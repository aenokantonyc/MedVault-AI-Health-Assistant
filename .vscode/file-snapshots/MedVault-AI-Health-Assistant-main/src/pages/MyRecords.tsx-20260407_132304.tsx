import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';

interface MedicalRecord {
  id: string;
  file_name: string;
  file_type: string;
  storage_path: string | null;
  upload_date: string;
  record_type: string;
  disease: string | null;
  is_processed: boolean;
  processing_status: string;
  preview_url?: string | null;
}

interface MyRecordsProps {
  onNavigate: (page: string, recordId?: string) => void;
}

export default function MyRecords({ onNavigate }: MyRecordsProps) {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();

    if (!user) return;

    const channel = supabase
      .channel(`records-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medical_records', filter: `user_id=eq.${user.id}` },
        () => {
          loadRecords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadRecords = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('user_id', user.id)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error loading records:', error);
    } else {
      const recordsWithPreview = await Promise.all(
        (data || []).map(async (record) => {
          if (!record.storage_path) {
            return { ...record, preview_url: null };
          }

          const { data: signedData } = await supabase.storage
            .from('medical-records')
            .createSignedUrl(record.storage_path, 60 * 30);

          return { ...record, preview_url: signedData?.signedUrl ?? null };
        })
      );

      setRecords(recordsWithPreview);
    }

    setLoading(false);
  };

  const handleDelete = async (recordId: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      const target = records.find((r) => r.id === recordId);

      if (target?.storage_path) {
        await supabase.storage.from('medical-records').remove([target.storage_path]);
      }

      const { error } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', recordId);

      if (!error) {
        setRecords(records.filter(r => r.id !== recordId));
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">My Medical Records</h1>
          <p className="text-slate-600 mb-6">Uploaded reports, scans, and live AI processing status.</p>

          {loading ? (
            <div className="text-center text-lg text-slate-600 py-12">Loading records...</div>
          ) : records.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <FileText size={54} className="mx-auto text-slate-400 mb-4" />
              <p className="text-lg font-semibold text-slate-700 mb-5">No records uploaded yet</p>
              <button
                onClick={() => onNavigate('upload')}
                className="btn-primary max-w-sm mx-auto"
              >
                Upload First Record
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div key={record.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
                  <button
                    onClick={() => onNavigate('record-detail', record.id)}
                    className="w-full p-5 text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-sky-100 p-3 rounded-xl flex-shrink-0">
                        {record.preview_url && record.file_type.startsWith('image/') ? (
                          <img
                            src={record.preview_url}
                            alt={record.file_name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <FileText size={34} className="text-sky-700" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                          {record.disease || record.record_type}
                        </h3>
                        <p className="text-sm text-slate-600 truncate mb-1" title={record.file_name}>{record.file_name}</p>
                        <p className="text-sm text-slate-500">Uploaded: {formatDate(record.upload_date)}</p>
                        {record.is_processed && (
                          <span className="status-chip mt-2 bg-emerald-100 text-emerald-800">Processed</span>
                        )}
                        {!record.is_processed && (
                          <span className="status-chip mt-2 bg-amber-100 text-amber-800">
                            {record.processing_status || 'Processing'}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  <div className="px-5 pb-4 border-t border-slate-100">
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 text-sm font-bold"
                    >
                      <Trash2 size={16} />
                      <span>Delete Record</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
