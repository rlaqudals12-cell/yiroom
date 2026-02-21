/**
 * MenuCard 공통 컴포넌트
 *
 * 아이콘 + 제목 + 설명 + 화살표 카드 패턴.
 * beauty/style/records 탭의 반복 패턴을 추출.
 */
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

interface MenuCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  onPress: () => void;
  testID?: string;
  style?: ViewStyle;
}

export function MenuCard({
  icon,
  iconBg,
  title,
  description,
  onPress,
  testID,
  style,
}: MenuCardProps): React.JSX.Element {
  const { colors, spacing, radii, shadows, typography } = useTheme();

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.xl,
          padding: spacing.md + 4,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: iconBg,
              width: 40,
              height: 40,
              borderRadius: 20,
            },
          ]}
        >
          {icon}
        </View>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              {
                color: colors.cardForeground,
                fontSize: typography.size.lg - 1,
                fontWeight: typography.weight.semibold,
              },
            ]}
          >
            {title}
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: typography.size.sm,
              lineHeight: typography.size.sm * typography.lineHeight.normal,
              marginTop: 2,
            }}
          >
            {description}
          </Text>
        </View>
        <ChevronRight size={20} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    lineHeight: 24,
  },
});
