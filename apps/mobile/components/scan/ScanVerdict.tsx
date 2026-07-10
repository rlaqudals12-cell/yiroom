/**
 * ScanVerdict — 스캔 판정 정본 (RN) "나와의 적합도" 컨설팅 (ADR-112 / ADR-111 표현 원칙)
 *
 * @description
 *   verdict-first 레이아웃: 적합도 히어로 → 그래서(행동) → 규제 사실 → 효과 타임라인
 *   → 궁합 경고(접기) → 전성분(접기) → 면책.
 *   절대 안전등급을 매기지 않는다 — 내 프로필 기준 "적합도"만 표현.
 *   모든 문구는 이미 받은 판정 데이터에서 규칙 기반으로 조립한다(새 fetch/새 AI 금지).
 *
 *   ⚠️ 규제 정보·효과 타임라인 문구는 법적 검토를 거친 lib 상수를 그대로 인용한다.
 *      금지 표현(치료·재생·보장·사라져)·절대등급·낙인 금지.
 *   ⚠️ 정직성: 피부 프로필이 없으면 점수를 지어내지 않고 분석 CTA를 표시한다.
 */
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import {
  Sparkles,
  ShieldAlert,
  Clock3,
  AlertTriangle,
  ExternalLink,
  Info,
} from 'lucide-react-native';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { TopActionsCard } from '@/components/analysis/TopActionsCard';
import { ProgressiveDisclosure } from '@/components/common/ProgressiveDisclosure';
import type { TopAction } from '@/lib/analysis/top-actions';
import type { RegulatoryFlag } from '@/lib/scan/ingredient-db-match';
import {
  formatTimelineNotice,
  TIMELINE_DISCLAIMER,
  type IngredientTimeline,
} from '@/lib/scan/ingredient-timeline';
import type { ScanVerdictData } from '@/lib/scan/verdict';
import { useTheme, spacing, radii, typography, statusColors } from '@/lib/theme';
import type { ProductIngredient } from '@/types/scan';

export type OcrConfidence = 'high' | 'medium' | 'low';

export interface ScanVerdictProps {
  /** 판정 데이터 (buildScanVerdict 결과) */
  verdict: ScanVerdictData;
  /** 분석에 사용된 성분 목록 (전성분 표시용) */
  ingredients: ProductIngredient[];
  /** 제품명 (있을 때) */
  productName?: string;
  /** 브랜드명 (있을 때) */
  brandName?: string;
  /** OCR 인식 정확도 — 정직성: 판정의 입력 품질을 알린다 */
  ocrConfidence?: OcrConfidence;
  /** 다시 스캔 콜백 */
  onRescan?: () => void;
  /** 테스트 ID */
  testID?: string;
}

/** OCR 정확도 배지 라벨/톤 */
const OCR_CONFIDENCE_VIEW: Record<OcrConfidence, { label: string; color: string }> = {
  high: { label: '높은 정확도', color: statusColors.success },
  medium: { label: '보통 정확도', color: statusColors.warning },
  low: { label: '낮은 정확도 · 재촬영 권장', color: statusColors.error },
};

/** 적합도 점수 → 색상/판정 문구 (절대등급 아님) */
function getScoreView(score: number): { color: string; verdict: string } {
  if (score >= 80) {
    return { color: statusColors.success, verdict: '내 프로필에 잘 맞는 제품이에요' };
  }
  if (score >= 60) {
    return {
      color: statusColors.warning,
      verdict: '대체로 잘 맞아요 · 아래 주의점만 확인해보세요',
    };
  }
  return {
    color: statusColors.error,
    verdict: '내 프로필엔 잘 안 맞을 수 있어요 · 아래를 확인해보세요',
  };
}

/** 규제 종류 → 배지 색 (공포 표현 없이 중립 톤) */
const REGULATORY_COLOR: Record<RegulatoryFlag['kind'], string> = {
  allergen25: statusColors.warning,
  restricted: statusColors.error,
  caution20: '#3B82F6',
};

/** EWG 등급 → 색 (참고 지표) */
function ewgColor(score: number): string {
  if (score <= 2) return statusColors.success;
  if (score <= 6) return statusColors.warning;
  return statusColors.error;
}

