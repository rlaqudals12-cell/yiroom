/**
 * 캡슐 대시보드 — 전 도메인 캡슐 개요
 *
 * BeautyProfile 완성도 + Daily Capsule 위젯 + 도메인별 캡슐 상태.
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { DailyCapsuleCard } from '../../components/capsule/DailyCapsuleCard';
import { ScreenContainer, GlassCard, SectionHeader, ErrorState } from '../../components/ui';
import { staggeredEntry } from '../../lib/animations';
import { useDailyCapsule, useBeautyProfile } from '../../lib/capsule/hooks';
import { useTheme } from '../../lib/theme';

// 도메인 목록 (표시 순서)
const DOMAINS = [
  { id: 'skin', name: '스킨케어', emoji: '💧' },
  { id: 'fashion', name: '패션', emoji: '👗' },
  { id: 'nutrition', name: '영양', emoji: '🥗' },
  { id: 'workout', name: '운동', emoji: '💪' },
  { id: 'hair', name: '헤어', emoji: '💇' },
  { id: 'makeup', name: '메이크업', emoji: '💄' },
  { id: 'personal-color', name: '퍼스널컬러', emoji: '🎨' },
  { id: 'oral', name: '구강건강', emoji: '🦷' },
  { id: 'body', name: '바디케어', emoji: '🧘' },
] as const;

export default function CapsuleDashboardScreen(): React.JSX.Element {
  const { colors, brand, spacing, radii, typography, isDark, module: moduleColors } = useTheme();
  const daily = useDailyCapsule();
  const profile = useBeautyProfile();

  // 초기 데이터 로드
  useEffect(() => {
    daily.fetchToday();
  }, [daily.fetchToday]);

  const handleRefresh = useCallback(() => {
    daily.fetchToday();
    profile.refresh();
  }, [daily.fetchToday, profile.refresh]);

  // 프로필 완성도 (완료 모듈 / 전체 모듈)
  const completedCount = profile.profile?.completedModules.length ?? 0;
  const totalModules = 9;
  const profileLevel = profile.profile?.personalizationLevel ?? 0;

  return (
    <ScreenContainer
      backgroundGradient="beauty"
      refreshing={daily.isLoading || profile.isLoading}
      onRefresh={handleRefresh}
      testID="capsule-dashboard-screen"
    >
      {/* 프로필 완성도 헤더 */}
      <Animated.View entering={staggeredEntry(0)} style={[styles.profileSection, { marginTop: spacing.md }]}>
        <GlassCard shadowSize="md" style={{ padding: spacing.md }}>
          <View style={styles.profileHeader}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.bold,
                }}
              >
                뷰티 프로필
              </Text>
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: typography.size.xs,
                  marginTop: 2,
                }}
              >
                {completedCount}/{totalModules} 모듈 완료 · Lv.{profileLevel}
              </Text>
            </View>
            {/* 프로필 레벨 인디케이터 */}
            <View
              style={[
                styles.levelBadge,
                {
                  backgroundColor: `${brand.primary}20`,
                  borderRadius: radii.full,
                },
              ]}
            >
              <Text
                style={{
                  color: brand.primary,
                  fontSize: typography.size.lg,
                  fontWeight: typography.weight.bold,
                }}
              >
                Lv.{profileLevel}
              </Text>
            </View>
          </View>
          {/* 완성도 바 */}
          <View style={[styles.progressTrack, { backgroundColor: colors.muted, borderRadius: radii.full, marginTop: spacing.sm }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round((completedCount / totalModules) * 100)}%` as unknown as number,
                  backgroundColor: brand.primary,
                  borderRadius: radii.full,
                },
              ]}
            />
          </View>
        </GlassCard>
      </Animated.View>

      {/* Daily Capsule 위젯 */}
      <Animated.View entering={staggeredEntry(1)} style={{ marginTop: spacing.lg }}>
        <SectionHeader
          title="오늘의 캡슐"
          action={{
            label: '자세히',
            onPress: () => router.push('/(capsule)/daily'),
          }}
          style={{ marginBottom: spacing.sm }}
        />
        <DailyCapsuleCard
          capsule={daily.capsule}
          completionRate={daily.completionRate}
          isGenerating={daily.isGenerating}
          onGenerate={daily.generate}
          onCheckItem={daily.checkItem}
          testID="daily-capsule-widget"
        />
      </Animated.View>

      {/* 에러 표시 */}
      {daily.error ? (
        <Animated.View entering={staggeredEntry(2)} style={{ marginTop: spacing.sm }}>
          <ErrorState
            message={daily.error.message}
            onRetry={daily.fetchToday}
          />
        </Animated.View>
      ) : null}

      {/* 도메인별 캡슐 그리드 */}
      <Animated.View entering={staggeredEntry(2)} style={{ marginTop: spacing.lg }}>
        <SectionHeader
          title="도메인별 캡슐"
          subtitle="각 영역의 최적 조합을 관리해요"
          style={{ marginBottom: spacing.sm }}
        />
        <View style={styles.domainGrid}>
          {DOMAINS.map((domain) => {
            const isCompleted = profile.profile?.completedModules.includes(domain.id) ?? false;
            return (
              <Pressable
                key={domain.id}
                onPress={() => router.push(`/(capsule)/${domain.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`${domain.name} 캡슐`}
                style={[
                  styles.domainCard,
                  {
                    backgroundColor: colors.card,
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: isCompleted ? `${brand.primary}40` : colors.border,
                    padding: spacing.md,
                  },
                  !isDark
                    ? Platform.select({
                        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
                        android: { elevation: 1 },
                      }) ?? {}
                    : {},
                ]}
              >
                <Text style={styles.domainEmoji}>{domain.emoji}</Text>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.medium,
                    marginTop: 4,
                  }}
                >
                  {domain.name}
                </Text>
                {isCompleted ? (
                  <Text
                    style={{
                      color: '#22C55E',
                      fontSize: typography.size.xs,
                      marginTop: 2,
                    }}
                  >
                    활성
                  </Text>
                ) : (
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: typography.size.xs,
                      marginTop: 2,
                    }}
                  >
                    미완성
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* 갭 분석 바로가기 */}
      <Animated.View entering={staggeredEntry(3)} style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}>
        <Pressable
          onPress={() => router.push('/(capsule)/gap')}
          accessibilityRole="button"
          accessibilityLabel="갭 분석 보기"
          style={[
            styles.gapButton,
            {
              backgroundColor: isDark ? 'rgba(248,200,220,0.08)' : 'rgba(248,200,220,0.15)',
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: `${brand.primary}30`,
              padding: spacing.md,
            },
          ]}
        >
          <Text style={{ fontSize: 20 }}>🔍</Text>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text
              style={{
                color: colors.foreground,
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
              }}
            >
              갭 분석 · 쇼핑 컴패니언
            </Text>
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: typography.size.xs,
                marginTop: 2,
              }}
            >
              캡슐에서 부족한 아이템을 확인하세요
            </Text>
          </View>
          <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>→</Text>
        </Pressable>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  profileSection: {},
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  progressTrack: {
    height: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  domainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  domainCard: {
    width: '31%',
    alignItems: 'center',
    minWidth: 100,
  },
  domainEmoji: {
    fontSize: 24,
  },
  gapButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
