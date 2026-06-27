/**
 * UNO Arena — Stats Store (Zustand + Persist)
 * Manages match history and achievements
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameMode } from '../types/game';

// ─── Match History ───────────────────────────────────────

export interface MatchRecord {
  id: string;
  mode: GameMode;
  playerCount: number;
  won: boolean;
  score: number;
  duration: number; // seconds
  timestamp: number;
  opponentNames: string[];
}

// ─── Achievement System ──────────────────────────────────

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number; // timestamp when unlocked
}

const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', title: 'First Blood', description: 'Win your first game', icon: '🏆' },
  { id: 'bot_slayer', title: 'Bot Slayer', description: 'Win 5 games against bots', icon: '🤖' },
  { id: 'card_shark', title: 'Card Shark', description: 'Play 100 games total', icon: '🦈' },
  { id: 'uno_master', title: 'UNO Master', description: 'Win 10 games', icon: '👑' },
  { id: 'speed_demon', title: 'Speed Demon', description: 'Win a Blitz mode game', icon: '⚡' },
  { id: 'flip_wizard', title: 'Flip Wizard', description: 'Win a Flip mode game', icon: '🔄' },
  { id: 'streak_3', title: 'Hot Streak', description: 'Win 3 games in a row', icon: '🔥' },
  { id: 'score_1000', title: 'High Roller', description: 'Accumulate 1000 total score', icon: '💰' },
  { id: 'perfectionist', title: 'Perfectionist', description: 'Win without drawing a card', icon: '✨' },
  { id: 'social_player', title: 'Social Butterfly', description: 'Play 10 multiplayer games', icon: '🦋' },
];

// ─── Store ───────────────────────────────────────────────

interface StatsStore {
  matchHistory: MatchRecord[];
  achievements: Achievement[];
  currentStreak: number;

  addMatch: (match: MatchRecord) => void;
  getAchievements: () => Achievement[];
  clearHistory: () => void;
}

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => ({
      matchHistory: [],
      achievements: ALL_ACHIEVEMENTS,
      currentStreak: 0,

      addMatch: (match) => {
        const { matchHistory, achievements, currentStreak } = get();
        const newHistory = [match, ...matchHistory].slice(0, 50); // Keep last 50 games
        const newStreak = match.won ? currentStreak + 1 : 0;

        // Check for newly unlocked achievements
        const totalWins = newHistory.filter(m => m.won).length;
        const totalGames = newHistory.length;
        const totalScore = newHistory.reduce((sum, m) => sum + m.score, 0);
        const now = Date.now();

        const updatedAchievements = achievements.map(a => {
          if (a.unlockedAt) return a; // Already unlocked

          switch (a.id) {
            case 'first_win':
              return match.won ? { ...a, unlockedAt: now } : a;
            case 'bot_slayer':
              return totalWins >= 5 ? { ...a, unlockedAt: now } : a;
            case 'card_shark':
              return totalGames >= 100 ? { ...a, unlockedAt: now } : a;
            case 'uno_master':
              return totalWins >= 10 ? { ...a, unlockedAt: now } : a;
            case 'speed_demon':
              return match.won && match.mode === 'blitz' ? { ...a, unlockedAt: now } : a;
            case 'flip_wizard':
              return match.won && match.mode === 'flip' ? { ...a, unlockedAt: now } : a;
            case 'streak_3':
              return newStreak >= 3 ? { ...a, unlockedAt: now } : a;
            case 'score_1000':
              return totalScore >= 1000 ? { ...a, unlockedAt: now } : a;
            default:
              return a;
          }
        });

        set({
          matchHistory: newHistory,
          achievements: updatedAchievements,
          currentStreak: newStreak,
        });
      },

      getAchievements: () => get().achievements,

      clearHistory: () => set({ matchHistory: [], currentStreak: 0 }),
    }),
    {
      name: 'uno-arena-stats',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
