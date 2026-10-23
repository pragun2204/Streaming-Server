import React, { useState } from 'react';
import { Share2, Copy, Check, Users } from 'lucide-react';
import { useRoomStore } from '../stores/roomStore';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose }) => {
  const { room } = useRoomStore();
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !room) return null;

  const inviteUrl = `${window.location.origin}/rooms/${room.id}${
    room.inviteToken ? `?invite=${room.inviteToken}` : ''
  }`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      alert('Failed to copy link to clipboard');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-graphite-900 border border-graphite-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-graphite-800 mb-5">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Share2 className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Invite Friends</h3>
          </div>
          <button onClick={onClose} className="text-graphite-400 hover:text-white px-2 py-1">
            ✕
          </button>
        </div>

        <p className="text-xs text-graphite-300 mb-4 leading-relaxed">
          Share this private link with your friends to let them join your watch party.
        </p>

        {/* Link Field with Copy Button */}
        <div className="flex items-center space-x-2 bg-graphite-850 border border-graphite-700/70 rounded-xl p-2 mb-4">
          <input
            type="text"
            readOnly
            value={inviteUrl}
            className="flex-1 bg-transparent text-xs text-graphite-200 font-mono px-2 focus:outline-none select-all"
          />
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-graphite-400 text-[11px] bg-graphite-800/50 p-2.5 rounded-lg border border-graphite-800">
          <Users className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Strict room limit: maximum {room.capacity} participants per party.</span>
        </div>
      </div>
    </div>
  );
};
