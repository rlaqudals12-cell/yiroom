/**
 * 도메인별 캡슐 상세 화면
 *
 * 선택한 도메인의 캡슐 아이템, CCS, 로테이션 상태 표시.
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useAuth } from '@clerk/clerk-expo';

import { DomainCapsuleList } from '../../components/capsule/DomainCapsuleList';
import { CapsuleProgressBar } from '../../components/capsule/CapsuleProgressBar';
import { ScreenContainer, GlassCard, SectionHeader, ErrorState } from '../../components/ui';
import { staggeredEntry } from '../../lib/animations';
import { getDomainCapsule, rotateCapsule } from '../../lib/capsule/api';
import type { CapsuleOverview, ApiError } from '../../lib/capsule/api';
import { useTheme } from '../../lib/theme';

// 도메인 메타 정보
const DOMAIN_META: Record<string, { name: string; emoji: string; colorKey: string }> = {
  skin: { name: '스킨케어', emoji: '💧', colorKey: 'skin' },
  fashion: { name: '패션', emoji: '👗', colorKey: 'personalColor' },
  nutrition: { name: '영양', emoji: '🥗', colorKey: 'nutrition' },
  workout: { name: '운동', emoji: '💪', colorKey: 'workout' },
  hair: { name: '헤어', emoji: '💇', colorKey: 'hair' },
  makeup: { name: '메이크업', emoji: '💄', colorKey: 'makeup' },
  'personal-color': { name: '퍼스널컬러', emoji: '🎨', colorKey: 'personalColor' },
  oral: { name: '구강건강', emoji: '🦷', colorKey: 'oralHealth' },
  body: { name: '바디케어', emoji: '🧘', colorKey: 'body' },
};

export default function DomainCapsuleScreen(): React.JSX.Element {
  const { domain } = useLocalSearchParams<{ domain: string }>();
  const { getToken } = useAuth();
  const { colors, brand, spacing, radii, typography, isDark, module: moduleColors } = useTheme();

  const [overview, setOverview] = useState<CapsuleOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRotating, setIsRotating] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const meta = DOMAIN_META[domain ?? ''] ?? { name: domain ?? '', emoji: '✨', colorKey: 'skin' };

  const fetchData = useCallback(async () => {
    if (!domain) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken({ template: 'supabase' });
      const result = await getDomainCapsule(domain, token ?? '');
      if (result.error) {
        setError(result.error);
      } else {
        setOverview(result.data);
      }
    } catch {
      setError({ code: 'UNKNOWN_ERROR', message: '캡슐 정보를 불러올 수 없습니다.' });
    } finally {
      setIsLoading(false);
    }
  }, [domain, getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRotate = useCallback(async () => {
    if (!domain) return;
    setIsRotating(true);
    try {
      const token = await getToken({ template: 'supabase' });
      const result = await rotateCapsule(domain, token ?? '', 'user-requested');
      if (result.error) {
        setError(result.error);
      } else {
        // 로테이션 후 새로고침
        await fetchData();
      }
    } catch {
      setError({ code: 'UNKNOWN_ERROR', message: '로테이션에 실패했습니다.' });
    } finally {
      setIsRotating(false);
    }
  }, [domain, getToken, fetchData]);

  return (
    <ScreenContainer
      backgroundGradient="beauty"
      refreshing={isLoading}
      onRefresh={fetchData}
      testID="domain-capsule-screen"
    >
      {/* 도메인 헤더 */}
      <Animated.View entering={staggeredEntry(0)} style={{ marginTop: spacing.md }}>
        <GlassCard shadowSize="lg" style={{ padding: spacing.lg }}>
          <View style={styles.domainHeader}>
            <Text style={styles.domainEmoji}>{meta.emoji}</Text>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.size.xl,
                  fontWeight: typography.weight.bold,
                }}
              >
                {meta.name} 캡슐
              </Text>
              {overview ? (
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: typography.size.sm,
                    marginTop: 2,
                  }}
                >
                  {overview.itemCount}/{overview.optimalN} 아이템 · CCS {overview.ccs}
                </Text>
              ) : null}
            </View>
          </View>

          {overview ? (
            <View style={{ marginTop: spacing.md }}>
              <CapsuleProgressBar
                current={overview.itemCount}
                optimal={overview.optimalN}
              />
            </View>
          ) : null}
        </GlassCard>
      </Animated.View>

      {error ? (
        <Animated.View entering={staggeredEntry(1)} style={{ marginTop: spacing.sm }}>
          <ErrorState message={error.message} onRetry={fetchData} />
        </Animated.View>
      ) : null}

      {/* 로딩 */}
      {isLoading && !overview ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={brand.primary} size="large" />
        </View>
      ) : null}

      {/* 캡슐 상세 정보 */}
      {overview ? (
        <>
          {/* CCS 등급 상세 */}
          <Animated.View entering={staggeredEntry(1)} style={{ marginTop: spacing.lg }}>
            <SectionHeader
              title="호환도 분석"
              style={{ marginBottom: spacing.sm }}
            />
            <GlassCard shadowSize="md" style={{ padding: spacing.md }}>
              <View style={styles.ccsDetailRow}>
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: typography.size.sm,
                  }}
                >
                  도메인 내 호환도
                </Text>
                <Text
                  style={{
                    color: overview.ccs >= 70 ? '#22C55E' : '#F59E0B',
                    fontSize: typography.size.base,
                    fontWeight: typography.weight.bold,
                  }}
                >
                  {overview.ccs}점
                </Text>
              </View>
              <View style={[styles.ccsDetailRow, { marginTop: spacing.xs }]}>
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: typography.size.sm,
                  }}
                >
                  상태
                </Text>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.medium,
                  }}
                >
                  {overview.status === 'optimal' ? '최적' : overview.status === 'active' ? '활성' : '구성 중'}
                </Text>
              </View>
            </GlassCard>
          </Animated.View>

          {/* 로테이션 버튼 */}
          <Animated.View entering={staggeredEntry(2)} style={{ marginTop: spacing.lg }}>
            <Pressable
              onPress={handleRotate}
              disabled={isRotating}
              accessibilityRole="button"
              accessibilityLabel="캡슐 로테이션"
              style={[
                styles.rotateButton,
                {
                  backgroundColor: isDark ? 'rgba(248,200,220,0.08)' : 'rgba(248,200,220,0.15)',
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: `${brand.primary}30`,
                  padding: spacing.md,
                },
              ]}
            >
              {isRotating ? (
                <ActivityIndicator color={brand.primary} size="small" />
              ) : (
                <Text style={{ fontSize: 18 }}>🔄</Text>
              )}
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.semibold,
                  }}
                >
                  캡슐 새로고침
                </Text>
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: typography.size.xs,
                    marginTop: 2,
                  }}
                >
                  낮은 호환도 아이템을 교체해요
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  domainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  domainEmoji: {
    fontSize: 36,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  ccsDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rotateButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
