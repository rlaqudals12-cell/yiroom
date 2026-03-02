/**
 * AnalysisTimeline — 분석 이력 타임라인
 *
 * 사용자의 최근 분석 결과를 시간순으로 표시.
 * 각 분석 타입(퍼스널컬러/피부/체형)별 아이콘과 요약 포함.
 */
import { Palette, Droplets, Ruler, Clock } from 'lucide-react-native';
import { StyleSheet, Text, View, Pressable, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme , spacing } from '../../lib/theme';
import { TIMING } from '../../lib/animations';
import type { AnalysisSummary } from '../../hooks/useUserAnalyses';

interface TypeConfigEntry {
  label: string;
  // lucide-react-native 아이콘 컴포넌트
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
  moduleKey: 'personalColor' | 'skin' | 'body';
}

const TYPE_CONFIG: Record<string, TypeConfigEntry> = {
  'personal-color': { label: '퍼스널컬러', IconComponent: Palette, moduleKey: 'personalColor' },
  skin: { label: '피부 분석', IconComponent: Droplets, moduleKey: 'skin' },
  body: { label: '체형 분석', IconComponent: Ruler, moduleKey: 'body' },
};

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export interface AnalysisTimelineProps {
  analyses: AnalysisSummary[];
  onItemPress?: (analysis: AnalysisSummary) => void;
  style?: ViewStyle;
  testID?: string;
}

export function AnalysisTimeline({
  analyses,
  onItemPress,
  style,
  testID,
}: AnalysisTimelineProps): React.JSX.Element {
  const { colors, spacing, radii, typography, module: moduleColors, shadows } = useTheme();

  // 시간순 정렬 (최신 먼저)
  const sorted = [...analyses].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <Animated.View
      entering={FadeInUp.duration(TIMING.normal)}
      testID={testID}
      style={[
        styles.container,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          borderColor: colors.border,
          padding: spacing.md,
        },
        style,
      ]}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: colors.secondary }]}>
          <Clock size={18} color={colors.mutedForeground} />
        </View>
        <Text
          style={{
            flex: 1,
            marginLeft: spacing.sm,
            fontSize: typography.size.base,
            fontWeight: typography.weight.semibold,
            color: colors.foreground,
          }}
        >
          분석 이력
        </Text>
      </View>

      {/* 타임라인 항목 */}
      {sorted.length > 0 ? (
        <View style={{ marginTop: spacing.sm }}>
          {sorted.map((item, idx) => {
            const config = TYPE_CONFIG[item.type];
            if (!config) return null;
            const { IconComponent, moduleKey, label } = config;
            const moduleColor = moduleColors[moduleKey];
            const isLast = idx === sorted.length - 1;

            return (
              <Pressable
                key={item.id}
                onPress={() => onItemPress?.(item)}
                accessibilityLabel={`${label}: ${item.summary}`}
                style={({ pressed }) => [
                  styles.timelineItem,
                  { opacity: pressed && onItemPress ? 0.7 : 1 },
                ]}
              >
                {/* 타임라인 라인 + 도트 */}
                <View style={styles.timelineTrack}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: moduleColor.base, borderColor: moduleColor.light },
                    ]}
                  />
                  {!isLast && (
                    <View style={[styles.line, { backgroundColor: colors.border }]} />
                  )}
                </View>

                {/* 내용 */}
                <View style={[styles.timelineContent, { paddingBottom: isLast ? 0 : spacing.sm }]}>
                  <View style={styles.timelineRow}>
                    <IconComponent size={14} color={moduleColor.dark} />
                    <Text
                      style={{
                        marginLeft: 6,
                        fontSize: typography.size.sm,
                        fontWeight: typography.weight.semibold,
                        color: colors.foreground,
                      }}
                    >
                      {label}
                    </Text>
                    <Text
                      style={{
                        marginLeft: 'auto',
                        fontSize: typography.size.xs,
                        color: colors.mutedForeground,
                      }}
                    >
                      {formatRelativeDate(item.createdAt)}
                    </Text>
                  </View>
                  <Text
                    style={{
                      marginTop: spacing.xxs,
                      fontSize: typography.size.xs,
                      color: colors.mutedForeground,
                    }}
                  >
                    {item.summary}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={[styles.emptyState, { marginTop: spacing.sm }]}>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              textAlign: 'center',
            }}
          >
            아직 분석 기록이 없어요
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineTrack: {
    width: 20,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: spacing.xxs,
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: spacing.smx,
    alignItems: 'center',
  },
});
