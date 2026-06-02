import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useSettingsStore } from '../store/settingsStore';

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const { soundEnabled, hapticsEnabled, toggleSound, toggleHaptics } = useSettingsStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Sound Effects</Text>
        <Switch
          value={soundEnabled}
          onValueChange={toggleSound}
          trackColor={{ false: COLORS.background.secondary, true: COLORS.accent.primary }}
        />
      </View>
      
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Haptics (Vibration)</Text>
        <Switch
          value={hapticsEnabled}
          onValueChange={toggleHaptics}
          trackColor={{ false: COLORS.background.secondary, true: COLORS.accent.primary }}
        />
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
  container: { flex: 1, backgroundColor: COLORS.background.primary, padding: SPACING.xl, paddingTop: 60 },
  title: { fontSize: FONTS.size['2xl'], color: COLORS.text.primary, marginBottom: SPACING.xl, fontWeight: 'bold' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background.card, padding: SPACING.lg, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.md },
  settingLabel: { color: COLORS.text.primary, fontSize: FONTS.size.md },
  backButton: { padding: SPACING.md, backgroundColor: COLORS.background.card, borderRadius: BORDER_RADIUS.md, width: '100%', alignItems: 'center', marginTop: 'auto', marginBottom: SPACING.xl },
  backButtonText: { color: COLORS.text.primary, fontSize: FONTS.size.md },
});
