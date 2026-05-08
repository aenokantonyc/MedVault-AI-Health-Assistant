import { useState } from 'react';
import { ArrowLeft, Link2, Download, Copy, CheckCircle } from 'lucide-react';

interface ShareWithDoctorProps {
  onNavigate: (page: string) => void;
}

export default function ShareWithDoctor({ onNavigate }: ShareWithDoctorProps) {
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareLink = 'https://healthrecord.demo/share/abc123xyz';

  const handleGenerateLink = () => {
    setLinkGenerated(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    alert('Demo: Health summary report would be downloaded as PDF');
  };

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

        <div className="glass-card p-6 md:p-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Share With Doctor</h1>
        <p className="text-slate-600 mb-6">
          Share your health records securely with your healthcare provider
        </p>

        {!linkGenerated ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
            <Link2 size={54} className="mx-auto text-sky-600 mb-4" />
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Generate Shareable Link</h2>
            <p className="text-sm text-slate-600 mb-6">
              Create a secure link to share all your medical records with your doctor
            </p>
            <button
              onClick={handleGenerateLink}
              className="btn-primary"
            >
              Generate Share Link
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-emerald-100 border border-emerald-300 rounded-2xl p-5 flex items-center space-x-4">
              <CheckCircle size={48} className="text-green-600" />
              <div>
                <h3 className="text-xl font-extrabold text-emerald-800">Link Generated!</h3>
                <p className="text-sm text-emerald-700">Valid for 7 days</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200">
              <h3 className="text-lg font-extrabold text-slate-900 mb-3">Shareable Link</h3>
              <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-300">
                <p className="text-sm text-slate-700 break-all">{shareLink}</p>
              </div>
              <button
                onClick={handleCopyLink}
                className="btn-primary flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle size={24} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={24} />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200">
              <h3 className="text-lg font-extrabold text-slate-900 mb-3">Download Summary Report</h3>
              <p className="text-sm text-slate-600 mb-4">
                Get a comprehensive PDF report of your health records
              </p>
              <button
                onClick={handleDownloadReport}
                className="w-full rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-bold text-white hover:bg-emerald-700 flex items-center justify-center gap-2"
              >
                <Download size={24} />
                <span>Download PDF Report</span>
              </button>
            </div>

            <div className="bg-sky-50 border border-sky-300 rounded-xl p-5">
              <h3 className="text-base font-extrabold text-sky-900 mb-3">What's Included?</h3>
              <ul className="space-y-1 text-sm text-sky-800">
                <li>• All uploaded medical records</li>
                <li>• Complete health timeline</li>
                <li>• Current medications</li>
                <li>• Recent lab results</li>
                <li>• Doctor visit history</li>
              </ul>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
