import { ReactNode } from 'react';
import { View, ScrollView, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme as t } from '../theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  bg?: string;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
};

export function Screen({ children, scroll, bg = t.colors.paper, contentStyle, footer }: Props) {
  const Body = (
    <View style={[{ flex: 1, paddingHorizontal: 24 }, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[{ paddingHorizontal: 24, paddingBottom: 24 }, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        Body
      )}
      {footer ? (
        <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 }}>{footer}</View>
      ) : null}
    </SafeAreaView>
  );
}
