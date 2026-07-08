/**
 * UNO Arena — Game Screen
 * The main battlefield: player hand, discard pile, opponents, turn indicator, UNO button
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Dimensions, Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS, CARD_DIMENSIONS } from '../constants/theme';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import UnoCard from '../components/cards/UnoCard';
import ColorPicker from '../components/game/ColorPicker';
import { Card, CardColor } from '../types/game';
import { canPlayCard, getPlayableCards } from '../game/actions';
import { botDecide, shouldBotCallUno, getBotDelay } from '../game/ai';
import { playSound, triggerHaptic } from '../utils/sounds';
import { EmojiBar, FloatingEmoji } from '../components/game/EmojiBar';
import { networkManager } from '../network/NetworkManager';
import { useState } from 'react';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function GameScreen({ navigation }: { navigation: any }) {
  const {
    gameState, selectedCard, showColorPicker,
    playCardAction, drawCardAction, callUnoAction,
    passTurnAction, setSelectedCard, setShowColorPicker,
    resetGame,
  } = useGameStore();
  const { profile } = usePlayerStore();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const turnGlow = useRef(new Animated.Value(0)).current;
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeEmojis, setActiveEmojis] = useState<{ id: string; emoji: string; playerName: string }[]>([]);

  const showEmoji = useCallback((emoji: string, senderName: string) => {
    const id = Math.random().toString();
    setActiveEmojis(prev => [...prev, { id, emoji, playerName: senderName }]);
  }, []);

  // Listen for network emojis
  useEffect(() => {
    const unsubscribe = networkManager.subscribe((msg) => {
      if (msg.type === 'CHAT_MESSAGE' && msg.payload?.emoji) {
        const sender = gameState?.players.find(p => p.id === msg.senderId);
        const senderName = sender ? sender.name : 'Opponent';
        // Only show if it's not from ourselves (since we display it instantly)
        if (msg.senderId !== profile.id) {
          showEmoji(msg.payload.emoji, senderName);
        }
      }
    });
    return unsubscribe;
  }, [gameState?.players, profile.id, showEmoji]);

  const handleSendEmoji = (emoji: string) => {
    showEmoji(emoji, profile.name);
    networkManager.sendMessage({
      type: 'CHAT_MESSAGE',
      senderId: profile.id,
      timestamp: Date.now(),
      payload: { emoji }
    });
  };

  // Pulse animation for "Your Turn"
  useEffect(() => {
    if (gameState && gameState.players[gameState.currentPlayerIndex]?.id === profile.id) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(turnGlow, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(turnGlow, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      turnGlow.setValue(0);
    }
  }, [gameState?.currentPlayerIndex]);

  // Bot auto-play logic
  useEffect(() => {
    if (!gameState || gameState.phase !== 'playing') return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.type !== 'bot') return;

    const delay = getBotDelay(currentPlayer.botDifficulty || 'medium');

    botTimerRef.current = setTimeout(() => {
      const decision = botDecide(gameState, currentPlayer);

      if (decision.action === 'play' && decision.cardId) {
        // Check if bot should call UNO before playing
        if (currentPlayer.hand.length === 2) {
          if (shouldBotCallUno(currentPlayer.botDifficulty || 'medium')) {
            callUnoAction(currentPlayer.id);
          }
        }
        playCardAction(currentPlayer.id, decision.cardId, decision.chosenColor);

        // 30% chance bot reacts with emoji
        if (Math.random() < 0.3) {
          const botEmojis = ['😂', '😠', '😭', '🔥', '👏', '😱', '💀', '🎉'];
          const randomEmoji = botEmojis[Math.floor(Math.random() * botEmojis.length)];
          setTimeout(() => {
            showEmoji(randomEmoji, currentPlayer.name);
            networkManager.sendMessage({
              type: 'CHAT_MESSAGE',
              senderId: currentPlayer.id,
              timestamp: Date.now(),
              payload: { emoji: randomEmoji }
            });
          }, 400);
        }
      } else {
        drawCardAction(currentPlayer.id);
        
        // 20% chance bot gets annoyed/crying emoji on draw
        if (Math.random() < 0.2) {
          setTimeout(() => {
            showEmoji('😭', currentPlayer.name);
            networkManager.sendMessage({
              type: 'CHAT_MESSAGE',
              senderId: currentPlayer.id,
              timestamp: Date.now(),
              payload: { emoji: '😭' }
            });
          }, 300);
        }

        // After drawing, bot only passes if the drawn card is not playable
        setTimeout(() => {
          const updatedState = useGameStore.getState().gameState;
          if (!updatedState) return;
          const updatedBot = updatedState.players.find(p => p.id === currentPlayer.id);
          if (!updatedBot) return;
          const topCard2 = updatedState.discardPile[updatedState.discardPile.length - 1];
          if (!hasPlayableCard(updatedBot.hand, topCard2, updatedState.currentColor, updatedState.settings.houseRules, updatedState.stackCount)) {
            passTurnAction(currentPlayer.id);
          }
        }, 500);
      }
    }, delay);

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [gameState?.currentPlayerIndex, gameState?.phase, showEmoji]);

  // Handle round end / game over
  useEffect(() => {
    if (!gameState) return;

    if (gameState.phase === 'round_end' || gameState.phase === 'game_over') {
      const winner = gameState.players.find(p => p.id === gameState.winner);
      const isMe = winner?.id === profile.id;

      if (isMe) {
        playSound('win');
        triggerHaptic('success');
      } else {
        playSound('lose');
        triggerHaptic('error');
      }

      setTimeout(() => {
        Alert.alert(
          gameState.phase === 'game_over' ? '🏆 Game Over!' : '🎉 Round Over!',
          isMe ? `You won! 🎊` : `${winner?.name} wins this round!`,
          [
            {
              text: 'Back to Menu',
              onPress: () => { resetGame(); navigation.navigate('Home'); },
            },
          ]
        );
      }, 800);
    }
  }, [gameState?.phase]);

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No active game</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const myPlayer = gameState.players.find(p => p.id === profile.id);
  const myIndex = gameState.players.findIndex(p => p.id === profile.id);
  const isMyTurn = gameState.currentPlayerIndex === myIndex;
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  const opponents = gameState.players.filter(p => p.id !== profile.id);

  const playableCards = myPlayer && isMyTurn
    ? getPlayableCards(myPlayer.hand, topCard, gameState.currentColor, gameState.settings.houseRules, gameState.stackCount)
    : [];

  const handleCardPress = (card: Card) => {
    if (!isMyTurn || !myPlayer) return;

    const isPlayable = playableCards.some(c => c.id === card.id);
    if (!isPlayable) return;

    // Wild card — show color picker
    if (card.color === 'wild') {
      setSelectedCard(card);
      setShowColorPicker(true);
      return;
    }

    // Check if we need to call UNO before playing
    if (myPlayer.hand.length === 2 && !myPlayer.hasCalledUno) {
      // Auto-reminder: player should call UNO
    }

    playSound('playCard');
    triggerHaptic('medium');
    playCardAction(profile.id, card.id);
  };

  const handleColorSelect = (color: CardColor) => {
    if (selectedCard) {
      playSound('playCard');
      triggerHaptic('medium');
      playCardAction(profile.id, selectedCard.id, color);
    }
  };

  const handleDraw = () => {
    if (!isMyTurn) return;
    playSound('drawCard');
    triggerHaptic('light');
    drawCardAction(profile.id);
  };

  const handleUnoCall = () => {
    if (!myPlayer) return;
    playSound('unoCall');
    triggerHaptic('heavy');
    callUnoAction(profile.id);
  };

  const handlePass = () => {
    if (!isMyTurn) return;
    triggerHaptic('light');
    passTurnAction(profile.id);
  };

  // Color indicator mapping
  const colorIndicator: Record<string, string> = {
    red: COLORS.uno.red,
    blue: COLORS.uno.blue,
    green: COLORS.uno.green,
    yellow: COLORS.uno.yellow,
  };

  return (
    <View style={styles.container}>
      {/* ── Top: Opponents ── */}
      <View style={styles.opponentsContainer}>
        {opponents.map((opp, i) => {
          const isOppTurn = gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === opp.id);
          return (
            <View
              key={opp.id}
              style={[styles.opponentCard, isOppTurn && styles.opponentActive]}
            >
              <Text style={styles.oppAvatar}>{opp.avatar}</Text>
              <Text style={[styles.oppName, isOppTurn && { color: COLORS.accent.primary }]} numberOfLines={1}>
                {opp.name}
              </Text>
              <View style={styles.oppCardsRow}>
                {Array.from({ length: Math.min(opp.hand.length, 7) }).map((_, ci) => (
                  <View key={ci} style={[styles.oppMiniCard, { marginLeft: ci > 0 ? -6 : 0 }]} />
                ))}
              </View>
              <Text style={styles.oppCardCount}>{opp.hand.length} cards</Text>
              {opp.hasCalledUno && opp.hand.length === 1 && (
                <Text style={styles.unoIndicator}>UNO!</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* ── Middle: Play Area ── */}
      <View style={styles.playArea}>
        {/* Direction indicator */}
        <Text style={styles.directionText}>
          {gameState.direction === 'clockwise' ? '↻' : '↺'}
        </Text>

        {/* Draw pile */}
        <TouchableOpacity
          onPress={handleDraw}
          disabled={!isMyTurn}
          activeOpacity={0.7}
          style={styles.drawPileContainer}
        >
          <View style={[styles.drawPile, !isMyTurn && { opacity: 0.5 }]}>
            <View style={styles.drawPileStack}>
              <View style={[styles.drawPileCard, { top: 4, left: 4 }]} />
              <View style={[styles.drawPileCard, { top: 2, left: 2 }]} />
              <View style={[styles.drawPileCardTop]}>
                <Text style={styles.drawPileText}>UNO</Text>
              </View>
            </View>
            <Text style={styles.drawCount}>{gameState.drawPile.length}</Text>
          </View>
          {isMyTurn && <Text style={styles.drawLabel}>Draw</Text>}
        </TouchableOpacity>

        {/* Discard pile */}
        <View style={styles.discardContainer}>
          <UnoCard card={topCard} size="discard" />
          {/* Current color indicator */}
          <View style={[styles.colorDot, { backgroundColor: colorIndicator[gameState.currentColor] }]} />
        </View>

        {/* Stack count if active */}
        {gameState.stackCount > 0 && (
          <View style={styles.stackBadge}>
            <Text style={styles.stackText}>+{gameState.stackCount}</Text>
          </View>
        )}
      </View>

      {/* ── Turn Indicator ── */}
      <Animated.View style={[styles.turnIndicator, { opacity: isMyTurn ? turnGlow : 0.6 }]}>
        <Text style={[styles.turnText, isMyTurn && { color: COLORS.accent.primary }]}>
          {isMyTurn ? '🎯 Your Turn!' : `${gameState.players[gameState.currentPlayerIndex]?.name}'s turn...`}
        </Text>
      </Animated.View>

      {/* ── Action Buttons ── */}
      <View style={styles.actionRow}>
        {isMyTurn && (
          <TouchableOpacity style={styles.passBtn} onPress={handlePass} activeOpacity={0.7}>
            <Text style={styles.passBtnText}>Pass</Text>
          </TouchableOpacity>
        )}

        {myPlayer && myPlayer.hand.length <= 2 && (
          <TouchableOpacity
            style={[styles.unoBtn, myPlayer.hasCalledUno && styles.unoBtnCalled]}
            onPress={handleUnoCall}
            activeOpacity={0.7}
          >
            <Text style={styles.unoBtnText}>
              {myPlayer.hasCalledUno ? '✓ UNO!' : 'UNO!'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Bottom: Player's Hand ── */}
      <View style={styles.handContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.handScroll}
        >
          {myPlayer?.hand.map((card) => {
            const isPlayable = playableCards.some(c => c.id === card.id);
            return (
              <View key={card.id} style={[styles.handCard, isPlayable && isMyTurn && styles.handCardPlayable]}>
                <UnoCard
                  card={card}
                  size="hand"
                  onPress={() => handleCardPress(card)}
                  disabled={!isMyTurn || !isPlayable}
                  highlighted={isPlayable && isMyTurn}
                />
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Color Picker Modal ── */}
      <ColorPicker
        visible={showColorPicker}
        onSelectColor={handleColorSelect}
      />

      {/* ── Emoji reaction overlay ── */}
      <EmojiBar onSendEmoji={handleSendEmoji} />

      {/* ── Floating Emojis ── */}
      {activeEmojis.map((ae) => (
        <FloatingEmoji
          key={ae.id}
          emoji={ae.emoji}
          playerName={ae.playerName}
          onDone={() => {
            setActiveEmojis(prev => prev.filter(x => x.id !== ae.id));
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    paddingTop: 50,
  },
  errorText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.lg,
    textAlign: 'center',
    marginTop: 100,
  },
  backBtn: {
    backgroundColor: COLORS.background.card,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'center',
    marginTop: SPACING.xl,
  },
  backBtnText: { color: COLORS.text.primary, fontSize: FONTS.size.md },

  // ── Opponents ──
  opponentsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  opponentCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  opponentActive: {
    borderColor: COLORS.accent.primary + '80',
    backgroundColor: COLORS.background.card,
  },
  oppAvatar: { fontSize: 22 },
  oppName: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.secondary,
    marginTop: 2,
    maxWidth: 70,
  },
  oppCardsRow: {
    flexDirection: 'row',
    marginTop: 4,
    height: 18,
  },
  oppMiniCard: {
    width: 10,
    height: 16,
    borderRadius: 2,
    backgroundColor: COLORS.accent.primary + '60',
    borderWidth: 0.5,
    borderColor: COLORS.accent.primary + '30',
  },
  oppCardCount: {
    fontSize: 9,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  unoIndicator: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.uno.yellow,
    marginTop: 2,
  },

  // ── Play Area ──
  playArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['2xl'],
    position: 'relative',
  },
  directionText: {
    position: 'absolute',
    top: 10,
    right: 20,
    fontSize: 28,
    color: COLORS.text.muted,
  },
  drawPileContainer: {
    alignItems: 'center',
  },
  drawPile: {
    alignItems: 'center',
  },
  drawPileStack: {
    width: CARD_DIMENSIONS.discard.width,
    height: CARD_DIMENSIONS.discard.height,
    position: 'relative',
  },
  drawPileCard: {
    position: 'absolute',
    width: CARD_DIMENSIONS.discard.width - 8,
    height: CARD_DIMENSIONS.discard.height - 8,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.accent.primary + '20',
  },
  drawPileCardTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_DIMENSIONS.discard.width - 8,
    height: CARD_DIMENSIONS.discard.height - 8,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawPileText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
    transform: [{ rotate: '-15deg' }],
  },
  drawCount: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.muted,
    marginTop: 6,
  },
  drawLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.accent.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  discardContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 2,
    borderColor: COLORS.background.primary,
  },
  stackBadge: {
    position: 'absolute',
    top: '40%',
    right: 30,
    backgroundColor: COLORS.accent.danger,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  stackText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: FONTS.size.lg,
  },

  // ── Turn Indicator ──
  turnIndicator: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  turnText: {
    fontSize: FONTS.size.md,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },

  // ── Action Buttons ──
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    minHeight: 44,
    alignItems: 'center',
  },
  passBtn: {
    backgroundColor: COLORS.background.card,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.text.muted + '30',
  },
  passBtnText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    fontWeight: '600',
  },
  unoBtn: {
    backgroundColor: COLORS.uno.red,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING['2xl'],
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.md,
  },
  unoBtnCalled: {
    backgroundColor: COLORS.accent.success,
  },
  unoBtnText: {
    color: '#FFF',
    fontSize: FONTS.size.lg,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // ── Player's Hand ──
  handContainer: {
    paddingBottom: 30,
    paddingTop: SPACING.sm,
    backgroundColor: COLORS.background.secondary + '80',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
  },
  handScroll: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'flex-end',
    gap: -8,
  },
  handCard: {
    marginHorizontal: -4,
  },
  handCardPlayable: {
    marginTop: -8,
  },
});
