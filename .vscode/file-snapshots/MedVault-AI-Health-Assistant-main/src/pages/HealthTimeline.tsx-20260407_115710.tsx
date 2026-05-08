import { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadTimeline();

    if (!user) return;

    const channel = supabase
      .channel(`timeline-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'health_timeline', filter: `user_id=eq.${user.id}` },
        () => {
          loadTimeline();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadTimeline = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('health_timeline')
      .select('*')
      .eq('user_id', user.id)
      .order('event_date', { ascending: false });

    if (error) {
      console.error('Error loading timeline:', error);
    } else {
      setEvents(data || []);
    }

    setLoading(false);
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
