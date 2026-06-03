/**
 * UNO Arena — Color Picker Modal
 * Shown when a Wild card is played — player chooses the next color
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { CardColor } from '../../types/game';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface ColorPickerProps {
  visible: boolean;
  onSelectColor: (color: CardColor) => void;
}

const PICK_COLORS: { color: CardColor; bg: string; label: string }[] = [
  { color: 'red', bg: COLORS.uno.red, label: 'Red' },
  { color: 'blue', bg: COLORS.uno.blue, label: 'Blue' },
  { color: 'green', bg: COLORS.uno.green, label: 'Green' },
  { color: 'yellow', bg: COLORS.uno.yellow, label: 'Yellow' },
];

export default function ColorPicker({ visible, onSelectColor }: ColorPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Choose a Color</Text>
          <View style={styles.grid}>
            {PICK_COLORS.map((c) => (
              <TouchableOpacity
                key={c.color}
                style={[styles.colorBtn, { backgroundColor: c.bg }]}
                onPress={() => onSelectColor(c.color)}
                activeOpacity={0.7}
              >
                <Text style={styles.colorLabel}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING['2xl'],
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  title: {
    fontSize: FONTS.size.xl,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: SPACING.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  colorBtn: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorLabel: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
