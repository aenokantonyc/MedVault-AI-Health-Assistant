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
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Health Timeline</h1>
          <p className="text-slate-600 mb-6">Live chronological health events extracted from your records.</p>

          {loading ? (
            <div className="text-center text-lg text-slate-600 py-12">Loading timeline...</div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <Calendar size={54} className="mx-auto text-slate-400 mb-4" />
              <p className="text-lg font-semibold text-slate-600">No timeline events yet</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-slate-200"></div>

              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="relative pl-14">
                    <div className="absolute left-0 top-5 w-3 h-3 bg-teal-600 rounded-full border-2 border-white"></div>

                    <div className={`rounded-2xl p-5 border ${getEventColor(event.event_type)}`}>
                      <div className="mb-2">
                        <span className="status-chip bg-white/60 text-slate-700">
                          {event.event_type}
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold mb-1">{event.title}</h3>
                      {event.description && (
                        <p className="text-sm text-slate-700 mb-2">{event.description}</p>
                      )}
                      <p className="text-xs text-slate-600 font-semibold">{formatDate(event.event_date)}</p>
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
