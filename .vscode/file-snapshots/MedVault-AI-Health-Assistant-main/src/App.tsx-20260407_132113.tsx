import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import UploadRecord from './pages/UploadRecord';
import MyRecords from './pages/MyRecords';
import RecordDetail from './pages/RecordDetail';
import HealthTimeline from './pages/HealthTimeline';
import CareReminders from './pages/CareReminders';
import AIHealthAnalysis from './pages/AIHealthAnalysis';
import ShareWithDoctor from './pages/ShareWithDoctor';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('login');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const handleNavigate = (page: string, recordId?: string) => {
    setCurrentPage(page);
    if (recordId) {
      setSelectedRecordId(recordId);
    }
  };

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="glass-card p-10 text-center w-full max-w-md">
          <div className="w-14 h-14 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-slate-700">Loading your MedVault workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (currentPage === 'signup') {
      return <SignUp onNavigate={handleNavigate} />;
    } else if (currentPage === 'forgot-password') {
      return <ForgotPassword onNavigate={handleNavigate} />;
    } else {
      return <Login onNavigate={handleNavigate} />;
    }
  }

  switch (currentPage) {
    case 'dashboard':
      return <Dashboard onNavigate={handleNavigate} />;
    case 'upload':
      return <UploadRecord onNavigate={handleNavigate} />;
    case 'records':
      return <MyRecords onNavigate={handleNavigate} />;
    case 'record-detail':
      return selectedRecordId ? (
        <RecordDetail recordId={selectedRecordId} onNavigate={handleNavigate} />
      ) : (
        <Dashboard onNavigate={handleNavigate} />
      );
    case 'timeline':
      return <HealthTimeline onNavigate={handleNavigate} />;
    case 'reminders':
      return <CareReminders onNavigate={handleNavigate} />;
    case 'ai-analysis':
      return <AIHealthAnalysis onNavigate={handleNavigate} />;
    case 'share':
      return <ShareWithDoctor onNavigate={handleNavigate} />;
    default:
      return <Dashboard onNavigate={handleNavigate} />;
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
