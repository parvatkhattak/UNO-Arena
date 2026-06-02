/**
 * UNO Arena — Player Store (Zustand)
 * Manages local player profile and settings
 */

import { create } from 'zustand';
import { AVATARS } from '../constants/cards';

interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
}

interface PlayerStore {
  profile: PlayerProfile;
  setName: (name: string) => void;
  setAvatar: (avatar: string) => void;
  incrementGamesPlayed: () => void;
  incrementGamesWon: () => void;
  addScore: (score: number) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  profile: {
    id: 'local-player',
    name: 'Player',
    avatar: AVATARS[0],
    gamesPlayed: 0,
    gamesWon: 0,
    totalScore: 0,
  },

  setName: (name) => set((state) => ({
    profile: { ...state.profile, name },
  })),

  setAvatar: (avatar) => set((state) => ({
    profile: { ...state.profile, avatar },
  })),

  incrementGamesPlayed: () => set((state) => ({
    profile: { ...state.profile, gamesPlayed: state.profile.gamesPlayed + 1 },
  })),

  incrementGamesWon: () => set((state) => ({
    profile: { ...state.profile, gamesWon: state.profile.gamesWon + 1 },
  })),

  addScore: (score) => set((state) => ({
    profile: { ...state.profile, totalScore: state.profile.totalScore + score },
  })),
}));
