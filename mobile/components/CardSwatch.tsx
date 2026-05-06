import { View } from 'react-native';
import { theme as t } from '../theme';

export type Issuer = 'amex' | 'chase' | 'savor';

const COLOR: Record<Issuer, string> = {
  amex:  t.colors.amex,
  chase: t.colors.chase,
  savor: t.colors.savor,
};

export function CardSwatch({ issuer, size = 28 }: { issuer: Issuer; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size * 0.65,
        borderRadius: 4,
        backgroundColor: COLOR[issuer],
        ...t.border.thin,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 2,
          right: 3,
          width: 6,
          height: 4,
          borderRadius: 1,
          backgroundColor: 'rgba(255,255,255,0.7)',
        }}
      />
    </View>
  );
}
