import { FileText, Clock, Calendar, Upload, Brain, LogOut, Crown } from 'lucide-react';
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
    { icon: Upload, label: 'Upload Medical Record', page: 'upload', color: 'bg-blue-600' },
    { icon: FileText, label: 'My Records', page: 'records', color: 'bg-green-600' },
    { icon: Calendar, label: 'Health Timeline', page: 'timeline', color: 'bg-orange-600' },
    { icon: Clock, label: 'Care Reminders', page: 'reminders', color: 'bg-red-600' },
    { icon: Brain, label: 'AI Health Analysis', page: 'ai-analysis', color: 'bg-purple-600', premium: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Health Dashboard</h1>
            <div className="flex items-center space-x-2 mt-2">
              <p className="text-xl text-gray-600">Your Personal Health Assistant</p>
              {isPremium && (
                <span className="flex items-center bg-amber-100 text-amber-800 px-3 py-1 rounded-lg">
                  <Crown size={18} />
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-4 bg-gray-200 rounded-xl hover:bg-gray-300"
          >
            <LogOut size={32} />
          </button>
        </div>

        {!isPremium && (
          <div className="bg-blue-100 border-4 border-blue-400 rounded-2xl p-6 mb-8">
            <p className="text-xl font-bold text-blue-900">
              Your records are safely stored free for 5 years
            </p>
            <p className="text-lg text-blue-800 mt-2">
              After 5 years you can continue storage for ₹299/year
            </p>
          </div>
        )}

        <div className="space-y-4">
          {menuItems.map((item) => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`w-full ${item.color} text-white p-8 rounded-2xl flex items-center space-x-6 hover:opacity-90 transition-opacity relative`}
            >
              <item.icon size={48} strokeWidth={2.5} />
              <span className="text-2xl font-bold flex-1 text-left">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
