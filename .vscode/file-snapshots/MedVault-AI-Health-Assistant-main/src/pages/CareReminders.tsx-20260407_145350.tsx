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
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    reminderType: 'Follow-up',
    title: '',
    description: '',
    reminderDateTime: '',
  });

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

  const createReminder = async () => {
    if (!user) return;
    if (!form.title.trim()) {
      alert('Please enter a reminder title.');
      return;
    }

    setSaving(true);
    const reminderTime = form.reminderDateTime ? new Date(form.reminderDateTime).toISOString() : null;

    const { error } = await supabase.from('care_reminders').insert({
      user_id: user.id,
      reminder_type: form.reminderType,
      title: form.title.trim(),
      description: form.description.trim() || null,
      reminder_time: reminderTime,
      is_active: true,
    });

    if (error) {
      alert(`Failed to save reminder: ${error.message}`);
    } else {
      setForm({
        reminderType: 'Follow-up',
        title: '',
        description: '',
        reminderDateTime: '',
      });
    }

    setSaving(false);
  };

  const toggleReminder = async (reminder: Reminder) => {
    const { error } = await supabase
      .from('care_reminders')
      .update({ is_active: !reminder.is_active })
      .eq('id', reminder.id);

    if (error) {
      alert(`Failed to update reminder: ${error.message}`);
    }
  };

  const deleteReminder = async (id: string) => {
    const { error } = await supabase.from('care_reminders').delete().eq('id', id);
    if (error) {
      alert(`Failed to delete reminder: ${error.message}`);
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
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Care Reminders</h1>
          <p className="text-slate-600 mb-6">Create reminders with custom date and description, plus realtime AI-generated reminders.</p>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-6 space-y-3">
            <h2 className="text-lg font-extrabold text-slate-900">Create Reminder</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Reminder Type</label>
                <select
                  value={form.reminderType}
                  onChange={(e) => setForm((prev) => ({ ...prev, reminderType: e.target.value }))}
                  className="field-input"
                >
                  <option>Follow-up</option>
                  <option>Medicine</option>
                  <option>Refill</option>
                  <option>General</option>
                </select>
              </div>

              <div>
                <label className="field-label">Date and Time</label>
                <input
                  type="datetime-local"
                  value={form.reminderDateTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, reminderDateTime: e.target.value }))}
                  className="field-input"
                />
              </div>
            </div>

            <div>
              <label className="field-label">Reminder Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="field-input"
                placeholder="e.g. Take BP medication"
              />
            </div>

            <div>
              <label className="field-label">Description (Optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="field-input min-h-[110px]"
                placeholder="Add dosage, doctor note, or follow-up details"
              />
            </div>

            <button
              onClick={createReminder}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Reminder'}
            </button>
          </div>

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
                          <span>{new Date(reminder.reminder_time).toLocaleString()}</span>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleReminder(reminder)}
                          className="text-xs font-bold rounded-full px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          {reminder.is_active ? 'Mark Inactive' : 'Mark Active'}
                        </button>
                        <button
                          onClick={() => deleteReminder(reminder.id)}
                          className="text-xs font-bold rounded-full px-3 py-1 bg-rose-100 text-rose-700 hover:bg-rose-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
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
