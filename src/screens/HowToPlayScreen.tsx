import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';

export default function HowToPlayScreen({ navigation }: { navigation: any }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How to Play</Text>
      <Text style={styles.content}>Match cards by color or number. Use action cards to gain an advantage. Don't forget to say UNO when you have one card left!</Text>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.primary, padding: SPACING.xl, paddingTop: 60 },
  title: { fontSize: FONTS.size['2xl'], color: COLORS.text.primary, marginBottom: SPACING.md, fontWeight: 'bold' },
  content: { fontSize: FONTS.size.md, color: COLORS.text.secondary, lineHeight: 24, marginBottom: SPACING.xl },
  backButton: { padding: SPACING.md, backgroundColor: COLORS.background.card, borderRadius: BORDER_RADIUS.md, width: '100%', alignItems: 'center', marginTop: 'auto', marginBottom: SPACING.xl },
  backButtonText: { color: COLORS.text.primary, fontSize: FONTS.size.md },
});
