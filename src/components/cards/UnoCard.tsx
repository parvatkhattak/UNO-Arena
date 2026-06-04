/**
 * UNO Arena — UnoCard Component
 * SVG-based card rendering with animations and glow effects
 */

import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import Svg, { Rect, Ellipse, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Card, AnyCardColor } from '../../types/game';
import { COLORS, CARD_DIMENSIONS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { VALUE_LABELS } from '../../constants/cards';
import { playSound, triggerHaptic } from '../../utils/sounds';

interface UnoCardProps {
  card: Card;
  size?: 'hand' | 'normal' | 'discard';
  onPress?: () => void;
  disabled?: boolean;
  faceDown?: boolean;
  highlighted?: boolean;
  style?: any;
}

const CARD_COLORS_MAP: Record<AnyCardColor, string> = {
  red: COLORS.uno.red,
  blue: COLORS.uno.blue,
  green: COLORS.uno.green,
  yellow: COLORS.uno.yellow,
  wild: COLORS.uno.wild,
};

const GLOW_MAP: Record<AnyCardColor, string> = {
  red: COLORS.glow.red,
  blue: COLORS.glow.blue,
  green: COLORS.glow.green,
  yellow: COLORS.glow.yellow,
  wild: COLORS.glow.wild,
};

function getCardDisplayValue(card: Card): string {
  if (typeof card.value === 'number') return String(card.value);
  return VALUE_LABELS[card.value] || card.value.toUpperCase();
}

function getCardLabel(card: Card): string {
  if (typeof card.value === 'number') return String(card.value);
  switch (card.value) {
    case 'skip': return '⊘';
    case 'reverse': return '⇄';
    case 'draw2': return '+2';
    case 'wild': return '★';
    case 'wild_draw4': return '+4';
    case 'flip': return '⟲';
    case 'skip_everyone': return '⊘⊘';
    case 'draw5': return '+5';
    case 'draw1': return '+1';
    default: return '?';
  }
}

export default function UnoCard({
  card, size = 'normal', onPress, disabled = false,
  faceDown = false, highlighted = false, style,
}: UnoCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(highlighted ? 1 : 0)).current;

  const dims = size === 'hand'
    ? CARD_DIMENSIONS.hand
    : size === 'discard'
      ? CARD_DIMENSIONS.discard
      : { width: CARD_DIMENSIONS.width, height: CARD_DIMENSIONS.height };

  useEffect(() => {
    if (highlighted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [highlighted]);

  const handlePressIn = () => {
    if (!disabled) {
      triggerHaptic('light');
      Animated.spring(scaleAnim, {
        toValue: 1.08, damping: 10, stiffness: 300, useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1, damping: 10, stiffness: 300, useNativeDriver: true,
    }).start();
  };

  const cardColor = CARD_COLORS_MAP[card.color];
  const glowColor = GLOW_MAP[card.color];
  const displayValue = getCardLabel(card);
  const isWild = card.color === 'wild';
  const fontSize = dims.width * 0.45;
  const smallFontSize = dims.width * 0.2;

  if (faceDown) {
    return (
      <Animated.View style={[
        styles.cardContainer,
        { width: dims.width, height: dims.height, transform: [{ scale: scaleAnim }] },
        style,
      ]}>
        <View style={[styles.cardBack, { width: dims.width, height: dims.height }]}>
          <View style={styles.cardBackInner}>
            <Text style={[styles.cardBackText, { fontSize: dims.width * 0.28 }]}>UNO</Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  const cardContent = (
    <Animated.View style={[
      styles.cardContainer,
      {
        width: dims.width, height: dims.height,
        transform: [{ scale: scaleAnim }],
      },
      highlighted && { ...SHADOWS.lg },
      style,
    ]}>
      {/* Glow effect */}
      {highlighted && (
        <Animated.View style={[
          styles.glowEffect,
          {
            backgroundColor: glowColor,
            opacity: glowAnim,
            width: dims.width + 8,
            height: dims.height + 8,
            borderRadius: BORDER_RADIUS.md + 4,
          },
        ]} />
      )}

      <View style={[
        styles.card,
        {
          width: dims.width,
          height: dims.height,
          backgroundColor: COLORS.background.elevated,
          borderColor: cardColor + '60',
        },
      ]}>
        {/* Colored inner area */}
        <View style={[
          styles.cardInner,
          {
            backgroundColor: cardColor,
            margin: dims.width * 0.06,
            borderRadius: BORDER_RADIUS.sm,
          },
        ]}>
          {/* Top-left value */}
          <Text style={[styles.cornerValue, styles.topLeft, { fontSize: smallFontSize }]}>
            {displayValue}
          </Text>

          {/* Center oval + value */}
          <View style={[styles.centerOval, {
            width: dims.width * 0.7,
            height: dims.height * 0.45,
            backgroundColor: isWild ? 'transparent' : 'rgba(255,255,255,0.92)',
          }]}>
            {isWild ? (
              <View style={styles.wildCenter}>
                <View style={[styles.wildQuadrant, { backgroundColor: COLORS.uno.red }]} />
                <View style={[styles.wildQuadrant, { backgroundColor: COLORS.uno.blue }]} />
                <View style={[styles.wildQuadrant, { backgroundColor: COLORS.uno.yellow }]} />
                <View style={[styles.wildQuadrant, { backgroundColor: COLORS.uno.green }]} />
                <Text style={[styles.centerValue, {
                  fontSize: fontSize * 0.7,
                  color: '#FFF',
                  position: 'absolute',
                  textShadowColor: 'rgba(0,0,0,0.5)',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 3,
                }]}>
                  {displayValue}
                </Text>
              </View>
            ) : (
              <Text style={[styles.centerValue, {
                fontSize,
                color: cardColor,
              }]}>
                {displayValue}
              </Text>
            )}
          </View>

          {/* Bottom-right value (rotated) */}
          <Text style={[
            styles.cornerValue, styles.bottomRight,
            { fontSize: smallFontSize, transform: [{ rotate: '180deg' }] },
          ]}>
            {displayValue}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  cardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cornerValue: {
    position: 'absolute',
    fontWeight: '900',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  topLeft: {
    top: 2,
    left: 4,
  },
  bottomRight: {
    bottom: 2,
    right: 4,
  },
  centerOval: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  centerValue: {
    fontWeight: '900',
    textAlign: 'center',
  },
  wildCenter: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    overflow: 'hidden',
  },
  wildQuadrant: {
    width: '50%',
    height: '50%',
  },
  glowEffect: {
    position: 'absolute',
    top: -4,
    left: -4,
  },
  cardBack: {
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: COLORS.accent.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardBackInner: {
    width: '80%',
    height: '70%',
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-15deg' }],
  },
  cardBackText: {
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
  },
});
