import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const safeJson = (raw: string) => {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as { userId: string; analysisType?: 'current-record' | 'complete-analysis'; recordId?: string };
    const { userId, analysisType = 'complete-analysis', recordId } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let query = supabase
      .from('medical_records')
      .select('id,disease,doctor,hospital,medicine,lab_value,upload_date,record_type,file_name,processing_status,is_processed')
      .eq('user_id', userId)
      .order('upload_date', { ascending: false });

    if (analysisType === 'current-record' && recordId) {
      query = query.eq('id', recordId).limit(1);
    } else {
      query = query.limit(20);
    }

    const { data: rows } = await query;

    const records = rows ?? [];
    if (!records.length) {
      return new Response(
        JSON.stringify({
          summary: 'No reports uploaded yet. Upload medical records to generate an AI analysis.',
          risk: 'Unknown',
          recommendations: ['Upload at least one lab report or prescription.'],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) {
      return new Response(
        JSON.stringify({
          summary: 'AI key not configured. Showing a rule-based summary from uploaded records.',
          risk: 'Unknown',
          recommendations: [
            'Configure OPENAI_API_KEY for advanced medical report analysis.',
            'Continue regular follow-up with your physician.',
          ],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const prompt = analysisType === 'current-record'
      ? `You are analyzing one current medical record for a patient. Return strict JSON with keys:
  headline (string), summary (string), risk (Low Risk|Moderate Risk|High Risk|Unknown), key_findings (string[]), recommendations (string[]), red_flags (string[]), next_steps (string[]).
  Record: ${JSON.stringify(records[0])}`
      : `You are analyzing a patient's complete medical history. Return strict JSON with keys:
  headline (string), summary (string), risk (Low Risk|Moderate Risk|High Risk|Unknown), key_findings (string[]), recommendations (string[]), red_flags (string[]), next_steps (string[]).
  Records: ${JSON.stringify(records)}`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error('AI request failed');
    }

    const payload = await response.json();
    const parsed = safeJson(payload.output_text ?? '');

    if (!parsed || !parsed.summary || !parsed.risk) {
      throw new Error('AI response parsing failed');
    }

    const payload = {
      headline: parsed.headline ?? (analysisType === 'current-record' ? 'Current Record Analysis' : 'Complete Health Analysis'),
      summary: parsed.summary,
      risk: parsed.risk,
      key_findings: Array.isArray(parsed.key_findings) ? parsed.key_findings : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      red_flags: Array.isArray(parsed.red_flags) ? parsed.red_flags : [],
      next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps : [],
    };

    if (analysisType === 'current-record' && recordId) {
      await supabase.from('ai_analyses').insert({
        user_id: userId,
        medical_record_id: recordId,
        summary: payload.summary,
        risk: payload.risk,
        recommendations: payload.recommendations,
        model_name: 'gpt-4o-mini',
      });
    } else {
      await supabase.from('ai_analyses').insert({
        user_id: userId,
        summary: payload.summary,
        risk: payload.risk,
        recommendations: payload.recommendations,
        model_name: 'gpt-4o-mini',
      });
    }

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        summary: 'Unable to generate full AI analysis right now.',
        risk: 'Unknown',
        recommendations: ['Please retry in a few moments.'],
        error: error instanceof Error ? error.message : 'Unexpected error',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
