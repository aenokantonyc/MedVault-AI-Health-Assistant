import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Pill, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';

interface Reminder {
  id: string;
  reminder_type: string;
  title: string;
  description: string | null;
  reminder_time: string | null;
  is_active: boolean;
}

interface CareRemindersProps {
  onNavigate: (page: string) => void;
}

export default function CareReminders({ onNavigate }: CareRemindersProps) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();

    if (!user) return;

    const channel = supabase
      .channel(`reminders-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'care_reminders', filter: `user_id=eq.${user.id}` },
        () => {
          loadReminders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadReminders = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('care_reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading reminders:', error);
    } else {
      setReminders(data || []);
    }

    setLoading(false);
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'Medicine':
        return <Pill size={36} />;
      case 'Follow-up':
        return <Calendar size={36} />;
      case 'Refill':
        return <AlertCircle size={36} />;
      default:
        return <Clock size={36} />;
    }
  };

  const getReminderColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Medicine': 'bg-blue-600',
      'Follow-up': 'bg-green-600',
      'Refill': 'bg-orange-600'
    };
    return colors[type] || 'bg-gray-600';
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

        <h1 className="text-4xl font-bold text-gray-900 mb-8">Care Reminders</h1>

        {loading ? (
          <div className="text-center text-2xl text-gray-600 py-12">Loading reminders...</div>
        ) : reminders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border-4 border-gray-200">
            <Clock size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-2xl text-gray-600">No reminders set</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="bg-white rounded-2xl p-6 border-4 border-gray-200"
              >
                <div className="flex items-start space-x-4">
                  <div className={`${getReminderColor(reminder.reminder_type)} p-4 rounded-xl text-white`}>
                    {getReminderIcon(reminder.reminder_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-block px-4 py-2 bg-gray-100 rounded-lg text-base font-bold text-gray-700">
                        {reminder.reminder_type}
                      </span>
                      {reminder.is_active && (
                        <span className="text-green-600 font-bold text-lg">Active</span>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{reminder.title}</h3>
                    {reminder.description && (
                      <p className="text-xl text-gray-700 mb-3">{reminder.description}</p>
                    )}
                    {reminder.reminder_time && (
                      <div className="flex items-center space-x-2 text-lg text-gray-600">
                        <Clock size={20} />
                        <span>{reminder.reminder_time}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