/**
 * "그래서, 이렇게 하세요" 행동을 판정 데이터에서 규칙 조립.
 * - ①적합/부적합 핵심 행동 (프로필 있을 때만)
 * - ②규제 정보 있으면 성분 확인 유도
 * - ③타임라인 있으면 변화 추적(재분석) 유도
 */
function buildActions(verdict: ScanVerdictData, hasSkinProfile: boolean): TopAction[] {
  const actions: TopAction[] = [];
  const avoid = verdict.ingredientAnalysis.avoid;
  const regulatory = verdict.regulatory ?? [];
  const timelines = verdict.timelines ?? [];

  // ① 핵심 적합/부적합 행동 — 내 피부 프로필이 있을 때만
  if (hasSkinProfile) {
    if (avoid.length > 0) {
      actions.push({
        title: '내 피부엔 자극될 수 있는 성분이 있어요 — 대체 제품을 살펴보세요',
        detail: `${avoid
          .slice(0, 2)
          .map((a) => a.nameKo || a.ingredient)
          .join(', ')} 성분이 신경 쓰일 수 있어요`,
        href: '/(tabs)/beauty',
        hrefLabel: '대체 제품 보기',
      });
    } else if (verdict.overallScore >= 80) {
      actions.push({
        title: '잘 맞는 제품이에요 — 지금 루틴에 더해보세요',
        detail: '내 피부 기준으로 큰 주의점이 없어요',
      });
    } else {
      actions.push({
        title: '패치 테스트 후 사용해보세요',
        detail: '내 피부 기준으로 무난하지만, 처음엔 소량으로 확인하는 게 좋아요',
      });
    }
  }

  // ② 규제 정보
  if (regulatory.length > 0) {
    const hasAllergen = regulatory.some((r) => r.kind === 'allergen25');
    const hasRestricted = regulatory.some((r) => r.kind === 'restricted');
    let title: string;
    if (hasAllergen) {
      title = '식약처 지정 알레르기 유발 착향제가 있어요 — 성분을 확인해보세요';
    } else if (hasRestricted) {
      title = '식약처 배합 제한 성분이 있어요 — 성분을 확인해보세요';
    } else {
      title = '알아두면 좋은 성분 정보가 있어요 — 아래에서 확인해보세요';
    }
    actions.push({ title, detail: '아래 규제 정보에서 성분명을 확인할 수 있어요' });
  }

  // ③ 효과 타임라인 → 변화 추적 연결
  if (timelines.length > 0) {
    actions.push({
      title: `꾸준히 쓰면 ${timelines[0].timelineShort} 후 변화를 확인해보세요`,
      detail: `핵심 성분: ${timelines
        .slice(0, 3)
        .map((t) => t.name)
        .join(', ')}`,
      href: '/(analysis)/skin',
      hrefLabel: '피부 분석으로 변화 확인',
    });
  }

  return actions;
}

