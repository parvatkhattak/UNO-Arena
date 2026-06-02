/**
 * UNO Arena — Game Mode Selection Screen
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { GameMode } from '../types/game';
import { useSettingsStore } from '../store/settingsStore';

const MODES: { mode: GameMode; icon: string; title: string; desc: string; color: string; rules: string[] }[] = [
  {
    mode: 'classic', icon: '🃏', title: 'Classic UNO', color: COLORS.uno.red,
    desc: 'The original UNO experience',
    rules: ['Match by color, number, or symbol', 'Action cards: Skip, Reverse, Draw 2', 'Wild & Wild Draw 4', 'First to empty hand wins'],
  },
  {
    mode: 'flip', icon: '🔄', title: 'UNO Flip', color: COLORS.uno.blue,
    desc: 'Double-sided cards — light & dark',
    rules: ['Flip card reverses entire deck', 'Dark side has harsher penalties', 'Draw 5 & Skip Everyone', 'Strategic depth!'],
  },
  {
    mode: 'blitz', icon: '⚡', title: 'UNO Blitz', color: COLORS.uno.yellow,
    desc: 'Speed mode — 10 second turns',
    rules: ['10-second turn timer', 'Auto-draw if time runs out', 'Fast-paced action', 'No time to think!'],
  },
  {
    mode: 'custom', icon: '🏠', title: 'House Rules', color: COLORS.uno.green,
    desc: 'Your rules, your way',
    rules: ['Stacking Draw cards', 'Jump-In with identical cards', '7-0 hand swap rule', 'Customize everything'],
  },
];

export default function GameModeScreen({ navigation }: { navigation: any }) {
  const { updateGameSettings } = useSettingsStore();
  const fadeAnims = useRef(MODES.map(() => new Animated.Value(0))).current;
  const slideAnims = useRef(MODES.map(() => new Animated.Value(30))).current;

  useEffect(() => {
    MODES.forEach((_, i) => {
      Animated.parallel([
        Animated.timing(fadeAnims[i], { toValue: 1, duration: 400, delay: i * 100, useNativeDriver: true }),
        Animated.timing(slideAnims[i], { toValue: 0, duration: 400, delay: i * 100, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  const selectMode = (mode: GameMode) => {
    updateGameSettings({ mode });
    navigation.navigate('Lobby');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Game Mode</Text>
      <Text style={styles.subtitle}>Pick your style of play</Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {MODES.map((m, i) => (
          <Animated.View key={m.mode} style={{ opacity: fadeAnims[i], transform: [{ translateY: slideAnims[i] }] }}>
            <TouchableOpacity
              style={[styles.modeCard, { borderColor: m.color + '30' }]}
              onPress={() => selectMode(m.mode)}
              activeOpacity={0.7}
            >
              <View style={[styles.modeIconBg, { backgroundColor: m.color + '20' }]}>
                <Text style={styles.modeIcon}>{m.icon}</Text>
              </View>
              <View style={styles.modeInfo}>
                <Text style={[styles.modeTitle, { color: m.color }]}>{m.title}</Text>
                <Text style={styles.modeDesc}>{m.desc}</Text>
                <View style={styles.rulesList}>
                  {m.rules.map((rule, ri) => (
                    <Text key={ri} style={styles.ruleItem}>• {rule}</Text>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.primary, paddingTop: 60 },
  title: { fontSize: FONTS.size['2xl'], fontWeight: '800', color: COLORS.text.primary, textAlign: 'center' },
  subtitle: { fontSize: FONTS.size.md, color: COLORS.text.secondary, textAlign: 'center', marginTop: 4, marginBottom: SPACING.xl },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING['3xl'], gap: SPACING.lg },
  modeCard: {
    backgroundColor: COLORS.background.card, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl, borderWidth: 1, ...SHADOWS.sm,
  },
  modeIconBg: {
    width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  modeIcon: { fontSize: 28 },
  modeInfo: { flex: 1 },
  modeTitle: { fontSize: FONTS.size.xl, fontWeight: '700' },
  modeDesc: { fontSize: FONTS.size.md, color: COLORS.text.secondary, marginTop: 4 },
  rulesList: { marginTop: SPACING.sm },
  ruleItem: { fontSize: FONTS.size.sm, color: COLORS.text.muted, marginTop: 2 },
});
