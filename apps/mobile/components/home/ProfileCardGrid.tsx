/**
 * 프로필 카드 그리드 (ADR-109 — 모바일 프로필 중심)
 *
 * 웹 app/(main)/home/_components/ProfileCardGrid.tsx의 RN 포팅.
 * 홈을 "분석 도구 메뉴"에서 "채워지는 5축 정체성 프로필"로.
 * - 완료 칸 → 개별 최신 결과(축 심화) = 무손실 깊이 진입
 * - 빈 칸 = CTA(그 축 분석)
 * - 변동 아이콘: 🔒 identity / 🔄 slow / 📅 condition (AXIS_CADENCE)
 * - 피부 = 오늘의 컨디션: 직전 대비 추이 칩(SkinTrendChip)
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Lock,
  RefreshCw,
  CalendarDays,
  Plus,
  Check,
  ChevronRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { CADENCE_META, type CadenceGroup } from '@yiroom/shared';

import type { AnalysisSummary } from '../../hooks/useUserAnalyses';
import { TIMING } from '../../lib/animations';
import { useTheme } from '../../lib/theme';
import {
  PROFILE_META,
  PROFILE_ORDER,
  TOTAL_ANALYSIS_TYPES,
  getProfileCadence,
  getProfileResultRoute,
  type ProfileAxis,
} from './profile-meta';

const CADENCE_ICON: Record<CadenceGroup, React.ComponentType<{ size?: number; color?: string }>> = {
  identity: Lock,
  slow: RefreshCw,
  condition: CalendarDays,
};
// 라벨은 @yiroom/shared CADENCE_META로 일원화 (웹·앱 문구 드리프트 방지)

// 추이 칩 색 (웹 emerald/amber/slate 시맨틱 유지)
const TREND_COLORS = {
  up: { fg: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  down: { fg: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  flat: { fg: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
} as const;

function relativeTime(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return '오늘';
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  return `${Math.floor(months / 12)}년 전`;
}

interface ProfileCardGridProps {
  analyses: AnalysisSummary[];
  /** 최신 통합 분석 페르소나 한 줄("당신은 ○○한 사람") — 있으면 상단 노출 */
  personaOneLine?: string | null;
  style?: ViewStyle;
  testID?: string;
}

