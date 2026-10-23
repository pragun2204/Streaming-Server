import React, { useState } from 'react';
import { FolderOpen, Film, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { usePlaybackStore } from '../stores/playbackStore';
import { useRoomStore } from '../stores/roomStore';
import { useAuthStore } from '../stores/authStore';
import { computeFileHash, formatFileSize } from '../lib/utils';

interface FilePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FilePickerModal: React.FC<FilePickerModalProps> = ({ isOpen, onClose }) => {
  const {
    playbackState,
    setLocalFile,
    sendMediaSelected,
  } = usePlaybackStore();

  const { room } = useRoomStore();
  const { user } = useAuthStore();

  const isHost = room && user ? room.hostUserId === user.id : false;

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [calculatedHash, setCalculatedHash] = useState<string | null>(null);
  const [fileDuration, setFileDuration] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSelectedFile(file);
    setIsProcessing(true);

    try {
      // 1. Calculate SHA-256 hash
      const hash = await computeFileHash(file);
      setCalculatedHash(hash);

      // 2. Read video duration using temporary video object
      const url = URL.createObjectURL(file);
      const tempVideo = document.createElement('video');
      tempVideo.src = url;

      tempVideo.onloadedmetadata = () => {
        setFileDuration(tempVideo.duration || 0);
        setIsProcessing(false);
        URL.revokeObjectURL(url);
      };

      tempVideo.onerror = () => {
        setIsProcessing(false);
        URL.revokeObjectURL(url);
      };
    } catch (err: any) {
      console.error('Failed to process file:', err);
      setError('Could not read file fingerprint.');
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedFile || !calculatedHash) return;

    setLocalFile(selectedFile, calculatedHash);

    if (isHost) {
      // Host announces media selection to the entire room
      sendMediaSelected(calculatedHash, selectedFile.name, selectedFile.size, fileDuration);
    }

    onClose();
  };

  const isMatchWithHost =
    playbackState.mediaId && calculatedHash
      ? playbackState.mediaId === calculatedHash
      : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-graphite-900 border border-graphite-700/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-graphite-800 mb-5">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Film className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Select Local Movie File</h3>
          </div>
          <button onClick={onClose} className="text-graphite-400 hover:text-white px-2 py-1">
            ✕
          </button>
        </div>

        {/* File Drop / Select Area */}
        <label className="border-2 border-dashed border-graphite-700 hover:border-indigo-500/50 bg-graphite-850/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition text-center mb-4 group">
          <FolderOpen className="w-10 h-10 text-graphite-400 group-hover:text-indigo-400 transition mb-3" />
          <span className="text-sm font-semibold text-white mb-1">
            {selectedFile ? selectedFile.name : 'Choose a video file from your computer'}
          </span>
          <span className="text-xs text-graphite-400">
            Supports MP4 (H.264), WebM, and browser-playable formats
          </span>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center space-x-2 py-4 text-xs text-indigo-400 font-mono">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Calculating cryptographic fingerprint (SHA-256)...</span>
          </div>
        )}

        {/* File Details & Compatibility Preview */}
        {selectedFile && calculatedHash && !isProcessing && (
          <div className="bg-graphite-850 border border-graphite-800 rounded-xl p-4 space-y-2 text-xs mb-5">
            <div className="flex justify-between">
              <span className="text-graphite-400">Size:</span>
              <span className="font-mono text-white">{formatFileSize(selectedFile.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-graphite-400">Fingerprint:</span>
              <span className="font-mono text-indigo-300 text-[11px] truncate max-w-[220px]">
                {calculatedHash}
              </span>
            </div>

            {/* Viewer comparison with Host */}
            {!isHost && playbackState.mediaId && (
              <div className="pt-2 border-t border-graphite-700/50 flex items-center space-x-2">
                {isMatchWithHost ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">
                      Matches the host's video file perfectly!
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-300 font-medium">
                      Warning: File hash differs from host's selected movie.
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-graphite-300 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedFile || isProcessing}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-indigo-600/20"
          >
            {isHost ? 'Broadcast & Play Movie' : 'Confirm & Sync'}
          </button>
        </div>
      </div>
    </div>
  );
};
