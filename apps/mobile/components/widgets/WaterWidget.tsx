/**
 * 물 섭취 위젯
 * 물 섭취량과 목표 진행률 표시
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';

import { useTheme, typography, radii , spacing } from '../../lib/theme';

interface WaterWidgetProps {
  current: number; // ml
  goal: number; // ml
  onAddWater?: (amount: number) => void;
  size?: 'small' | 'medium';
}

export function WaterWidget({ current, goal, onAddWater, size = 'medium' }: WaterWidgetProps) {
  const { colors, status, typography } = useTheme();

  const progress = Math.min((current / goal) * 100, 100);
  const remaining = Math.max(goal - current, 0);
  const glasses = Math.floor(current / 250); // 1잔 = 250ml

  // 물방울 애니메이션 레벨 (8단계)
  const getWaterLevel = () => {
    if (progress >= 100) return 8;
    return Math.floor(progress / 12.5);
  };

  // 향후 물 애니메이션에 사용 예정
  const _waterLevel = getWaterLevel();

  if (size === 'small') {
    return (
      <View style={[styles.containerSmall, { backgroundColor: colors.card }]}>
        <Text style={styles.waterIcon}>💧</Text>
        <Text style={[styles.currentSmall, { color: colors.foreground }]}>
          {(current / 1000).toFixed(1)}L
        </Text>
        <View style={[styles.miniProgressBar, { backgroundColor: colors.muted }]}>
          <View style={[styles.miniProgressFill, { width: `${progress}%`, backgroundColor: status.info }]} />
        </View>
      </View>
    );
  }

  return (
    <View testID="water-widget" style={[styles.containerMedium, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>💧 물 섭취</Text>
        <Text style={[styles.glasses, { color: colors.mutedForeground }]}>{glasses}잔 마심</Text>
      </View>

      <View style={styles.content}>
        {/* 물컵 시각화 */}
        <View style={styles.cupContainer}>
          <View style={[styles.cup, { backgroundColor: status.info + '15', borderColor: status.info + '40' }]}>
            <View
              style={[
                styles.water,
                { height: `${progress}%`, backgroundColor: status.info },
                progress >= 100 && { backgroundColor: status.success },
              ]}
            />
          </View>
        </View>

        {/* 수치 */}
        <View style={styles.stats}>
          <Text style={[styles.currentLarge, { color: colors.foreground }]}>
            {current}
            <Text style={styles.unit}>ml</Text>
          </Text>
          <Text style={[styles.goal, { color: colors.mutedForeground }]}>목표: {goal}ml</Text>
          {remaining > 0 && (
            <Text style={[styles.remaining, { color: status.info }]}>{remaining}ml 남음</Text>
          )}
        </View>

        {/* 빠른 추가 버튼 */}
        {onAddWater && (
          <View style={styles.quickAdd}>
            <Pressable
              style={[styles.addButton, { backgroundColor: status.info }]}
              onPress={() => onAddWater(250)}
            >
              <Text style={[styles.addButtonText, { color: colors.card }]}>+1잔</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerSmall: {
    width: 155,
    height: 155,
    borderRadius: 22,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  containerMedium: {
    width: 329,
    height: 155,
    borderRadius: 22,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.smx,
  },
  title: {
    fontSize: 17,
    fontWeight: typography.weight.semibold,
  },
  glasses: {
    fontSize: 13,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  cupContainer: {
    width: 50,
    height: 70,
  },
  cup: {
    flex: 1,
    borderRadius: radii.md,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  water: {
    width: '100%',
  },
  stats: {
    flex: 1,
  },
  currentLarge: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  unit: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.normal,
  },
  goal: {
    fontSize: 13,
    marginTop: spacing.xxs,
  },
  remaining: {
    fontSize: typography.size.xs,
    marginTop: spacing.xs,
  },
  quickAdd: {
    justifyContent: 'center',
  },
  addButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.circle,
  },
  addButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  waterIcon: {
    fontSize: typography.size['4xl'],
    marginBottom: spacing.sm,
  },
  currentSmall: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  miniProgressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
