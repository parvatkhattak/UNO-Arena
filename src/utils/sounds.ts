/**
 * UNO Arena — Sound & Haptics Manager
 * Handles playing UI sounds and triggering haptic feedback
 */

import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../store/settingsStore';

// In a real app with audio assets, we would use expo-av:
// import { Audio } from 'expo-av';
// const sounds = {
//   playCard: require('../../assets/sounds/play_card.mp3'),
//   drawCard: require('../../assets/sounds/draw_card.mp3'),
//   unoCall: require('../../assets/sounds/uno_call.mp3'),
// };

export type SoundEffect = 'playCard' | 'drawCard' | 'unoCall' | 'penalty' | 'win' | 'lose' | 'buttonPress';

/**
 * Play a sound effect if sounds are enabled
 */
export async function playSound(effect: SoundEffect) {
  const { soundEnabled } = useSettingsStore.getState();
  
  if (!soundEnabled) return;

  // Placeholder for sound playing logic until actual audio files are added to assets/sounds/
  console.log(`[Sound Manager] Playing sound effect: ${effect}`);
  
  /* Example implementation:
  try {
    const { sound } = await Audio.Sound.createAsync(sounds[effect]);
    await sound.playAsync();
  } catch (error) {
    console.warn('Error playing sound:', error);
  }
  */
}

/**
 * Trigger haptic feedback if haptics are enabled
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  const { hapticsEnabled } = useSettingsStore.getState();
  
  if (!hapticsEnabled) return;

  try {
    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      default:
        Haptics.selectionAsync();
        break;
    }
  } catch (error) {
    // Haptics might not be available on all devices/simulators
    console.warn('Haptics not available:', error);
  }
}
