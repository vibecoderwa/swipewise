import { Pressable, Text, ViewStyle, StyleProp } from 'react-native';
import { theme as t } from '../theme';

type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  bg?: string;
  fg?: string;
  size?: Size;
  fullWidth?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const PAD: Record<Size, { px: number; py: number }> = {
  sm: { px: 16, py: 10 },
  md: { px: 22, py: 14 },
  lg: { px: 28, py: 18 },
};
const FS: Record<Size, number> = { sm: 14, md: 16, lg: 18 };

export function ChunkyBtn({
  label,
  onPress,
  bg = t.colors.ink,
  fg = t.colors.paper,
  size = 'md',
  fullWidth,
  disabled,
  style,
}: Props) {
  const { px, py } = PAD[size];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          paddingHorizontal: px,
          paddingVertical: py,
          borderRadius: t.radii.md,
          ...t.border.thin,
          ...(pressed ? null : t.shadow.chunky),
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.55 : 1,
          transform: pressed ? [{ translateX: 1 }, { translateY: 1 }] : undefined,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: fg,
          fontSize: FS[size],
          fontFamily: t.fonts.bodySemiBold,
          letterSpacing: -0.2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
