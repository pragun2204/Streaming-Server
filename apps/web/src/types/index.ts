export interface User {
  id: string;
  displayName: string;
  createdAt: string;
  lastSeenAt: string;
}

export type MediaMode = 'NONE' | 'SCREEN_SHARE' | 'LOCAL_FILE';

export interface Participant {
  userId: string;
  displayName: string;
  role: 'HOST' | 'VIEWER';
  joinedAt: string;
  isOnline: boolean;
  isSpeaking?: boolean;
  audioVolume?: number; // 0 to 100
  isLocalCompatible?: boolean;
}

export interface Room {
  id: string;
  name: string;
  hostUserId: string;
  capacity: number;
  mediaMode: MediaMode;
  isPrivate: boolean;
  hasPassword: boolean;
  inviteToken?: string;
  participants: Participant[];
  createdAt: string;
}

export interface PlaybackState {
  roomId: string;
  mediaId: string | null;
  mediaName: string | null;
  mediaSize: number | null;
  mediaDuration: number | null;
  status: 'IDLE' | 'PLAYING' | 'PAUSED' | 'BUFFERING';
  positionSeconds: number;
  playbackRate: number;
  updatedAt: number; // epoch ms
  revision: number;
  hostId: string | null;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderUserId: string;
  senderDisplayName: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface LiveKitTokenResponse {
  token: string;
  url: string;
  roomName: string;
  participantIdentity: string;
  participantName: string;
}

export interface WebRTCStats {
  resolutionWidth: number;
  resolutionHeight: number;
  frameRate: number;
  bitrateKbps: number;
  packetLossPercent: number;
  rttMs: number;
  jitterMs: number;
  codec: string;
}
