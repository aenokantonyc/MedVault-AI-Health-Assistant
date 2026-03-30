import { useState, useEffect } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RecordDetailProps {
  recordId: string;
  onNavigate: (page: string) => void;
}

interface MedicalRecord {
  id: string;
  file_name: string;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      }

      setLoading(false);
    };

    loadRecord();
  }, [recordId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-2xl text-gray-600">Loading record...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-2xl text-gray-600 mb-8">Record not found</p>
          <button
            onClick={() => onNavigate('records')}
            className="bg-blue-600 text-white py-5 px-8 rounded-xl text-2xl font-bold hover:bg-blue-700"
          >
            Back to Records
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => onNavigate('records')}
          className="flex items-center space-x-3 text-blue-600 mb-8"
        >
          <ArrowLeft size={32} />
          <span className="text-2xl font-medium">Back to Records</span>
        </button>

        <div className="bg-white rounded-2xl p-8 border-4 border-gray-200 mb-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-blue-100 p-4 rounded-xl">
              <FileText size={40} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{record.disease || record.record_type}</h1>
              <p className="text-xl text-gray-600">{formatDate(record.upload_date)}</p>
            </div>
          </div>

          <div className="bg-gray-100 rounded-xl p-6 mb-6">
            <p className="text-xl text-gray-600 mb-2">Document Preview</p>
            <div className="bg-white border-4 border-gray-300 rounded-lg p-8 text-center">
              <FileText size={64} className="mx-auto text-gray-400 mb-2" />
              <p className="text-lg text-gray-500">{record.file_name}</p>
              <p className="text-base text-gray-400 mt-1">(Preview placeholder)</p>
            </div>
          </div>

          {record.is_processed && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Extracted Information</h2>

              <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="grid grid-cols-1 gap-4">
                  {record.disease && (
                    <div>
                      <p className="text-lg text-gray-600 font-medium">Disease</p>
                      <p className="text-2xl font-bold text-gray-900">{record.disease}</p>
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
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-full bg-green-600 text-white py-6 px-6 rounded-xl text-2xl font-bold hover:bg-green-700"
              >
                {showExplanation ? 'Hide Explanation' : 'Explain This Report'}
              </button>

              {showExplanation && (
                <div className="bg-green-50 border-4 border-green-300 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-green-900 mb-4">Simple Explanation</h3>
                  <p className="text-xl text-gray-800 leading-relaxed">
                    Your sugar level is slightly high. The doctor prescribed Metformin to control blood sugar and prevent diabetes complications. Take the medicine regularly as prescribed, maintain a healthy diet, and exercise regularly. Monitor your blood sugar levels and visit your doctor for follow-up checkups.
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
