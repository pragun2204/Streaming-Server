import { User, Room, LiveKitTokenResponse, PlaybackState } from '../types';

const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/v1`;

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const err = await res.json();
      errorDetail = err.detail || err.error || errorDetail;
    } catch {
      errorDetail = res.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const authApi = {
  loginGuest: (displayName: string) =>
    fetchJson<User>(`${API_BASE}/auth/guest`, {
      method: 'POST',
      body: JSON.stringify({ displayName }),
    }),
  getMe: () => fetchJson<User>(`${API_BASE}/auth/me`),
  logout: () =>
    fetchJson<{ status: string }>(`${API_BASE}/auth/logout`, {
      method: 'POST',
    }),
};

export const roomApi = {
  createRoom: (name: string, isPrivate = true, password?: string) =>
    fetchJson<Room>(`${API_BASE}/rooms`, {
      method: 'POST',
      body: JSON.stringify({ name, isPrivate, password }),
    }),
  getRoom: (roomId: string) => fetchJson<Room>(`${API_BASE}/rooms/${roomId}`),
  joinRoom: (roomId: string, inviteToken?: string, password?: string) =>
    fetchJson<Room>(`${API_BASE}/rooms/${roomId}/join`, {
      method: 'POST',
      body: JSON.stringify({ inviteToken, password }),
    }),
  leaveRoom: (roomId: string) =>
    fetchJson<{ status: string }>(`${API_BASE}/rooms/${roomId}/leave`, {
      method: 'POST',
    }),
  transferHost: (roomId: string, newHostUserId: string) =>
    fetchJson<{ status: string; newHostUserId: string }>(
      `${API_BASE}/rooms/${roomId}/transfer-host`,
      {
        method: 'POST',
        body: JSON.stringify({ newHostUserId }),
      }
    ),
  kickParticipant: (roomId: string, participantId: string) =>
    fetchJson<{ status: string }>(
      `${API_BASE}/rooms/${roomId}/participants/${participantId}`,
      {
        method: 'DELETE',
      }
    ),
  createInvite: (roomId: string) =>
    fetchJson<{ id: string; roomId: string; inviteToken: string; expiresAt: string }>(
      `${API_BASE}/rooms/${roomId}/invites`,
      {
        method: 'POST',
      }
    ),
};

export const mediaApi = {
  getLiveKitToken: (roomId: string) =>
    fetchJson<LiveKitTokenResponse>(`${API_BASE}/rooms/${roomId}/livekit-token`, {
      method: 'POST',
    }),
  getPlaybackState: (roomId: string) =>
    fetchJson<PlaybackState>(`${API_BASE}/rooms/${roomId}/playback-state`),
};
