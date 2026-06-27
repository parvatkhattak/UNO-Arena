/**
 * UNO Arena — How To Play Screen
 * Interactive tutorial with swipeable pages
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, Animated,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

interface TutorialPage {
  icon: string;
  title: string;
  content: string;
  highlight?: string;
}

const PAGES: TutorialPage[] = [
  {
    icon: '🎴',
    title: 'The Basics',
    content: 'Match cards by color or number with the top card of the discard pile. If you can\'t play, draw a card from the draw pile.',
    highlight: 'Goal: Be the first to empty your hand!',
  },
  {
    icon: '🃏',
    title: 'Action Cards',
    content: '⊘ Skip — Next player loses their turn\n⇄ Reverse — Reverses play direction\n+2 Draw Two — Next player draws 2 cards and loses their turn',
  },
  {
    icon: '🌈',
    title: 'Wild Cards',
    content: '★ Wild — Play anytime. Choose the next color.\n+4 Wild Draw Four — Choose a color AND the next player draws 4 cards. Can only be played if you have no other matching cards!',
    highlight: 'Opponents can challenge your Wild +4!',
  },
  {
    icon: '🔊',
    title: 'Calling UNO!',
    content: 'When you have ONE card left, you must tap the UNO button before playing your second-to-last card. If another player catches you forgetting, you draw 2 penalty cards!',
    highlight: 'Don\'t forget to call UNO!',
  },
  {
    icon: '🔄',
    title: 'UNO Flip',
    content: 'Cards have two sides: Light and Dark. When someone plays a FLIP card, ALL cards are flipped! The dark side has harsher penalties:\n\n+5 Draw Five\n⊘⊘ Skip Everyone\n🌑 Dark Wild Draw',
  },
  {
    icon: '⚡',
    title: 'Blitz Mode',
    content: 'Fast-paced action! Each player has only 10 seconds per turn. If time runs out, you automatically draw a card. Perfect for quick rounds with friends!',
  },
  {
    icon: '🏠',
    title: 'House Rules',
    content: 'Customize your game with these optional rules:\n\n🔗 Stacking — Chain +2 and +4 cards\n⚡ Jump-In — Play identical card out of turn\n7️⃣ 7-0 Rule — 7 swaps hands, 0 rotates all hands\n🎯 Force Play — Must play if you can',
  },
  {
    icon: '📡',
    title: 'Playing Offline',
    content: 'No internet needed! One player hosts a game (creates a WiFi hotspot). Others connect to that WiFi and join using the host\'s IP address.\n\nYou can also play solo against AI bots!',
    highlight: 'Works anywhere — travel, camping, road trips!',
  },
];

export default function HowToPlayScreen({ navigation }: { navigation: any }) {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToPage = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_W, animated: true });
    setCurrentPage(index);
  };

  const handleScroll = (event: any) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / SCREEN_W);
    setCurrentPage(page);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>How to Play</Text>
        <Text style={styles.pageCount}>{currentPage + 1}/{PAGES.length}</Text>
      </View>

      {/* Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.carousel}
      >
        {PAGES.map((page, i) => (
          <View key={i} style={styles.page}>
            <Text style={styles.pageIcon}>{page.icon}</Text>
            <Text style={styles.pageTitle}>{page.title}</Text>
            <Text style={styles.pageContent}>{page.content}</Text>
            {page.highlight && (
              <View style={styles.highlightBox}>
                <Text style={styles.highlightText}>💡 {page.highlight}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => scrollToPage(i)}>
            <View style={[styles.dot, i === currentPage && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Navigation buttons */}
      <View style={styles.navButtons}>
        {currentPage > 0 && (
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => scrollToPage(currentPage - 1)}
          >
            <Text style={styles.navBtnText}>← Previous</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        {currentPage < PAGES.length - 1 ? (
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnPrimary]}
            onPress={() => scrollToPage(currentPage + 1)}
          >
            <Text style={[styles.navBtnText, { color: '#FFF' }]}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnPrimary]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.navBtnText, { color: '#FFF' }]}>Got it! ✓</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  backArrow: { fontSize: 24, color: COLORS.text.primary },
  title: {
    fontSize: FONTS.size.xl,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  pageCount: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.muted,
  },
  carousel: { flex: 1 },
  page: {
    width: SCREEN_W,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['2xl'],
  },
  pageIcon: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  pageTitle: {
    fontSize: FONTS.size['2xl'],
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  pageContent: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  highlightBox: {
    backgroundColor: COLORS.accent.primary + '15',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.accent.primary + '30',
  },
  highlightText: {
    fontSize: FONTS.size.sm,
    color: COLORS.accent.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.text.muted + '40',
  },
  dotActive: {
    backgroundColor: COLORS.accent.primary,
    width: 20,
  },
  navButtons: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['2xl'],
    gap: SPACING.md,
  },
  navBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background.card,
  },
  navBtnPrimary: {
    backgroundColor: COLORS.accent.primary,
    ...SHADOWS.sm,
  },
  navBtnText: {
    fontSize: FONTS.size.md,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
});
