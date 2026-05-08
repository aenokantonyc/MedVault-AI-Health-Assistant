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
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Care Reminders</h1>
          <p className="text-slate-600 mb-6">Realtime reminders created from AI report processing.</p>

          {loading ? (
            <div className="text-center text-lg text-slate-600 py-12">Loading reminders...</div>
          ) : reminders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <Clock size={54} className="mx-auto text-slate-400 mb-4" />
              <p className="text-lg font-semibold text-slate-600">No reminders set</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <div key={reminder.id} className="rounded-2xl p-5 border border-slate-200 bg-white">
                  <div className="flex items-start gap-4">
                    <div className={`${getReminderColor(reminder.reminder_type)} p-3 rounded-xl text-white`}>
                      {getReminderIcon(reminder.reminder_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="status-chip bg-slate-100 text-slate-700">
                          {reminder.reminder_type}
                        </span>
                        {reminder.is_active && <span className="status-chip bg-emerald-100 text-emerald-700">Active</span>}
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 mb-1">{reminder.title}</h3>
                      {reminder.description && (
                        <p className="text-sm text-slate-700 mb-2">{reminder.description}</p>
                      )}
                      {reminder.reminder_time && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                          <Clock size={14} />
                          <span>{reminder.reminder_time}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
