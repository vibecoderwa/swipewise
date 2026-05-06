// Design tokens — ported from project/mocks/system.jsx (the `T` object).
// Editorial palette. No gradients. Hard offset shadows. 1.5px ink borders.
// FRD §13.5: monochrome by default, accent colors are information.

export const theme = {
  colors: {
    ink:      '#1A1814',
    paper:    '#F7F2E9',
    cream:    '#EFE7D7',

    lemon:    '#D4B254',
    lemonDk:  '#A88A36',
    mint:     '#9CB49A',
    mintDk:   '#6B8A74',
    coral:    '#C26B5A',
    coralDk:  '#9A4F3F',
    sky:      '#8BA5B8',
    skyDk:    '#5A7A8E',
    plum:     '#8C7A9E',
    plumDk:   '#5F5070',

    smoke:    '#EDE7DA',
    haze:     '#D9D0BD',
    graphite: '#3A362F',
    dim:      '#8C8578',
    line:     '#2A261F',
    hairline: '#DCD4C1',

    amex:      '#AE8B3B',
    amexWash:  '#F0E8D3',
    chase:     '#2B4468',
    chaseWash: '#DCE2ED',
    savor:     '#7A3848',
    savorWash: '#EBDAE0',
  },
  fonts: {
    display: 'Fraunces_900Black',
    displayItalic: 'Fraunces_900Black_Italic',
    bodyRegular: 'InterTight_400Regular',
    bodyMedium:  'InterTight_500Medium',
    bodySemiBold: 'InterTight_600SemiBold',
    bodyBold:    'InterTight_700Bold',
    bodyExtraBold: 'InterTight_800ExtraBold',
    monoMedium:  'JetBrainsMono_500Medium',
    monoBold:    'JetBrainsMono_700Bold',
  },
  radii: {
    sm: 8, md: 12, lg: 14, xl: 18, pill: 9999,
  },
  // Signature shadow — hard, offset, no blur. RN translates via shadow* + elevation.
  shadow: {
    chunky:  { shadowColor: '#1A1814', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 0 },
    chunkier: { shadowColor: '#1A1814', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 0 },
    chunkiest: { shadowColor: '#1A1814', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 0 },
    soft:     { shadowColor: '#1A1814', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.85, shadowRadius: 0, elevation: 0 },
  },
  border: {
    thin:   { borderWidth: 1.5, borderColor: '#1A1814' },
    medium: { borderWidth: 2,   borderColor: '#1A1814' },
    bold:   { borderWidth: 2.5, borderColor: '#1A1814' },
  },
} as const;

export type Theme = typeof theme;
