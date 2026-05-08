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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center space-x-3 text-blue-600 mb-8"
        >
          <ArrowLeft size={32} />
          <span className="text-2xl font-medium">Back to Dashboard</span>
        </button>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Medical Records</h1>

        {loading ? (
          <div className="text-center text-2xl text-gray-600 py-12">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border-4 border-gray-200">
            <FileText size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-2xl text-gray-600 mb-6">No records uploaded yet</p>
            <button
              onClick={() => onNavigate('upload')}
              className="bg-blue-600 text-white py-5 px-8 rounded-xl text-2xl font-bold hover:bg-blue-700"
            >
              Upload First Record
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record.id} className="bg-white rounded-2xl border-4 border-gray-200 hover:border-blue-400 transition">
                <button
                  onClick={() => onNavigate('record-detail', record.id)}
                  className="w-full p-6 text-left"
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-4 rounded-xl flex-shrink-0">
                      {record.preview_url && record.file_type.startsWith('image/') ? (
                        <img
                          src={record.preview_url}
                          alt={record.file_name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <FileText size={40} className="text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {record.disease || record.record_type}
                      </h3>
                      <p className="text-xl text-gray-600 mb-1">{record.file_name}</p>
                      <p className="text-lg text-gray-500">Uploaded: {formatDate(record.upload_date)}</p>
                      {record.is_processed && (
                        <span className="inline-block mt-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg text-base font-bold">
                          Processed
                        </span>
                      )}
                      {!record.is_processed && (
                        <span className="inline-block mt-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-base font-bold">
                          {record.processing_status || 'Processing'}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                <div className="px-6 pb-4 border-t-4 border-gray-100">
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-800 text-lg font-medium"
                  >
                    <Trash2 size={24} />
                    <span>Delete Record</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
