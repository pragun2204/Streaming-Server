import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Film, Lock, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { roomApi } from '../lib/api';
import { useRoomStore } from '../stores/roomStore';

export const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { setRoom } = useRoomStore();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const room = await roomApi.createRoom(
        name.trim(),
        true,
        hasPassword && password.trim() ? password.trim() : undefined
      );
      setRoom(room);
      navigate(`/rooms/${room.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-graphite-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-graphite-900 border border-graphite-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center space-x-2 text-indigo-400 mb-6">
          <Film className="w-7 h-7" />
          <span className="text-2xl font-black text-white tracking-tight">
            Create a Watch Party
          </span>
        </div>

        <p className="text-xs text-graphite-400 text-center mb-6 leading-relaxed">
          Set up a private room for your movie night or screen-sharing session. Up to 10 friends can join.
        </p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-graphite-300 mb-2">
              Room Name
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Friday Sci-Fi Marathon"
              className="w-full bg-graphite-850 border border-graphite-700 rounded-xl px-4 py-3 text-sm text-white placeholder-graphite-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Optional Password Toggle */}
          <div className="pt-2">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasPassword}
                onChange={(e) => setHasPassword(e.target.checked)}
                className="w-4 h-4 rounded bg-graphite-800 border-graphite-700 text-indigo-600 focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-xs font-medium text-graphite-300">
                Protect room with a password
              </span>
            </label>
          </div>

          {hasPassword && (
            <div>
              <label className="block text-xs font-semibold text-graphite-300 mb-2">
                Room Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-graphite-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required={hasPassword}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter optional password"
                  className="w-full bg-graphite-850 border border-graphite-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-graphite-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
          )}

          <div className="bg-graphite-850/60 border border-graphite-800 rounded-xl p-3 flex items-center space-x-2 text-[11px] text-graphite-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Private room with cryptographic invitation link generated automatically.</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/25"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Party...</span>
              </>
            ) : (
              <>
                <span>Launch Watch Party</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-graphite-800 text-center text-xs text-graphite-500">
          <Link to="/" className="hover:text-graphite-300 transition">
            ← Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};
