/**
 * Swing design tokens.
 *
 * Brand: calm & airy. Sky blue (planes fly through it) + paper white (planes
 * are made of it). One semantic accent for "send/accept" actions, one for
 * "reject/block".
 *
 * Use `Colors.light.foo` / `Colors.dark.foo` in components via the
 * `useThemeColor` hook so dark mode works automatically.
 */

import { Platform } from 'react-native';

const brand = {
  sky: '#3B82F6',
  skyPressed: '#2563EB',
  skyTint: '#DBEAFE',
};

export const Colors = {
  light: {
    text: '#0F172A',
    textMuted: '#475569',
    textSubtle: '#94A3B8',

    background: '#FAFBFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',

    border: '#E2E8F0',
    borderStrong: '#CBD5E1',

    tint: brand.sky,
    tintPressed: brand.skyPressed,
    tintMuted: brand.skyTint,

    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',

    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: brand.sky,
  },
  dark: {
    text: '#F8FAFC',
    textMuted: '#CBD5E1',
    textSubtle: '#64748B',

    background: '#0B1220',
    surface: '#111827',
    surfaceAlt: '#1E293B',

    border: '#1F2937',
    borderStrong: '#334155',

    tint: '#60A5FA',
    tintPressed: brand.sky,
    tintMuted: '#1E3A8A',

    success: '#34D399',
    danger: '#F87171',
    warning: '#FBBF24',

    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: '#60A5FA',
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
