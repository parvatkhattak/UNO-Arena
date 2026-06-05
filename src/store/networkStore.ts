/**
 * UNO Arena — Network Store
 * Manages the UI state for networking (IP address, host vs client status)
 */

import { create } from 'zustand';

interface NetworkStore {
  isHost: boolean;
  isConnected: boolean;
  localIpAddress: string | null;
  connectedIpAddress: string | null;
  serverPort: number;
  connectionError: string | null;

  setHostMode: (isHost: boolean) => void;
  setLocalIpAddress: (ip: string | null) => void;
  setConnected: (connected: boolean, ip?: string) => void;
  setError: (error: string | null) => void;
  resetNetwork: () => void;
}

export const useNetworkStore = create<NetworkStore>((set) => ({
  isHost: false,
  isConnected: false,
  localIpAddress: null,
  connectedIpAddress: null,
  serverPort: 7070,
  connectionError: null,

  setHostMode: (isHost) => set({ isHost }),
  setLocalIpAddress: (ip) => set({ localIpAddress: ip }),
  setConnected: (connected, ip) => set({ isConnected: connected, connectedIpAddress: ip || null }),
  setError: (error) => set({ connectionError: error }),
  resetNetwork: () => set({
    isHost: false,
    isConnected: false,
    connectedIpAddress: null,
    connectionError: null,
  }),
}));
