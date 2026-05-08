import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ProcessPayload = {
  recordId: string;
  userId: string;
  storagePath: string;
  fileName: string;
  fileType: string;
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
    const body = (await req.json()) as ProcessPayload;
    const { recordId, userId, storagePath, fileName, fileType } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: signed } = await supabase.storage
      .from('medical-records')
      .createSignedUrl(storagePath, 60 * 60);

    const signedUrl = signed?.signedUrl;

    let analysis = {
      disease: null as string | null,
      doctor: null as string | null,
      hospital: null as string | null,
      medicine: null as string | null,
      lab_value: null as string | null,
      summary: 'Automated analysis completed.',
      risk: 'Unknown',
      recommendations: ['Consult your physician with this report for confirmation.'],
      timeline_events: [
        {
          event_type: 'Report Upload',
          title: 'Medical report processed',
          description: `Processed ${fileName}`,
        },
      ],
      reminders: [] as Array<{ reminder_type: string; title: string; description: string; reminder_time: string | null }> ,
    };

    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (openAiKey && signedUrl) {
      const prompt = `You are a clinical document analysis assistant.
Return strict JSON with keys:
- disease (string|null)
- doctor (string|null)
- hospital (string|null)
- medicine (string|null)
- lab_value (string|null)
- summary (string)
- risk (Low Risk|Moderate Risk|High Risk|Unknown)
- recommendations (string[])
- timeline_events ({event_type,title,description}[])
- reminders ({reminder_type,title,description,reminder_time}[])

If uncertain, return null/Unknown but still provide recommendations.
File type: ${fileType}; file name: ${fileName}; url: ${signedUrl}`;

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          input: [
            {
              role: 'user',
              content: [
                { type: 'input_text', text: prompt },
                ...(fileType.startsWith('image/')
                  ? [{ type: 'input_image', image_url: signedUrl }]
                  : []),
              ],
            },
          ],
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        const outputText = payload.output_text ?? '';
        const parsed = safeJson(outputText);
        if (parsed) {
          analysis = {
            ...analysis,
            ...parsed,
            recommendations: Array.isArray(parsed.recommendations)
              ? parsed.recommendations
              : analysis.recommendations,
            timeline_events: Array.isArray(parsed.timeline_events)
              ? parsed.timeline_events
              : analysis.timeline_events,
            reminders: Array.isArray(parsed.reminders) ? parsed.reminders : analysis.reminders,
          };
        }
      }
    }

    const { error: updateError } = await supabase
      .from('medical_records')
      .update({
        disease: analysis.disease,
        doctor: analysis.doctor,
        hospital: analysis.hospital,
        medicine: analysis.medicine,
        lab_value: analysis.lab_value,
        extracted_payload: analysis,
        processing_status: 'processed',
        is_processed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    if (analysis.timeline_events.length) {
      await supabase.from('health_timeline').insert(
        analysis.timeline_events.map((event) => ({
          user_id: userId,
          event_type: event.event_type ?? 'AI Insight',
          title: event.title ?? 'Record insight',
          description: event.description ?? null,
          record_id: recordId,
          event_date: new Date().toISOString(),
        }))
      );
    }

    if (analysis.reminders.length) {
      await supabase.from('care_reminders').insert(
        analysis.reminders.map((reminder) => ({
          user_id: userId,
          reminder_type: reminder.reminder_type ?? 'Care',
          title: reminder.title ?? 'Health follow-up',
          description: reminder.description ?? null,
          reminder_time: reminder.reminder_time ?? null,
          is_active: true,
        }))
      );
    }

    await supabase.from('ai_analyses').insert({
      user_id: userId,
      medical_record_id: recordId,
      summary: analysis.summary,
      risk: analysis.risk,
      recommendations: analysis.recommendations,
      model_name: openAiKey ? 'gpt-4o-mini' : 'fallback-local',
    });

    return new Response(JSON.stringify({ ok: true, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Unexpected error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
