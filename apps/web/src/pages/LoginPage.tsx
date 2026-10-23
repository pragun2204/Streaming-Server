import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Film, User, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { loginGuest, isLoading, error, clearError } = useAuthStore();
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    try {
      await loginGuest(displayName.trim());
      navigate(redirectUrl);
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-screen bg-graphite-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-graphite-900 border border-graphite-800 rounded-2xl p-8 shadow-2xl">
        {/* Brand */}
        <div className="flex items-center justify-center space-x-2 text-indigo-400 mb-6">
          <Film className="w-7 h-7" />
          <span className="text-2xl font-black text-white tracking-tight">
            Watch<span className="text-indigo-400">Party</span>
          </span>
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-2">Welcome to the Party</h2>
        <p className="text-xs text-graphite-400 text-center mb-6 leading-relaxed">
          Choose a display name to join or create rooms. No passwords or long sign-ups needed.
        </p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl mb-5 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-rose-400 hover:text-white ml-2">
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-graphite-300 mb-2">
              Your Display Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-graphite-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                minLength={2}
                maxLength={50}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. MovieBuff99"
                className="w-full bg-graphite-850 border border-graphite-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-graphite-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !displayName.trim()}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/25"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Entering Party...</span>
              </>
            ) : (
              <>
                <span>Continue as Guest</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-graphite-800 text-center text-xs text-graphite-500">
          <Link to="/" className="hover:text-graphite-300 transition">
            ← Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
