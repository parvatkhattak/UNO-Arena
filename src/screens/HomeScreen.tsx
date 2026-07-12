/**
 * UNO Arena — Home Screen
 * Main landing screen with animated branding
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(50)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.3)).current;

  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;
  
  // Track press state for each button independently
  const btnScaleAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1, damping: 12, stiffness: 100, useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(buttonSlide, {
          toValue: 0, duration: 500, useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1, duration: 500, useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Floating animations for background circles
    const floatLoop = (anim: Animated.Value, duration: number, translateY: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: translateY, duration: duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: duration, useNativeDriver: true }),
        ])
      ).start();
    };

    floatLoop(floatAnim1, 4000, -20);
    floatLoop(floatAnim2, 5000, 20);
    floatLoop(floatAnim3, 6000, -30);
  }, []);

  const handlePressIn = (index: number) => {
    Animated.spring(btnScaleAnims[index], {
      toValue: 0.95, useNativeDriver: true, speed: 20, bounciness: 10
    }).start();
  };

  const handlePressOut = (index: number) => {
    Animated.spring(btnScaleAnims[index], {
      toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10
    }).start();
  };

  const renderMenuButton = (title: string, subtitle: string, color: string, onPress: () => void, delay: number, index: number) => (
    <Animated.View style={{
      opacity: buttonOpacity,
      transform: [
        { translateY: Animated.multiply(buttonSlide, new Animated.Value(1 + delay * 0.3)) },
        { scale: btnScaleAnims[index] }
      ],
    }}>
      <TouchableOpacity
        style={[styles.menuButton, { borderColor: color + '40' }]}
        onPress={onPress}
        onPressIn={() => handlePressIn(index)}
        onPressOut={() => handlePressOut(index)}
        activeOpacity={0.9}
      >
        <View style={[styles.menuButtonGlow, { backgroundColor: color + '15' }]} />
        <View style={styles.menuButtonContent}>
          <Text style={[styles.menuButtonTitle, { color }]}>{title}</Text>
          <Text style={styles.menuButtonSubtitle}>{subtitle}</Text>
        </View>
        <Text style={[styles.menuArrow, { color }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Background decorative elements */}
      <Animated.View style={[styles.bgCircle1, { transform: [{ translateY: floatAnim1 }] }]} />
      <Animated.View style={[styles.bgCircle2, { transform: [{ translateY: floatAnim2 }] }]} />
      <Animated.View style={[styles.bgCircle3, { transform: [{ translateY: floatAnim3 }] }]} />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
        <Animated.View style={[styles.logoGlow, { opacity: glowPulse }]} />
        <Text style={styles.logoUno}>UNO</Text>
        <Text style={styles.logoArena}>ARENA</Text>
        <Text style={styles.logoTagline}>Play Anywhere. No Internet Needed.</Text>
      </Animated.View>

      {/* Menu Buttons */}
      <View style={styles.menuContainer}>
        {renderMenuButton(
          '🎮  Play Game', 'Start a new match',
          COLORS.accent.primary, () => navigation.navigate('GameMode'), 0, 0
        )}
        {renderMenuButton(
          '👤  Profile', 'Stats & Customization',
          COLORS.accent.secondary, () => navigation.navigate('Profile'), 1, 1
        )}
        {renderMenuButton(
          '⚙️  Settings', 'Sound, Rules & More',
          COLORS.accent.warning, () => navigation.navigate('Settings'), 2, 2
        )}
        {renderMenuButton(
          '📖  How to Play', 'Learn the rules',
          COLORS.accent.success, () => navigation.navigate('HowToPlay'), 3, 3
        )}
      </View>

      {/* Version */}
      <Text style={styles.version}>v1.0.0 • Offline Multiplayer</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  bgCircle1: {
    position: 'absolute', top: -100, right: -80,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: COLORS.uno.red + '08',
  },
  bgCircle2: {
    position: 'absolute', bottom: -60, left: -100,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: COLORS.uno.blue + '08',
  },
  bgCircle3: {
    position: 'absolute', top: height * 0.3, left: -50,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: COLORS.uno.green + '06',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  logoGlow: {
    position: 'absolute',
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: COLORS.accent.primary,
    top: -40,
  },
  logoUno: {
    fontSize: FONTS.size.display,
    fontWeight: '900',
    color: COLORS.text.primary,
    letterSpacing: 8,
    textShadowColor: COLORS.accent.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  logoArena: {
    fontSize: FONTS.size['3xl'],
    fontWeight: '300',
    color: COLORS.accent.primary,
    letterSpacing: 16,
    marginTop: -8,
  },
  logoTagline: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
    letterSpacing: 1,
  },
  menuContainer: {
    width: '100%',
    gap: SPACING.md,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  menuButtonGlow: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 4,
    borderRadius: 2,
  },
  menuButtonContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  menuButtonTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
  },
  menuButtonSubtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  menuArrow: {
    fontSize: FONTS.size['3xl'],
    fontWeight: '300',
  },
  version: {
    position: 'absolute',
    bottom: SPACING['2xl'],
    fontSize: FONTS.size.xs,
    color: COLORS.text.muted,
    letterSpacing: 1,
  },
});
