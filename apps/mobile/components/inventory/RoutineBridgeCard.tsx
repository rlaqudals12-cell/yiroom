/**
 * 인벤토리-루틴 브릿지 카드 (React Native)
 *
 * @description 보유 제품 기반 스킨케어 루틴 완성도 시각화
 * @see apps/web/components/inventory/RoutineBridgeCard.tsx (웹 원본)
 */

import {
  Droplets,
  AlertCircle,
  CheckCircle2,
  ShoppingCart,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react-native';
import React, { memo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import type {
  RoutineInventoryResult,
  RoutineStepMatch,
  InventoryProduct,
} from '@/lib/inventory/routine-bridge';
import { useTheme, typography, spacing } from '@/lib/theme';

// ============================================
// 완성도 색상 결정
// ============================================

interface CoverageColors {
  text: string;
  bar: string;
}

function getCoverageColors(percent: number, status: Record<string, string>): CoverageColors {
  if (percent >= 100) return { text: status.success, bar: status.success };
  if (percent >= 80) return { text: '#3b82f6', bar: '#3b82f6' };
  if (percent >= 50) return { text: status.warning, bar: status.warning };
  return { text: status.error, bar: status.error };
}

// ============================================
// 루틴 완성도 바
// ============================================

function CoverageBar({ percent }: { percent: number }): React.JSX.Element {
  const { colors, radii, status } = useTheme();
  const coverageColors = getCoverageColors(percent, status);

  return (
    <View testID="coverage-bar">
      <View style={styles.coverageHeader}>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.semibold,
            color: colors.foreground,
          }}
        >
          루틴 완성도
        </Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: coverageColors.text,
          }}
        >
          {percent}%
        </Text>
      </View>
      {/* 프로그레스 바 */}
      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: colors.secondary,
            borderRadius: radii.full,
          },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(percent, 100)}%`,
              backgroundColor: coverageColors.bar,
              borderRadius: radii.full,
            },
          ]}
        />
      </View>
    </View>
  );
}

// ============================================
// 루틴 단계 아이템
// ============================================

function RoutineStepItem({ match }: { match: RoutineStepMatch }): React.JSX.Element {
  const { colors, radii, status } = useTheme();

  return (
    <View
      style={[
        styles.stepItem,
        {
          borderRadius: radii.xl,
          borderColor: match.isMissing ? colors.mutedForeground + '30' : colors.border,
          backgroundColor: match.isMissing ? colors.muted + '30' : colors.card,
          borderStyle: match.isMissing ? 'dashed' : 'solid',
          padding: spacing.sm,
        },
      ]}
      testID="routine-step-item"
    >
      {/* 상태 아이콘 */}
      <View style={styles.stepIcon}>
        {match.isMissing ? (
          <AlertCircle size={20} color={colors.mutedForeground + '50'} />
        ) : (
          <CheckCircle2 size={20} color={status.success} />
        )}
      </View>

      {/* 단계명 + 매칭 제품 */}
      <View style={styles.stepContent}>
        <View style={styles.stepLabelRow}>
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              color: match.isMissing ? colors.mutedForeground : colors.foreground,
            }}
          >
            {match.stepLabel}
          </Text>
          {match.isMissing && (
            <View
              style={[
                styles.badge,
                {
                  borderColor: colors.border,
                  borderRadius: radii.sm,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                }}
              >
                없음
              </Text>
            </View>
          )}
        </View>
        {match.matchedProducts.length > 0 && (
          <View style={[styles.productChipsRow, { marginTop: spacing.xxs }]}>
            {match.matchedProducts.map((product) => (
              <View
                key={product.id}
                style={[
                  styles.productChip,
                  {
                    backgroundColor: colors.secondary,
                    borderRadius: radii.sm,
                  },
                ]}
              >
                <Text style={{ fontSize: typography.size.xs, color: colors.foreground }}>
                  {product.name}
                  {product.remainingPercent !== undefined && product.remainingPercent < 20 && (
                    <Text style={{ color: status.error }}> ({product.remainingPercent}%)</Text>
                  )}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ============================================
// 누락 단계 알림
// ============================================

function MissingStepAlert({ messages }: { messages: string[] }): React.JSX.Element | null {
  const { radii, status } = useTheme();

  if (messages.length === 0) return null;

  return (
    <View
      style={[
        styles.alertBox,
        {
          backgroundColor: status.warning + '15',
          borderColor: status.warning + '40',
          borderRadius: radii.xl,
          padding: spacing.md,
        },
      ]}
      testID="missing-step-alert"
    >
      <View style={styles.alertHeader}>
        <AlertCircle size={16} color={status.warning} />
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: status.warning,
            marginLeft: spacing.xs,
          }}
        >
          루틴에 빈 자리가 있어요
        </Text>
      </View>
      {messages.map((msg, i) => (
        <View key={i} style={styles.alertItem}>
          <View style={[styles.alertDot, { backgroundColor: status.warning, marginTop: 6 }]} />
          <Text
            style={{
              fontSize: typography.size.sm,
              color: status.warning,
              marginLeft: spacing.xs,
              flex: 1,
            }}
          >
            {msg}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ============================================
// 재구매 필요 제품
// ============================================

function LowStockSection({ products }: { products: InventoryProduct[] }): React.JSX.Element | null {
  const { colors, radii, status } = useTheme();

  if (products.length === 0) return null;

  return (
    <View testID="low-stock-section">
      <View style={styles.sectionHeader}>
        <ShoppingCart size={16} color={colors.mutedForeground} />
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
            marginLeft: spacing.xs,
          }}
        >
          재구매 필요
        </Text>
      </View>
      {products.map((product) => (
        <View
          key={product.id}
          style={[
            styles.lowStockItem,
            {
              backgroundColor: status.error + '10',
              borderColor: status.error + '30',
              borderRadius: radii.lg,
              padding: spacing.sm,
              marginTop: spacing.xs,
            },
          ]}
        >
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {product.name}
          </Text>
          <View style={styles.lowStockBar}>
            {/* 잔여량 프로그레스 바 */}
            <View
              style={[
                styles.miniProgressTrack,
                {
                  backgroundColor: colors.muted,
                  borderRadius: radii.full,
                },
              ]}
            >
              <View
                style={[
                  styles.miniProgressFill,
                  {
                    width: `${product.remainingPercent ?? 0}%`,
                    backgroundColor: status.error,
                    borderRadius: radii.full,
                  },
                ]}
              />
            </View>
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
                color: status.error,
                width: 32,
                textAlign: 'right',
              }}
            >
              {product.remainingPercent ?? 0}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ============================================
// 시간대 토글
// ============================================

function TimeToggle({
  timeOfDay,
  onToggle,
}: {
  timeOfDay: 'morning' | 'evening';
  onToggle: (time: 'morning' | 'evening') => void;
}): React.JSX.Element {
  const { colors, radii, brand } = useTheme();

  return (
    <View style={styles.toggleRow}>
      <Pressable
        style={[
          styles.toggleButton,
          {
            backgroundColor: timeOfDay === 'morning' ? brand.primary : colors.card,
            borderColor: timeOfDay === 'morning' ? brand.primary : colors.border,
            borderRadius: radii.full,
          },
        ]}
        onPress={() => onToggle('morning')}
        accessibilityRole="tab"
        accessibilityState={{ selected: timeOfDay === 'morning' }}
        accessibilityLabel="아침 루틴"
      >
        <Sun
          size={14}
          color={timeOfDay === 'morning' ? colors.overlayForeground : colors.foreground}
        />
        <Text
          style={{
            fontSize: typography.size.xs,
            fontWeight: typography.weight.semibold,
            color: timeOfDay === 'morning' ? colors.overlayForeground : colors.foreground,
            marginLeft: 4,
          }}
        >
          아침
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.toggleButton,
          {
            backgroundColor: timeOfDay === 'evening' ? brand.primary : colors.card,
            borderColor: timeOfDay === 'evening' ? brand.primary : colors.border,
            borderRadius: radii.full,
            marginLeft: spacing.xs,
          },
        ]}
        onPress={() => onToggle('evening')}
        accessibilityRole="tab"
        accessibilityState={{ selected: timeOfDay === 'evening' }}
        accessibilityLabel="저녁 루틴"
      >
        <Moon
          size={14}
          color={timeOfDay === 'evening' ? colors.overlayForeground : colors.foreground}
        />
        <Text
          style={{
            fontSize: typography.size.xs,
            fontWeight: typography.weight.semibold,
            color: timeOfDay === 'evening' ? colors.overlayForeground : colors.foreground,
            marginLeft: 4,
          }}
        >
          저녁
        </Text>
      </Pressable>
    </View>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export interface RoutineBridgeCardProps {
  /** 루틴-인벤토리 연동 결과 */
  result: RoutineInventoryResult;
  /** 시간대 (아침/저녁) */
  timeOfDay?: 'morning' | 'evening';
  /** 루틴 완성도 요약 메시지 */
  summaryMessage?: string;
  /** 누락 단계 메시지 목록 */
  missingMessages?: string[];
  /** 시간대 변경 핸들러 */
  onTimeChange?: (time: 'morning' | 'evening') => void;
  /** "제품 추가하기" 클릭 핸들러 */
  onAddProduct?: () => void;
}

export const RoutineBridgeCard = memo(function RoutineBridgeCard({
  result,
  timeOfDay = 'morning',
  summaryMessage,
  missingMessages = [],
  onTimeChange,
  onAddProduct,
}: RoutineBridgeCardProps): React.JSX.Element {
  const { colors, radii, shadows, brand } = useTheme();

  // 내부 시간대 상태 (onTimeChange가 없으면 자체 관리)
  const [internalTime, setInternalTime] = useState(timeOfDay);
  const currentTime = onTimeChange ? timeOfDay : internalTime;

  const handleTimeToggle = useCallback(
    (time: 'morning' | 'evening') => {
      if (onTimeChange) {
        onTimeChange(time);
      } else {
        setInternalTime(time);
      }
    },
    [onTimeChange]
  );

  const timeLabel = currentTime === 'morning' ? '아침' : '저녁';

  return (
    <View
      style={[
        styles.card,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          borderColor: colors.border,
          padding: spacing.md,
        },
      ]}
      testID="routine-bridge-card"
    >
      {/* 헤더 */}
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Droplets size={20} color={brand.primary} />
          <Text
            style={{
              fontSize: typography.size.lg,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
              marginLeft: spacing.xs,
            }}
          >
            {timeLabel} 루틴 현황
          </Text>
        </View>
        {summaryMessage && (
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              marginTop: spacing.xxs,
            }}
          >
            {summaryMessage}
          </Text>
        )}
      </View>

      {/* 시간대 토글 */}
      <View style={{ marginTop: spacing.sm }}>
        <TimeToggle timeOfDay={currentTime} onToggle={handleTimeToggle} />
      </View>

      {/* 완성도 바 */}
      <View style={{ marginTop: spacing.md }}>
        <CoverageBar percent={result.coveragePercent} />
      </View>

      {/* 루틴 단계 리스트 */}
      <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
        {result.stepMatches.map((match) => (
          <RoutineStepItem key={match.step} match={match} />
        ))}
      </View>

      {/* 누락 단계 알림 */}
      {missingMessages.length > 0 && (
        <View style={{ marginTop: spacing.md }}>
          <MissingStepAlert messages={missingMessages} />
        </View>
      )}

      {/* 재구매 필요 제품 */}
      {result.lowStockProducts.length > 0 && (
        <View style={{ marginTop: spacing.md }}>
          <LowStockSection products={result.lowStockProducts} />
        </View>
      )}

      {/* 제품 추가 CTA */}
      {onAddProduct && result.missingSteps.length > 0 && (
        <Pressable
          style={[
            styles.ctaButton,
            {
              borderColor: colors.border,
              borderRadius: radii.xl,
              marginTop: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
          onPress={onAddProduct}
          testID="routine-add-product-cta"
          accessibilityRole="button"
          accessibilityLabel="부족한 제품 추가하기"
        >
          <ChevronRight size={16} color={colors.foreground} />
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
              marginLeft: spacing.xs,
            }}
          >
            부족한 제품 추가하기
          </Text>
        </Pressable>
      )}
    </View>
  );
});

export default RoutineBridgeCard;

// ============================================
// 스타일
// ============================================

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  cardHeader: {},
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressTrack: {
    height: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
  },
  stepIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  productChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  productChip: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  alertBox: {
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  alertDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  lowStockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  lowStockBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  miniProgressTrack: {
    width: 64,
    height: 8,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
  },
  ctaButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});
