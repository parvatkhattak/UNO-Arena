/**
 * UNO Arena — Results Screen
 * Shows winner celebration and score breakdown
 */

import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, FlatList,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import { useStatsStore } from '../store/statsStore';

export default function ResultsScreen({ navigation }: { navigation: any }) {
  const { gameState, resetGame } = useGameStore();
  const { profile, incrementGamesPlayed, incrementGamesWon, addScore } = usePlayerStore();
  const { addMatch } = useStatsStore();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const savedRef = useRef(false);

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1, damping: 8, stiffness: 100, useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }),
    ]).start();

    // Save match result once
    if (gameState && !savedRef.current) {
      savedRef.current = true;
      const won = gameState.winner === profile.id;
      const myPlayer = gameState.players.find(p => p.id === profile.id);

      incrementGamesPlayed();
      if (won) incrementGamesWon();
      if (myPlayer) addScore(myPlayer.score);

      addMatch({
        id: uuidv4(),
        mode: gameState.settings.mode,
        playerCount: gameState.players.length,
        won,
        score: myPlayer?.score || 0,
        duration: Math.floor(Math.random() * 300 + 60), // placeholder duration
        timestamp: Date.now(),
        opponentNames: gameState.players.filter(p => p.id !== profile.id).map(p => p.name),
      });
    }
  }, []);

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>No results available</Text>
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.homeBtnText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const winner = gameState.players.find(p => p.id === gameState.winner);
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

  return (
    <View style={styles.container}>
      {/* Winner celebration */}
      <Animated.View style={[styles.winnerSection, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.winnerName}>{winner?.name || 'Unknown'}</Text>
        <Text style={styles.winnerLabel}>Winner!</Text>
        <Text style={styles.winnerAvatar}>{winner?.avatar}</Text>
      </Animated.View>

      {/* Scoreboard */}
      <Animated.View style={[styles.scoreSection, { opacity: fadeAnim }]}>
        <Text style={styles.scoreTitle}>Scoreboard</Text>
        {sortedPlayers.map((player, index) => (
          <View
            key={player.id}
            style={[
              styles.scoreRow,
              index === 0 && { borderColor: COLORS.uno.yellow + '50' },
            ]}
          >
            <Text style={styles.rank}>
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
            </Text>
            <Text style={styles.scoreAvatar}>{player.avatar}</Text>
            <Text style={styles.scoreName}>{player.name}</Text>
            <Text style={[styles.scoreValue, index === 0 && { color: COLORS.uno.yellow }]}>
              {player.score} pts
            </Text>
          </View>
        ))}
      </Animated.View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.playAgainBtn}
          onPress={() => {
            resetGame();
            navigation.navigate('GameMode');
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.playAgainText}>🎮 Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => {
            resetGame();
            navigation.navigate('Home');
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.homeBtnText}>🏠 Home</Text>
        </TouchableOpacity>
      </View>
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
  noData: { color: COLORS.text.secondary, textAlign: 'center', marginTop: 100 },
  winnerSection: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  trophy: { fontSize: 64 },
  winnerName: {
    fontSize: FONTS.size['3xl'],
    fontWeight: '900',
    color: COLORS.text.primary,
    marginTop: SPACING.sm,
  },
  winnerLabel: {
    fontSize: FONTS.size.lg,
    color: COLORS.uno.yellow,
    fontWeight: '700',
  },
  winnerAvatar: { fontSize: 48, marginTop: SPACING.sm },
  scoreSection: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rank: { fontSize: 20, marginRight: SPACING.md, width: 30 },
  scoreAvatar: { fontSize: 24, marginRight: SPACING.md },
  scoreName: { flex: 1, fontSize: FONTS.size.md, color: COLORS.text.primary, fontWeight: '600' },
  scoreValue: { fontSize: FONTS.size.md, fontWeight: '700', color: COLORS.accent.primary },
  actions: {
    gap: SPACING.md,
    marginBottom: SPACING['2xl'],
  },
  playAgainBtn: {
    backgroundColor: COLORS.accent.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  playAgainText: { color: '#FFF', fontSize: FONTS.size.lg, fontWeight: '700' },
  homeBtn: {
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  homeBtnText: { color: COLORS.text.primary, fontSize: FONTS.size.md },
});
