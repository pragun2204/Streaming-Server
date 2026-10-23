import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Film,
  ScreenShare,
  Headphones,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [inviteInput, setInviteInput] = useState('');

  const handleJoinWithLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;

    try {
      const url = new URL(inviteInput.trim());
      const path = url.pathname;
      const search = url.search;
      navigate(`${path}${search}`);
    } catch {
      // If user typed room ID or invite code directly
      navigate(`/rooms/${inviteInput.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-graphite-950 text-graphite-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-graphite-850 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Film className="w-6 h-6 text-indigo-400" />
          <span className="text-xl font-extrabold text-white tracking-tight">
            Watch<span className="text-indigo-400">Party</span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/settings"
            className="text-xs text-graphite-400 hover:text-white transition px-3 py-1.5"
          >
            Settings
          </Link>
          <Link
            to="/privacy"
            className="text-xs text-graphite-400 hover:text-white transition px-3 py-1.5"
          >
            Privacy
          </Link>
          {user ? (
            <Link
              to="/rooms/new"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-md shadow-indigo-600/20"
            >
              Create Party
            </Link>
          ) : (
            <Link
              to="/login"
              className="bg-graphite-800 hover:bg-graphite-700 text-white text-xs font-semibold px-4 py-2 rounded-lg border border-graphite-700 transition"
            >
              Sign In / Guest
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs px-3.5 py-1.5 rounded-full mb-6 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time SFU WebRTC & Frame-Accurate Playback</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-4xl leading-tight sm:leading-none mb-6">
          Movie nights and screen sharing,{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-violet-300 bg-clip-text text-transparent">
            synchronized perfectly.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-graphite-300 max-w-2xl mb-10 leading-relaxed font-normal">
          Watch movies with up to 10 friends with zero video uploads using private local file sync,
          share your screen in ultra-smooth 1080p60, and chat freely over low-latency group voice.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full max-w-md">
          <Link
            to={user ? '/rooms/new' : '/login?redirect=/rooms/new'}
            className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition shadow-xl shadow-indigo-600/25"
          >
            <span>Host a Watch Party</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Join with Invite Form */}
          <form onSubmit={handleJoinWithLink} className="w-full sm:w-auto flex-1 flex">
            <input
              type="text"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              placeholder="Paste invite link or code..."
              className="w-full bg-graphite-900 border border-graphite-700/80 rounded-xl px-4 py-3 text-xs text-white placeholder-graphite-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </form>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {/* Card 1 */}
          <div className="bg-graphite-900/60 border border-graphite-800 rounded-2xl p-6 hover:border-graphite-700 transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Film className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Synchronized Local Media</h3>
            <p className="text-xs text-graphite-400 leading-relaxed">
              Play local movie files in lockstep with SHA-256 fingerprint validation and micro-drift
              rate adjustments. 100% private, 0 server bandwidth.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-graphite-900/60 border border-graphite-800 rounded-2xl p-6 hover:border-graphite-700 transition">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4">
              <ScreenShare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">1080p 60 FPS Screen Share</h3>
            <p className="text-xs text-graphite-400 leading-relaxed">
              Stream your desktop or application window with optional system audio through LiveKit's
              high-throughput WebRTC SFU with live diagnostics.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-graphite-900/60 border border-graphite-800 rounded-2xl p-6 hover:border-graphite-700 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Crystal Voice Chat</h3>
            <p className="text-xs text-graphite-400 leading-relaxed">
              Ultra-low latency audio with echo cancellation, noise suppression, push-to-talk,
              speaking indicators, and independent media vs voice volume.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-graphite-900 py-6 text-center text-xs text-graphite-500">
        <p>WatchParty — Open source, privacy-first private movie nights & screen sharing.</p>
      </footer>
    </div>
  );
};
