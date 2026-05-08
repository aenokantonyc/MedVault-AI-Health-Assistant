import { useState, useEffect } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RecordDetailProps {
  recordId: string;
  onNavigate: (page: string, recordId?: string) => void;
}

interface MedicalRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  storage_path: string | null;
  processing_status: string;
  upload_date: string;
  record_type: string;
  disease: string | null;
  doctor: string | null;
  hospital: string | null;
  medicine: string | null;
  lab_value: string | null;
  is_processed: boolean;
}

export default function RecordDetail({ recordId, onNavigate }: RecordDetailProps) {
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [explanationText, setExplanationText] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecord();

    const channel = supabase
      .channel(`record-${recordId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medical_records', filter: `id=eq.${recordId}` },
        () => {
          loadRecord();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recordId]);

  const loadRecord = async () => {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (error) {
      console.error('Error loading record:', error);
    } else {
      setRecord(data);

      if (data.storage_path) {
        const { data: signed } = await supabase.storage
          .from('medical-records')
          .createSignedUrl(data.storage_path, 60 * 30);
        setPreviewUrl(signed?.signedUrl ?? null);
      } else {
        setPreviewUrl(null);
      }
    }

    setLoading(false);
  };

  const loadExplanation = async () => {
    if (!record) return;

    const { data: analysis } = await supabase
      .from('ai_analyses')
      .select('summary,recommendations')
      .eq('medical_record_id', record.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysis?.summary) {
      const recommendations = Array.isArray(analysis.recommendations)
        ? analysis.recommendations.map((item: string) => `- ${item}`).join('\n')
        : '';

      setExplanationText(
        `${analysis.summary}${recommendations ? `\n\nRecommended next steps:\n${recommendations}` : ''}`
      );
      return;
    }

    const { data: generated } = await supabase.functions.invoke('generate-health-analysis', {
      body: { userId: record.user_id },
    });

    if (generated?.summary) {
      const recommendations = Array.isArray(generated.recommendations)
        ? generated.recommendations.map((item: string) => `- ${item}`).join('\n')
        : '';
      setExplanationText(
        `${generated.summary}${recommendations ? `\n\nRecommended next steps:\n${recommendations}` : ''}`
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="glass-card px-8 py-6 text-slate-600 font-semibold">Loading record...</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="app-shell">
        <div className="page-wrap text-center">
          <p className="text-xl text-slate-600 mb-8">Record not found</p>
          <button
            onClick={() => onNavigate('records')}
            className="btn-primary max-w-sm mx-auto"
          >
            Back to Records
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-wrap">
        <button
          onClick={() => onNavigate('records')}
          className="inline-flex items-center gap-2 text-teal-700 mb-6 font-semibold"
        >
          <ArrowLeft size={20} />
          <span>Back to Records</span>
        </button>

        <div className="glass-card p-6 md:p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-sky-100 p-3 rounded-xl">
              <FileText size={30} className="text-sky-700" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{record.disease || record.record_type}</h1>
              <p className="text-slate-600">{formatDate(record.upload_date)}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-200">
            <p className="text-sm uppercase tracking-wide font-bold text-slate-500 mb-2">Document Preview</p>
            <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
              {previewUrl ? (
                record.file_type.startsWith('image/') ? (
                  <img src={previewUrl} alt={record.file_name} className="max-h-96 mx-auto rounded-lg" />
                ) : (
                  <iframe
                    src={previewUrl}
                    title={record.file_name}
                    className="w-full h-96 rounded-lg border-0"
                  />
                )
              ) : (
                <>
                  <FileText size={54} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">{record.file_name}</p>
                </>
              )}
            </div>
          </div>

          {!record.is_processed && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-amber-900 text-sm font-semibold">
              AI processing status: {record.processing_status || 'processing'}
            </div>
          )}

          {record.is_processed && (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900 mb-4">Extracted Information</h2>

              <div className="bg-sky-50 rounded-xl p-5 border border-sky-200">
                <div className="grid grid-cols-1 gap-4">
                  {record.disease && (
                    <div>
                      <p className="text-xs uppercase tracking-wide font-bold text-slate-500">Disease</p>
                      <p className="text-lg font-bold text-slate-900">{record.disease}</p>
                    </div>
                  )}
                  {record.doctor && (
                    <div>
                      <p className="text-lg text-gray-600 font-medium">Doctor</p>
                      <p className="text-2xl font-bold text-gray-900">{record.doctor}</p>
                    </div>
                  )}
                  {record.hospital && (
                    <div>
                      <p className="text-lg text-gray-600 font-medium">Hospital</p>
                      <p className="text-2xl font-bold text-gray-900">{record.hospital}</p>
                    </div>
                  )}
                  {record.medicine && (
                    <div>
                      <p className="text-lg text-gray-600 font-medium">Medicine</p>
                      <p className="text-2xl font-bold text-gray-900">{record.medicine}</p>
                    </div>
                  )}
                  {record.lab_value && (
                    <div>
                      <p className="text-lg text-gray-600 font-medium">Lab Value</p>
                      <p className="text-2xl font-bold text-gray-900">{record.lab_value}</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={async () => {
                  const next = !showExplanation;
                  setShowExplanation(next);
                  if (next) {
                    await loadExplanation();
                  }
                }}
                className="btn-primary"
              >
                {showExplanation ? 'Hide Explanation' : 'Explain This Report'}
              </button>

              {showExplanation && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                  <h3 className="text-lg font-extrabold text-emerald-900 mb-3">Simple Explanation</h3>
                  <p className="text-base text-slate-800 leading-relaxed whitespace-pre-line">
                    {explanationText || 'Generating explanation from AI analysis...'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
