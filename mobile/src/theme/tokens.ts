// Swipewise — Design Tokens
// Source of truth for colors, type, spacing, radii, motion.
// Mirrors `mocks/system.jsx` T object — keep these two in sync until the
// React Native app fully replaces the canvas mocks.
//
// Usage (Expo / React Native):
//   import { tokens } from './tokens';
//   <View style={{ backgroundColor: tokens.color.paper }} />

export const color = {
  // Editorial palette — muted, warm, magazine-like. No neons.
  ink:      '#1A1814',  // warm near-black, primary text
  paper:    '#F7F2E9',  // soft bone, primary surface
  cream:    '#EFE7D7',  // raised surface
  smoke:    '#EDE7DA',  // sunken surface
  haze:     '#D9D0BD',  // dividers on cream
  hairline: '#DCD4C1',  // hairline rules
  graphite: '#3A362F',  // secondary text on light
  dim:      '#8C8578',  // tertiary text / metadata
  line:     '#2A261F',  // soft black for borders (not pure black)

  // Accents — used sparingly, one per surface
  lemon:    '#D4B254',  lemonDk: '#A88A36',  // ochre — earnings, positive
  mint:     '#9CB49A',  mintDk:  '#6B8A74',  // sage — confirmation, streaks
  coral:    '#C26B5A',  coralDk: '#9A4F3F',  // terracotta — alerts, warnings
  sky:      '#8BA5B8',  skyDk:   '#5A7A8E',  // dusty blue — info, geo
  plum:     '#8C7A9E',  plumDk:  '#5F5070',  // mauve — premium, special

  // Issuer colors — subdued, used only on card art and issuer chips
  amex:     '#AE8B3B',  amexWash:  '#F0E8D3',
  chase:    '#2B4468',  chaseWash: '#DCE2ED',
  savor:    '#7A3848',  savorWash: '#EBDAE0',
} as const;

export const font = {
  display: '"Fraunces", "Times New Roman", Georgia, serif',
  body:    '"Inter Tight", "Inter", -apple-system, system-ui, sans-serif',
  mono:    '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace',
} as const;

// Type scale — major third (1.25), 16px base
export const type = {
  display1: { size: 64, weight: '800', tracking: -0.04, family: font.display },
  display2: { size: 48, weight: '800', tracking: -0.03, family: font.display },
  title1:   { size: 32, weight: '700', tracking: -0.02, family: font.display },
  title2:   { size: 24, weight: '700', tracking: -0.01, family: font.display },
  title3:   { size: 20, weight: '600', tracking: -0.01, family: font.body },
  body:     { size: 16, weight: '500', tracking: 0,     family: font.body },
  bodySm:   { size: 14, weight: '500', tracking: 0,     family: font.body },
  caption:  { size: 12, weight: '600', tracking:  0.01, family: font.body },
  mono:     { size: 13, weight: '500', tracking: 0,     family: font.mono },
} as const;

// 4pt spacing scale
export const space = {
  xxs: 2, xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64,
} as const;

export const radius = {
  none: 0, sm: 6, md: 10, lg: 14, xl: 20, pill: 999,
} as const;

// "Chunky" shadow — flat 2px offset, used on primary buttons + card art
export const shadow = {
  chunky: { offsetX: 2, offsetY: 2, blur: 0, color: color.ink },
  card:   { offsetX: 0, offsetY: 4, blur: 12, color: 'rgba(26,24,20,0.08)' },
} as const;

export const motion = {
  fast: 120,    // micro-interactions (button press)
  base: 200,    // standard ease
  slow: 320,    // screen transitions
  ease: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
} as const;

export const tokens = { color, font, type, space, radius, shadow, motion } as const;
export type Tokens = typeof tokens;
