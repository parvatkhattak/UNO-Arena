import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { usePlayerStore } from '../store/playerStore';

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const { profile, setName, setAvatar } = usePlayerStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      
      <View style={styles.avatarContainer}>
        <Text style={styles.avatar}>{profile.avatar}</Text>
      </View>
      
      <Text style={styles.name}>{profile.name}</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile.gamesPlayed}</Text>
          <Text style={styles.statLabel}>Games Played</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile.gamesWon}</Text>
          <Text style={styles.statLabel}>Games Won</Text>
        </View>
      </View>
      
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
  container: { flex: 1, backgroundColor: COLORS.background.primary, padding: SPACING.xl, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FONTS.size['2xl'], color: COLORS.text.primary, marginBottom: SPACING.xl, fontWeight: 'bold' },
  avatarContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.background.card, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  avatar: { fontSize: 60 },
  name: { fontSize: FONTS.size.xl, color: COLORS.text.primary, marginBottom: SPACING.xl },
  statsContainer: { flexDirection: 'row', gap: SPACING.lg, marginBottom: SPACING['3xl'] },
  statBox: { backgroundColor: COLORS.background.secondary, padding: SPACING.lg, borderRadius: BORDER_RADIUS.md, alignItems: 'center', minWidth: 120 },
  statValue: { fontSize: FONTS.size['2xl'], color: COLORS.accent.primary, fontWeight: 'bold' },
  statLabel: { fontSize: FONTS.size.sm, color: COLORS.text.secondary, marginTop: SPACING.sm },
  backButton: { padding: SPACING.md, backgroundColor: COLORS.background.card, borderRadius: BORDER_RADIUS.md, width: '100%', alignItems: 'center' },
  backButtonText: { color: COLORS.text.primary, fontSize: FONTS.size.md },
});
