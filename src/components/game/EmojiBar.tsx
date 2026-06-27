/**
 * UNO Arena — Emoji Reaction Bar
 * Quick emoji reactions during multiplayer games
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { triggerHaptic } from '../../utils/sounds';

const REACTIONS = ['😂', '😠', '😭', '🔥', '👏', '😱', '💀', '🎉'];

interface EmojiBarProps {
  onSendEmoji: (emoji: string) => void;
}

export function EmojiBar({ onSendEmoji }: EmojiBarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      {expanded ? (
        <View style={styles.emojiRow}>
          {REACTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.emojiBtn}
              onPress={() => {
                triggerHaptic('light');
                onSendEmoji(emoji);
                setExpanded(false);
              }}
              activeOpacity={0.6}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.closeBtn} onPress={() => setExpanded(false)}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.toggleBtn} onPress={() => setExpanded(true)} activeOpacity={0.7}>
          <Text style={styles.toggleText}>💬</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface FloatingEmojiProps {
  emoji: string;
  playerName: string;
  onDone: () => void;
}

export function FloatingEmoji({ emoji, playerName, onDone }: FloatingEmojiProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
      Animated.delay(1500),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -30, duration: 400, useNativeDriver: true }),
      ]),
    ]).start(() => onDone());
  }, []);

  return (
    <Animated.View style={[styles.floatingEmoji, { opacity, transform: [{ translateY }] }]}>
      <Text style={styles.floatingEmojiText}>{emoji}</Text>
      <Text style={styles.floatingName}>{playerName}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 140,
    left: SPACING.md,
    zIndex: 100,
  },
  toggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  toggleText: { fontSize: 20 },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    gap: 4,
    maxWidth: 200,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  emojiBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.secondary,
  },
  closeBtnText: { fontSize: 14, color: COLORS.text.muted },
  floatingEmoji: {
    position: 'absolute',
    top: '35%',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  floatingEmojiText: { fontSize: 48 },
  floatingName: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
});
