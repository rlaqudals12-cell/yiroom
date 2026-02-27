/**
 * AnalysisHistoryCard — 분석 이력 항목 카드
 *
 * 이력 목록에서 각 분석 결과를 표시하는 카드.
 * 모듈 아이콘, 날짜, 요약, 점수를 포함.
 */
import {
  Palette,
  Droplets,
  Ruler,
  Scissors,
  Sparkles,
  SmilePlus,
  PersonStanding,
} from 'lucide-react-native';
import { StyleSheet, Text, View, Pressable, type ViewStyle } from 'react-native';

import { useTheme, typography} from '../../lib/theme';
import type { AnalysisModuleType, AnalysisHistoryItem } from '../../hooks/useAnalysisHistory';

interface ModuleConfig {
  label: string;
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
  moduleKey: string;
}

const MODULE_CONFIG: Record<AnalysisModuleType, ModuleConfig> = {
  'personal-color': { label: '퍼스널컬러', IconComponent: Palette, moduleKey: 'personalColor' },
  skin: { label: '피부 분석', IconComponent: Droplets, moduleKey: 'skin' },
  body: { label: '체형 분석', IconComponent: Ruler, moduleKey: 'body' },
  hair: { label: '헤어 분석', IconComponent: Scissors, moduleKey: 'hair' },
  makeup: { label: '메이크업', IconComponent: Sparkles, moduleKey: 'makeup' },
  'oral-health': { label: '구강건강', IconComponent: SmilePlus, moduleKey: 'personalColor' },
  posture: { label: '자세 분석', IconComponent: PersonStanding, moduleKey: 'body' },
};

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const h = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${y}.${m}.${d} ${h}:${min}`;
}

export interface AnalysisHistoryCardProps {
  item: AnalysisHistoryItem;
  onPress?: (item: AnalysisHistoryItem) => void;
  style?: ViewStyle;
  testID?: string;
}

export function AnalysisHistoryCard({
  item,
  onPress,
  style,
  testID,
}: AnalysisHistoryCardProps): React.JSX.Element {
  const { colors, spacing, radii, typography, module: moduleColors, shadows } = useTheme();

  const config = MODULE_CONFIG[item.moduleType];
  const { IconComponent, label, moduleKey } = config;
  const moduleColor = moduleColors[moduleKey as keyof typeof moduleColors] || moduleColors.personalColor;

  return (
    <Pressable
      testID={testID}
      onPress={() => onPress?.(item)}
      accessibilityLabel={`${label}: ${item.summary}, ${formatDate(item.createdAt)}`}
      style={({ pressed }) => [
        styles.container,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          borderColor: colors.border,
          padding: spacing.md,
          opacity: pressed && onPress ? 0.7 : 1,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {/* 아이콘 */}
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: (moduleColor as { light?: string }).light || colors.secondary },
          ]}
        >
          <IconComponent
            size={20}
            color={(moduleColor as { dark?: string }).dark || colors.foreground}
          />
        </View>

        {/* 내용 */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
              }}
            >
              {label}
            </Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
              }}
            >
              {formatDate(item.createdAt)}
            </Text>
          </View>

          <View style={[styles.detailRow, { marginTop: spacing.xs }]}>
            <Text
              style={{
                flex: 1,
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
              }}
              numberOfLines={1}
            >
              {item.summary}
            </Text>

            {item.score !== undefined && item.score !== null && (
              <View
                style={[
                  styles.scoreBadge,
                  {
                    backgroundColor: (moduleColor as { base?: string }).base || colors.accent,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.semibold,
                    color: colors.card,
                  }}
                >
                  {item.score}점
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginLeft: 8,
  },
});
