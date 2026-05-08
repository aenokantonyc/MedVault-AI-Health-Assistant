import { useAuth } from '../contexts/useAuth';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Brain, Lock, AlertTriangle, Heart, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AIHealthAnalysisProps {
  onNavigate: (page: string) => void;
}

type AnalysisMode = 'current-record' | 'complete-analysis';

type AnalysisReport = {
  headline: string;
  summary: string;
  risk: string;
  keyFindings: string[];
  recommendations: string[];
  redFlags: string[];
  nextSteps: string[];
};

type RecordSummary = {
  id: string;
  file_name: string;
  disease: string | null;
  upload_date: string;
  processing_status: string;
  is_processed: boolean;
  doctor: string | null;
  hospital: string | null;
  medicine: string | null;
  lab_value: string | null;
};

const emptyReport: AnalysisReport = {
  headline: 'No analysis yet',
  summary: 'Upload a medical record to generate analysis.',
  risk: 'Unknown',
  keyFindings: [],
  recommendations: [],
  redFlags: [],
  nextSteps: [],
};

export default function AIHealthAnalysis({ onNavigate }: AIHealthAnalysisProps) {
  const { accountType, user } = useAuth();
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('complete-analysis');
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport>(emptyReport);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentRecord = useMemo(() => {
    if (!selectedRecordId) return null;
    return records.find((record) => record.id === selectedRecordId) ?? null;
  }, [records, selectedRecordId]);

  const riskTone = useMemo(() => {
    const lowerRisk = report.risk.toLowerCase();
    if (lowerRisk.includes('high')) return 'bg-rose-100 text-rose-800 border-rose-200';
    if (lowerRisk.includes('moderate')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (lowerRisk.includes('low')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  }, [report.risk]);

  const loadRecords = async () => {
    if (!user) return;

    setLoadingRecords(true);
    const { data, error: recordsError } = await supabase
      .from('medical_records')
      .select('id,file_name,disease,upload_date,processing_status,is_processed,doctor,hospital,medicine,lab_value')
      .eq('user_id', user.id)
      .order('upload_date', { ascending: false })
      .limit(8);

    if (recordsError) {
      setError('Unable to load your uploaded records.');
    } else {
      const nextRecords = (data ?? []) as RecordSummary[];
      setRecords(nextRecords);
      if (!selectedRecordId && nextRecords.length > 0) {
        setSelectedRecordId(nextRecords[0].id);
      }
      if (selectedRecordId && !nextRecords.some((record) => record.id === selectedRecordId)) {
        setSelectedRecordId(nextRecords[0]?.id ?? null);
      }
    }

    setLoadingRecords(false);
  };

  const buildFallbackReport = (): AnalysisReport => {
    const sourceRecords = analysisMode === 'current-record' && currentRecord ? [currentRecord] : records;
    const latest = sourceRecords[0];
    const joinedText = sourceRecords
      .map((record) => [record.disease, record.doctor, record.hospital, record.medicine, record.lab_value].filter(Boolean).join(' '))
      .join(' ')
      .toLowerCase();

    const hasDiabetes = joinedText.includes('diabetes') || joinedText.includes('hba1c') || joinedText.includes('glucose');
    const hasMedication = joinedText.includes('medicine') || joinedText.includes('tablet') || joinedText.includes('metformin');
    const risk = hasDiabetes ? 'Moderate Risk' : sourceRecords.length > 0 ? 'Low Risk' : 'Unknown';

    return {
      headline: analysisMode === 'current-record' ? 'Current Record Overview' : 'Complete Health Overview',
      summary: latest
        ? `We reviewed ${analysisMode === 'current-record' ? 'the latest document' : 'your uploaded history'} and prepared a simple clinical summary.`
        : 'No medical record is available yet.',
      risk,
      keyFindings: sourceRecords.length > 0
        ? [
            latest?.disease ? `Primary focus: ${latest.disease}` : 'No disease label found in the latest record.',
            latest?.lab_value ? `Lab signal: ${latest.lab_value}` : 'No clear lab signal was extracted.',
            hasMedication || latest?.medicine ? 'Medication details were detected in the record history.' : 'No medication details were detected.',
          ]
        : [],
      recommendations: sourceRecords.length > 0
        ? [
            'Review the report with your doctor for confirmation.',
            'Keep future reports uploaded so trends stay visible.',
            'Regenerate analysis after new uploads for the latest guidance.',
          ]
        : ['Upload a report to begin analysis.'],
      redFlags: hasDiabetes ? ['Blood sugar markers suggest follow-up is important.'] : [],
      nextSteps: sourceRecords.length > 0
        ? ['Open the latest record for details.', 'Share the summary with your clinician if needed.']
        : ['Go to Upload Medical Record and add a lab report.'],
    };
  };

  const loadReport = async (forceRegenerate = false) => {
    if (!user || accountType !== 'premium') return;

    setLoadingReport(true);
    setError(null);

    const recordId = analysisMode === 'current-record' ? selectedRecordId : undefined;
    const sourceQuery = analysisMode === 'current-record'
      ? supabase.from('ai_analyses').select('summary,risk,recommendations').eq('user_id', user.id).eq('medical_record_id', recordId ?? '__none__').limit(1)
      : supabase.from('ai_analyses').select('summary,risk,recommendations').eq('user_id', user.id).is('medical_record_id', null).order('generated_at', { ascending: false }).limit(1);

    if (!forceRegenerate) {
      const { data: existing, error: existingError } = analysisMode === 'current-record' && recordId
        ? await sourceQuery.maybeSingle()
        : await sourceQuery.maybeSingle();

      if (!existingError && existing) {
        setReport({
          headline: analysisMode === 'current-record' ? 'Current Record Analysis' : 'Complete Health Analysis',
          summary: existing.summary,
          risk: existing.risk,
          keyFindings: [],
          recommendations: existing.recommendations ?? [],
          redFlags: [],
          nextSteps: [],
        });
        setLoadingReport(false);
        return;
      }
    }

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('generate-health-analysis', {
        body: {
          userId: user.id,
          analysisType: analysisMode,
          recordId,
        },
      });

      if (fnError) {
        throw fnError;
      }

      const nextReport: AnalysisReport = {
        headline: fnData?.headline ?? (analysisMode === 'current-record' ? 'Current Record Analysis' : 'Complete Health Analysis'),
        summary: fnData?.summary ?? emptyReport.summary,
        risk: fnData?.risk ?? 'Unknown',
        keyFindings: Array.isArray(fnData?.key_findings) ? fnData.key_findings : [],
        recommendations: Array.isArray(fnData?.recommendations) ? fnData.recommendations : [],
        redFlags: Array.isArray(fnData?.red_flags) ? fnData.red_flags : [],
        nextSteps: Array.isArray(fnData?.next_steps) ? fnData.next_steps : [],
      };

      setReport(nextReport);
    } catch {
      const fallback = buildFallbackReport();
      setReport(fallback);
      setError('Using a fallback analysis because the AI service is unavailable right now.');
    }

    setLoadingReport(false);
  };

  useEffect(() => {
    loadRecords();
  }, [user?.id]);

  useEffect(() => {
    loadReport();
    if (!user) return;

    const channel = supabase
      .channel(`analysis-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_analyses', filter: `user_id=eq.${user.id}` },
        () => {
          loadReport();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medical_records', filter: `user_id=eq.${user.id}` },
        () => {
          loadRecords();
          loadReport();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountType, user?.id, analysisMode, selectedRecordId]);

  const handleModeChange = (mode: AnalysisMode) => {
    setAnalysisMode(mode);
    setError(null);
    if (mode === 'current-record' && !selectedRecordId && records[0]?.id) {
      setSelectedRecordId(records[0].id);
    }
  };

  if (accountType !== 'premium') {
    return (
      <div className="app-shell">
        <div className="page-wrap">
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 text-teal-700 mb-6 font-semibold"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="glass-card p-8 text-center">
            <div className="bg-purple-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={48} className="text-purple-600" />
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 mb-3">AI Health Analysis</h1>
            <p className="text-slate-600 mb-6">This feature is available only for Premium users</p>

            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 mb-8 text-left">
              <h3 className="text-lg font-extrabold text-purple-900 mb-3">Premium Features:</h3>
              <ul className="space-y-2 text-sm text-purple-800">
                <li>• Current record analysis</li>
                <li>• Complete history analysis</li>
                <li>• Medication tracking</li>
                <li>• Personalized recommendations</li>
                <li>• Health risk alerts</li>
              </ul>
            </div>

            <button
              onClick={(e) => e.preventDefault()}
              className="btn-secondary cursor-not-allowed"
            >
              Unlock Premium (Demo Only)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-wrap space-y-4">
        <button
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-2 text-teal-700 mb-2 font-semibold"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <div className="glass-card p-6 md:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-indigo-600 p-3 rounded-xl shrink-0">
              <Brain size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">AI Health Analysis</h1>
              <p className="text-slate-600 mt-1">Real-time medical summaries in a simple, readable format.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleModeChange('current-record')}
              className={`rounded-2xl border px-4 py-3 text-left transition ${analysisMode === 'current-record' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'}`}
            >
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <CheckCircle2 size={16} className={analysisMode === 'current-record' ? 'text-teal-600' : 'text-slate-400'} />
                Current Record Analysis
              </div>
              <p className="text-xs text-slate-600 mt-1">Analyze one selected report in detail</p>
            </button>

            <button
              onClick={() => handleModeChange('complete-analysis')}
              className={`rounded-2xl border px-4 py-3 text-left transition ${analysisMode === 'complete-analysis' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'}`}
            >
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Sparkles size={16} className={analysisMode === 'complete-analysis' ? 'text-teal-600' : 'text-slate-400'} />
                Complete Analysis
              </div>
              <p className="text-xs text-slate-600 mt-1">Summarize the full upload history</p>
            </button>
          </div>

          {analysisMode === 'current-record' && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Choose record</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {records.length === 0 && <div className="text-sm text-slate-500">No records found yet.</div>}
                {records.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => setSelectedRecordId(record.id)}
                    className={`min-w-[180px] rounded-2xl border px-4 py-3 text-left transition ${selectedRecordId === record.id ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'}`}
                  >
                    <div className="text-sm font-bold text-slate-900 truncate">{record.disease || record.file_name}</div>
                    <div className="text-xs text-slate-600 truncate">{record.file_name}</div>
                    <div className="text-xs text-slate-500 mt-1">{record.is_processed ? 'Processed' : record.processing_status}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentRecord && analysisMode === 'current-record' && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Selected record</div>
              <div className="text-lg font-extrabold text-slate-900">{currentRecord.disease || currentRecord.file_name}</div>
              <div className="text-sm text-slate-600">{currentRecord.file_name}</div>
            </div>
          )}

          <div className="rounded-3xl p-5 md:p-6 border border-sky-200 bg-sky-50">
            <div className="flex items-center gap-3 mb-3">
              <Heart size={22} className="text-sky-700" />
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">{report.headline}</h2>
                <p className="text-xs text-slate-600">{analysisMode === 'current-record' ? 'Current record view' : 'Complete history view'}</p>
              </div>
            </div>
            <p className="text-sm md:text-base text-slate-700 leading-relaxed whitespace-pre-line">
              {loadingReport ? 'Generating analysis from your records...' : report.summary}
            </p>
          </div>

          <div className={`rounded-3xl border p-5 ${riskTone}`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} />
              <h3 className="text-base font-extrabold">Risk Level</h3>
            </div>
            <p className="text-lg font-extrabold">{loadingReport ? 'Calculating...' : report.risk}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <h3 className="text-base font-extrabold text-slate-900 mb-3">Key Findings</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {loadingReport && <li>Generating findings...</li>}
                {!loadingReport && report.keyFindings.length === 0 && <li>No findings available.</li>}
                {report.keyFindings.map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <h3 className="text-base font-extrabold text-slate-900 mb-3">Red Flags</h3>
              <ul className="space-y-2 text-sm text-rose-700">
                {loadingReport && <li>Checking for alerts...</li>}
                {!loadingReport && report.redFlags.length === 0 && <li>No immediate red flags found.</li>}
                {report.redFlags.map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Recommendations</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              {loadingReport && <li>Generating recommendations...</li>}
              {!loadingReport && report.recommendations.length === 0 && <li>No recommendations available.</li>}
              {report.recommendations.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Next Steps</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              {loadingReport && <li>Preparing next steps...</li>}
              {!loadingReport && report.nextSteps.length === 0 && <li>No next steps available.</li>}
              {report.nextSteps.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>

          {error && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => loadReport(true)}
              disabled={loadingReport || (analysisMode === 'current-record' && !selectedRecordId)}
              className="btn-primary"
            >
              {loadingReport ? 'Regenerating...' : 'Regenerate AI Analysis'}
            </button>
            <button
              onClick={() => onNavigate('upload')}
              className="btn-secondary"
            >
              Upload a New Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
