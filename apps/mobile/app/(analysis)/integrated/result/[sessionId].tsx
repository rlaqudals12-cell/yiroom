/**
 * 통합 분석 결과 페이지 (모바일)
 *
 * @route /(analysis)/integrated/result/[sessionId]
 * @see docs/adr/ADR-102-mobile-integrated-porting.md §5.5
 * @see docs/specs/SDD-MOBILE-INTEGRATED.md §5
 *
 * Phase D (초기): 입력 페이지에서 payload 쿼리로 결과를 받아 표시.
 * Phase E (재방문 지원): payload 없으면 Supabase에서 sessionId 기반 조회 (RLS 적용).
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';

import { GlassCard, ScreenContainer } from '@/components/ui';
import { useTheme, typography, radii, spacing } from '@/lib/theme';
import { useIntegratedSession } from '@/hooks/useIntegratedSession';
import { useHasClosetItems } from '@/hooks/useHasClosetItems';
import type {
  IntegratedAnalysisResult,
  AxisCode,
  AxisData,
  AxisResult,
  PersonaProfile,
} from '@/lib/api';
import {
  composeActionPlan,
  getHorizonLabel,
  type ActionItem,
  type ActionPlan,
} from '@/lib/integrated/action-plan';
import { composeCrossInsights, type CrossInsights } from '@/lib/integrated/cross-insights';
import { composeCuration, type Curation, type CurationItem } from '@/lib/integrated/curation';
import { ALL_STEPS } from '@/lib/integrated/next-steps';

// ============================================
// 축 라벨 매핑 (UI 표시용)
// ============================================

const AXIS_LABELS: Record<AxisCode, string> = {
  personal_color: '퍼스널컬러',
  skin: '피부',
  body: '체형',
  hair: '헤어',
  makeup: '메이크업',
};

// ============================================
// 메인 화면
// ============================================

export default function IntegratedResultScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const { sessionId, payload } = useLocalSearchParams<{
    sessionId: string;
    payload?: string;
  }>();

  // POST 직후: payload 쿼리 → 즉시 표시 (네트워크 호출 생략)
  // 재방문/북마크: payload 없음 → Supabase 조회
  const initialResult = useMemo<IntegratedAnalysisResult | null>(() => {
    if (!payload || typeof payload !== 'string') return null;
    try {
      return JSON.parse(decodeURIComponent(payload)) as IntegratedAnalysisResult;
    } catch {
      return null;
    }
  }, [payload]);

  const { result, isLoading, error } = useIntegratedSession(
    typeof sessionId === 'string' ? sessionId : null,
    initialResult
  );

  // 왜: outfit 카드를 옷장 상태에 맞게 우회시키기 위해 비동기 조회
  const hasClosetItems = useHasClosetItems();

  // 로딩 중 (재방문 경로 한정)
  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#EC4899" />
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            결과를 불러오는 중...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // 세션을 찾을 수 없음 (RLS로 권한 없거나 삭제된 경우)
  if (!result) {
    const message = error !== null ? '결과를 불러오지 못했어요.' : '세션을 찾을 수 없어요';
    return (
      <ScreenContainer>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{message}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            새로 분석을 시작해주세요.
          </Text>
          <Pressable
            onPress={() => router.replace('/(analysis)/integrated' as never)}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>다시 시작</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>YIROOM INTELLIGENCE</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>내 정체성 5축 결과</Text>
          <Text style={[styles.sessionLabel, { color: colors.mutedForeground }]}>
            세션 {String(sessionId ?? '').slice(0, 8)}
          </Text>
        </View>

        {/* Partial Success 배너 */}
        {result.status === 'partial' && (
          <PartialSuccessBanner
            axesCompleted={result.axesCompleted}
            axesFailed={result.axesFailed}
          />
        )}

        {/* ADR-104 체크리스트 #1: 나 프로필 내러티브 */}
        <PersonaNarrativeCard persona={result.persona} />

        {/* ADR-104 체크리스트 #2: 다음 행동 3단계 */}
        <ActionPlanSection plan={composeActionPlan(result.axes)} />

        {/* ADR-104 체크리스트 #4: 축 조합 인사이트 */}
        <CrossInsightsSection insights={composeCrossInsights(result.axes)} />

        {/* ADR-104 체크리스트 #5: 통합 큐레이션 (제품 세트) */}
        <CurationSection
          curation={composeCuration(result.axes, result.sessionId, { hasClosetItems })}
        />

        {/* 5축 요약 카드 */}
        <AxesSummaryCard axes={result.axes} />

        {/* 다음 단계 */}
        <NextStepsLinks axesCompleted={result.axesCompleted} />

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          분석 결과는 AI가 생성한 참고 정보이며, 의학적 진단을 대체하지 않아요.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

// ============================================
// 5축 요약 카드
// ============================================

