import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Link2, Download, Copy, CheckCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useAuth } from '../contexts/useAuth';
import { supabase } from '../lib/supabase';

interface ShareWithDoctorProps {
  onNavigate: (page: string) => void;
}

export default function ShareWithDoctor({ onNavigate }: ShareWithDoctorProps) {
  const { user } = useAuth();
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const storageKey = useMemo(() => (user ? `medvault.shareLink.${user.id}` : 'medvault.shareLink.guest'), [user]);

  const shareLink = useMemo(() => {
    if (!shareToken) return '';
    return `${window.location.origin}${window.location.pathname}#/share?token=${shareToken}`;
  }, [shareToken]);

  useEffect(() => {
    if (!user) return;

    const route = window.location.hash.replace(/^#\/?/, '');
    const [, rawQuery = ''] = route.split('?');
    const routeToken = new URLSearchParams(rawQuery).get('token');

    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      if (routeToken) {
        setShareToken(routeToken);
        setLinkGenerated(true);
      }
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { token: string; expiresAt: string };
      const isValid = new Date(parsed.expiresAt).getTime() > Date.now();

      if (isValid) {
        setShareToken(routeToken ?? parsed.token);
        setExpiresAt(parsed.expiresAt);
        setLinkGenerated(true);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, user]);

  const handleGenerateLink = () => {
    const token = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`).replace(/-/g, '');
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    setShareToken(token);
    setExpiresAt(expiry);
    setLinkGenerated(true);
    localStorage.setItem(storageKey, JSON.stringify({ token, expiresAt: expiry }));
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('textarea');
      input.value = shareLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadReport = async () => {
    if (!user) return;
    setDownloading(true);

    try {
      const [recordsResult, timelineResult, remindersResult, analysisResult] = await Promise.all([
        supabase.from('medical_records').select('file_name,disease,upload_date').eq('user_id', user.id).order('upload_date', { ascending: false }).limit(20),
        supabase.from('health_timeline').select('title,event_date').eq('user_id', user.id).order('event_date', { ascending: false }).limit(20),
        supabase.from('care_reminders').select('title,reminder_time,is_active').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('ai_analyses').select('summary,risk,generated_at').eq('user_id', user.id).order('generated_at', { ascending: false }).limit(5),
      ]);

      const records = recordsResult.data ?? [];
      const timeline = timelineResult.data ?? [];
      const reminders = remindersResult.data ?? [];
      const analyses = analysisResult.data ?? [];

      const doc = new jsPDF();
      let y = 16;

      const addSectionTitle = (title: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(title, 14, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
      };

      const addParagraph = (text: string) => {
        const lines = doc.splitTextToSize(text, 180);
        doc.text(lines, 14, y);
        y += lines.length * 6;
        if (y > 270) {
          doc.addPage();
          y = 16;
        }
      };

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('MedVault Health Summary', 14, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y);
      y += 10;

      addSectionTitle('Recent AI Summary');
      if (analyses.length === 0) {
        addParagraph('No AI summaries available yet.');
      } else {
        analyses.forEach((item, index) => {
          addParagraph(`${index + 1}. [${item.risk}] ${item.summary}`);
        });
      }

      addSectionTitle('Medical Records');
      if (records.length === 0) {
        addParagraph('No records uploaded yet.');
      } else {
        records.forEach((record, index) => {
          addParagraph(`${index + 1}. ${record.file_name} | ${record.disease ?? 'No disease label'} | ${new Date(record.upload_date).toLocaleDateString()}`);
        });
      }

      addSectionTitle('Timeline Highlights');
      if (timeline.length === 0) {
        addParagraph('No timeline events available.');
      } else {
        timeline.forEach((event, index) => {
          addParagraph(`${index + 1}. ${event.title} (${new Date(event.event_date).toLocaleDateString()})`);
        });
      }

      addSectionTitle('Care Reminders');
      if (reminders.length === 0) {
        addParagraph('No reminders available.');
      } else {
        reminders.forEach((reminder, index) => {
          addParagraph(`${index + 1}. ${reminder.title} | ${reminder.is_active ? 'Active' : 'Inactive'}${reminder.reminder_time ? ` | ${new Date(reminder.reminder_time).toLocaleString()}` : ''}`);
        });
      }

      doc.save(`medvault-summary-${Date.now()}.pdf`);
    } catch (err) {
      alert(err instanceof Error ? `Failed to generate PDF: ${err.message}` : 'Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
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
                <p className="text-sm text-emerald-700">Valid until {expiresAt ? new Date(expiresAt).toLocaleDateString() : '7 days'}</p>
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
                disabled={downloading}
                className="w-full rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-bold text-white hover:bg-emerald-700 flex items-center justify-center gap-2"
              >
                <Download size={24} />
                <span>{downloading ? 'Preparing PDF...' : 'Download PDF Report'}</span>
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
