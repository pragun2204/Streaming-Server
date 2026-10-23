import { create } from 'zustand';
import { Room, Participant, ChatMessage } from '../types';
import { RoomWebSocket } from '../lib/websocket';
import { roomApi } from '../lib/api';

interface RoomState {
  room: Room | null;
  participants: Participant[];
  chatMessages: ChatMessage[];
  connectionState: 'disconnected' | 'connecting' | 'connected';
  ws: RoomWebSocket | null;
  activeSidebarTab: 'chat' | 'participants' | 'media';
  isSidebarOpen: boolean;

  setRoom: (room: Room) => void;
  updateMediaMode: (mode: Room['mediaMode']) => void;
  setActiveSidebarTab: (tab: 'chat' | 'participants' | 'media') => void;
  toggleSidebar: () => void;
  initWs: (roomId: string) => void;
  sendChatMessage: (text: string) => void;
  leaveRoom: () => Promise<void>;
  disconnectWs: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  room: null,
  participants: [],
  chatMessages: [],
  connectionState: 'disconnected',
  ws: null,
  activeSidebarTab: 'chat',
  isSidebarOpen: true,

  setRoom: (room: Room) => {
    set({ room, participants: room.participants || [] });
  },

  updateMediaMode: (mode) => {
    set((state) => (state.room ? { room: { ...state.room, mediaMode: mode } } : state));
  },

  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab, isSidebarOpen: true }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  initWs: (roomId: string) => {
    const existingWs = get().ws;
    if (existingWs) {
      existingWs.disconnect();
    }

    const ws = new RoomWebSocket(roomId);
    set({ ws, connectionState: 'connecting' });

    ws.on('connection.state_changed', ({ state }) => {
      set({ connectionState: state });
    });

    ws.on('room.state', ({ participants }) => {
      if (participants) {
        set({ participants });
      }
    });

    ws.on('room.participant_joined', (user) => {
      set((state) => {
        const exists = state.participants.some((p) => p.userId === user.userId);
        const updated = exists
          ? state.participants.map((p) => (p.userId === user.userId ? { ...p, isOnline: true } : p))
          : [
              ...state.participants,
              {
                userId: user.userId,
                displayName: user.displayName,
                role: user.role,
                joinedAt: new Date().toISOString(),
                isOnline: true,
              },
            ];

        const systemMessage: ChatMessage = {
          id: `sys_${Date.now()}`,
          roomId,
          senderUserId: 'system',
          senderDisplayName: 'System',
          message: `${user.displayName} joined the party`,
          timestamp: Date.now(),
          isSystem: true,
        };

        return {
          participants: updated,
          chatMessages: [...state.chatMessages, systemMessage],
        };
      });
    });

    ws.on('room.participant_left', ({ userId, reason }) => {
      set((state) => {
        const departing = state.participants.find((p) => p.userId === userId);
        const name = departing ? departing.displayName : 'A participant';
        const updated = state.participants.filter((p) => p.userId !== userId);

        const systemMessage: ChatMessage = {
          id: `sys_${Date.now()}`,
          roomId,
          senderUserId: 'system',
          senderDisplayName: 'System',
          message: `${name} ${reason === 'kicked' ? 'was removed from the room' : 'left the room'}`,
          timestamp: Date.now(),
          isSystem: true,
        };

        return {
          participants: updated,
          chatMessages: [...state.chatMessages, systemMessage],
        };
      });
    });

    ws.on('room.host_changed', ({ newHostUserId }) => {
      set((state) => {
        const newHost = state.participants.find((p) => p.userId === newHostUserId);
        const updated = state.participants.map((p) => ({
          ...p,
          role: (p.userId === newHostUserId ? 'HOST' : 'VIEWER') as 'HOST' | 'VIEWER',
        }));

        const systemMessage: ChatMessage = {
          id: `sys_${Date.now()}`,
          roomId,
          senderUserId: 'system',
          senderDisplayName: 'System',
          message: `${newHost ? newHost.displayName : 'Another user'} is now the host`,
          timestamp: Date.now(),
          isSystem: true,
        };

        return {
          room: state.room ? { ...state.room, hostUserId: newHostUserId } : null,
          participants: updated,
          chatMessages: [...state.chatMessages, systemMessage],
        };
      });
    });

    ws.on('chat.message_created', (msg: ChatMessage) => {
      set((state) => ({
        chatMessages: [...state.chatMessages, msg],
      }));
    });

    ws.on('media.share_started', () => {
      get().updateMediaMode('SCREEN_SHARE');
    });

    ws.on('media.share_stopped', () => {
      get().updateMediaMode('NONE');
    });

    ws.connect();
  },

  sendChatMessage: (text: string) => {
    const ws = get().ws;
    if (ws && text.trim()) {
      ws.send('chat.send', { text: text.trim() });
    }
  },

  leaveRoom: async () => {
    const room = get().room;
    if (room) {
      try {
        await roomApi.leaveRoom(room.id);
      } catch (err) {
        console.warn('Error leaving room on API:', err);
      }
    }
    get().disconnectWs();
    set({ room: null, participants: [], chatMessages: [] });
  },

  disconnectWs: () => {
    const ws = get().ws;
    if (ws) {
      ws.disconnect();
      set({ ws: null, connectionState: 'disconnected' });
    }
  },
}));
