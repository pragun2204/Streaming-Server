import { useEffect, useRef, useCallback } from 'react';
import { usePlaybackStore } from '../stores/playbackStore';
import { useRoomStore } from '../stores/roomStore';
import { useAuthStore } from '../stores/authStore';

export function usePlaybackSync(videoRef: React.RefObject<HTMLVideoElement>) {
  const {
    playbackState,
    updatePlaybackState,
    sendPlaybackCommand,
    setDriftMs,
  } = usePlaybackStore();

  const { ws, room } = useRoomStore();
  const { user } = useAuthStore();

  const isHost = room && user ? room.hostUserId === user.id : false;
  const isApplyingServerStateRef = useRef(false);
  const seekSuppressionUntilRef = useRef(0);

  // Subscribe to WebSocket playback updates
  useEffect(() => {
    if (!ws) return;

    const unbind = ws.on('playback.state_updated', (newState) => {
      updatePlaybackState(newState);
    });

    return () => unbind();
  }, [ws, updatePlaybackState]);

  // Handle local video playback controls when host clicks play/pause/seek
  const handleHostPlay = useCallback(() => {
    if (!isHost || isApplyingServerStateRef.current) return;
    const video = videoRef.current;
    if (video) {
      sendPlaybackCommand('PLAY', video.currentTime, video.playbackRate);
    }
  }, [isHost, sendPlaybackCommand, videoRef]);

  const handleHostPause = useCallback(() => {
    if (!isHost || isApplyingServerStateRef.current) return;
    const video = videoRef.current;
    if (video) {
      sendPlaybackCommand('PAUSE', video.currentTime, video.playbackRate);
    }
  }, [isHost, sendPlaybackCommand, videoRef]);

  const handleHostSeek = useCallback((targetSeconds: number) => {
    if (!isHost) return;
    seekSuppressionUntilRef.current = Date.now() + 1000;
    const video = videoRef.current;
    if (video) {
      video.currentTime = targetSeconds;
    }
    sendPlaybackCommand('SEEK', targetSeconds);
  }, [isHost, sendPlaybackCommand, videoRef]);

  // High-frequency drift monitoring and correction loop (runs every 250ms)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now < seekSuppressionUntilRef.current) return;

      const { status, positionSeconds, playbackRate, updatedAt } = playbackState;

      // Calculate expected server position
      let expectedPos = positionSeconds;
      if (status === 'PLAYING') {
        const elapsedSec = Math.max(0, (now - updatedAt) / 1000);
        expectedPos = positionSeconds + elapsedSec * playbackRate;
      }

      const currentPos = video.currentTime;
      const driftSec = currentPos - expectedPos;
      setDriftMs(Math.round(driftSec * 1000));

      // Synchronize play/pause state
      if (status === 'PLAYING' && video.paused) {
        isApplyingServerStateRef.current = true;
        video.play().catch(() => {}).finally(() => {
          isApplyingServerStateRef.current = false;
        });
      } else if (status === 'PAUSED' && !video.paused) {
        isApplyingServerStateRef.current = true;
        video.pause();
        isApplyingServerStateRef.current = false;
      }

      // Three-Zone Drift Correction Policy
      const absDrift = Math.abs(driftSec);

      if (absDrift <= 0.15) {
        // Zone 0: In sync. Restore normal playback rate
        if (video.playbackRate !== playbackRate) {
          video.playbackRate = playbackRate;
        }
      } else if (absDrift > 0.15 && absDrift <= 1.0) {
        // Zone 1: Micro-drift. Smoothly accelerate or decelerate by 5%
        if (driftSec < 0) {
          // Client is behind expected position -> speed up slightly
          video.playbackRate = playbackRate * 1.05;
        } else {
          // Client is ahead -> slow down slightly
          video.playbackRate = playbackRate * 0.95;
        }
      } else if (absDrift > 1.0) {
        // Zone 2: Hard drift (>1.0s). Perform instantaneous seek jump
        isApplyingServerStateRef.current = true;
        seekSuppressionUntilRef.current = now + 1000;
        video.currentTime = expectedPos;
        video.playbackRate = playbackRate;
        setTimeout(() => {
          isApplyingServerStateRef.current = false;
        }, 300);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [playbackState, setDriftMs, videoRef]);

  return {
    handleHostPlay,
    handleHostPause,
    handleHostSeek,
    isHost,
  };
}
