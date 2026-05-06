import { View, Text } from 'react-native';
import { theme as t } from '../theme';

type Props = {
  label: string;
  bg?: string;
  fg?: string;
  bordered?: boolean;
};

export function Pill({ label, bg = t.colors.lemon, fg = t.colors.ink, bordered = true }: Props) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: bg,
        borderColor: t.colors.ink,
        borderWidth: bordered ? 1 : 0,
        borderRadius: t.radii.pill,
        paddingHorizontal: 10,
        paddingVertical: 3,
      }}
    >
      <Text
        style={{
          color: fg,
          fontSize: 10.5,
          fontFamily: t.fonts.bodySemiBold,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
