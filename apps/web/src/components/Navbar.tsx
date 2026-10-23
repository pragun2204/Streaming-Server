import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Film,
  Users,
  Settings,
  Share2,
  LogOut,
  WifiOff,
} from 'lucide-react';
import { useRoomStore } from '../stores/roomStore';
import { useAuthStore } from '../stores/authStore';

interface NavbarProps {
  onOpenInviteModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenInviteModal }) => {
  const navigate = useNavigate();
  const { room, participants, connectionState, leaveRoom } = useRoomStore();
  const { user } = useAuthStore();

  const handleLeave = async () => {
    await leaveRoom();
    navigate('/');
  };

  return (
    <header className="h-14 border-b border-graphite-800 bg-graphite-900/90 backdrop-blur px-4 flex items-center justify-between z-20">
      {/* Brand & Room Info */}
      <div className="flex items-center space-x-3">
        <Link to="/" className="flex items-center space-x-2 text-brand-500 hover:text-brand-400 font-bold text-lg transition">
          <Film className="w-5 h-5 text-indigo-400" />
          <span className="text-white tracking-tight">Watch<span className="text-indigo-400">Party</span></span>
        </Link>

        {room && (
          <div className="hidden sm:flex items-center space-x-2 border-l border-graphite-700 pl-3">
            <span className="text-sm font-semibold text-graphite-200">{room.name}</span>
            <div className="flex items-center space-x-1 bg-graphite-800 text-graphite-300 text-xs px-2 py-0.5 rounded-full">
              <Users className="w-3 h-3" />
              <span>{participants.length}/{room.capacity}</span>
            </div>
          </div>
        )}
      </div>

      {/* Status & Actions */}
      <div className="flex items-center space-x-2">
        {room && (
          <>
            {/* Connection State */}
            <div className="flex items-center space-x-1.5 px-2 py-1 text-xs rounded-md bg-graphite-850 text-graphite-400 border border-graphite-800">
              {connectionState === 'connected' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 hidden md:inline">Connected</span>
                </>
              ) : connectionState === 'connecting' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-amber-400 hidden md:inline">Connecting</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-rose-500" />
                  <span className="text-rose-400 hidden md:inline">Disconnected</span>
                </>
              )}
            </div>

            {/* Invite Button */}
            <button
              onClick={onOpenInviteModal}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-md transition shadow-sm"
              title="Invite Friends"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Invite</span>
            </button>
          </>
        )}

        {/* Settings */}
        <Link
          to="/settings"
          className="p-2 text-graphite-400 hover:text-graphite-200 hover:bg-graphite-800 rounded-md transition"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>

        {/* User Pill */}
        {user && (
          <div className="flex items-center space-x-2 bg-graphite-800/80 px-2.5 py-1 rounded-md border border-graphite-700/50">
            <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-graphite-200 hidden md:inline">
              {user.displayName}
            </span>
          </div>
        )}

        {/* Leave Room Action */}
        {room && (
          <button
            onClick={handleLeave}
            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-md transition"
            title="Leave Party"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
