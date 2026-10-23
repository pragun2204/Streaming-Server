import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaybackStore } from '../stores/playbackStore';
import { useVoiceStore } from '../stores/voiceStore';

describe('Playback and Voice Stores', () => {
  beforeEach(() => {
    usePlaybackStore.getState().clearLocalFile();
  });

  it('updates authoritative playback state with revision check', () => {
    const store = usePlaybackStore.getState();

    store.updatePlaybackState({
      roomId: 'room-1',
      mediaId: 'hash123',
      mediaName: 'Movie.mp4',
      mediaSize: 1000,
      mediaDuration: 500,
      status: 'PLAYING',
      positionSeconds: 10,
      playbackRate: 1.0,
      updatedAt: Date.now(),
      revision: 1,
      hostId: 'host-1',
    });

    expect(usePlaybackStore.getState().playbackState.status).toBe('PLAYING');
    expect(usePlaybackStore.getState().playbackState.revision).toBe(1);

    // Stale revision (0 < 1) should be ignored
    usePlaybackStore.getState().updatePlaybackState({
      roomId: 'room-1',
      mediaId: 'hash123',
      mediaName: 'Movie.mp4',
      mediaSize: 1000,
      mediaDuration: 500,
      status: 'PAUSED',
      positionSeconds: 5,
      playbackRate: 1.0,
      updatedAt: Date.now(),
      revision: 0,
      hostId: 'host-1',
    });

    expect(usePlaybackStore.getState().playbackState.status).toBe('PLAYING');
  });

  it('manages voice settings and deafen privacy logic', () => {
    const voice = useVoiceStore.getState();
    expect(voice.isMicMuted).toBe(false);

    // Deafening automatically mutes microphone
    voice.toggleDeafen();
    expect(useVoiceStore.getState().isDeafened).toBe(true);
    expect(useVoiceStore.getState().isMicMuted).toBe(true);

    // Undeafening
    voice.toggleDeafen();
    expect(useVoiceStore.getState().isDeafened).toBe(false);

    // Volume boundaries
    voice.setMediaVolume(1.5);
    expect(useVoiceStore.getState().mediaVolume).toBe(1.0);
    voice.setVoiceVolume(-0.5);
    expect(useVoiceStore.getState().voiceVolume).toBe(0.0);
  });
});
