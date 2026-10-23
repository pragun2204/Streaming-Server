import { create } from 'zustand';

export type ScreenQualityProfile = '1080p60' | '1080p30' | '720p30';

interface VoiceState {
  isMicMuted: boolean;
  isDeafened: boolean;
  isPushToTalk: boolean;
  pttKey: string;
  isPttPressed: boolean;
  screenQuality: ScreenQualityProfile;
  mediaVolume: number; // 0.0 to 1.0
  voiceVolume: number; // 0.0 to 1.0
  participantVolumes: Record<string, number>; // userId -> 0.0 to 1.0
  audioInputDeviceId: string;
  audioOutputDeviceId: string;

  toggleMic: () => void;
  setMicMuted: (muted: boolean) => void;
  toggleDeafen: () => void;
  setPushToTalk: (enabled: boolean) => void;
  setPttKey: (key: string) => void;
  setPttPressed: (pressed: boolean) => void;
  setScreenQuality: (profile: ScreenQualityProfile) => void;
  setMediaVolume: (vol: number) => void;
  setVoiceVolume: (vol: number) => void;
  setParticipantVolume: (userId: string, vol: number) => void;
  setAudioInputDevice: (deviceId: string) => void;
  setAudioOutputDevice: (deviceId: string) => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isMicMuted: false,
  isDeafened: false,
  isPushToTalk: false,
  pttKey: 'Space',
  isPttPressed: false,
  screenQuality: '1080p60',
  mediaVolume: 0.8,
  voiceVolume: 0.9,
  participantVolumes: {},
  audioInputDeviceId: 'default',
  audioOutputDeviceId: 'default',

  toggleMic: () => set((state) => ({ isMicMuted: !state.isMicMuted })),
  setMicMuted: (muted) => set({ isMicMuted: muted }),
  toggleDeafen: () =>
    set((state) => {
      const nextDeafen = !state.isDeafened;
      return {
        isDeafened: nextDeafen,
        // Deafening also mutes mic for privacy
        isMicMuted: nextDeafen ? true : state.isMicMuted,
      };
    }),
  setPushToTalk: (enabled) => set({ isPushToTalk: enabled }),
  setPttKey: (key) => set({ pttKey: key }),
  setPttPressed: (pressed) => set({ isPttPressed: pressed }),
  setScreenQuality: (screenQuality) => set({ screenQuality }),
  setMediaVolume: (mediaVolume) => set({ mediaVolume: Math.max(0, Math.min(1, mediaVolume)) }),
  setVoiceVolume: (voiceVolume) => set({ voiceVolume: Math.max(0, Math.min(1, voiceVolume)) }),
  setParticipantVolume: (userId, vol) =>
    set((state) => ({
      participantVolumes: {
        ...state.participantVolumes,
        [userId]: Math.max(0, Math.min(1, vol)),
      },
    })),
  setAudioInputDevice: (audioInputDeviceId) => set({ audioInputDeviceId }),
  setAudioOutputDevice: (audioOutputDeviceId) => set({ audioOutputDeviceId }),
}));
