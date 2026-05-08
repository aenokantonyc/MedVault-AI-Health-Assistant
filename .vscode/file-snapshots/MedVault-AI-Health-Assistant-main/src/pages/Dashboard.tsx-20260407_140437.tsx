import { FileText, Clock, Calendar, Upload, Brain, LogOut, Crown, Share2 } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { logout, accountType, user } = useAuth();
  const isPremium = accountType === 'premium';

  const handleLogout = () => {
    logout();
    onNavigate('login');
  };

  const menuItems = [
    {
      icon: Upload,
      label: 'Upload Medical Record',
      page: 'upload',
      color: 'from-cyan-500 to-teal-600',
      description: 'Scan, upload, and start AI processing.'
    },
    {
      icon: FileText,
      label: 'My Records',
      page: 'records',
      color: 'from-emerald-500 to-green-600',
      description: 'View all uploaded reports and status.'
    },
    {
      icon: Calendar,
      label: 'Health Timeline',
      page: 'timeline',
      color: 'from-orange-500 to-amber-600',
      description: 'Track clinical events chronologically.'
    },
    {
      icon: Clock,
      label: 'Care Reminders',
      page: 'reminders',
      color: 'from-rose-500 to-red-600',
      description: 'Medicine and follow-up reminders.'
    },
    {
      icon: Brain,
      label: 'AI Health Analysis',
      page: 'ai-analysis',
      color: 'from-indigo-500 to-blue-600',
      description: 'Live risk summary and recommendations.',
      premium: true,
    },
    {
      icon: Share2,
      label: 'Share With Doctor',
      page: 'share',
      color: 'from-slate-600 to-slate-800',
      description: 'Create a secure shareable summary link.',
    },
  ];

  return (
    <div className="app-shell">
      <div className="page-wrap space-y-6">
        <div className="glass-card p-6 md:p-8 flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Health Dashboard</h1>
            <p className="text-slate-600 mt-2">Welcome back, {user?.email}. Your realtime health workspace is ready.</p>
            <div className="flex items-center space-x-2 mt-3">
              {isPremium && (
                <span className="status-chip bg-amber-100 text-amber-800 gap-2">
                  <Crown size={14} /> Premium Access
                </span>
              )}
              {!isPremium && <span className="status-chip bg-sky-100 text-sky-800">Basic Plan</span>}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 transition hover:bg-slate-50"
          >
            <div className="flex items-center gap-2"><LogOut size={18} /> Logout</div>
          </button>
        </div>

        {!isPremium && (
          <div className="glass-card border-l-4 border-l-teal-500 p-5">
            <p className="text-lg font-bold text-teal-900">
              Your records are safely stored free for 5 years
            </p>
            <p className="text-teal-700 mt-1">
              After 5 years you can continue storage for ₹299/year
            </p>
          </div>
        )}

        <div className="space-y-4">
          {menuItems.map((item) => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`w-full bg-gradient-to-br ${item.color} text-white p-5 md:p-6 rounded-3xl text-left transition hover:translate-y-[-2px] shadow-lg shadow-slate-900/15`}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white/20 p-3">
                  <item.icon size={26} strokeWidth={2.3} />
                </div>
                <div>
                  <div className="text-xl font-extrabold">{item.label}</div>
                  <div className="text-sm text-white/90 mt-1">{item.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