interface AxesSummaryCardProps {
  axes: IntegratedAnalysisResult['axes'];
}

function axisDataOrNull<T>(r: AxisResult<T>): T | null {
  return r.success ? r.data : null;
}

function AxesSummaryCard({ axes }: AxesSummaryCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const rows: Array<{ code: AxisCode; label: string; summary: string }> = [
    {
      code: 'personal_color',
      label: AXIS_LABELS.personal_color,
      summary: pcSummary(axisDataOrNull(axes.personalColor)),
    },
    {
      code: 'skin',
      label: AXIS_LABELS.skin,
      summary: skinSummary(axisDataOrNull(axes.skin)),
    },
    {
      code: 'body',
      label: AXIS_LABELS.body,
      summary: bodySummary(axisDataOrNull(axes.body)),
    },
    {
      code: 'hair',
      label: AXIS_LABELS.hair,
      summary: hairSummary(axisDataOrNull(axes.hair)),
    },
    {
      code: 'makeup',
      label: AXIS_LABELS.makeup,
      summary: makeupSummary(axisDataOrNull(axes.makeup)),
    },
  ];

  return (
    <GlassCard style={styles.summaryCard}>
      <Text style={[styles.summaryHeader, { color: colors.mutedForeground }]}>내 정체성 5축</Text>
      {rows.map((row) => (
        <View key={row.code} style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>{row.summary}</Text>
        </View>
      ))}
    </GlassCard>
  );
}

function pcSummary(data: AxisData | null): string {
  if (!data) return '분석 미완료';
  const season = String(data.season ?? '-');
  const undertone = String(data.undertone ?? '-');
  return `${season} / ${undertone}`;
}

function skinSummary(data: AxisData | null): string {
  if (!data) return '분석 미완료';
  const type = String(data.skinType ?? '-');
  const score = Number(data.overallScore ?? 0);
  return `${type} · ${score}점`;
}

function bodySummary(data: AxisData | null): string {
  if (!data) return '분석 미완료';
  return String(data.bodyType ?? '-');
}

function hairSummary(data: AxisData | null): string {
  if (!data) return '분석 미완료';
  return `${String(data.faceShape ?? '-')}형`;
}

function makeupSummary(data: AxisData | null): string {
  if (!data) return '분석 미완료';
  return String(data.baseRecommendation ?? '추천 있음').slice(0, 28);
}

// ============================================
// Partial Success 배너
// ============================================

// ============================================
// 통합 큐레이션 섹션 (ADR-104 체크리스트 #5)
// ============================================

interface CurationSectionProps {
  curation: Curation;
}

const CATEGORY_ACCENT: Record<CurationItem['category'], string> = {
  lip: '#F472B6',
  base: '#EC4899',
  skincare: '#38BDF8',
  outfit: '#A78BFA',
  hair: '#FBBF24',
};

