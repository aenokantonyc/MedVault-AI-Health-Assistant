import { useAuth } from "../contexts/useAuth";
import { useState, useEffect } from "react";
import { ArrowLeft, Brain, Lock, AlertTriangle, Heart } from "lucide-react";
import { supabase } from "../lib/supabase";

interface AIHealthAnalysisProps {
  onNavigate: (page: string) => void;
}

type AnalysisReport = {
  summary: string;
  risk: string;
  recommendations: string[];
};

export default function AIHealthAnalysis({ onNavigate }: AIHealthAnalysisProps) {
  const { accountType, user } = useAuth();

  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildFallbackReport = async (userId: string): Promise<AnalysisReport> => {
    const { data } = await supabase
      .from('medical_records')
      .select('disease,lab_value,medicine')
      .eq('user_id', userId)
      .order('upload_date', { ascending: false })
      .limit(5);

    const records = data ?? [];
    const hasDiabetes = records.some((r) => (r.disease ?? '').toLowerCase().includes('diabetes'));
    const onMedication = records.some((r) => Boolean(r.medicine));
    const hasA1cSignal = records.some((r) => (r.lab_value ?? '').toLowerCase().includes('hba1c'));

    if (hasDiabetes || hasA1cSignal) {
      return {
        summary: 'Latest records suggest blood-sugar management is the primary health focus. Continue regular monitoring and follow-up.',
        risk: 'Moderate Risk',
        recommendations: [
          onMedication ? 'Continue prescribed medication and avoid missed doses.' : 'Consult your doctor to confirm medication plan.',
          'Track fasting and post-meal glucose values weekly.',
          'Follow a lower refined-carb meal pattern and daily physical activity.',
          'Repeat HbA1c/lab panel as advised by your clinician.',
        ],
      };
    }

    return {
      summary: 'Recent records do not show major high-risk markers. Maintain preventive care and periodic checkups.',
      risk: 'Low Risk',
      recommendations: [
        'Continue routine health screenings based on age and family history.',
        'Maintain hydration, sleep quality, and consistent exercise.',
        'Keep medication and vaccination history updated in MedVault.',
      ],
    };
  };

  const loadReport = async (forceRegenerate = false) => {
    if (!user || accountType !== 'premium') return;

    setLoadingReport(true);
    setError(null);

    if (!forceRegenerate) {
      const { data: existing, error: existingError } = await supabase
        .from('ai_analyses')
        .select('summary,risk,recommendations')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!existingError && existing) {
        setReport({
          summary: existing.summary,
          risk: existing.risk,
          recommendations: existing.recommendations ?? [],
        });
        setLoadingReport(false);
        return;
      }
    }

      let generatedReport: AnalysisReport | null = null;

    const { data: fnData, error: fnError } = await supabase.functions.invoke('generate-health-analysis', {
      body: { userId: user.id },
    });

    if (!fnError && fnData?.summary && fnData?.risk) {
      generatedReport = {
        summary: fnData.summary,
        risk: fnData.risk,
        recommendations: Array.isArray(fnData.recommendations) ? fnData.recommendations : [],
      };
    } else {
      generatedReport = await buildFallbackReport(user.id);
    }

    const { error: saveError } = await supabase.from('ai_analyses').insert({
      user_id: user.id,
      summary: generatedReport.summary,
      risk: generatedReport.risk,
      recommendations: generatedReport.recommendations,
      model_name: fnError ? 'fallback-rules' : 'edge-function',
    });

    if (saveError) {
      setError('Analysis generated, but saving the result failed.');
    }

    setReport(generatedReport);
    setLoadingReport(false);
  };

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountType, user]);

  if (accountType !== "premium") {
    return (
      <div className="app-shell">
        <div className="page-wrap">

          <button
            onClick={() => onNavigate("dashboard")}
            className="inline-flex items-center gap-2 text-teal-700 mb-6 font-semibold"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="glass-card p-8 text-center">

            <div className="bg-purple-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={48} className="text-purple-600" />
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
              AI Health Analysis
            </h1>

            <p className="text-slate-600 mb-6">
              This feature is available only for Premium users
            </p>

            <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6 mb-8 text-left">
              <h3 className="text-xl font-bold text-purple-900 mb-3">
                Premium Features:
              </h3>
              <ul className="space-y-2 text-lg text-purple-800">
                <li>• Full medical history analysis</li>
                <li>• Disease prediction</li>
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

            <p className="text-sm text-gray-500 mt-4">
              Demo prototype — payments disabled
            </p>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-wrap">

        <button
          onClick={() => onNavigate("dashboard")}
          className="inline-flex items-center gap-2 text-teal-700 mb-6 font-semibold"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <div className="glass-card p-6 md:p-8 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-indigo-600 p-3 rounded-xl">
              <Brain size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">AI Health Analysis</h1>
              <p className="text-slate-600">Realtime medical summary based on uploaded documents.</p>
            </div>
          </div>

          <div className="space-y-4">

            <div className="rounded-2xl p-5 border border-sky-200 bg-sky-50">
            <div className="flex items-center space-x-3 mb-4">
              <Heart size={28} className="text-blue-600" />
              <h2 className="text-xl font-extrabold text-slate-900">
                Current Health Summary
              </h2>
            </div>
            <p className="text-base text-slate-700">
              {loadingReport ? 'Generating report from your records...' : report?.summary || 'No analysis available yet.'}
            </p>
          </div>

            <div className="rounded-2xl p-5 border border-rose-200 bg-rose-50">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle size={28} className="text-red-600" />
              <h2 className="text-xl font-extrabold text-rose-900">
                Risk Level
              </h2>
            </div>
            <p className="text-base text-rose-800 font-semibold">
              {loadingReport ? 'Calculating risk...' : report?.risk || 'Pending'}
            </p>
          </div>

            <div className="rounded-2xl p-5 border border-emerald-200 bg-emerald-50">
            <h2 className="text-xl font-extrabold text-emerald-900 mb-4">
              Recommendations
            </h2>
            <ul className="space-y-2 text-sm text-emerald-900">
              {report
                ? report.recommendations.map((r, i) => <li key={i}>• {r}</li>)
                : <li>Generating recommendations...</li>}
            </ul>
          </div>

          {error && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 text-yellow-900">
              {error}
            </div>
          )}

          <button
            onClick={() => loadReport(true)}
            disabled={loadingReport}
            className="btn-primary"
          >
            {loadingReport ? 'Regenerating...' : 'Regenerate AI Analysis'}
          </button>

          </div>
        </div>
      </div>
    </div>
  );
}