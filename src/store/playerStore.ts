/**
 * UNO Arena — Player Store (Zustand + Persist)
 * Manages local player profile with AsyncStorage persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVATARS } from '../constants/cards';

interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  hasCompletedOnboarding: boolean;
}

interface PlayerStore {
  profile: PlayerProfile;
  setName: (name: string) => void;
  setAvatar: (avatar: string) => void;
  incrementGamesPlayed: () => void;
  incrementGamesWon: () => void;
  addScore: (score: number) => void;
  completeOnboarding: () => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      profile: {
        id: 'local-player',
        name: 'Player',
        avatar: AVATARS[0],
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0,
        hasCompletedOnboarding: false,
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

      completeOnboarding: () => set((state) => ({
        profile: { ...state.profile, hasCompletedOnboarding: true },
      })),
    }),
    {
      name: 'uno-arena-player',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
