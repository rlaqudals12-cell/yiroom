/**
 * 물 섭취 위젯
 * 물 섭취량과 목표 진행률 표시
 */

import { View, Text, StyleSheet, useColorScheme, Pressable } from 'react-native';

interface WaterWidgetProps {
  current: number; // ml
  goal: number; // ml
  onAddWater?: (amount: number) => void;
  size?: 'small' | 'medium';
}

export function WaterWidget({
  current,
  goal,
  onAddWater,
  size = 'medium',
}: WaterWidgetProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const progress = Math.min((current / goal) * 100, 100);
  const remaining = Math.max(goal - current, 0);
  const glasses = Math.floor(current / 250); // 1잔 = 250ml

  // 물방울 애니메이션 레벨 (8단계)
  const getWaterLevel = () => {
    if (progress >= 100) return 8;
    return Math.floor(progress / 12.5);
  };

  const waterLevel = getWaterLevel();

  if (size === 'small') {
    return (
      <View style={[styles.containerSmall, isDark && styles.containerDark]}>
        <Text style={styles.waterIcon}>💧</Text>
        <Text style={[styles.currentSmall, isDark && styles.textLight]}>
          {(current / 1000).toFixed(1)}L
        </Text>
        <View style={styles.miniProgressBar}>
          <View
            style={[styles.miniProgressFill, { width: `${progress}%` }]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.containerMedium, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.textLight]}>
          💧 물 섭취
        </Text>
        <Text style={[styles.glasses, isDark && styles.textMuted]}>
          {glasses}잔 마심
        </Text>
      </View>

      <View style={styles.content}>
        {/* 물컵 시각화 */}
        <View style={styles.cupContainer}>
          <View style={[styles.cup, isDark && styles.cupDark]}>
            <View
              style={[
                styles.water,
                { height: `${progress}%` },
                progress >= 100 && styles.waterFull,
              ]}
            />
          </View>
        </View>

        {/* 수치 */}
        <View style={styles.stats}>
          <Text style={[styles.currentLarge, isDark && styles.textLight]}>
            {current}
            <Text style={styles.unit}>ml</Text>
          </Text>
          <Text style={[styles.goal, isDark && styles.textMuted]}>
            목표: {goal}ml
          </Text>
          {remaining > 0 && (
            <Text style={[styles.remaining, isDark && styles.textMuted]}>
              {remaining}ml 남음
            </Text>
          )}
        </View>

        {/* 빠른 추가 버튼 */}
        {onAddWater && (
          <View style={styles.quickAdd}>
            <Pressable
              style={[styles.addButton, isDark && styles.addButtonDark]}
              onPress={() => onAddWater(250)}
            >
              <Text style={styles.addButtonText}>+1잔</Text>
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
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
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
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  glasses: {
    fontSize: 13,
    color: '#666',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  cupContainer: {
    width: 50,
    height: 70,
  },
  cup: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#bae6fd',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  cupDark: {
    backgroundColor: '#1e3a5f',
    borderColor: '#3b82f6',
  },
  water: {
    backgroundColor: '#3b82f6',
    width: '100%',
  },
  waterFull: {
    backgroundColor: '#22c55e',
  },
  stats: {
    flex: 1,
  },
  currentLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  unit: {
    fontSize: 14,
    fontWeight: '400',
  },
  goal: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  remaining: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 4,
  },
  quickAdd: {
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonDark: {
    backgroundColor: '#2563eb',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  waterIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  currentSmall: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  miniProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
