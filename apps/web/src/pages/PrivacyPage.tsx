import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, EyeOff, Server, ArrowLeft } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-graphite-950 text-graphite-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between pb-6 border-b border-graphite-850 mb-8">
          <Link
            to="/"
            className="flex items-center space-x-1.5 text-xs text-graphite-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <div className="flex items-center space-x-2 text-white font-bold text-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Privacy & Architecture</span>
          </div>
          <div className="w-12" />
        </div>

        <div className="space-y-6 text-xs text-graphite-300 leading-relaxed">
          <div className="bg-graphite-900 border border-graphite-800 rounded-2xl p-6">
            <div className="flex items-center space-x-2 text-white font-bold text-sm mb-3">
              <EyeOff className="w-4 h-4 text-indigo-400" />
              <span>Zero Video Uploads for Local Media</span>
            </div>
            <p>
              When watching movies via local file synchronization, your video files never leave your computer.
              They are not uploaded to our servers or transferred through the cloud.
            </p>
            <p className="mt-2 text-graphite-400">
              Only a cryptographic fingerprint (SHA-256 hash) and timestamp telemetry are sent to verify
              compatibility between friends and keep your players locked in frame-by-frame synchronization.
            </p>
          </div>

          <div className="bg-graphite-900 border border-graphite-800 rounded-2xl p-6">
            <div className="flex items-center space-x-2 text-white font-bold text-sm mb-3">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Private Rooms & Ephemeral Sessions</span>
            </div>
            <p>
              Rooms are private by default, limited to 10 participants, and accessible only via cryptographically
              random invitation tokens or room passwords.
            </p>
            <p className="mt-2 text-graphite-400">
              Guest identities require no personal tracking, emails, or third-party advertising cookies.
              Session cookies are HTTP-only and SameSite protected.
            </p>
          </div>

          <div className="bg-graphite-900 border border-graphite-800 rounded-2xl p-6">
            <div className="flex items-center space-x-2 text-white font-bold text-sm mb-3">
              <Server className="w-4 h-4 text-violet-400" />
              <span>LiveKit WebRTC Media Routing</span>
            </div>
            <p>
              Voice channels and screen sharing utilize a dedicated, self-hostable LiveKit SFU. All media streams
              are encrypted via standard WebRTC DTLS-SRTP in transit. Media tokens are signed server-side and expire
              automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
