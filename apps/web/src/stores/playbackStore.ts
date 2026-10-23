import { create } from 'zustand';
import { PlaybackState } from '../types';
import { useRoomStore } from './roomStore';

interface PlaybackStoreState {
  playbackState: PlaybackState;
  localFile: File | null;
  localFileHash: string | null;
  isCompatible: boolean;
  driftMs: number;
  measuredFps: number;
  measuredResolution: string;

  setLocalFile: (file: File, hash: string) => void;
  clearLocalFile: () => void;
  updatePlaybackState: (state: PlaybackState) => void;
  setDriftMs: (ms: number) => void;
  setDiagnostics: (fps: number, resolution: string) => void;
  sendPlaybackCommand: (command: string, positionSeconds?: number, playbackRate?: number) => void;
  sendMediaSelected: (mediaId: string, mediaName: string, mediaSize: number, mediaDuration: number) => void;
  sendReadyStatus: (isCompatible: boolean) => void;
}

const initialPlaybackState: PlaybackState = {
  roomId: '',
  mediaId: null,
  mediaName: null,
  mediaSize: null,
  mediaDuration: null,
  status: 'IDLE',
  positionSeconds: 0,
  playbackRate: 1.0,
  updatedAt: 0,
  revision: 0,
  hostId: null,
};

export const usePlaybackStore = create<PlaybackStoreState>((set, get) => ({
  playbackState: initialPlaybackState,
  localFile: null,
  localFileHash: null,
  isCompatible: false,
  driftMs: 0,
  measuredFps: 0,
  measuredResolution: '0x0',

  setLocalFile: (file, hash) => {
    const current = get().playbackState;
    const compatible = current.mediaId ? current.mediaId === hash : true;
    set({
      localFile: file,
      localFileHash: hash,
      isCompatible: compatible,
    });
    get().sendReadyStatus(compatible);
  },

  clearLocalFile: () => {
    set({ localFile: null, localFileHash: null, isCompatible: false });
    get().sendReadyStatus(false);
  },

  updatePlaybackState: (newState) => {
    const current = get().playbackState;
    if (newState.revision >= current.revision) {
      const hash = get().localFileHash;
      const isCompat = newState.mediaId && hash ? newState.mediaId === hash : false;
      set({
        playbackState: newState,
        isCompatible: isCompat,
      });
    }
  },

  setDriftMs: (ms) => set({ driftMs: ms }),
  setDiagnostics: (fps, resolution) => set({ measuredFps: fps, measuredResolution: resolution }),

  sendPlaybackCommand: (command, positionSeconds, playbackRate) => {
    const ws = useRoomStore.getState().ws;
    const currentRev = get().playbackState.revision;
    if (ws) {
      ws.send('playback.command', {
        command,
        positionSeconds,
        playbackRate,
        revision: currentRev,
      });
    }
  },

  sendMediaSelected: (mediaId, mediaName, mediaSize, mediaDuration) => {
    const ws = useRoomStore.getState().ws;
    if (ws) {
      ws.send('playback.media_selected', {
        mediaId,
        mediaName,
        mediaSize,
        mediaDuration,
      });
    }
  },

  sendReadyStatus: (isCompatible) => {
    const ws = useRoomStore.getState().ws;
    if (ws) {
      ws.send('playback.ready', { isCompatible });
    }
  },
}));