function CurationSection({ curation }: CurationSectionProps): React.JSX.Element | null {
  const { colors } = useTheme();
  if (curation.items.length === 0) return null;

  return (
    <View style={styles.curationWrap} testID="curation-section">
      <Text style={styles.curationLabel}>✨ 당신을 위한 세트</Text>
      <Text style={[styles.curationTitle, { color: colors.foreground }]}>
        5축 프로필에 맞춰 골랐어요
      </Text>
      <Text style={[styles.curationSubtitle, { color: colors.mutedForeground }]}>
        축들을 종합해 지금 바로 시도할 수 있는 것부터 순서대로
      </Text>

      {curation.items.map((item) => {
        const accent = CATEGORY_ACCENT[item.category];
        return (
          <Pressable
            key={`${item.category}-${item.title}`}
            onPress={() => router.push(item.href as never)}
            style={[styles.curationItem, { borderColor: colors.border }]}
            testID={`curation-item-${item.category}`}
          >
            <View
              style={[
                styles.curationBullet,
                { backgroundColor: `${accent}22`, borderColor: `${accent}4D` },
              ]}
            />
            <View style={styles.curationItemContent}>
              <Text style={[styles.curationItemTitle, { color: colors.foreground }]}>
                {item.title}
              </Text>
              <Text style={[styles.curationItemReason, { color: colors.mutedForeground }]}>
                {item.reason}
              </Text>
            </View>
            <Text style={[styles.curationItemCta, { color: accent }]}>{item.cta} ›</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ============================================
// 축 조합 인사이트 섹션 (ADR-104 체크리스트 #4)
// ============================================

interface CrossInsightsSectionProps {
  insights: CrossInsights;
}

const COMBO_ACCENT: Record<string, string> = {
  pc_s: '#F472B6',
  pc_m: '#FB7185',
  c_h: '#60A5FA',
  s_m: '#FBBF24',
  pc_c: '#A78BFA',
};

function CrossInsightsSection({ insights }: CrossInsightsSectionProps): React.JSX.Element | null {
  const { colors } = useTheme();
  if (insights.items.length === 0) return null;

  return (
    <View style={styles.crossWrap} testID="cross-insights-section">
      <Text style={[styles.crossHeader, { color: colors.mutedForeground }]}>축이 대화해요</Text>
      {insights.items.map((item) => {
        const accent = COMBO_ACCENT[item.id] ?? colors.mutedForeground;
        return (
          <View
            key={item.id}
            style={[
              styles.crossItem,
              {
                borderColor: `${accent}4D`, // 30% alpha
                backgroundColor: `${accent}14`, // 8% alpha
              },
            ]}
            testID={`cross-insight-${item.id}`}
          >
            <Text style={[styles.crossCombo, { color: accent }]}>{item.combo}</Text>
            <Text style={[styles.crossTitle, { color: colors.foreground }]}>{item.title}</Text>
            <Text style={[styles.crossBody, { color: colors.mutedForeground }]}>{item.body}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ============================================
// 액션 플랜 섹션 (ADR-104 체크리스트 #2)
// ============================================

interface ActionPlanSectionProps {
  plan: ActionPlan;
}

function ActionPlanSection({ plan }: ActionPlanSectionProps): React.JSX.Element | null {
  const { colors } = useTheme();
  if (plan.items.length === 0) return null;

  const horizonColor: Record<ActionItem['horizon'], string> = {
    now: '#F472B6',
    this_week: '#A78BFA',
    this_month: '#60A5FA',
  };

  return (
    <View style={styles.actionPlanWrap} testID="action-plan-section">
      <Text style={[styles.actionPlanHeader, { color: colors.mutedForeground }]}>다음 행동</Text>
      {plan.items.map((item) => (
        <View
          key={`${item.horizon}-${item.axis}`}
          style={[
            styles.actionItem,
            {
              borderColor: horizonColor[item.horizon],
              backgroundColor: `${horizonColor[item.horizon]}14`,
            },
          ]}
          testID={`action-item-${item.horizon}`}
        >
          <Text style={[styles.actionHorizon, { color: horizonColor[item.horizon] }]}>
            {getHorizonLabel(item.horizon)}
          </Text>
          <Text style={[styles.actionTitle, { color: colors.foreground }]}>{item.title}</Text>
          <Text style={[styles.actionWhy, { color: colors.mutedForeground }]}>{item.why}</Text>
        </View>
      ))}
    </View>
  );
}

// ============================================
// 나 프로필 내러티브 카드 (ADR-104 체크리스트 #1)
// ============================================

interface PersonaNarrativeCardProps {
  persona: PersonaProfile | null;
}

function PersonaNarrativeCard({ persona }: PersonaNarrativeCardProps): React.JSX.Element | null {
  const { colors } = useTheme();
  if (!persona) return null;

  return (
    <View style={styles.personaCard} testID="persona-narrative-card">
      <Text style={styles.personaLabel}>✨ 나 프로필</Text>
      <Text style={[styles.personaOneLine, { color: colors.foreground }]}>{persona.oneLine}</Text>
      <Text style={[styles.personaNarrative, { color: colors.mutedForeground }]}>
        {persona.narrative}
      </Text>
      {persona.keyInsights.length > 0 && (
        <View style={styles.personaInsights}>
          {persona.keyInsights.map((insight) => (
            <View key={insight} style={styles.personaInsightRow}>
              <Text style={styles.personaBullet}>·</Text>
              <Text style={[styles.personaInsightText, { color: colors.mutedForeground }]}>
                {insight}
              </Text>
            </View>
          ))}
        </View>
      )}
      {persona.usedFallback && (
        <Text style={[styles.personaFallback, { color: colors.mutedForeground }]}>
          ⓘ AI 합성 대신 요약으로 생성된 프로필이에요.
        </Text>
      )}
    </View>
  );
}

// ============================================
// Partial Success 배너
// ============================================

interface PartialSuccessBannerProps {
  axesCompleted: AxisCode[];
  axesFailed: AxisCode[];
}

function PartialSuccessBanner({
  axesCompleted,
  axesFailed,
}: PartialSuccessBannerProps): React.JSX.Element | null {
  if (axesFailed.length === 0) return null;

  const completedLabels = axesCompleted.map((c) => AXIS_LABELS[c]).join(', ');
  const failedLabels = axesFailed.map((c) => AXIS_LABELS[c]).join(', ');

  return (
    <View style={styles.partialBanner}>
      <Text style={styles.partialBannerTitle}>일부 분석이 완료되지 않았어요</Text>
      {completedLabels && (
        <Text style={styles.partialBannerBody}>
          <Text style={styles.partialBannerKey}>성공: </Text>
          {completedLabels}
        </Text>
      )}
      <Text style={styles.partialBannerBody}>
        <Text style={styles.partialBannerKey}>미완료: </Text>
        {failedLabels}
      </Text>
      <Pressable
        onPress={() => router.replace('/(analysis)/integrated' as never)}
        style={styles.partialRetryButton}
      >
        <Text style={styles.partialRetryText}>다시 시도</Text>
      </Pressable>
    </View>
  );
}

// ============================================
// 다음 단계 링크
// ============================================

interface NextStepsLinksProps {
  axesCompleted: AxisCode[];
}

function NextStepsLinks({ axesCompleted }: NextStepsLinksProps): React.JSX.Element | null {
  const { colors } = useTheme();
  const completedSet = new Set<AxisCode>(axesCompleted);
  const steps = ALL_STEPS.filter((s) => completedSet.has(s.axis));
  if (steps.length === 0) return null;

  return (
    <View style={styles.nextStepsWrap}>
      <Text style={[styles.nextStepsHeader, { color: colors.mutedForeground }]}>다음 단계</Text>
      {steps.map((step) => (
        <Pressable
          key={step.axis}
          onPress={() => router.push(step.href as never)}
          style={[styles.nextStepItem, { borderColor: colors.border }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.nextStepLabel, { color: colors.foreground }]}>{step.label}</Text>
            <Text style={[styles.nextStepDesc, { color: colors.mutedForeground }]}>
              {step.description}
            </Text>
          </View>
          <Text style={[styles.nextStepArrow, { color: colors.mutedForeground }]}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ============================================
// 스타일
// ============================================

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: '800',
  },
  sessionLabel: {
    fontSize: typography.size.xs,
  },
  summaryCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryHeader: {
    fontSize: typography.size.xs,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    gap: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.size.sm,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  // ADR-104 #5 통합 큐레이션 스타일
  curationWrap: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.3)',
    backgroundColor: 'rgba(236,72,153,0.08)',
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  curationLabel: {
    color: '#EC4899',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  curationTitle: {
    fontSize: typography.size.lg,
    fontWeight: '800',
  },
  curationSubtitle: {
    fontSize: typography.size.xs,
    marginBottom: spacing.xs,
  },
  curationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  curationBullet: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    borderWidth: 1,
  },
  curationItemContent: {
    flex: 1,
    gap: 2,
  },
  curationItemTitle: {
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
  curationItemReason: {
    fontSize: typography.size.xs,
  },
  curationItemCta: {
    fontSize: typography.size.xs,
    fontWeight: '700',
  },
  // ADR-104 #4 축 조합 인사이트 스타일
  crossWrap: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  crossHeader: {
    fontSize: typography.size.xs,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  crossItem: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 4,
  },
  crossCombo: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  crossTitle: {
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
  crossBody: {
    fontSize: typography.size.xs,
    lineHeight: typography.size.xs * 1.5,
  },
  // ADR-104 #2 액션 플랜 스타일
  actionPlanWrap: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  actionPlanHeader: {
    fontSize: typography.size.xs,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  actionItem: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 4,
  },
  actionHorizon: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  actionTitle: {
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
  actionWhy: {
    fontSize: typography.size.xs,
    lineHeight: typography.size.xs * 1.5,
  },
  // ADR-104 나 프로필 스타일
  personaCard: {
    backgroundColor: 'rgba(236,72,153,0.08)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.3)',
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  personaLabel: {
    color: '#EC4899',
    fontSize: typography.size.xs,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  personaOneLine: {
    fontSize: typography.size.xl,
    fontWeight: '800',
    lineHeight: typography.size.xl * 1.3,
  },
  personaNarrative: {
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
  personaInsights: {
    gap: 6,
    marginTop: 6,
  },
  personaInsightRow: {
    flexDirection: 'row',
    gap: 6,
  },
  personaBullet: {
    color: '#EC4899',
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
  personaInsightText: {
    flex: 1,
    fontSize: typography.size.xs,
    lineHeight: typography.size.xs * 1.5,
  },
  personaFallback: {
    fontSize: 11,
    marginTop: 4,
  },
  partialBanner: {
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  partialBannerTitle: {
    color: '#FBBF24',
    fontSize: typography.size.sm,
    fontWeight: '700',
    marginBottom: 6,
  },
  partialBannerBody: {
    color: '#FDE68A',
    fontSize: typography.size.xs,
    marginBottom: 4,
  },
  partialBannerKey: {
    fontWeight: '700',
  },
  partialRetryButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.4)',
  },
  partialRetryText: {
    color: '#FBBF24',
    fontSize: typography.size.xs,
    fontWeight: '600',
  },
  nextStepsWrap: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  nextStepsHeader: {
    fontSize: typography.size.xs,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  nextStepLabel: {
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
  nextStepDesc: {
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  nextStepArrow: {
    fontSize: 20,
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: '#EC4899',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: typography.size.base,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 16,
  },
});