export function ProfileCardGrid({
  analyses,
  personaOneLine,
  style,
  testID = 'profile-card-grid',
}: ProfileCardGridProps): React.JSX.Element {
  const { colors, brand, spacing, radii, typography, module: moduleColors, shadows } = useTheme();
  const router = useRouter();

  const byType = new Map(analyses.map((a) => [a.type, a]));
  const completedCount = analyses.filter((a) =>
    PROFILE_ORDER.includes(a.type as ProfileAxis)
  ).length;
  const pct = Math.round((completedCount / TOTAL_ANALYSIS_TYPES) * 100);

  return (
    <Animated.View
      entering={FadeInUp.duration(TIMING.normal)}
      testID={testID}
      accessibilityLabel="내 정체성 프로필"
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
      {/* 페르소나 한 줄 — "살아있는 나" (있을 때만) */}
      {personaOneLine ? (
        <View
          style={[styles.personaRow, { marginBottom: spacing.smx }]}
          testID="profile-persona-line"
        >
          <Sparkles size={16} color={brand.primary} />
          <Text
            style={{
              flex: 1,
              fontSize: typography.size.base,
              fontWeight: typography.weight.bold,
              color: brand.primary,
            }}
            numberOfLines={2}
          >
            {personaOneLine}
          </Text>
        </View>
      ) : null}

      {/* 헤더 + 완성도 미터 */}
      <View style={{ marginBottom: spacing.md }}>
        <View style={styles.headerRow}>
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
            }}
          >
            내 정체성
          </Text>
          <Text style={{ fontSize: typography.size.sm, fontWeight: '600', color: '#8B5CF6' }}>
            {pct === 100 ? '완성' : `나를 ${pct}% 알아냈어요`}
          </Text>
        </View>
        <View
          style={[styles.meterTrack, { backgroundColor: colors.secondary, marginTop: spacing.xs }]}
        >
          <LinearGradient
            colors={['#A78BFA', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.meterFill, { width: `${pct}%` }]}
          />
        </View>
        <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: spacing.xs }}>
          {completedCount}/{TOTAL_ANALYSIS_TYPES} · 셀카 한 장으로 채워가요
        </Text>
      </View>

      {/* 5축 카드 그리드 (2열) */}
      <View style={styles.grid}>
        {PROFILE_ORDER.map((type) => {
          const analysis = byType.get(type);
          const meta = PROFILE_META[type];
          const Icon = meta.icon;

          // 빈 칸 = CTA(해당 축 분석)
          if (!analysis) {
            return (
              <Pressable
                key={type}
                onPress={() => router.push(meta.analysisRoute as never)}
                testID={`profile-card-empty-${type}`}
                accessibilityLabel={`${meta.label} 분석 시작`}
                style={({ pressed }) => [
                  styles.card,
                  styles.emptyCard,
                  { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={[styles.iconBadge, { backgroundColor: colors.secondary }]}>
                  <Plus size={16} color={colors.mutedForeground} />
                </View>
                <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
                  {meta.label}
                </Text>
                <Text style={{ fontSize: typography.size.sm, fontWeight: '600', color: '#8B5CF6' }}>
                  채우기
                </Text>
              </Pressable>
            );
          }

          // 완료 칸 = 개별 최신 결과로 진입
          const cadence = getProfileCadence(type);
          const CadenceIcon = CADENCE_ICON[cadence];
          const mod = moduleColors[meta.moduleKey];
          return (
            <Pressable
              key={type}
              onPress={() => router.push(getProfileResultRoute(analysis) as never)}
              testID={`profile-card-${type}`}
              accessibilityLabel={`${meta.label}: ${analysis.summary}`}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.cardTopRow}>
                <LinearGradient
                  colors={[mod.light, mod.base]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconBadge}
                >
                  <Icon size={16} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.cadenceChip}>
                  <CadenceIcon size={11} color={colors.mutedForeground} />
                  <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                    {CADENCE_META[cadence].label}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
                {meta.label}
              </Text>
              <View style={styles.summaryRow}>
                <Text
                  style={{
                    flexShrink: 1,
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.semibold,
                    color: colors.foreground,
                  }}
                  numberOfLines={1}
                >
                  {analysis.summary}
                </Text>
                {analysis.type === 'skin' && analysis.skinTrend ? (
                  <SkinTrendChip trend={analysis.skinTrend} delta={analysis.skinDelta ?? 0} />
                ) : null}
              </View>
              <View style={styles.metaRow}>
                <Check size={11} color="#22C55E" />
                <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                  {relativeTime(analysis.createdAt)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* 통합 분석 진입 (전체 채우기) */}
      {completedCount < TOTAL_ANALYSIS_TYPES ? (
        <Pressable
          onPress={() => router.push('/(analysis)/integrated' as never)}
          testID="profile-card-integrated-cta"
          accessibilityLabel="셀카 한 장으로 채우기"
          style={({ pressed }) => [{ marginTop: spacing.smx, opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={['#EC4899', '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.ctaButton, { borderRadius: radii.lg }]}
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.bold,
                color: '#FFFFFF',
              }}
            >
              셀카 한 장으로 채우기
            </Text>
            <ChevronRight size={16} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

/** 피부 점수 추이 칩 — 직전 분석 대비 (↑ 개선 / ↓ 하락 / 유지) */
function SkinTrendChip({
  trend,
  delta,
}: {
  trend: 'up' | 'down' | 'flat';
  delta: number;
}): React.JSX.Element {
  const c = TREND_COLORS[trend];
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const label =
    trend === 'up' ? `+${Math.abs(delta)}` : trend === 'down' ? `-${Math.abs(delta)}` : '유지';
  return (
    <View style={[styles.trendChip, { backgroundColor: c.bg }]} testID="skin-trend-chip">
      <Icon size={10} color={c.fg} />
      <Text style={{ fontSize: 10, fontWeight: '600', color: c.fg }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  personaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meterTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 999,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    gap: 6,
    padding: 12,
    borderRadius: 14,
  },
  emptyCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cadenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
  },
});
