import { useState } from 'react';
import { useAuth } from '../contexts/useAuth';

interface SignUpProps {
  onNavigate: (page: string) => void;
}

export default function SignUp({ onNavigate }: SignUpProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signUp(email, password, fullName, phone);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="app-shell flex items-center justify-center">
      <div className="glass-card w-full max-w-xl p-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 text-center">Create Account</h1>
        <p className="text-slate-600 mb-6 text-center">Build your private medical vault and start AI-assisted tracking.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="field-label">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="field-input"
              required
            />
          </div>

          <div>
            <label className="field-label">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="field-input"
              required
            />
          </div>

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
              minLength={6}
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="w-full text-center text-sm font-semibold text-slate-700"
          >
            Already have an account? Login
          </button>
        </form>
      </div>
    </div>
  );
}
