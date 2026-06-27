/**
 * UNO Arena — Stats Screen
 * Match history and achievements display
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useStatsStore, MatchRecord, Achievement } from '../store/statsStore';
import { usePlayerStore } from '../store/playerStore';

type Tab = 'history' | 'achievements';

export default function StatsScreen({ navigation }: { navigation: any }) {
  const { matchHistory, achievements } = useStatsStore();
  const { profile } = usePlayerStore();
  const [activeTab, setActiveTab] = useState<Tab>('history');

  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const winRate = matchHistory.length > 0
    ? Math.round((matchHistory.filter(m => m.won).length / matchHistory.length) * 100)
    : 0;

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Stats</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStatBox}>
          <Text style={styles.quickStatValue}>{matchHistory.length}</Text>
          <Text style={styles.quickStatLabel}>Games</Text>
        </View>
        <View style={styles.quickStatBox}>
          <Text style={[styles.quickStatValue, { color: COLORS.accent.success }]}>{winRate}%</Text>
          <Text style={styles.quickStatLabel}>Win Rate</Text>
        </View>
        <View style={styles.quickStatBox}>
          <Text style={[styles.quickStatValue, { color: COLORS.uno.yellow }]}>{unlockedCount}/{achievements.length}</Text>
          <Text style={styles.quickStatLabel}>Badges</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            📋 History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'achievements' && styles.tabActive]}
          onPress={() => setActiveTab('achievements')}
        >
          <Text style={[styles.tabText, activeTab === 'achievements' && styles.tabTextActive]}>
            🏅 Achievements
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'history' ? (
        matchHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🃏</Text>
            <Text style={styles.emptyText}>No games played yet!</Text>
            <Text style={styles.emptyHint}>Start a game to see your history here.</Text>
          </View>
        ) : (
          <FlatList
            data={matchHistory}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: SPACING.sm, paddingBottom: SPACING['2xl'] }}
            renderItem={({ item }) => (
              <View style={[styles.matchCard, item.won && styles.matchCardWon]}>
                <View style={styles.matchLeft}>
                  <Text style={styles.matchResult}>{item.won ? '🏆' : '😢'}</Text>
                  <View>
                    <Text style={styles.matchMode}>
                      {item.mode.charAt(0).toUpperCase() + item.mode.slice(1)}
                    </Text>
                    <Text style={styles.matchMeta}>
                      {item.playerCount} players • {formatDuration(item.duration)}
                    </Text>
                  </View>
                </View>
                <View style={styles.matchRight}>
                  <Text style={[styles.matchScore, item.won && { color: COLORS.uno.yellow }]}>
                    {item.score} pts
                  </Text>
                  <Text style={styles.matchDate}>{formatDate(item.timestamp)}</Text>
                </View>
              </View>
            )}
          />
        )
      ) : (
        <ScrollView contentContainerStyle={{ gap: SPACING.sm, paddingBottom: SPACING['2xl'] }}>
          {achievements.map((ach) => (
            <View key={ach.id} style={[styles.achievementCard, !ach.unlockedAt && styles.achievementLocked]}>
              <Text style={[styles.achievementIcon, !ach.unlockedAt && { opacity: 0.3 }]}>
                {ach.icon}
              </Text>
              <View style={styles.achievementInfo}>
                <Text style={[styles.achievementTitle, !ach.unlockedAt && { color: COLORS.text.muted }]}>
                  {ach.title}
                </Text>
                <Text style={styles.achievementDesc}>{ach.description}</Text>
              </View>
              {ach.unlockedAt ? (
                <Text style={styles.achievementUnlocked}>✓</Text>
              ) : (
                <Text style={styles.achievementLockedIcon}>🔒</Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  backArrow: { fontSize: 24, color: COLORS.text.primary },
  title: {
    fontSize: FONTS.size['2xl'],
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  quickStats: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  quickStatBox: {
    flex: 1,
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  quickStatValue: {
    fontSize: FONTS.size.xl,
    fontWeight: '900',
    color: COLORS.accent.primary,
  },
  quickStatLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
  },
  tabActive: {
    backgroundColor: COLORS.accent.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.accent.primary + '40',
  },
  tabText: { fontSize: FONTS.size.sm, color: COLORS.text.muted, fontWeight: '600' },
  tabTextActive: { color: COLORS.accent.primary },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.lg },
  emptyText: { fontSize: FONTS.size.lg, color: COLORS.text.primary, fontWeight: '600' },
  emptyHint: { fontSize: FONTS.size.sm, color: COLORS.text.muted, marginTop: SPACING.sm },
  matchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  matchCardWon: { borderColor: COLORS.accent.success + '30' },
  matchLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  matchResult: { fontSize: 24 },
  matchMode: { fontSize: FONTS.size.md, fontWeight: '600', color: COLORS.text.primary },
  matchMeta: { fontSize: FONTS.size.xs, color: COLORS.text.muted, marginTop: 2 },
  matchRight: { alignItems: 'flex-end' },
  matchScore: { fontSize: FONTS.size.md, fontWeight: '700', color: COLORS.accent.primary },
  matchDate: { fontSize: FONTS.size.xs, color: COLORS.text.muted, marginTop: 2 },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  achievementLocked: { opacity: 0.6 },
  achievementIcon: { fontSize: 28 },
  achievementInfo: { flex: 1 },
  achievementTitle: { fontSize: FONTS.size.md, fontWeight: '700', color: COLORS.text.primary },
  achievementDesc: { fontSize: FONTS.size.xs, color: COLORS.text.muted, marginTop: 2 },
  achievementUnlocked: { fontSize: 18, color: COLORS.accent.success, fontWeight: '900' },
  achievementLockedIcon: { fontSize: 18, opacity: 0.5 },
});
