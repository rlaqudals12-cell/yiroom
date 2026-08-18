/**
 * 제품 상세 (사용기한, 성분 충돌 경고)
 */
import { useAuth } from '@clerk/clerk-expo';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ErrorState, GlassCard, ScreenContainer } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import {
  getProductShelfItem,
  updateProductShelfItem,
  type ProductShelfItem,
  type ProductShelfStatus,
} from '@/lib/api/product-shelf';
import { useTheme, typography, spacing, radii } from '@/lib/theme';

interface ShelfDetail {
  name: string;
  brand: string;
  status: ProductShelfStatus;
  expiresAt?: string;
  ingredients: string[];
  conflicts: { ingredient: string; reason: string }[];
}

const STATUS_ACTIONS: { id: ProductShelfStatus; label: string }[] = [
  { id: 'owned', label: '보유중' },
  { id: 'wishlist', label: '관심' },
  { id: 'used_up', label: '다 씀' },
  { id: 'archived', label: '보관' },
];

function toShelfDetail(item: ProductShelfItem): ShelfDetail {
  const ingredientAnalysis = item.analysisResult?.ingredientAnalysis;
  const notes = [...(ingredientAnalysis?.caution ?? []), ...(ingredientAnalysis?.avoid ?? [])];
  const interactions = ingredientAnalysis?.interactions ?? [];

  return {
    name: item.productName || '이름 없음',
    brand: item.productBrand || '브랜드 미등록',
    status: item.status,
    expiresAt: item.expiresAt,
    ingredients: item.productIngredients.map(
      (ingredient) => ingredient.nameKo || ingredient.inciName
    ),
    conflicts: [
      ...notes.map((note) => ({ ingredient: note.ingredient, reason: note.note })),
      ...interactions.map((warning) => ({
        ingredient: `${warning.ingredient1} · ${warning.ingredient2}`,
        reason: warning.reason,
      })),
    ],
  };
}

function formatExpiry(value: string | undefined): string {
  if (!value) return '미등록';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '미등록' : date.toLocaleDateString('ko-KR');
}

export default function ShelfDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { getToken } = useAuth();
  const [detail, setDetail] = useState<ShelfDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ProductShelfStatus>('owned');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchDetail = useCallback(async (): Promise<void> => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('로그인이 필요합니다.');
      const item = await getProductShelfItem(id, token);
      const next = toShelfDetail(item);
      setDetail(next);
      setStatus(next.status);
    } catch (caught) {
      setDetail(null);
      setError(caught instanceof Error ? caught.message : '제품 정보를 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, id]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const handleStatusChange = useCallback(
    async (nextStatus: ProductShelfStatus): Promise<void> => {
      if (!id || nextStatus === status || isUpdating) return;
      setIsUpdating(true);
      try {
        const token = await getToken();
        if (!token) throw new Error('로그인이 필요합니다.');
        const updated = await updateProductShelfItem(id, { status: nextStatus }, token);
        setStatus(updated.status);
        setDetail((current) => (current ? { ...current, status: updated.status } : current));
      } catch {
        Alert.alert('저장 실패', '제품 상태를 바꾸지 못했어요. 잠시 후 다시 시도해주세요.');
      } finally {
        setIsUpdating(false);
      }
    },
    [getToken, id, isUpdating, status]
  );

  if (isLoading) {
    return (
      <ScreenContainer
        edges={['bottom']}
        contentPadding={20}
        testID="shelf-detail-screen"
        backgroundGradient="beauty"
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </ScreenContainer>
    );
  }

  if (!detail) {
    return (
      <ScreenContainer
        edges={['bottom']}
        contentPadding={20}
        testID="shelf-detail-screen"
        backgroundGradient="beauty"
      >
        <ErrorState
          message={error || '제품을 찾을 수 없어요.'}
          onRetry={() => void fetchDetail()}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={20}
      testID="shelf-detail-screen"
      backgroundGradient="beauty"
    >
      {/* 제품 헤더 */}
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <GlassCard shadowSize="md" style={{ ...styles.headerCard }}>
          <View style={[styles.iconCircle, { backgroundColor: colors.muted }]}>
            <Text style={{ fontSize: 36 }}>🧴</Text>
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>{detail.name}</Text>
          <Text style={[styles.brand, { color: colors.mutedForeground }]}>{detail.brand}</Text>
        </GlassCard>
      </Animated.View>

      {/* 사용기한 */}
      <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
        <GlassCard shadowSize="md" style={{ ...styles.card }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>사용기한</Text>
          <Text style={[styles.expiryDate, { color: colors.foreground }]}>
            {formatExpiry(detail.expiresAt)}
          </Text>
        </GlassCard>
      </Animated.View>

      {/* 주요 성분 */}
      <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
        <GlassCard shadowSize="md" style={{ ...styles.card }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>주요 성분</Text>
          <View style={styles.ingredientList}>
            {detail.ingredients.length > 0 ? (
              detail.ingredients.map((ing) => (
                <View key={ing} style={[styles.ingredientChip, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.ingredientText, { color: colors.foreground }]}>{ing}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.ingredientText, { color: colors.mutedForeground }]}>
                등록된 성분 정보가 없어요.
              </Text>
            )}
          </View>
        </GlassCard>
      </Animated.View>

      {/* 성분 충돌 경고 */}
      {detail.conflicts.length > 0 && (
        <Animated.View entering={FadeInUp.delay(300).duration(TIMING.normal)}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#450a0a' : '#FEF2F2',
                borderColor: isDark ? '#991b1b' : '#FCA5A5',
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
              ⚠️ 성분 주의
            </Text>
            {detail.conflicts.map((conflict, idx) => (
              <View key={idx} style={styles.conflictItem}>
                <Text
                  style={[styles.conflictIngredient, { color: isDark ? '#FCA5A5' : '#DC2626' }]}
                >
                  {conflict.ingredient}
                </Text>
                <Text style={[styles.conflictReason, { color: isDark ? '#FECACA' : '#7F1D1D' }]}>
                  {conflict.reason}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* 상태 변경 */}
      <Animated.View entering={FadeInUp.delay(400).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>상태 변경</Text>
        <View style={styles.actionRow}>
          {STATUS_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              style={[
                styles.actionButton,
                {
                  backgroundColor: status === action.id ? colors.foreground : colors.card,
                  borderColor: colors.border,
                  borderWidth: status === action.id ? 0 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: status === action.id, disabled: isUpdating }}
              disabled={isUpdating}
              onPress={() => void handleStatusChange(action.id)}
            >
              <Text
                style={[
                  styles.actionLabel,
                  { color: status === action.id ? colors.background : colors.foreground },
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radii.xl,
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  brand: {
    fontSize: typography.size.sm,
  },
  card: {
    padding: spacing.mlg,
    borderRadius: radii.xl,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.smx,
  },
  expiryDate: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  ingredientList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  ingredientChip: {
    paddingHorizontal: spacing.smx,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
  },
  ingredientText: {
    fontSize: typography.size.sm,
  },
  conflictItem: {
    marginBottom: spacing.sm,
  },
  conflictIngredient: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  conflictReason: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.smx,
    marginTop: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    gap: spacing.xxs,
  },
  actionLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
});
