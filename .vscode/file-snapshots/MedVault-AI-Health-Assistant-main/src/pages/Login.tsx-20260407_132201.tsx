import { useState } from 'react';
import { useAuth } from '../contexts/useAuth';

interface LoginProps {
  onNavigate: (page: string) => void;
}

export default function Login({ onNavigate }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submit
    if (loading) return;

    setError('');

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);

      console.log('Attempting login...');

      const result = await signIn(email.trim(), password);

      console.log('Login result:', result);

      if (!result || result.error) {
        throw result?.error || new Error('Login failed.');
      }

      // Reset loading before navigation
      setLoading(false);

      onNavigate('dashboard');
    } catch (err: unknown) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="app-shell flex items-center justify-center">
      <div className="glass-card w-full max-w-md p-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 text-center">Welcome Back</h1>
        <p className="text-slate-600 mb-6 text-center">Login to access your realtime health records and AI insights.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="field-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-input"
              required
            />
          </div>

          <div>
            <label className="field-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input"
              required
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => onNavigate('forgot-password')}
            className="text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            Forgot Password?
          </button>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('signup')}
            className="w-full text-center text-sm font-semibold text-slate-700"
          >
            Don't have an account? Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