export function ScanVerdict({
  verdict,
  ingredients,
  productName,
  brandName,
  ocrConfidence,
  onRescan,
  testID = 'scan-verdict',
}: ScanVerdictProps): React.JSX.Element {
  const { colors } = useTheme();

  // 피부 프로필 유무 — 점수 히어로/핵심 행동의 표시 여부를 가른다
  const hasSkinProfile = verdict.hasUserAnalysis.skinAnalysis;
  const regulatory = verdict.regulatory ?? [];
  const timelines = verdict.timelines ?? [];
  const { color: scoreColor, verdict: verdictLine } = getScoreView(verdict.overallScore);

  const goodPoints = verdict.skinCompatibility.goodPoints;
  const warnings = verdict.skinCompatibility.warnings;
  const avoid = verdict.ingredientAnalysis.avoid;
  const caution = verdict.ingredientAnalysis.caution;
  const interactions = verdict.ingredientAnalysis.interactions;

  const actions = buildActions(verdict, hasSkinProfile);

  const cautionCount = warnings.length + avoid.length + caution.length + interactions.length;
  let warningSummary = '특별히 주의할 점은 없어요';
  if (avoid.length > 0) {
    warningSummary = `주의 성분 ${avoid.length}개 · 함께 볼 점 확인`;
  } else if (cautionCount > 0) {
    warningSummary = '함께 사용 시 참고할 점이 있어요';
  }

  const border = { borderColor: colors.border };
  const cardBg = { backgroundColor: colors.card };

  return (
    <View testID={testID} style={styles.container}>
      {/* 제품명 + OCR 정확도 (있을 때) */}
      {(productName || brandName || ocrConfidence) && (
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            {brandName ? (
              <Text style={[styles.brand, { color: colors.mutedForeground }]}>{brandName}</Text>
            ) : null}
            {productName ? (
              <Text style={[styles.productName, { color: colors.foreground }]}>{productName}</Text>
            ) : null}
          </View>
          {ocrConfidence ? (
            <View
              testID="scan-verdict-ocr-confidence"
              style={[
                styles.ocrBadge,
                { backgroundColor: `${OCR_CONFIDENCE_VIEW[ocrConfidence].color}22` },
              ]}
            >
              <Text
                style={[styles.ocrBadgeText, { color: OCR_CONFIDENCE_VIEW[ocrConfidence].color }]}
              >
                {OCR_CONFIDENCE_VIEW[ocrConfidence].label}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* 히어로: 나와의 적합도 (프로필 있을 때) / 분석 CTA (없을 때) */}
      {hasSkinProfile ? (
        <View testID="scan-verdict-hero" style={[styles.hero, cardBg, border]}>
          <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>나와의 적합도</Text>
          <Text style={[styles.heroScore, { color: scoreColor }]}>
            {verdict.overallScore}
            <Text style={styles.heroScoreUnit}>점</Text>
          </Text>
          <Text style={[styles.heroVerdict, { color: colors.foreground }]}>{verdictLine}</Text>
        </View>
      ) : (
        <View
          testID="scan-verdict-cta"
          style={[
            styles.cta,
            { backgroundColor: `${statusColors.success}00`, borderColor: '#EC489933' },
          ]}
        >
          <Sparkles size={26} color="#EC4899" />
          <Text style={[styles.ctaTitle, { color: colors.foreground }]}>
            피부 분석을 하면 내 피부 기준으로 판정해드려요
          </Text>
          <Text style={[styles.ctaSub, { color: colors.mutedForeground }]}>
            아래 성분 정보와 효과 안내는 지금도 볼 수 있어요
          </Text>
          <Pressable
            testID="scan-verdict-cta-button"
            onPress={() => router.push('/(analysis)/skin' as never)}
            accessibilityRole="button"
            accessibilityLabel="피부 분석 시작하기"
            style={[styles.ctaButton, { backgroundColor: '#EC4899' }]}
          >
            <Text style={styles.ctaButtonText}>피부 분석 시작하기</Text>
          </Pressable>
        </View>
      )}

      {/* 그래서, 이렇게 하세요 */}
      {actions.length > 0 ? <TopActionsCard actions={actions} /> : null}

      {/* 좋은 점 (프로필 있고 항목 있을 때) */}
      {hasSkinProfile && goodPoints.length > 0 && (
        <View style={[styles.section, cardBg, border]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>잘 맞는 점</Text>
          {goodPoints.map((point, i) => (
            <View key={`good-${i}`} style={styles.pointRow}>
              <Sparkles size={16} color={statusColors.success} />
              <Text style={[styles.pointText, { color: colors.foreground }]}>
                {point.description}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* L1 규제 정보 — 사실 인용 톤 (있을 때만) */}
      {regulatory.length > 0 && (
        <View testID="scan-verdict-regulatory" style={[styles.section, cardBg, border]}>
          <View style={styles.sectionTitleRow}>
            <ShieldAlert size={16} color={statusColors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>성분 규제 정보</Text>
          </View>
          <Text style={[styles.sectionCaption, { color: colors.mutedForeground }]}>
            식약처 고시·공공데이터 기준으로 참고할 성분이에요.
          </Text>
          {regulatory.map((flag, i) => (
            <View key={`reg-${flag.ingredient}-${i}`} style={styles.regRow}>
              <View
                style={[styles.regBadge, { backgroundColor: `${REGULATORY_COLOR[flag.kind]}22` }]}
              >
                <Text style={[styles.regBadgeText, { color: REGULATORY_COLOR[flag.kind] }]}>
                  {flag.label}
                </Text>
              </View>
              <Text style={[styles.regIngredient, { color: colors.foreground }]} numberOfLines={1}>
                {flag.ingredient}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* L4 효과 타임라인 — 문헌 인용형 (있을 때만) */}
      {timelines.length > 0 && (
        <View testID="scan-verdict-timeline" style={[styles.section, cardBg, border]}>
          <View style={styles.sectionTitleRow}>
            <Clock3 size={16} color="#EC4899" />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              효과가 보이는 시기
            </Text>
          </View>
          {timelines.map((t: IngredientTimeline, i) => (
            <View
              key={`tl-${t.name}-${i}`}
              style={[styles.timelineItem, { borderBottomColor: colors.border }]}
            >
              <View style={styles.timelineHead}>
                <Text style={[styles.timelineName, { color: colors.foreground }]}>{t.name}</Text>
                <Text style={[styles.timelineEffect, { color: colors.mutedForeground }]}>
                  {t.effect}
                </Text>
              </View>
              <Text style={[styles.timelineNotice, { color: colors.foreground }]}>
                {formatTimelineNotice(t)}
              </Text>
              <Pressable
                testID={`scan-verdict-timeline-source-${i}`}
                onPress={() => Linking.openURL(t.sourceUrl)}
                accessibilityRole="link"
                accessibilityLabel={`출처: ${t.sourceLabel}`}
                style={styles.sourceRow}
              >
                <Text style={[styles.sourceText, { color: '#EC4899' }]}>출처: {t.sourceLabel}</Text>
                <ExternalLink size={12} color="#EC4899" />
              </Pressable>
            </View>
          ))}
          <View style={[styles.disclaimerBox, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.disclaimerBoxText, { color: colors.mutedForeground }]}>
              {TIMELINE_DISCLAIMER}
            </Text>
          </View>
        </View>
      )}

      {/* 궁합·주의 — 접기 (프로필 있고 항목 있을 때) */}
      {hasSkinProfile && cautionCount > 0 && (
        <View style={[styles.section, cardBg, border]}>
          <ProgressiveDisclosure
            expandLabel="궁합·주의할 점 보기"
            collapseLabel="접기"
            summary={
              <View style={styles.disclosureSummary}>
                <AlertTriangle size={16} color={statusColors.warning} />
                <View style={styles.disclosureSummaryText}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    궁합·주의할 점
                  </Text>
                  <Text style={[styles.sectionCaption, { color: colors.mutedForeground }]}>
                    {warningSummary}
                  </Text>
                </View>
              </View>
            }
            detail={
              <View style={styles.disclosureDetail}>
                {warnings.map((w, i) => (
                  <View key={`warn-${i}`} style={styles.pointRow}>
                    <AlertTriangle size={16} color={statusColors.warning} />
                    <View style={styles.flex1}>
                      <Text style={[styles.pointStrong, { color: colors.foreground }]}>
                        {w.title}
                      </Text>
                      <Text style={[styles.pointText, { color: colors.mutedForeground }]}>
                        {w.description}
                      </Text>
                    </View>
                  </View>
                ))}
                {avoid.length > 0 && (
                  <View style={[styles.avoidBox, { backgroundColor: `${statusColors.error}12` }]}>
                    <Text style={[styles.avoidTitle, { color: statusColors.error }]}>
                      주의가 필요한 성분
                    </Text>
                    {avoid.map((item, i) => (
                      <Text
                        key={`avoid-${i}`}
                        style={[styles.avoidItem, { color: statusColors.error }]}
                      >
                        {item.nameKo || item.ingredient}
                        {item.reason ? ` · ${item.reason}` : ''}
                      </Text>
                    ))}
                  </View>
                )}
                {interactions.map((it, i) => (
                  <View key={`int-${i}`} style={styles.pointRow}>
                    <Info size={16} color={colors.mutedForeground} />
                    <Text style={[styles.pointText, { color: colors.foreground }]}>
                      {it.ingredients.join(' + ')} · {it.reason}
                    </Text>
                  </View>
                ))}
              </View>
            }
          />
        </View>
      )}

      {/* 전성분 — 접기 */}
      {ingredients.length > 0 && (
        <View style={[styles.section, cardBg, border]}>
          <ProgressiveDisclosure
            expandLabel={`전성분 ${ingredients.length}개 보기`}
            collapseLabel="접기"
            summary={
              <View style={styles.disclosureSummaryText}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  전성분 {ingredients.length}개
                </Text>
                <Text style={[styles.sectionCaption, { color: colors.mutedForeground }]}>
                  성분별 EWG 참고 지표를 함께 볼 수 있어요
                </Text>
              </View>
            }
            detail={
              <View>
                {ingredients.map((ing, i) => (
                  <View
                    key={`ing-${ing.order}-${i}`}
                    style={[styles.ingRow, { borderBottomColor: colors.border }]}
                  >
                    <Text style={[styles.ingName, { color: colors.foreground }]} numberOfLines={1}>
                      <Text style={{ color: colors.mutedForeground }}>{ing.order}. </Text>
                      {ing.nameKo || ing.inciName}
                    </Text>
                    {ing.ewgGrade !== undefined && ing.ewgGrade !== null ? (
                      <View
                        style={[
                          styles.ewgBadge,
                          { backgroundColor: `${ewgColor(ing.ewgGrade)}22` },
                        ]}
                      >
                        <Text style={[styles.ewgBadgeText, { color: ewgColor(ing.ewgGrade) }]}>
                          EWG {ing.ewgGrade}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ))}
                <Text
                  style={[
                    styles.sectionCaption,
                    { color: colors.mutedForeground, marginTop: spacing.sm },
                  ]}
                >
                  EWG 등급은 성분 안전성 참고 지표예요(출처: EWG Skin Deep). 농도·개인차는 반영되지
                  않아요.
                </Text>
              </View>
            }
          />
        </View>
      )}

      {/* 면책 강화 */}
      <Text
        testID="scan-verdict-disclaimer"
        style={[styles.finalDisclaimer, { color: colors.mutedForeground }]}
      >
        이 판정은 정보 제공 도구이며 의학적 조언이 아니에요. 성분·규제 정보는 공개 데이터를 인용한
        참고 자료로, 알레르기나 피부 질환이 있다면 전문가와 상담해주세요.
      </Text>

      {/* 다시 스캔 */}
      {onRescan ? (
        <Pressable
          testID="scan-verdict-rescan"
          onPress={onRescan}
          accessibilityRole="button"
          accessibilityLabel="다른 제품 스캔하기"
          style={[styles.rescan, border]}
        >
          <Text style={[styles.rescanText, { color: colors.foreground }]}>다른 제품 스캔하기</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  brand: {
    fontSize: typography.size.sm,
  },
  productName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  ocrBadge: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  ocrBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  hero: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  heroScore: {
    fontSize: 48,
    fontWeight: typography.weight.bold,
    marginTop: spacing.xs,
  },
  heroScoreUnit: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  heroVerdict: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  cta: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  ctaSub: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  ctaButton: {
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.smx,
    marginTop: spacing.md,
  },
  ctaButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: '#FFFFFF',
  },
  section: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  sectionCaption: {
    fontSize: typography.size.xs,
    marginBottom: spacing.sm,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  pointText: {
    flex: 1,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  pointStrong: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  flex1: {
    flex: 1,
  },
  regRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  regBadge: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  regBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  regIngredient: {
    flex: 1,
    fontSize: typography.size.sm,
  },
  timelineItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
  },
  timelineHead: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  timelineName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  timelineEffect: {
    fontSize: typography.size.xs,
  },
  timelineNotice: {
    fontSize: typography.size.sm,
    marginTop: spacing.xxs,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xxs,
  },
  sourceText: {
    fontSize: typography.size.xs,
  },
  disclaimerBox: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  disclaimerBoxText: {
    fontSize: typography.size.xs,
    lineHeight: 18,
  },
  disclosureSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  disclosureSummaryText: {
    flex: 1,
  },
  disclosureDetail: {
    gap: spacing.xs,
  },
  avoidBox: {
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  avoidTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginBottom: spacing.xxs,
  },
  avoidItem: {
    fontSize: typography.size.sm,
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.xs,
  },
  ingName: {
    flex: 1,
    fontSize: typography.size.sm,
  },
  ewgBadge: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  ewgBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  finalDisclaimer: {
    fontSize: typography.size.xs,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  rescan: {
    borderRadius: radii.xl,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: spacing.smx,
  },
  rescanText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
});
