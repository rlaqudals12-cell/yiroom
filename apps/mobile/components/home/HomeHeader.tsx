/**
 * HomeHeader — 인사말 + 사용자명
 */
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme';

interface HomeHeaderProps {
  userName: string;
  isLoaded: boolean;
}

// 시간대별 인사말
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '늦은 밤이에요';
  if (hour < 12) return '좋은 아침이에요';
  if (hour < 18) return '좋은 오후예요';
  return '좋은 저녁이에요';
}

export function HomeHeader({ userName, isLoaded }: HomeHeaderProps): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={[styles.header, { marginBottom: spacing.lg }]} testID="home-header">
      <Text
        style={{
          fontSize: typography.size.sm,
          color: colors.mutedForeground,
          marginBottom: 4,
        }}
      >
        {getGreeting()}
      </Text>
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
        }}
      >
        {isLoaded ? userName : '...'}님
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {},
});
