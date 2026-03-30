import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';

interface TimelineEvent {
  id: string;
  event_date: string;
  event_type: string;
  title: string;
  description: string | null;
}

interface HealthTimelineProps {
  onNavigate: (page: string) => void;
}

export default function HealthTimeline({ onNavigate }: HealthTimelineProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTimeline = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('health_timeline')
      .select('*')
      .eq('user_id', user.id)
      .order('event_date', { ascending: false });

    if (error) {
      console.error('Error loading timeline:', error);
      setEvents(getMockEvents());
    } else {
      const allEvents = [...(data || []), ...getMockEvents()];
      allEvents.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
      setEvents(allEvents);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const getMockEvents = (): TimelineEvent[] => {
    return [
      {
        id: 'mock-1',
        event_date: '2024-06-15T10:00:00Z',
        event_type: 'Checkup',
        title: 'Annual Health Checkup',
        description: 'Routine physical examination - All vitals normal'
      },
      {
        id: 'mock-2',
        event_date: '2024-03-20T14:30:00Z',
        event_type: 'Vaccination',
        title: 'Flu Vaccination',
        description: 'Seasonal flu vaccine administered'
      },
      {
        id: 'mock-3',
        event_date: '2023-11-10T09:15:00Z',
        event_type: 'Lab Test',
        title: 'Blood Test',
        description: 'Complete Blood Count - Results within normal range'
      }
    ];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getEventColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Diagnosis': 'bg-red-100 border-red-400 text-red-800',
      'Checkup': 'bg-blue-100 border-blue-400 text-blue-800',
      'Vaccination': 'bg-green-100 border-green-400 text-green-800',
      'Lab Test': 'bg-orange-100 border-orange-400 text-orange-800',
      'Surgery': 'bg-purple-100 border-purple-400 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 border-gray-400 text-gray-800';
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

        <h1 className="text-4xl font-bold text-gray-900 mb-8">Health Timeline</h1>

        {loading ? (
          <div className="text-center text-2xl text-gray-600 py-12">Loading timeline...</div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border-4 border-gray-200">
            <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-2xl text-gray-600">No timeline events yet</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-300"></div>

            <div className="space-y-6">
              {events.map((event) => (
                <div key={event.id} className="relative pl-20">
                  <div className="absolute left-4 top-6 w-8 h-8 bg-blue-600 rounded-full border-4 border-white"></div>

                  <div className={`bg-white rounded-2xl p-6 border-4 ${getEventColor(event.event_type)}`}>
                    <div className="mb-2">
                      <span className="inline-block px-4 py-2 rounded-lg text-base font-bold">
                        {event.event_type}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                    {event.description && (
                      <p className="text-xl text-gray-700 mb-3">{event.description}</p>
                    )}
                    <p className="text-lg text-gray-600">{formatDate(event.event_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
