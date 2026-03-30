import { useAuth } from "../contexts/useAuth";
import { useState, useEffect } from "react";
import { ArrowLeft, Brain, Lock, AlertTriangle, Heart, Download } from "lucide-react";

interface AIHealthAnalysisProps {
  onNavigate: (page: string) => void;
}

export default function AIHealthAnalysis({ onNavigate }: AIHealthAnalysisProps) {
  const { accountType } = useAuth();

  const [report, setReport] = useState<{
    summary: string;
    risk: string;
    recommendations: string[];
  } | null>(null);

  // ---------- PREMIUM REPORT GENERATOR ----------
  const generateMockReport = () => {
    setReport({
      summary:
        "Patient shows stable diabetes management. Blood sugar under control and vitals are within normal range.",
      risk: "Low Risk",
      recommendations: [
        "Continue Metformin",
        "Walk 30 minutes daily",
        "Avoid late night meals",
        "Repeat blood test in 3 months",
      ],
    });
  };

  useEffect(() => {
    if (accountType === "premium") {
      generateMockReport();
    }
  }, [accountType]);

  const downloadPDFReport = () => {
    // Create a simple PDF mockup using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 800, 600);

      // Title
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 32px Arial';
      ctx.fillText('AI Health Analysis Report', 50, 50);

      // Date
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px Arial';
      ctx.fillText(`Generated: ${new Date().toLocaleDateString()}`, 50, 80);

      // Content
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('Health Summary:', 50, 130);
      ctx.font = '14px Arial';
      ctx.fillText('Patient shows stable diabetes management. Blood sugar under', 50, 160);
      ctx.fillText('control and vitals are within normal range.', 50, 185);

      ctx.font = 'bold 18px Arial';
      ctx.fillText('Risk Level: Low Risk', 50, 240);

      ctx.font = 'bold 18px Arial';
      ctx.fillText('Recommendations:', 50, 290);
      const recommendations = [
        '• Continue Metformin',
        '• Walk 30 minutes daily',
        '• Avoid late night meals',
        '• Repeat blood test in 3 months'
      ];
      recommendations.forEach((rec, idx) => {
        ctx.font = '14px Arial';
        ctx.fillText(rec, 70, 320 + (idx * 30));
      });

      // Footer
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px Arial';
      ctx.fillText('Note: AI assists your understanding. It does not replace a doctor\'s advice.', 50, 580);

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `AI_Health_Analysis_${new Date().toISOString().split('T')[0]}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      });
    }
  };

  // ============================================================
  // 🔒 LOCK SCREEN (BASIC USER)
  // ============================================================
  if (accountType !== "premium") {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">

          <button
            onClick={() => onNavigate("dashboard")}
            className="flex items-center space-x-3 text-blue-600 mb-8"
          >
            <ArrowLeft size={28} />
            <span className="text-xl font-medium">Back to Dashboard</span>
          </button>

          <div className="bg-white rounded-2xl p-8 border-4 border-gray-200 text-center">

            <div className="bg-purple-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={48} className="text-purple-600" />
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Health Analysis
            </h1>

            <p className="text-xl text-gray-600 mb-6">
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
              className="w-full bg-gray-400 text-white py-4 px-6 rounded-xl text-xl font-bold cursor-not-allowed"
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

  // ============================================================
  // 🧠 PREMIUM USER REAL PAGE
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">

        <button
          onClick={() => onNavigate("dashboard")}
          className="flex items-center space-x-3 text-blue-600 mb-8"
        >
          <ArrowLeft size={28} />
          <span className="text-xl font-medium">Back to Dashboard</span>
        </button>

        <div className="flex items-center space-x-4 mb-8">
          <div className="bg-purple-600 p-4 rounded-xl">
            <Brain size={36} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              AI Health Analysis
            </h1>
            <p className="text-lg text-gray-600">
              Your Personalized Health Report
            </p>
          </div>
        </div>

        <button
          onClick={downloadPDFReport}
          className="mb-8 bg-green-600 text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-green-700 flex items-center space-x-2"
        >
          <Download size={28} />
          <span>Download Report (PDF)</span>
        </button>

        <div className="space-y-6">

          <div className="bg-white rounded-2xl p-6 border-4 border-blue-200">
            <div className="flex items-center space-x-3 mb-4">
              <Heart size={28} className="text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Current Health Summary
              </h2>
            </div>
            <p className="text-lg text-gray-700">
              {report?.summary || "Generating report..."}
            </p>
          </div>

          <div className="bg-red-50 border-4 border-red-300 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle size={28} className="text-red-600" />
              <h2 className="text-2xl font-bold text-red-900">
                Risk Level
              </h2>
            </div>
            <p className="text-lg text-red-800">
              {report?.risk || "Calculating..."}
            </p>
          </div>

          <div className="bg-green-50 border-4 border-green-300 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-green-900 mb-4">
              Recommendations
            </h2>
            <ul className="space-y-2 text-lg text-green-800">
              {report
                ? report.recommendations.map((r, i) => <li key={i}>• {r}</li>)
                : <li>Generating recommendations...</li>}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}