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
    const { userId } = (await req.json()) as { userId: string };

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: rows } = await supabase
      .from('medical_records')
      .select('id,disease,doctor,hospital,medicine,lab_value,upload_date,record_type')
      .eq('user_id', userId)
      .order('upload_date', { ascending: false })
      .limit(20);

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

    const prompt = `Using the medical record summaries below, return strict JSON with keys:
summary (string), risk (Low Risk|Moderate Risk|High Risk|Unknown), recommendations (string[]).
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

    return new Response(JSON.stringify(parsed), {
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
