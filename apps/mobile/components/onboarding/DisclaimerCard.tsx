/**
 * DisclaimerCard — 면책조항 안내 카드
 *
 * 웹의 bg-amber-50 면책조항 패턴을 네이티브로 구현.
 * 건강 데이터 입력 전 법적 면책 안내 표시.
 */
import { AlertTriangle } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import { useTheme, typography, spacing, radii } from '@/lib/theme';

const WARNING_COLOR = '#F59E0B';

interface DisclaimerCardProps {
  message: string;
  title?: string;
  testID?: string;
}

export function DisclaimerCard({
  message,
  title = '서비스 이용 안내',
  testID = 'disclaimer-card',
}: DisclaimerCardProps): React.JSX.Element {
  const { isDark } = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? `${WARNING_COLOR}12` : '#FFFBEB',
          borderColor: isDark ? `${WARNING_COLOR}30` : '#FDE68A',
          borderRadius: radii.xl,
        },
      ]}
      accessibilityRole="alert"
    >
      <View style={styles.header}>
        <AlertTriangle size={16} color={isDark ? '#FBBF24' : '#D97706'} strokeWidth={2} />
        <Text style={[styles.title, { color: isDark ? '#FBBF24' : '#92400E' }]}>{title}</Text>
      </View>
      <Text style={[styles.message, { color: isDark ? '#FCD34D' : '#78350F' }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderWidth: 1,
    marginVertical: spacing.smx,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  message: {
    fontSize: typography.size.xs + 1,
    lineHeight: 18,
  },
});
