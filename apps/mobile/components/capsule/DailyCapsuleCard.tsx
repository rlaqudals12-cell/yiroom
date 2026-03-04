/**
 * DailyCapsuleCard — Daily Capsule Progressive Disclosure UI
 *
 * Level 0: 생성 전 → 원버튼 CTA
 * Level 1: 생성 후 → 요약 (완료율 + 총 CCS)
 * Level 2: 확장 → 아이템 리스트 (체크박스)
 *
 * @see docs/adr/ADR-073-one-button-daily.md
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from '../../lib/theme';
import { GlassCard } from '../ui/GlassCard';

import { CapsuleProgressBar } from './CapsuleProgressBar';

interface DailyItem {
  id: string;
  moduleCode: string;
  name: string;
  reason: string;
  isChecked: boolean;
}

interface DailyCapsuleCardProps {
  /** null이면 Level 0 (생성 전) */
  capsule: {
    id: string;
    items: DailyItem[];
    totalCcs: number;
    status: string;
  } | null;
  /** 완료율 (0-100) */
  completionRate: number;
  /** 생성 중 여부 */
  isGenerating?: boolean;
  /** 캡슐 생성 콜백 */
  onGenerate: () => void;
  /** 아이템 체크 콜백 */
  onCheckItem: (itemId: string, isChecked: boolean) => void;
  testID?: string;
}

// 모듈 코드 → 이모지 매핑
const MODULE_EMOJI: Record<string, string> = {
  skin: '💧',
  fashion: '👗',
  nutrition: '🥗',
  workout: '💪',
  hair: '💇',
  makeup: '💄',
  'personal-color': '🎨',
  oral: '🦷',
  body: '🧘',
};

export function DailyCapsuleCard({
  capsule,
  completionRate,
  isGenerating = false,
  onGenerate,
  onCheckItem,
  testID,
}: DailyCapsuleCardProps): React.JSX.Element {
  const { colors, brand, spacing, radii, typography, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);

  // Level 0: 캡슐 없음 → 생성 CTA
  if (!capsule) {
    return (
      <GlassCard testID={testID} shadowSize="lg" style={{ padding: spacing.lg }}>
        <Text
          style={{
            color: colors.foreground,
            fontSize: typography.size.lg,
            fontWeight: typography.weight.bold,
            marginBottom: spacing.xs,
          }}
        >
          오늘의 뷰티 캡슐
        </Text>
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: typography.size.sm,
            marginBottom: spacing.md,
            lineHeight: typography.size.sm * 1.5,
          }}
        >
          AI가 나에게 딱 맞는 오늘의 뷰티 루틴을 추천해 드려요
        </Text>
        <Pressable
          onPress={onGenerate}
          disabled={isGenerating}
          accessibilityRole="button"
          accessibilityLabel="오늘의 캡슐 만들기"
          style={{ borderRadius: radii.lg, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={[brand.primary, '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.ctaButton, { borderRadius: radii.lg }]}
          >
            {isGenerating ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={[styles.ctaText, { fontWeight: typography.weight.bold }]}>
                캡슐 만들기
              </Text>
            )}
          </LinearGradient>
        </Pressable>
      </GlassCard>
    );
  }

  // Level 1+2: 캡슐 존재
  return (
    <GlassCard testID={testID} shadowSize="lg" style={{ padding: spacing.lg }}>
      {/* 헤더 */}
      <Pressable
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        accessibilityLabel={expanded ? '캡슐 접기' : '캡슐 펼치기'}
      >
        <View style={styles.headerRow}>
          <Text
            style={{
              color: colors.foreground,
              fontSize: typography.size.lg,
              fontWeight: typography.weight.bold,
              flex: 1,
            }}
          >
            오늘의 뷰티 캡슐
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: typography.size.sm,
            }}
          >
            {expanded ? '접기 ▲' : '펼치기 ▼'}
          </Text>
        </View>

        {/* 요약: 진행률 + CCS */}
        <View style={[styles.summaryRow, { marginTop: spacing.sm }]}>
          <View style={{ flex: 1 }}>
            <CapsuleProgressBar
              current={capsule.items.filter((i) => i.isChecked).length}
              optimal={capsule.items.length}
              accentColor={brand.primary}
            />
          </View>
          <View
            style={[
              styles.ccsChip,
              {
                backgroundColor: isDark ? 'rgba(248,200,220,0.15)' : 'rgba(248,200,220,0.25)',
                borderRadius: radii.full,
              },
            ]}
          >
            <Text
              style={{
                color: brand.primary,
                fontSize: typography.size.xs,
                fontWeight: typography.weight.bold,
              }}
            >
              CCS {capsule.totalCcs}
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Level 2: 아이템 리스트 */}
      {expanded ? (
        <View style={[styles.itemList, { marginTop: spacing.md }]}>
          {capsule.items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onCheckItem(item.id, !item.isChecked)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.isChecked }}
              accessibilityLabel={`${item.name} ${item.isChecked ? '완료' : '미완료'}`}
              style={[
                styles.itemRow,
                {
                  backgroundColor: item.isChecked
                    ? (isDark ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)')
                    : 'transparent',
                  borderRadius: radii.md,
                  padding: spacing.sm,
                },
              ]}
            >
              {/* 체크 아이콘 */}
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: item.isChecked ? '#22C55E' : colors.border,
                    backgroundColor: item.isChecked ? '#22C55E' : 'transparent',
                    borderRadius: radii.sm,
                  },
                ]}
              >
                {item.isChecked ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : null}
              </View>

              {/* 모듈 이모지 + 이름 + 이유 */}
              <View style={styles.itemContent}>
                <View style={styles.itemTitleRow}>
                  <Text style={styles.moduleEmoji}>
                    {MODULE_EMOJI[item.moduleCode] ?? '✨'}
                  </Text>
                  <Text
                    style={[
                      styles.itemName,
                      {
                        color: colors.foreground,
                        fontSize: typography.size.sm,
                        fontWeight: typography.weight.medium,
                        textDecorationLine: item.isChecked ? 'line-through' : 'none',
                        opacity: item.isChecked ? 0.6 : 1,
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                </View>
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: typography.size.xs,
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {item.reason}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ccsChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ctaButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  itemList: {
    gap: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  itemContent: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moduleEmoji: {
    fontSize: 14,
  },
  itemName: {},
});
