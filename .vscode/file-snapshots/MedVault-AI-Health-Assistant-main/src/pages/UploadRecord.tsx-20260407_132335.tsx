import { useRef, useState } from 'react';
import { Camera, FileImage, FileText, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';

interface UploadRecordProps {
  onNavigate: (page: string, recordId?: string) => void;
}

export default function UploadRecord({ onNavigate }: UploadRecordProps) {
  const { user } = useAuth();
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const [uploadedRecordId, setUploadedRecordId] = useState<string | null>(null);

  const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

  const buildFallbackAnalysis = (file: File) => {
    const name = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || name.endsWith('.pdf');
    const looksLikeLab = /lab|blood|cbc|report|test|hba1c|glucose|cholesterol/.test(name);

    return {
      disease: looksLikeLab ? 'Needs Clinical Review' : null,
      doctor: null,
      hospital: null,
      medicine: null,
      lab_value: looksLikeLab ? 'Possible lab report detected' : null,
      summary: isPdf
        ? 'The uploaded PDF has been stored and is ready for AI processing. If the analysis service is unavailable, a manual review can still be performed from the saved document.'
        : 'The uploaded image has been stored and is ready for AI processing. If the analysis service is unavailable, a manual review can still be performed from the saved document.',
      risk: looksLikeLab ? 'Moderate Risk' : 'Unknown',
      recommendations: [
        'Review the uploaded report in your records.',
        'Share the document with your physician for confirmation.',
        'Regenerate AI analysis once the processing service is available.',
      ],
    };
  };

  const processWithAI = async (recordId: string, storagePath: string, file: File) => {
    setProcessing(true);
    setStatusMessage('Running AI analysis on your report...');

    const payload = {
      recordId,
      userId: user?.id,
      storagePath,
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
    };

    const { error: fnError } = await supabase.functions.invoke('process-medical-record', {
      body: payload,
    });

    if (fnError) {
      const fallback = buildFallbackAnalysis(file);

      await supabase
        .from('medical_records')
        .update({
          ...fallback,
          extracted_payload: fallback,
          processing_status: 'processed-fallback',
          is_processed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recordId);

      await supabase.from('ai_analyses').insert({
        user_id: user?.id,
        medical_record_id: recordId,
        summary: fallback.summary,
        risk: fallback.risk,
        recommendations: fallback.recommendations,
        model_name: 'client-fallback',
      });

      setStatusMessage('Edge Function unavailable, fallback analysis saved.');
      setUploadedRecordId(recordId);
      setProcessing(false);
      setUploadComplete(true);
      return;
    }

    setStatusMessage('AI analysis completed.');
    setUploadedRecordId(recordId);
    setProcessing(false);
    setUploadComplete(true);
  };

  const uploadFile = async (file: File) => {
    if (!user) return;

    setUploading(true);
    setStatusMessage('Uploading file to secure storage...');

    const now = Date.now();
    const filePath = `${user.id}/${now}-${sanitizeFileName(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from('medical-records')
      .upload(filePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      setUploading(false);
      setStatusMessage('');
      alert('Upload failed: ' + uploadError.message);
      return;
    }

    const { data, error } = await supabase
      .from('medical_records')
      .insert([{
        user_id: user.id,
        file_name: file.name,
        file_type: file.type || 'application/octet-stream',
        record_type: 'Lab Report',
        storage_path: filePath,
        processing_status: 'processing',
        is_processed: false,
      }])
      .select()
      .single();

    if (error) {
      await supabase.storage.from('medical-records').remove([filePath]);
      alert('Upload failed: ' + error.message);
      setUploading(false);
      setStatusMessage('');
      return;
    }

    setUploading(false);
    await processWithAI(data.id, filePath, file);
  };

  const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadFile(file);
    } catch (err) {
      setProcessing(false);
      setStatusMessage('');
      alert(err instanceof Error ? err.message : 'Failed to process uploaded file');
    } finally {
      event.target.value = '';
    }
  };

  if (uploadComplete) {
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
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-3xl font-extrabold text-emerald-800 mb-2">Upload Complete!</h2>
            <p className="text-slate-700 mb-2">
              Record securely saved in your Health Vault
            </p>
            <p className="text-sm text-slate-600 mb-8">Your file is now in live storage and analysis is saved.</p>

            <div className="mt-8 space-y-4">
              <button
                onClick={() => onNavigate('record-detail', uploadedRecordId ?? undefined)}
                className="btn-primary"
              >
                View Processed Record
              </button>
              <button
                onClick={() => {
                  setUploadComplete(false);
                  setUploadedRecordId(null);
                  setStatusMessage('');
                }}
                className="btn-secondary"
              >
                Upload Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="glass-card max-w-2xl w-full p-10 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-6">Analyzing Your Report</h2>
          <div className="rounded-2xl bg-sky-50 border border-sky-200 p-8 text-center">
            <div className="w-14 h-14 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl font-semibold text-sky-900">{statusMessage || 'Processing...'}</p>
            <p className="text-sm text-sky-800 mt-2">This may take a few seconds depending on file size.</p>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Upload Medical Record</h1>
          <p className="text-slate-600 mb-6">Choose a file source to upload your medical document.</p>

          <div className="space-y-4">
          <button
            onClick={() => pdfInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-gradient-to-br from-rose-500 to-red-600 text-white p-6 rounded-3xl flex items-center space-x-4 hover:opacity-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FileText size={34} strokeWidth={2.5} />
            <div className="text-left flex-1">
              <div className="text-xl font-bold">Upload PDF</div>
              <div className="text-sm">Lab reports, prescriptions, discharge summaries.</div>
            </div>
          </button>

          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-gradient-to-br from-emerald-500 to-green-600 text-white p-6 rounded-3xl flex items-center space-x-4 hover:opacity-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FileImage size={34} strokeWidth={2.5} />
            <div className="text-left flex-1">
              <div className="text-xl font-bold">Upload Image</div>
              <div className="text-sm">JPG, PNG photos of reports and prescriptions.</div>
            </div>
          </button>

          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-gradient-to-br from-sky-500 to-blue-600 text-white p-6 rounded-3xl flex items-center space-x-4 hover:opacity-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Camera size={34} strokeWidth={2.5} />
            <div className="text-left flex-1">
              <div className="text-xl font-bold">Take Photo</div>
              <div className="text-sm">Capture and upload directly from your camera.</div>
            </div>
          </button>
          </div>

          {uploading && (
            <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-center">
              <p className="text-base font-bold text-sky-800">{statusMessage || 'Uploading...'}</p>
            </div>
          )}
        </div>

        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={onFileSelected}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileSelected}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFileSelected}
        />
      </div>
    </div>
  );
}
