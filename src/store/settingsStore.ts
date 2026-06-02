/**
 * UNO Arena — Settings Store (Zustand)
 */

import { create } from 'zustand';
import { GameSettings, DEFAULT_GAME_SETTINGS, HouseRules } from '../types/game';

interface SettingsStore {
  gameSettings: GameSettings;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  darkMode: boolean;

  updateGameSettings: (settings: Partial<GameSettings>) => void;
  updateHouseRules: (rules: Partial<HouseRules>) => void;
  toggleSound: () => void;
  toggleHaptics: () => void;
  toggleDarkMode: () => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  gameSettings: DEFAULT_GAME_SETTINGS,
  soundEnabled: true,
  hapticsEnabled: true,
  darkMode: true,

  updateGameSettings: (settings) => set((state) => ({
    gameSettings: { ...state.gameSettings, ...settings },
  })),

  updateHouseRules: (rules) => set((state) => ({
    gameSettings: {
      ...state.gameSettings,
      houseRules: { ...state.gameSettings.houseRules, ...rules },
    },
  })),

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  resetSettings: () => set({ gameSettings: DEFAULT_GAME_SETTINGS }),
}));
