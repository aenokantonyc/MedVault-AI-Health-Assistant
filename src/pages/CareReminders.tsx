import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Pill, Calendar, AlertCircle, X, Plus } from 'lucide-react';
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

interface NewReminder {
  title: string;
  description: string;
  reminderTime: string;
  reminderType: string;
}

export default function CareReminders({ onNavigate }: CareRemindersProps) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [newReminder, setNewReminder] = useState<NewReminder>({
    title: '',
    description: '',
    reminderTime: '',
    reminderType: 'Follow-up'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('care_reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading reminders:', error);
      setReminders(getMockReminders());
    } else {
      const allReminders = [...(data || []), ...getMockReminders()];
      setReminders(allReminders);
    }

    setLoading(false);
  };

  const getMockReminders = (): Reminder[] => {
    return [
      {
        id: 'mock-1',
        reminder_type: 'Follow-up',
        title: 'Doctor Follow-up Visit',
        description: 'Visit Dr. Kumar for diabetes check-up',
        reminder_time: 'March 15, 2026',
        is_active: true
      },
      {
        id: 'mock-2',
        reminder_type: 'Refill',
        title: 'Medicine Refill Alert',
        description: 'Refill Metformin prescription',
        reminder_time: 'In 7 days',
        is_active: true
      }
    ];
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

  const handleSaveReminder = async () => {
    if (!newReminder.title.trim() || !newReminder.reminderTime.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (user) {
        const { data, error } = await supabase
          .from('care_reminders')
          .insert([
            {
              user_id: user.id,
              title: newReminder.title,
              description: newReminder.description,
              reminder_type: newReminder.reminderType,
              reminder_time: newReminder.reminderTime,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ]);

        if (error) {
          console.error('Error saving reminder:', error);
          alert('Error saving reminder. Using mock data.');
        }
      }

      // Add the new reminder to the local state
      const addedReminder: Reminder = {
        id: `reminder-${Date.now()}`,
        reminder_type: newReminder.reminderType,
        title: newReminder.title,
        description: newReminder.description || null,
        reminder_time: newReminder.reminderTime,
        is_active: true
      };

      setReminders([addedReminder, ...reminders]);
      setShowDialog(false);
      setNewReminder({
        title: '',
        description: '',
        reminderTime: '',
        reminderType: 'Follow-up'
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save reminder');
    } finally {
      setSaving(false);
    }
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

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Care Reminders</h1>
          <button
            onClick={() => setShowDialog(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus size={24} />
            <span>New Details</span>
          </button>
        </div>

        {/* New Reminder Dialog */}
        {showDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-xl w-full max-h-screen overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b-4 border-gray-200 p-6 flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Add New Reminder</h2>
                <button
                  onClick={() => setShowDialog(false)}
                  disabled={saving}
                  className="bg-gray-100 p-3 rounded-xl hover:bg-gray-200 disabled:bg-gray-200"
                >
                  <X size={32} className="text-gray-600" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {/* Reminder Type */}
                <div>
                  <label className="block text-xl font-bold text-gray-900 mb-3">
                    Reminder Type
                  </label>
                  <select
                    value={newReminder.reminderType}
                    onChange={(e) => setNewReminder({ ...newReminder, reminderType: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Follow-up">Follow-up Visit</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Refill">Prescription Refill</option>
                  </select>
                </div>

                {/* Heading */}
                <div>
                  <label className="block text-xl font-bold text-gray-900 mb-3">
                    Heading/Title <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Doctor Follow-up Visit"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xl font-bold text-gray-900 mb-3">
                    Description
                  </label>
                  <textarea
                    placeholder="e.g., Visit Dr. Kumar for diabetes check-up"
                    value={newReminder.description}
                    onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>

                {/* Date and Time Picker */}
                <div>
                  <label className="block text-xl font-bold text-gray-900 mb-3">
                    Remind Me On <span className="text-red-600">*</span>
                  </label>
                  <div className="flex items-center space-x-3">
                    <Clock size={28} className="text-blue-600" />
                    <input
                      type="datetime-local"
                      value={newReminder.reminderTime}
                      onChange={(e) => setNewReminder({ ...newReminder, reminderTime: e.target.value })}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveReminder}
                  disabled={saving}
                  className="w-full bg-green-600 text-white py-4 px-6 rounded-lg text-xl font-bold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {saving ? 'Saving...' : 'Save Reminder'}
                </button>

                <button
                  onClick={() => setShowDialog(false)}
                  disabled={saving}
                  className="w-full bg-gray-200 text-gray-900 py-4 px-6 rounded-lg text-xl font-bold hover:bg-gray-300 disabled:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

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
