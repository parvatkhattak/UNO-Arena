/**
 * UNO Arena — Global Design System
 * Dark-first gaming aesthetic with neon accents
 */

export const COLORS = {
  // Background layers
  background: {
    primary: '#0F0F23',
    secondary: '#1A1A2E',
    tertiary: '#16213E',
    card: '#1E1E3F',
    elevated: '#252547',
  },

  // UNO Card Colors (vibrant neon variants)
  uno: {
    red: '#FF3B5C',
    blue: '#3B82F6',
    green: '#10B981',
    yellow: '#F59E0B',
    wild: '#8B5CF6',
    dark: '#1E1E3F', // For flip dark side
  },

  // Card glow effects
  glow: {
    red: 'rgba(255, 59, 92, 0.4)',
    blue: 'rgba(59, 130, 246, 0.4)',
    green: 'rgba(16, 185, 129, 0.4)',
    yellow: 'rgba(245, 158, 11, 0.4)',
    wild: 'rgba(139, 92, 246, 0.4)',
  },

  // UI Accent Colors
  accent: {
    primary: '#8B5CF6',    // Purple
    secondary: '#06B6D4',  // Cyan
    success: '#10B981',    // Green
    warning: '#F59E0B',    // Amber
    danger: '#EF4444',     // Red
    info: '#3B82F6',       // Blue
  },

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#A0AEC0',
    muted: '#4A5568',
    inverse: '#0F0F23',
  },

  // Glass effect
  glass: {
    background: 'rgba(30, 30, 63, 0.6)',
    border: 'rgba(139, 92, 246, 0.2)',
    highlight: 'rgba(255, 255, 255, 0.05)',
  },

  // Status
  status: {
    online: '#10B981',
    offline: '#6B7280',
    playing: '#F59E0B',
    ready: '#3B82F6',
  },
} as const;

export const FONTS = {
  family: {
    heading: 'Outfit-Bold',
    body: 'Inter-Regular',
    bodyMedium: 'Inter-Medium',
    bodySemiBold: 'Inter-SemiBold',
    bodyBold: 'Inter-Bold',
    mono: 'SpaceMono-Regular',
  },
  size: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    display: 64,
  },
  lineHeight: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  }),
} as const;

export const CARD_DIMENSIONS = {
  width: 70,
  height: 100,
  borderRadius: 10,
  // In-hand (smaller)
  hand: {
    width: 56,
    height: 80,
  },
  // Discard pile (larger)
  discard: {
    width: 90,
    height: 130,
  },
} as const;

export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
    cardPlay: 400,
    cardDraw: 350,
    shuffle: 800,
  },
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
} as const;
