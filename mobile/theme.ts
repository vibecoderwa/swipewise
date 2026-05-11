// Design tokens — React Native facade. Source of truth lives at:
//   mobile/src/theme/tokens.ts  (provided by Claude Design handoff)
//
// This file adapts the canonical web tokens into React Native shapes:
// - `theme.colors`     mirrors `tokens.color`
// - `theme.fonts`      maps to the specific Google Font family names loaded via
//                      @expo-google-fonts in app/_layout.tsx (web tokens use CSS
//                      stacks that RN can't resolve)
// - `theme.radii`      mirrors `tokens.radius`
// - `theme.space`      mirrors `tokens.space`
// - `theme.type`       mirrors `tokens.type` with `fontFamily` resolved to RN names
// - `theme.shadow`     RN-native equivalents of `tokens.shadow.chunky`
// - `theme.motion`     mirrors `tokens.motion`
// - `theme.border`     ink-border presets (no equivalent in tokens; preset for DX)
//
// Per CLAUDE_CODE_BRIEF: components consume tokens, never raw hex. Import
// `theme` for the styled scales and font family names.

import { color, radius, space, motion } from './src/theme/tokens';

const fonts = {
  display:        'Fraunces_900Black',
  displayItalic:  'Fraunces_900Black_Italic',
  displayBold:    'Fraunces_700Bold',
  displayRegular: 'Fraunces_400Regular',
  bodyRegular:    'InterTight_400Regular',
  bodyMedium:     'InterTight_500Medium',
  bodySemiBold:   'InterTight_600SemiBold',
  bodyBold:       'InterTight_700Bold',
  bodyExtraBold:  'InterTight_800ExtraBold',
  monoMedium:     'JetBrainsMono_500Medium',
  monoBold:       'JetBrainsMono_700Bold',
} as const;

const ink = color.ink;

export const theme = {
  colors: color,
  fonts,
  radii: radius,
  space,
  motion,

  // Resolved type scale: same numeric/weight/tracking values as tokens.type,
  // but `fontFamily` is the RN-loaded family name rather than a CSS stack.
  type: {
    display1: { fontSize: 64, fontFamily: fonts.display,       letterSpacing: -2.5 },
    display2: { fontSize: 48, fontFamily: fonts.display,       letterSpacing: -1.5 },
    title1:   { fontSize: 32, fontFamily: fonts.displayBold,   letterSpacing: -0.6 },
    title2:   { fontSize: 24, fontFamily: fonts.displayBold,   letterSpacing: -0.3 },
    title3:   { fontSize: 20, fontFamily: fonts.bodySemiBold,  letterSpacing: -0.2 },
    body:     { fontSize: 16, fontFamily: fonts.bodyMedium,    letterSpacing: 0 },
    bodySm:   { fontSize: 14, fontFamily: fonts.bodyMedium,    letterSpacing: 0 },
    caption:  { fontSize: 12, fontFamily: fonts.bodySemiBold,  letterSpacing: 0.12 },
    mono:     { fontSize: 13, fontFamily: fonts.monoMedium,    letterSpacing: 0 },
  },

  // Hard offset shadow — the brand's "chunky" treatment. RN doesn't render
  // box-shadow with 0 blur quite the same as web, but the offset is visible.
  shadow: {
    chunky:    { shadowColor: ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1,    shadowRadius: 0, elevation: 0 },
    chunkier:  { shadowColor: ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1,    shadowRadius: 0, elevation: 0 },
    chunkiest: { shadowColor: ink, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1,    shadowRadius: 0, elevation: 0 },
    soft:      { shadowColor: ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.85, shadowRadius: 0, elevation: 0 },
  },

  border: {
    thin:   { borderWidth: 1.5, borderColor: ink },
    medium: { borderWidth: 2,   borderColor: ink },
    bold:   { borderWidth: 2.5, borderColor: ink },
  },
} as const;

export type Theme = typeof theme;
