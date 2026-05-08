import { useEffect, useState } from 'react';
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

const VALID_PAGES = new Set([
  'login',
  'signup',
  'forgot-password',
  'dashboard',
  'upload',
  'records',
  'record-detail',
  'timeline',
  'reminders',
  'ai-analysis',
  'share',
]);

const PAGE_STORAGE_KEY = 'medvault.currentPage';
const RECORD_STORAGE_KEY = 'medvault.selectedRecordId';

const parseHashRoute = () => {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) return { page: null as string | null, recordId: null as string | null };

  const [path, rawQuery = ''] = hash.split('?');
  const page = VALID_PAGES.has(path) ? path : null;
  const params = new URLSearchParams(rawQuery);
  const recordId = params.get('recordId');

  return { page, recordId };
};

const syncHashRoute = (page: string, recordId?: string) => {
  const params = new URLSearchParams();
  if (page === 'record-detail' && recordId) {
    params.set('recordId', recordId);
  }
  const query = params.toString();
  window.location.hash = query ? `/${page}?${query}` : `/${page}`;
};

function AppContent() {
  const { user, loading } = useAuth();
  const initialRoute = parseHashRoute();
  const [currentPage, setCurrentPage] = useState<string>(
    initialRoute.page ?? localStorage.getItem(PAGE_STORAGE_KEY) ?? 'login'
  );
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(
    initialRoute.recordId ?? localStorage.getItem(RECORD_STORAGE_KEY)
  );

  useEffect(() => {
    const onHashChange = () => {
      const route = parseHashRoute();
      if (route.page) {
        setCurrentPage(route.page);
      }
      if (route.recordId) {
        setSelectedRecordId(route.recordId);
      }
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    localStorage.setItem(PAGE_STORAGE_KEY, currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (selectedRecordId) {
      localStorage.setItem(RECORD_STORAGE_KEY, selectedRecordId);
    }
  }, [selectedRecordId]);

  const handleNavigate = (page: string, recordId?: string) => {
    setCurrentPage(page);
    if (recordId) {
      setSelectedRecordId(recordId);
    }
    syncHashRoute(page, recordId);
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
