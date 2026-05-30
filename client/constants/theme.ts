/**
 * Swing design tokens.
 *
 * Brand: warm & inviting. Peach / coral (matches the cursive wordmark)
 * paired with paper-white surfaces. One semantic accent for "send /
 * accept" actions, one for "reject / block".
 *
 * Use `Colors.light.foo` / `Colors.dark.foo` in components via the
 * `useThemeColor` hook so dark mode works automatically.
 */

import { Platform } from 'react-native';

const brand = {
  // Sampled directly from the cursive wordmark PNG — average of every
  // opaque coloured pixel in the letter strokes. The exact same hue
  // shows up in the logo so the brand reads identically wherever it
  // appears in the app (tabs, buttons, status rings, badges, etc).
  coral: '#FD425E',
  coralPressed: '#E0304C',
  coralTint: '#FFE0E5',
};

export const Colors = {
  light: {
    text: '#0F172A',
    textMuted: '#475569',
    textSubtle: '#94A3B8',

    background: '#FFFFFF', // clean white (Tinder / Instagram style)
    surface: '#FFFFFF',
    surfaceAlt: '#F5F5F7',

    border: '#E5E7EB',
    borderStrong: '#D1D5DB',

    tint: brand.coral,
    tintPressed: brand.coralPressed,
    tintMuted: brand.coralTint,

    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',

    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: brand.coral,
  },
  dark: {
    text: '#F9FAFB',
    textMuted: '#D1D5DB',
    textSubtle: '#6B7280',

    background: '#000000',
    surface: '#0E0E10',
    surfaceAlt: '#1A1A1D',

    border: '#27272A',
    borderStrong: '#3F3F46',

    // Same exact logo coral on dark too — keeps brand consistent
    // across light + dark. Pure black bg (#000) gives plenty of
    // contrast so we don't need a lighter variant.
    tint: brand.coral,
    tintPressed: brand.coralPressed,
    tintMuted: '#3A0F18',

    success: '#34D399',
    danger: '#F87171',
    warning: '#FBBF24',

    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: brand.coral,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

export const Radii = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
