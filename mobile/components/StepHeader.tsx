import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme as t } from '../theme';

type Props = {
  step?: string;
  showBack?: boolean;
  trailing?: { label: string; onPress: () => void };
};

export function StepHeader({ step, showBack = true, trailing }: Props) {
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
        marginBottom: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: t.colors.paper,
              ...t.border.medium,
              ...t.shadow.chunky,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18, fontFamily: t.fonts.bodyExtraBold, color: t.colors.ink, marginTop: -2 }}>
              ‹
            </Text>
          </Pressable>
        ) : null}
        {step ? (
          <Text style={{ fontSize: 14, fontFamily: t.fonts.bodySemiBold, color: t.colors.dim, marginLeft: 6 }}>
            {step}
          </Text>
        ) : null}
      </View>
      {trailing ? (
        <Pressable onPress={trailing.onPress} hitSlop={8}>
          <Text
            style={{
              fontSize: 14,
              fontFamily: t.fonts.bodyBold,
              color: t.colors.graphite,
              textDecorationLine: 'underline',
            }}
          >
            {trailing.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
