/**
 * UNO Arena — Lobby Screen
 * Host or Join a game, see connected players
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useSettingsStore } from '../store/settingsStore';
import { usePlayerStore } from '../store/playerStore';
import { useGameStore } from '../store/gameStore';
import { useNetworkStore } from '../store/networkStore';
import { networkManager } from '../network/NetworkManager';
import { Player } from '../types/game';
import { AVATARS, BOT_NAMES } from '../constants/cards';

export default function LobbyScreen({ navigation }: { navigation: any }) {
  const { profile } = usePlayerStore();
  const { gameSettings } = useSettingsStore();
  const { initGame } = useGameStore();
  const { isHost, isConnected, localIpAddress, connectionError } = useNetworkStore();

  const [roleSelected, setRoleSelected] = useState<boolean>(false);
  const [joinIp, setJoinIp] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([
    {
      id: profile.id, name: profile.name, avatar: profile.avatar,
      type: 'human', hand: [], score: 0, isReady: true, isConnected: true, hasCalledUno: false,
    },
  ]);
  const [botCount, setBotCount] = useState(0);

  const addBot = () => {
    if (players.length >= gameSettings.maxPlayers) {
      Alert.alert('Room Full', `Maximum ${gameSettings.maxPlayers} players allowed.`);
      return;
    }
    const botName = BOT_NAMES[botCount % BOT_NAMES.length];
    const bot: Player = {
      id: uuidv4(), name: botName, avatar: AVATARS[(botCount + 5) % AVATARS.length],
      type: 'bot', botDifficulty: 'medium',
      hand: [], score: 0, isReady: true, isConnected: true, hasCalledUno: false,
    };
    setPlayers([...players, bot]);
    setBotCount(botCount + 1);
  };

  const removePlayer = (id: string) => {
    if (id === profile.id) return;
    setPlayers(players.filter(p => p.id !== id));
  };

  const startGame = () => {
    if (players.length < 2) {
      Alert.alert('Not Enough Players', 'Need at least 2 players to start.');
      return;
    }
    initGame(players, gameSettings);
    networkManager.broadcastGameState(); // Tell clients game started!
    navigation.navigate('Game');
  };

  const handleHostGame = async () => {
    setRoleSelected(true);
    await networkManager.startHosting();
  };

  const handleJoinGame = () => {
    if (!joinIp) return;
    setRoleSelected(true);
    networkManager.joinGame(joinIp);
  };

  // If role not selected yet, show host/join selection
  if (!roleSelected) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Game Lobby</Text>
        <Text style={styles.subtitle}>
          Mode: {gameSettings.mode.charAt(0).toUpperCase() + gameSettings.mode.slice(1)}
        </Text>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleCard, { borderColor: COLORS.accent.primary + '50' }]}
            onPress={handleHostGame}
            activeOpacity={0.7}
          >
            <Text style={styles.roleIcon}>📡</Text>
            <Text style={[styles.roleTitle, { color: COLORS.accent.primary }]}>Host Game</Text>
            <Text style={styles.roleDesc}>Create a room for others to join</Text>
          </TouchableOpacity>

          <View style={[styles.roleCard, { borderColor: COLORS.accent.secondary + '50', paddingBottom: SPACING.md }]}>
            <Text style={styles.roleIcon}>🔗</Text>
            <Text style={[styles.roleTitle, { color: COLORS.accent.secondary }]}>Join Game</Text>
            <Text style={styles.roleDesc}>Enter host's IP Address</Text>
            
            <View style={{ flexDirection: 'row', marginTop: SPACING.md, gap: SPACING.sm, width: '100%' }}>
              <TextInput
                style={styles.ipInput}
                placeholder="192.168.x.x"
                placeholderTextColor={COLORS.text.muted}
                value={joinIp}
                onChangeText={setJoinIp}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.joinBtn} onPress={handleJoinGame}>
                <Text style={styles.joinBtnText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.roleCard, { borderColor: COLORS.accent.success + '50' }]}
            onPress={() => {
              setRoleSelected(true);
              useNetworkStore.getState().setHostMode(true);
              useNetworkStore.getState().setConnected(true);
              // Auto-add a bot for quick play
              const bot: Player = {
                id: uuidv4(), name: BOT_NAMES[0], avatar: AVATARS[5],
                type: 'bot', botDifficulty: 'medium',
                hand: [], score: 0, isReady: true, isConnected: true, hasCalledUno: false,
              };
              setPlayers(prev => [...prev, bot]);
              setBotCount(1);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.roleIcon}>🤖</Text>
            <Text style={[styles.roleTitle, { color: COLORS.accent.success }]}>vs Bots</Text>
            <Text style={styles.roleDesc}>Practice against AI opponents</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isHost ? 'Your Room' : 'Join Room'}</Text>
      <Text style={styles.subtitle}>
        {gameSettings.mode.charAt(0).toUpperCase() + gameSettings.mode.slice(1)} • {players.length}/{gameSettings.maxPlayers} Players
      </Text>

      {/* Room code display for host */}
      {isHost && (
        <View style={styles.roomCodeContainer}>
          <Text style={styles.roomCodeLabel}>Host IP Address</Text>
          <Text style={styles.roomCode}>
            {localIpAddress || 'Loading...'}
          </Text>
          <Text style={styles.roomCodeHint}>Others need this to join you</Text>
        </View>
      )}
      
      {!isHost && !isConnected && (
         <View style={styles.roomCodeContainer}>
          <Text style={styles.roomCodeLabel}>Status</Text>
          <Text style={[styles.roomCode, { fontSize: FONTS.size.lg }]}>
            {connectionError ? `Error: ${connectionError}` : 'Connecting...'}
          </Text>
         </View>
      )}

      {/* Players list */}
      <View style={styles.playersContainer}>
        <Text style={styles.sectionTitle}>Players</Text>
        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.playerRow}>
              <Text style={styles.playerAvatar}>{item.avatar}</Text>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{item.name}</Text>
                <Text style={styles.playerType}>
                  {item.type === 'bot' ? `🤖 Bot (${item.botDifficulty})` : '👤 Human'}
                </Text>
              </View>
              {item.isReady && <Text style={styles.readyBadge}>✓ Ready</Text>}
              {item.id !== profile.id && (
                <TouchableOpacity onPress={() => removePlayer(item.id)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          contentContainerStyle={{ gap: SPACING.sm }}
        />
      </View>

      {/* Action buttons */}
      {isHost && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.addBotBtn} onPress={addBot} activeOpacity={0.7}>
            <Text style={styles.addBotText}>+ Add Bot</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.startBtn, players.length < 2 && styles.startBtnDisabled]}
            onPress={startGame}
            activeOpacity={0.7}
            disabled={players.length < 2}
          >
            <Text style={styles.startBtnText}>🚀 Start Game</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.primary, paddingTop: 60, paddingHorizontal: SPACING.xl },
  title: { fontSize: FONTS.size['2xl'], fontWeight: '800', color: COLORS.text.primary, textAlign: 'center' },
  subtitle: { fontSize: FONTS.size.md, color: COLORS.text.secondary, textAlign: 'center', marginTop: 4, marginBottom: SPACING.xl },
  roleContainer: { gap: SPACING.lg, marginTop: SPACING.xl },
  roleCard: {
    backgroundColor: COLORS.background.card, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl, borderWidth: 1, alignItems: 'center', ...SHADOWS.sm,
  },
  roleIcon: { fontSize: 40, marginBottom: SPACING.sm },
  roleTitle: { fontSize: FONTS.size.xl, fontWeight: '700' },
  roleDesc: { fontSize: FONTS.size.sm, color: COLORS.text.muted, marginTop: 4 },
  roomCodeContainer: {
    backgroundColor: COLORS.background.card, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.accent.primary + '30',
  },
  roomCodeLabel: { fontSize: FONTS.size.sm, color: COLORS.text.secondary },
  roomCode: {
    fontSize: FONTS.size['4xl'], fontWeight: '900', color: COLORS.accent.primary,
    letterSpacing: 8, marginVertical: SPACING.sm,
  },
  roomCodeHint: { fontSize: FONTS.size.xs, color: COLORS.text.muted },
  playersContainer: { flex: 1, marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONTS.size.lg, fontWeight: '700', color: COLORS.text.primary, marginBottom: SPACING.md },
  playerRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background.secondary, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, paddingHorizontal: SPACING.lg,
  },
  playerAvatar: { fontSize: 28, marginRight: SPACING.md },
  playerInfo: { flex: 1 },
  playerName: { fontSize: FONTS.size.md, fontWeight: '600', color: COLORS.text.primary },
  playerType: { fontSize: FONTS.size.xs, color: COLORS.text.muted, marginTop: 2 },
  readyBadge: { fontSize: FONTS.size.xs, color: COLORS.accent.success, fontWeight: '600' },
  removeBtn: { padding: SPACING.sm, marginLeft: SPACING.sm },
  removeBtnText: { fontSize: FONTS.size.md, color: COLORS.accent.danger },
  actions: { gap: SPACING.md, marginBottom: SPACING['2xl'] },
  addBotBtn: {
    backgroundColor: COLORS.background.card, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.accent.secondary + '30', borderStyle: 'dashed',
  },
  addBotText: { fontSize: FONTS.size.md, color: COLORS.accent.secondary, fontWeight: '600' },
  startBtn: {
    backgroundColor: COLORS.accent.primary, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg, alignItems: 'center', ...SHADOWS.md,
  },
  startBtnDisabled: { opacity: 0.4 },
  startBtnText: { fontSize: FONTS.size.lg, fontWeight: '700', color: COLORS.text.primary },
  ipInput: {
    flex: 1, backgroundColor: COLORS.background.secondary, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, color: COLORS.text.primary, fontSize: FONTS.size.md,
    borderWidth: 1, borderColor: COLORS.glass.border,
  },
  joinBtn: {
    backgroundColor: COLORS.accent.secondary, borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center', paddingHorizontal: SPACING.lg,
  },
  joinBtnText: { color: COLORS.background.primary, fontWeight: 'bold' }
});
