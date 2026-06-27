/**
 * UNO Arena — Onboarding Screen
 * First-launch experience: pick a name and avatar
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Animated, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { AVATARS } from '../constants/cards';
import { usePlayerStore } from '../store/playerStore';

const { width: SCREEN_W } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }: { navigation: any }) {
  const { setName, setAvatar, completeOnboarding, profile } = usePlayerStore();
  const [step, setStep] = useState(0); // 0 = welcome, 1 = name, 2 = avatar
  const [userName, setUserName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATARS[0]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [step]);

  const animateNext = (nextStep: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleFinish = () => {
    if (userName.trim()) setName(userName.trim());
    setAvatar(selectedAvatar);
    completeOnboarding();
    navigation.replace('Home');
  };

  // ── Step 0: Welcome ──
  if (step === 0) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.centered, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.bigEmoji}>🎴</Text>
          <Text style={styles.welcomeTitle}>Welcome to{'\n'}UNO Arena</Text>
          <Text style={styles.welcomeDesc}>
            Play UNO with friends — no internet needed.{'\n'}Connect via WiFi or Hotspot!
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => animateNext(1)} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Let's Go →</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Dots */}
        <View style={styles.dots}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
      </View>
    );
  }

  // ── Step 1: Name ──
  if (step === 1) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.centered, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.stepTitle}>What's your name?</Text>
          <Text style={styles.stepDesc}>This is how other players will see you.</Text>

          <TextInput
            style={styles.nameInput}
            placeholder="Enter your name"
            placeholderTextColor={COLORS.text.muted}
            value={userName}
            onChangeText={setUserName}
            maxLength={16}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.primaryBtn, !userName.trim() && styles.btnDisabled]}
            onPress={() => userName.trim() && animateNext(2)}
            activeOpacity={0.8}
            disabled={!userName.trim()}
          >
            <Text style={styles.primaryBtnText}>Next →</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.dots}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Step 2: Avatar ──
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.avatarStep, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.stepTitle}>Pick your avatar</Text>
        <Text style={styles.stepDesc}>Choose your battle identity!</Text>

        <Text style={styles.previewAvatar}>{selectedAvatar}</Text>
        <Text style={styles.previewName}>{userName || 'Player'}</Text>

        <ScrollView contentContainerStyle={styles.avatarGrid} showsVerticalScrollIndicator={false}>
          {AVATARS.map((av) => (
            <TouchableOpacity
              key={av}
              style={[
                styles.avatarCell,
                av === selectedAvatar && styles.avatarCellSelected,
              ]}
              onPress={() => setSelectedAvatar(av)}
              activeOpacity={0.7}
            >
              <Text style={styles.avatarEmoji}>{av}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleFinish} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>🎮 Start Playing!</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.dots}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: SPACING.xl,
    paddingTop: 80,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarStep: {
    flex: 1,
    alignItems: 'center',
  },
  bigEmoji: { fontSize: 80, marginBottom: SPACING.xl },
  welcomeTitle: {
    fontSize: FONTS.size['3xl'],
    fontWeight: '900',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  welcomeDesc: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING['3xl'],
  },
  stepTitle: {
    fontSize: FONTS.size['2xl'],
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  stepDesc: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING['2xl'],
  },
  nameInput: {
    width: '100%',
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    fontSize: FONTS.size.xl,
    color: COLORS.text.primary,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginBottom: SPACING['2xl'],
  },
  primaryBtn: {
    backgroundColor: COLORS.accent.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING['3xl'],
    ...SHADOWS.md,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: FONTS.size.lg,
    fontWeight: '700',
  },
  btnDisabled: { opacity: 0.4 },
  previewAvatar: { fontSize: 72, marginBottom: SPACING.sm },
  previewName: {
    fontSize: FONTS.size.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.xl,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  avatarCell: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarCellSelected: {
    borderColor: COLORS.accent.primary,
    backgroundColor: COLORS.accent.primary + '20',
  },
  avatarEmoji: { fontSize: 30 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.text.muted,
  },
  dotActive: {
    backgroundColor: COLORS.accent.primary,
    width: 24,
  },
});
