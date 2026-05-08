import { useRef, useState } from 'react';
import { Camera, FileImage, FileText, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';

interface UploadRecordProps {
  onNavigate: (page: string) => void;
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

  const processWithAI = async (recordId: string, storagePath: string, file: File) => {
    setProcessing(true);
    setStatusMessage('Running AI analysis on your report...');

    const { error: fnError } = await supabase.functions.invoke('process-medical-record', {
      body: {
        recordId,
        userId: user?.id,
        storagePath,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
      },
    });

    if (fnError) {
      await supabase
        .from('medical_records')
        .update({ processing_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', recordId);
      throw new Error(fnError.message);
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
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-3 text-blue-600 mb-8"
          >
            <ArrowLeft size={32} />
            <span className="text-2xl font-medium">Back to Dashboard</span>
          </button>

          <div className="bg-green-100 border-4 border-green-400 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-3xl font-bold text-green-800 mb-4">Upload Complete!</h2>
            <p className="text-xl text-green-700 mb-8">
              Record securely saved in your Health Vault
            </p>
            <p className="text-lg text-gray-700 mb-2">Your file is now in live storage and analysis is saved.</p>

            <div className="mt-8 space-y-4">
              <button
                onClick={() => onNavigate('record-detail', uploadedRecordId ?? undefined)}
                className="w-full bg-blue-600 text-white py-5 px-6 rounded-xl text-2xl font-bold hover:bg-blue-700"
              >
                View Processed Record
              </button>
              <button
                onClick={() => {
                  setUploadComplete(false);
                  setUploadedRecordId(null);
                  setStatusMessage('');
                }}
                className="w-full bg-gray-200 text-gray-900 py-5 px-6 rounded-xl text-2xl font-bold hover:bg-gray-300"
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
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Analyzing Your Report</h2>
          <div className="bg-blue-50 border-4 border-blue-300 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-2xl font-semibold text-blue-900">{statusMessage || 'Processing...'}</p>
            <p className="text-lg text-blue-800 mt-2">This may take a few seconds depending on file size.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center space-x-3 text-blue-600 mb-8"
        >
          <ArrowLeft size={32} />
          <span className="text-2xl font-medium">Back to Dashboard</span>
        </button>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">Upload Medical Record</h1>
        <p className="text-xl text-gray-600 mb-8">Choose a file source to upload your medical document</p>

        <div className="space-y-4">
          <button
            onClick={() => pdfInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-red-600 text-white p-8 rounded-2xl flex items-center space-x-6 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FileText size={48} strokeWidth={2.5} />
            <div className="text-left flex-1">
              <div className="text-2xl font-bold">Upload PDF</div>
              <div className="text-lg">Lab reports, prescriptions, etc.</div>
            </div>
          </button>

          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-green-600 text-white p-8 rounded-2xl flex items-center space-x-6 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FileImage size={48} strokeWidth={2.5} />
            <div className="text-left flex-1">
              <div className="text-2xl font-bold">Upload Image</div>
              <div className="text-lg">JPG, PNG photos of documents</div>
            </div>
          </button>

          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-blue-600 text-white p-8 rounded-2xl flex items-center space-x-6 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Camera size={48} strokeWidth={2.5} />
            <div className="text-left flex-1">
              <div className="text-2xl font-bold">Take Photo</div>
              <div className="text-lg">Capture document with camera</div>
            </div>
          </button>
        </div>

        {uploading && (
          <div className="mt-8 bg-blue-100 border-4 border-blue-400 rounded-xl p-6 text-center">
            <p className="text-2xl font-bold text-blue-800">{statusMessage || 'Uploading...'}</p>
          </div>
        )}

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
