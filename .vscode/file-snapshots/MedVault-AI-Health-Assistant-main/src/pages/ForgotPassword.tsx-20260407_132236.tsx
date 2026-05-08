import { useState } from 'react';

interface ForgotPasswordProps {
  onNavigate: (page: string) => void;
}

export default function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="app-shell flex items-center justify-center">
      <div className="glass-card w-full max-w-md p-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 text-center">Forgot Password</h1>
        <p className="text-slate-600 mb-6 text-center">
          {submitted
            ? 'Password reset link sent to your email (Demo Mode)'
            : 'Enter your email to reset your password'}
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <button
              type="submit"
              className="btn-primary"
            >
              Send Reset Link
            </button>

            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="w-full text-center text-sm font-semibold text-slate-700"
            >
              Back to Login
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
              Check your email for the password reset link
            </div>

            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="btn-primary"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
