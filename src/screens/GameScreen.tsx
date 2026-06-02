import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useGameStore } from '../store/gameStore';

export default function GameScreen({ navigation }: { navigation: any }) {
  const { gameState, isMyTurn } = useGameStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game Active</Text>
      <Text style={styles.status}>
        {isMyTurn ? "Your Turn!" : "Waiting for others..."}
      </Text>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Leave Game</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.primary, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FONTS.size['2xl'], color: COLORS.text.primary, marginBottom: SPACING.md, fontWeight: 'bold' },
  status: { fontSize: FONTS.size.lg, color: COLORS.accent.secondary, marginBottom: SPACING.xl },
  backButton: { padding: SPACING.md, backgroundColor: COLORS.background.card, borderRadius: BORDER_RADIUS.md },
  backButtonText: { color: COLORS.text.primary, fontSize: FONTS.size.md },
});
