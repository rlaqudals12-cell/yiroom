/**
 * 제품 상세 (사용기한, 성분 충돌 경고)
 */
import { useAuth } from '@clerk/clerk-expo';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { GlassCard, ScreenContainer } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { useTheme, typography, spacing, radii } from '@/lib/theme';

interface ShelfDetail {
  name: string;
  brand: string;
  category: string;
  status: string;
  expiresAt: string | null;
  ingredients: string[];
  conflicts: { ingredient: string; reason: string }[];
}

const STATUS_ACTIONS = [
  { id: 'stored', label: '보관중', emoji: '🗄️' },
  { id: 'in_use', label: '사용중', emoji: '✨' },
  { id: 'finished', label: '다 씀', emoji: '✅' },
];

export default function ShelfDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { userId } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [detail, setDetail] = useState<ShelfDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('stored');

  // Supabase에서 제품 상세 조회
  useEffect(() => {
    if (!userId || !id) return;
    const fetchDetail = async (): Promise<void> => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_inventory')
        .select('name, brand, category, status, expires_at, metadata')
        .eq('id', id)
        .eq('clerk_user_id', userId)
        .single();

      if (!error && data) {
        const meta = (data.metadata as Record<string, unknown>) ?? {};
        setDetail({
          name: data.name ?? '이름 없음',
          brand: data.brand ?? '',
          category: data.category ?? '스킨케어',
          status: data.status ?? 'stored',
          expiresAt: data.expires_at,
          ingredients: (meta.ingredients as string[]) ?? [],
          conflicts: (meta.conflicts as { ingredient: string; reason: string }[]) ?? [],
        });
        setStatus(data.status ?? 'stored');
      }
      setIsLoading(false);
    };
    fetchDetail();
  }, [userId, id, supabase]);

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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📦</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.base }}>
            제품을 찾을 수 없습니다
          </Text>
        </View>
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
          <Text style={[styles.brand, { color: colors.mutedForeground }]}>
            {detail.brand} · {detail.category}
          </Text>
        </GlassCard>
      </Animated.View>

      {/* 사용기한 */}
      <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
        <GlassCard shadowSize="md" style={{ ...styles.card }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>사용기한</Text>
          <Text style={[styles.expiryDate, { color: colors.foreground }]}>{detail.expiresAt}</Text>
        </GlassCard>
      </Animated.View>

      {/* 주요 성분 */}
      <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
        <GlassCard shadowSize="md" style={{ ...styles.card }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>주요 성분</Text>
          <View style={styles.ingredientList}>
            {detail.ingredients.map((ing, idx) => (
              <View key={idx} style={[styles.ingredientChip, { backgroundColor: colors.muted }]}>
                <Text style={[styles.ingredientText, { color: colors.foreground }]}>{ing}</Text>
              </View>
            ))}
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
              onPress={() => setStatus(action.id as 'stored' | 'in_use' | 'finished')}
            >
              <Text style={{ fontSize: 20 }}>{action.emoji}</Text>
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
