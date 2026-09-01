/**
 * 통합 분석 결과 페이지 (Server Component)
 *
 * @route GET /analysis/integrated/result/[sessionId]
 * @see docs/adr/ADR-100-integrated-analysis-ui.md
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §3
 */

import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import { CalendarCheck, ChevronRight } from 'lucide-react';
import { fetchIntegratedResult } from '@/lib/analysis/integrated/internal/result-fetcher';
// internal 소비 관행(result-fetcher와 동일) — 구버전 세션에 저장된 페르소나 문구
// (원시 영문 피부타입·"바이탈리티"·"을(를)" 병기)를 표시 시점에 정본 라벨로 교정.
import { repairLegacyPersona } from '@/lib/analysis/integrated/internal/persona-repair';
import type { AxisDbRecord } from '@/lib/analysis/integrated/internal/result-fetcher';
import { hasAnyClosetItems } from '@/lib/analysis/integrated/internal/closet-check';
// internal 소비 관행(result-fetcher·closet-check와 동일) — 세션 얼굴 사진의 서명 URL 발급.
// 참고: PC 단독 라우트는 `integrated://face/` 센티널에서 서명 실패하는 기존 결함이 있으나
// 여기는 세션 레코드의 실제 버킷 경로를 직접 쓰므로 무관(별도 수정 항목).
import { getSignedImageUrl } from '@/lib/analysis/integrated/internal/storage-uploader';
import { fetchCurationProducts } from '@/lib/analysis/integrated/internal/product-matcher';
import {
  composeActionPlan,
  composeCrossInsights,
  composeCuration,
  type AxisCode,
  type AxisFallbackState,
  type AxisResult,
  type PersonalColorAxisData,
  type SkinAxisData,
  type BodyAxisData,
  type HairAxisData,
  type MakeupAxisData,
  type RecommendationGender,
  type RecommendationSituation,
  seasonKo,
  undertoneKo,
  skinTypeKo,
  faceShapeKo,
  toneKo,
} from '@/lib/analysis/integrated';
import { getBodyShapeLabel } from '@/lib/body';
import type { OutputLocale } from '@/lib/gemini/client';
import type { PersonaBadge, PaletteColor } from '@/components/share/PersonaShareCard';
import type { ReportRow, ReportStyleChip } from '@/components/share/PersonaReportCard';
import { getCardPalette } from '@/lib/share/tone-palettes';
import { fetchIssueNo } from '@/lib/share/issue-no';
import { PartialSuccessBanner } from './_components/PartialSuccessBanner';
import { AxisFallbackNotice } from './_components/AxisFallbackNotice';
import { NextStepsLinks } from './_components/NextStepsLinks';
import { PersonaNarrativeCard } from './_components/PersonaNarrativeCard';
import { PersonaShareSection, type PersonaReportData } from './_components/PersonaShareSection';
import { DrapingSectionDynamic } from '@/components/analysis/personal-color';
import { DrapingShareSection } from './_components/DrapingShareSection';
import { IntegratedImageStorageNotice } from './_components/IntegratedImageStorageNotice';
import { ActionPlanCard } from './_components/ActionPlanCard';
import { CrossInsightsCard } from './_components/CrossInsightsCard';
import { CurationCard } from './_components/CurationCard';
import { ShareReportButton } from './_components/ShareReportButton';
import { validateToneValue, type TwelveTone } from '@/lib/analysis/personal-color-v2';

/** 저장된 시즌·서브타입이 실제 12톤 조합일 때만 드레이핑 판정에 전달한다. */
function resolveDrapingTone(season: string | undefined, subtype: string): TwelveTone | undefined {
  if (!season || !subtype) return undefined;
  const normalizedSubtype = subtype.toLowerCase() === 'mute' ? 'muted' : subtype.toLowerCase();
  return validateToneValue(`${normalizedSubtype}-${season.toLowerCase()}`) ?? undefined;
}

/**
 * DB 레코드 → AxisResult 변환 (action-plan 입력용).
 * 레코드 null이면 실패 경로.
 *
 * usedFallback: 세션 used_fallback에 담긴 실제 Mock 대체 여부를 전달한다
 * (과거 false 하드코딩은 통합 리포트가 축별 Mock을 숨기던 정직성 결함이었음).
 *
 * fetchFailed: 조회 자체가 실패한 축. "결과 없음"과 구분한다 — 일시적 장애를
 * "분석 안 함"으로 표시하면 사용자가 이미 한 분석을 다시 하게 된다.
 */
function toAxisResult<T>(
  record: AxisDbRecord | null,
  mapper: (r: AxisDbRecord) => T,
  fallbackState: AxisFallbackState,
  fetchFailed = false
): AxisResult<T> {
  if (!record) {
    return fetchFailed
      ? {
          success: false,
          error: {
            code: 'UNKNOWN',
            message: 'Axis fetch failed',
            userMessage: '결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
            retryable: true,
          },
        }
      : {
          success: false,
          error: {
            code: 'MISSING_INPUT',
            message: 'No DB record',
            userMessage: '분석 결과가 없어요.',
            retryable: true,
          },
        };
  }
  return {
    success: true,
    usedFallback: fallbackState === 'used',
    fallbackState,
    data: mapper(record),
  };
}

function extractNested(record: AxisDbRecord, key: string, field: string): string {
  const nested = record[key];
  if (typeof nested === 'object' && nested !== null) {
    const value = (nested as Record<string, unknown>)[field];
    if (typeof value === 'string') return value;
  }
  return '';
}

/**
 * best_colors JSONB → 유효한 색(hex + 색이름) 최대 6개.
 * 두 저장 형태를 모두 수용: 단독 AI 경로 = {name,hex} 객체 / 통합 정적 경로 = hex 문자열 배열
 * (문자열을 버리면 통합 세션 카드의 팔레트가 통째로 비는 배선 결함 — 2026-07-15 감사 발견).
 * 방어적으로 {color} 폴백(useAnalysisStatus.normalizeBestColors 동일 규칙).
 * 색이름은 있을 때만 담는다(없으면 카드가 색블록만 렌더 — 지어내지 않음).
 */
function parsePaletteItem(item: unknown): PaletteColor | null {
  let hex: string | null = null;
  let name: string | undefined;
  if (typeof item === 'string') {
    hex = item;
  } else if (typeof item === 'object' && item !== null) {
    const c = item as { hex?: unknown; color?: unknown; name?: unknown };
    if (typeof c.hex === 'string') hex = c.hex;
    else if (typeof c.color === 'string') hex = c.color;
    if (typeof c.name === 'string' && c.name) name = c.name;
  }
  if (!hex || !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) return null;
  return { hex, ...(name ? { name } : {}) };
}

function extractPalette(raw: unknown): PaletteColor[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(parsePaletteItem)
    .filter((c): c is PaletteColor => c !== null)
    .slice(0, 6);
}

/**
 * 공유카드/드레이핑 팔레트 해석 — 단독 AI 경로의 {hex,name}(개인 실측)이 이름까지 있으면
 * 우선, 아니면(통합 정적 = hex 문자열·웹세이프 제네릭 색 = 카드 품질 미달) 진단 톤의
 * 표준 큐레이션 팔레트로 대체(오프라인 진단 관습: 진단 톤 → 톤 표준 스와치 = 정직).
 */
function resolveCardPalettes(
  record: AxisDbRecord | null,
  pcData: PersonalColorAxisData | null,
  locale: OutputLocale
): { best: PaletteColor[]; avoid: PaletteColor[]; accent: PaletteColor[]; metals: PaletteColor[] } {
  const stored = extractPalette(record?.best_colors);
  const curated = pcData ? getCardPalette(pcData.tone || pcData.season, locale) : null;
  const best =
    stored.length >= 4 && stored.every((c) => !!c.name) ? stored : (curated?.best ?? stored);
  // 포인트·금속은 개인 실측이 존재하지 않는 영역 — 항상 톤 표준 큐레이션(관습 파생)
  return {
    best,
    avoid: curated?.avoid ?? [],
    accent: curated?.accent ?? [],
    metals: curated?.metals ?? [],
  };
}

/**
 * 추천 헤어 스타일 — recommendations.styleRecommendations JSONB에서 방어적 추출(형태 보장 없음).
 * suitability(0~100)가 저장돼 있으면 fit으로 전달 — 어울림 도트는 저장된 값만(지어내지 않음).
 */
function extractHairStyles(record: AxisDbRecord | null): ReportStyleChip[] {
  const rec = record?.recommendations;
  if (typeof rec !== 'object' || rec === null) return [];
  const list = (rec as Record<string, unknown>).styleRecommendations;
  if (!Array.isArray(list)) return [];
  return list
    .map((item): ReportStyleChip | null => {
      if (typeof item === 'string') return { name: item };
      if (typeof item === 'object' && item !== null) {
        const { name, suitability } = item as { name?: unknown; suitability?: unknown };
        if (typeof name === 'string' && name.length > 0) {
          return {
            name,
            ...(typeof suitability === 'number' && suitability > 0 ? { fit: suitability } : {}),
          };
        }
      }
      return null;
    })
    .filter((s): s is ReportStyleChip => s !== null)
    .slice(0, 3);
}

/** 피부 관리 포인트 — 저장된 관심사(primaryConcerns)만 이어붙임(지어내지 않음) */
function extractSkinConcerns(record: AxisDbRecord | null): string | undefined {
  const rec = record?.recommendations;
  if (typeof rec !== 'object' || rec === null) return undefined;
  const list = (rec as Record<string, unknown>).primaryConcerns;
  if (!Array.isArray(list)) return undefined;
  const items = list.filter((x): x is string => typeof x === 'string' && x.length > 0).slice(0, 3);
  return items.length > 0 ? items.join(' · ') : undefined;
}

/** 세션 얼굴 사진의 서명 URL(1h) — 경로 없으면/실패면 null(드레이핑 섹션 미렌더) */
async function fetchFaceUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  return getSignedImageUrl(path, 3600);
}

/** 리포트 속성표 라벨 묶음 — 로케일 완료 문자열 (카드에는 원시 영문값 금지) */
interface ReportAttrLabels {
  season: string;
  tone: string;
  undertone: string;
  brightness: string;
  saturation: string;
  contrast: string;
  valueLight: string;
  valueDeep: string;
  valueVivid: string;
  valueSoft: string;
  valueBalanced: string;
  contrastLow: string;
  contrastMedium: string;
  contrastHigh: string;
}

/**
 * 명도·채도 파생 행 — 명시 측정값이 DB에 없어 12톤 서브타입의 **정의**에서만 파생한다
 * (라이트=고명도·딥=저명도·브라이트=고채도·뮤트=저채도·트루=균형). 정의 밖이면 행 생략(지어내지 않음).
 */
// 스펙트럼 위치 — 범주값의 시각화 좌표(저=0.22/중=0.5/고=0.78). 숫자 미표기라 가짜 정밀도 없음
const SPECTRUM_LOW = 0.22;
const SPECTRUM_MID = 0.5;
const SPECTRUM_HIGH = 0.78;

function subtypeAttrRows(subtype: string, l: ReportAttrLabels): ReportRow[] {
  const s = subtype.toLowerCase();
  const rows: ReportRow[] = [];
  if (s === 'light')
    rows.push({
      label: l.brightness,
      value: l.valueLight,
      spectrumPos: SPECTRUM_HIGH,
      iconKey: 'brightness',
    });
  else if (s === 'deep' || s === 'dark')
    rows.push({
      label: l.brightness,
      value: l.valueDeep,
      spectrumPos: SPECTRUM_LOW,
      iconKey: 'brightness',
    });
  else if (s === 'true')
    rows.push({
      label: l.brightness,
      value: l.valueBalanced,
      spectrumPos: SPECTRUM_MID,
      iconKey: 'brightness',
    });
  if (s === 'bright' || s === 'vivid')
    rows.push({
      label: l.saturation,
      value: l.valueVivid,
      spectrumPos: SPECTRUM_HIGH,
      iconKey: 'saturation',
    });
  else if (s === 'muted' || s === 'soft')
    rows.push({
      label: l.saturation,
      value: l.valueSoft,
      spectrumPos: SPECTRUM_LOW,
      iconKey: 'saturation',
    });
  else if (s === 'true')
    rows.push({
      label: l.saturation,
      value: l.valueBalanced,
      spectrumPos: SPECTRUM_MID,
      iconKey: 'saturation',
    });
  return rows;
}

/** 퍼스널컬러 속성표 — 점수(채점표) 대신 "왜 이 진단인가"의 분해. 실데이터 행만 담는다 */
function buildReportAttrs(
  pcData: PersonalColorAxisData | null,
  subtype: string,
  contrast: string,
  locale: OutputLocale,
  l: ReportAttrLabels,
  // 계절 인장이 히어로에 있으면 표의 계절 행은 생략(중복 금지)
  omitSeason = false
): ReportRow[] {
  if (!pcData) return [];
  const rows: ReportRow[] = [];
  const seasonLabel = pcData.season ? seasonKo(pcData.season, locale) : '';
  if (seasonLabel && !omitSeason)
    rows.push({ label: l.season, value: seasonLabel, iconKey: 'season' });
  const toneLabel = pcData.tone ? toneKo(pcData.tone, locale) : '';
  // 톤이 계절 폴백(동일 문자열)이면 중복 행 생략
  if (toneLabel && toneLabel !== seasonLabel)
    rows.push({ label: l.tone, value: toneLabel, iconKey: 'tone' });
  const undertoneLabel = pcData.undertone ? undertoneKo(pcData.undertone, locale) : '';
  if (undertoneLabel)
    rows.push({ label: l.undertone, value: undertoneLabel, iconKey: 'undertone' });
  rows.push(...subtypeAttrRows(subtype, l));
  // 대비감 — 클라이언트 실측(ADR-116)이 저장된 세션만 (없으면 행 생략)
  const contrastByLevel: Record<string, { value: string; pos: number }> = {
    low: { value: l.contrastLow, pos: SPECTRUM_LOW },
    medium: { value: l.contrastMedium, pos: SPECTRUM_MID },
    high: { value: l.contrastHigh, pos: SPECTRUM_HIGH },
  };
  const contrastEntry = contrastByLevel[contrast.toLowerCase()];
  if (contrastEntry)
    rows.push({
      label: l.contrast,
      value: contrastEntry.value,
      spectrumPos: contrastEntry.pos,
      iconKey: 'contrast',
    });
  return rows;
}

/** 계절 인장 텍스트 — 히어로가 12톤명일 때만(계절 라벨과 다를 때). 점수 없는 타입 확정 스탬프 */
function sealTextFor(
  pcData: PersonalColorAxisData | null,
  toneName: string | undefined,
  locale: OutputLocale
): string | undefined {
  if (!pcData?.season) return undefined;
  const seasonLabel = seasonKo(pcData.season, locale);
  return seasonLabel && toneName !== seasonLabel ? seasonLabel : undefined;
}

/** "왜 피해요?" 한 줄 — 12톤 서브타입 정의에서 파생(계측 아님). 워스트 팔레트가 있을 때만 */
function avoidNoteFor(
  pcData: PersonalColorAxisData | null,
  subtype: string,
  hasWorst: boolean,
  reasonBySubtype: Record<string, string>,
  fallback: string
): string | undefined {
  if (!pcData || !hasWorst) return undefined;
  return reasonBySubtype[subtype.toLowerCase()] ?? fallback;
}

/** "분석 신뢰도 N%" — 사람이 아닌 진단의 점수. 퍼컬 실측 성공 시에만(Mock 폴백이면 undefined) */
function confidenceLabelFor(
  pcData: PersonalColorAxisData | null,
  isFallback: boolean,
  toLabel: (value: number) => string
): string | undefined {
  if (!pcData || isFallback || pcData.confidence <= 0) return undefined;
  return toLabel(Math.round(pcData.confidence));
}

/** 비어 있지 않은 라벨만 " · "로 이어붙임 (없으면 undefined) */
function joinLabels(...parts: Array<string | false | 0 | null | undefined>): string | undefined {
  const nonEmpty = parts.filter((p): p is string => typeof p === 'string' && p.length > 0);
  return nonEmpty.length > 0 ? nonEmpty.join(' · ') : undefined;
}

/** "컨디션 82점" (피부 컨디션 점수 라벨, 언어별). */
function conditionLabel(score: number, locale: OutputLocale): string {
  switch (locale) {
    case 'en':
      return `Condition ${score}`;
    case 'ja':
      return `コンディション${score}点`;
    case 'zh':
      return `状态${score}分`;
    default:
      return `컨디션 ${score}점`;
  }
}

function pcSummary(r: AxisDbRecord | null, locale: OutputLocale): string | undefined {
  if (!r) return undefined;
  return joinLabels(
    r.season ? seasonKo(String(r.season), locale) : undefined,
    r.undertone ? undertoneKo(String(r.undertone), locale) : undefined
  );
}

function skinSummary(r: AxisDbRecord | null, locale: OutputLocale): string | undefined {
  if (!r) return undefined;
  const score = Number(r.overall_score ?? 0);
  return joinLabels(
    r.skin_type ? skinTypeKo(String(r.skin_type), locale) : undefined,
    score > 0 ? conditionLabel(score, locale) : undefined
  );
}

/**
 * 축별 "핵심 결과 1줄" 요약 (NextStepsLinks 심화 링크용).
 * 반드시 공용 라벨 헬퍼로 한국어화 — 원시 영문값(Autumn/combination) 노출 금지.
 * 세션에 담긴 축(DB 레코드 존재)만 요약을 만든다.
 */
function buildAxisSummaries(
  axes: {
    personalColor: AxisDbRecord | null;
    skin: AxisDbRecord | null;
    body: AxisDbRecord | null;
    hair: AxisDbRecord | null;
    makeup: AxisDbRecord | null;
  },
  locale: OutputLocale
): Partial<Record<AxisCode, string>> {
  return {
    personal_color: pcSummary(axes.personalColor, locale),
    skin: skinSummary(axes.skin, locale),
    body: axes.body?.body_type ? getBodyShapeLabel(axes.body.body_type, locale) : undefined,
    hair: axes.hair?.face_shape ? faceShapeKo(String(axes.hair.face_shape), locale) : undefined,
    makeup: axes.makeup?.undertone ? undertoneKo(String(axes.makeup.undertone), locale) : undefined,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('analysis.integratedResult');
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

/** 축 코드 → 축 이름 i18n 키 (프로필 폴백 고지 문구용) */
const AXIS_LABEL_KEY = {
  personal_color: 'axes.personalColor',
  skin: 'axes.skin',
  body: 'axes.body',
  hair: 'axes.hair',
  makeup: 'axes.makeup',
} as const satisfies Record<AxisCode, string>;

// locale → toLocaleString용 BCP47 (외국어 사용자에게 한국어 날짜 포맷 노출 방지)
const DATE_LOCALE: Record<string, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
};

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function IntegratedResultPage({
  params,
}: PageProps): Promise<React.JSX.Element> {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const t = await getTranslations('analysis.integratedResult');
  const locale = await getLocale();
  const dateLocale = DATE_LOCALE[locale] ?? 'ko-KR';
  // 라벨 헬퍼용 로케일 (지원 4언어로 좁힘, 그 외는 ko 폴백)
  const uiLocale: OutputLocale = (['ko', 'en', 'ja', 'zh'] as const).includes(
    locale as OutputLocale
  )
    ? (locale as OutputLocale)
    : 'ko';

  const { sessionId } = await params;

  // UUID 형식 간단 검증 (경로 주입 방지)
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    sessionId
  );
  if (!isValidUuid) {
    notFound();
  }

  const data = await fetchIntegratedResult(sessionId);
  if (!data) {
    // RLS가 권한 없으면 null 반환 → 404로 처리
    notFound();
  }

  const {
    session,
    storedImageAccessState,
    accessibleFaceImagePath,
    axes,
    axesFromProfile,
    axesFetchFailed,
    fallbackAxes,
    unknownAxes,
    axisProvenance,
  } = data;
  // 이번 세션에 없던 축은 fetcher가 사용자의 최신 진단으로 이미 채웠다 (ADR-109 "유지" 약속).
  // 여기서는 그 사실을 고지하기 위해 목록만 라벨로 바꾼다.
  const pcRecord = axes.personalColor;
  const fetchFailedSet = new Set<AxisCode>(axesFetchFailed);
  const profileFallbackLabels =
    axesFromProfile.length > 0
      ? axesFromProfile.map((axis) => t(AXIS_LABEL_KEY[axis])).join(' · ')
      : null;
  // 저장된 persona는 생성 시점 문자열 — 구버전 Mock 템플릿의 원시값·조사 병기를 표시 시점 교정
  const persona = repairLegacyPersona(session.persona ?? null);

  const axesCompleted = (session.axes_completed ?? []) as AxisCode[];
  const axesFailed = (session.axes_failed ?? []) as AxisCode[];
  // Mock Fallback으로 대체된 축 — 정직성 고지(AxisFallbackNotice)와 축별 usedFallback에 사용
  const usedFallbackAxes = fallbackAxes;
  const usedFallbackSet = new Set<AxisCode>(usedFallbackAxes);
  const unknownSet = new Set<AxisCode>(unknownAxes);
  const fallbackStateFor = (axis: AxisCode): AxisFallbackState => {
    const resolved = axisProvenance[axis]?.fallbackState;
    if (resolved) return resolved;
    if (usedFallbackSet.has(axis)) return 'used';
    return unknownSet.has(axis) ? 'unknown' : 'not_used';
  };

  // 성별/상황 — 추천 분기 전용 (분석 판정엔 영향 없음). questionnaire JSONB에 저장됨.
  const questionnaire = (session.questionnaire ?? {}) as Record<string, unknown>;
  const gender = questionnaire.gender as RecommendationGender | undefined;
  const situation = questionnaire.situation as RecommendationSituation | undefined;
  const imageStorageConsent =
    typeof questionnaire.imageStorageConsent === 'boolean'
      ? questionnaire.imageStorageConsent
      : null;
  const imageStorageWasPurged = typeof questionnaire._imageStoragePurgedAt === 'string';
  const imageStorageFailure =
    typeof questionnaire._imageStorageFailure === 'string'
      ? questionnaire._imageStorageFailure
      : null;

  // 왜: action-plan + cross-insights가 같은 AxisResult 입력을 받음 → 변환 1회로 공유
  const axisResults = {
    personalColor: toAxisResult<PersonalColorAxisData>(
      pcRecord,
      (r) => ({
        season: String(r.season ?? ''),
        tone: extractNested(r, 'image_analysis', 'tone') || String(r.season ?? ''),
        undertone: String(r.undertone ?? ''),
        confidence: Number(r.confidence ?? 0),
      }),
      fallbackStateFor('personal_color'),
      fetchFailedSet.has('personal_color')
    ),
    skin: toAxisResult<SkinAxisData>(
      axes.skin,
      (r) => ({
        skinType: String(r.skin_type ?? ''),
        overallScore: Number(r.overall_score ?? 0),
      }),
      fallbackStateFor('skin'),
      fetchFailedSet.has('skin')
    ),
    body: toAxisResult<BodyAxisData>(
      axes.body,
      (r) => ({
        bodyType: String(r.body_type ?? ''),
      }),
      fallbackStateFor('body'),
      fetchFailedSet.has('body')
    ),
    hair: toAxisResult<HairAxisData>(
      axes.hair,
      (r) => ({
        faceShape: String(r.face_shape ?? ''),
      }),
      fallbackStateFor('hair'),
      fetchFailedSet.has('hair')
    ),
    makeup: toAxisResult<MakeupAxisData>(
      axes.makeup,
      (r) => ({
        baseRecommendation: extractNested(r, 'recommendations', 'baseRecommendation'),
      }),
      fallbackStateFor('makeup'),
      fetchFailedSet.has('makeup')
    ),
  };

  // ADR-104 체크리스트 #2: 결정론적 규칙 기반 액션 플랜 (성별/상황 분기)
  const actionPlan = composeActionPlan({ ...axisResults, gender, situation });

  // ADR-104 체크리스트 #4: 축 조합 인사이트 (0-5개)
  const crossInsights = composeCrossInsights(axisResults);

  // ADR-104 체크리스트 #5: 통합 큐레이션 (세션 기반 제품 세트)
  // 왜: 옷장이 비면 outfit 카드 CTA를 "먼저 옷장 등록하기"로 우회
  // 실제 제품 3개(지갑 여는 세트)는 병렬로 매칭 — 없으면 링크 카드 폴백
  const pcData = axisResults.personalColor.success ? axisResults.personalColor.data : null;
  const skinData = axisResults.skin.success ? axisResults.skin.data : null;
  const bodyData = axisResults.body.success ? axisResults.body.data : null;
  const hairData = axisResults.hair.success ? axisResults.hair.data : null;

  // 공유카드 히어로 = 진단명(퍼컬 문화의 자랑 라벨 — 문장이 아니라 라벨이 공유됨, 7/15 조사).
  // 퍼컬 실패 시 undefined → 카드에서 은유(oneLine)가 히어로 자리를 유지.
  const pcToneName = pcData
    ? toneKo(pcData.tone, uiLocale) || seasonKo(pcData.season, uiLocale)
    : undefined;

  // 공유카드/드레이핑 팔레트 — 해석 규칙은 resolveCardPalettes 참조
  const {
    best: personaPalette,
    avoid: personaWorst,
    accent: personaAccents,
    metals: personaMetals,
  } = resolveCardPalettes(pcRecord, pcData, uiLocale);

  // 서명 뱃지 — 퍼컬 외 성공 축만(퍼컬은 히어로가 담당, 중복 금지). 실패 축 지어내지 않음.
  const personaBadges: PersonaBadge[] = [
    skinData && { label: t('axes.skin'), value: skinTypeKo(skinData.skinType, uiLocale) },
    bodyData && { label: t('axes.body'), value: getBodyShapeLabel(bodyData.bodyType, uiLocale) },
    hairData && { label: t('axes.hair'), value: faceShapeKo(hairData.faceShape, uiLocale) },
  ].filter((b): b is PersonaBadge => Boolean(b && b.value));
  const [hasClosetItems, curationProducts, issueNo, faceImageUrl] = await Promise.all([
    hasAnyClosetItems(),
    fetchCurationProducts({
      skinType: skinData?.skinType,
      personalColorSeason: pcData?.season,
      undertone: pcData?.undertone,
      gender: gender ?? 'neutral',
    }),
    fetchIssueNo(session.created_at),
    fetchFaceUrl(accessibleFaceImagePath),
  ]);
  const curation = composeCuration({
    ...axisResults,
    sessionId: session.id,
    hasClosetItems,
    gender,
  });

  // 축별 심화 링크 요약 (원시 영문값 노출 방지 — 공용 라벨 헬퍼 사용, 새 fetch 없음)
  const axisSummaries = buildAxisSummaries({ ...axes, personalColor: pcRecord }, uiLocale);

  // 진단지 리포트(공유 3번째 포맷, 2026-07-16) — 채점표(종합점수·매력도·레이더) 없이
  // 속성표 + 5축 요약 + 신뢰도 + 재현성으로 신뢰를 만든다(외모 점수화 금지 원칙).
  const reportAttrLabels: ReportAttrLabels = {
    season: t('reportCard.attrSeason'),
    tone: t('reportCard.attrTone'),
    undertone: t('reportCard.attrUndertone'),
    brightness: t('reportCard.attrBrightness'),
    saturation: t('reportCard.attrSaturation'),
    contrast: t('reportCard.attrContrast'),
    valueLight: t('reportCard.valueLight'),
    valueDeep: t('reportCard.valueDeep'),
    valueVivid: t('reportCard.valueVivid'),
    valueSoft: t('reportCard.valueSoft'),
    valueBalanced: t('reportCard.valueBalanced'),
    contrastLow: t('reportCard.contrastLow'),
    contrastMedium: t('reportCard.contrastMedium'),
    contrastHigh: t('reportCard.contrastHigh'),
  };
  // 계절 인장 — 리포트당 1개 절제(패널 합의)
  const reportSeal = sealTextFor(pcData, pcToneName, uiLocale);
  const pcSubtype = pcRecord ? extractNested(pcRecord, 'image_analysis', 'subtype') : '';
  const reportAttrs = buildReportAttrs(
    pcData,
    pcSubtype,
    pcRecord ? extractNested(pcRecord, 'image_analysis', 'contrastLevel') : '',
    uiLocale,
    reportAttrLabels,
    Boolean(reportSeal)
  );
  // 5축 요약 행 — 퍼컬은 속성표·히어로가 담당(중복 금지), 나머지 성공 축만.
  // 헤어 축 값은 얼굴형 판정이므로 라벨도 "얼굴형" — "헤어=계란형"은 범주 오류(시뮬 2인 지적)
  const reportAxisRows: ReportRow[] = (
    [
      ['skin', t('axes.skin'), axisSummaries.skin],
      ['body', t('axes.body'), axisSummaries.body],
      ['face', t('reportCard.faceShape'), axisSummaries.hair],
      ['makeup', t('axes.makeup'), axisSummaries.makeup],
    ] as const
  ).flatMap(([iconKey, label, value]) => (value ? [{ iconKey, label, value }] : []));
  // "왜 피해요?" — 12톤 서브타입 정의에서 파생(계측 아님, 정의 서술)
  const AVOID_REASON_BY_SUBTYPE: Record<string, string> = {
    light: t('reportCard.avoidReasonLight'),
    deep: t('reportCard.avoidReasonDeep'),
    dark: t('reportCard.avoidReasonDeep'),
    bright: t('reportCard.avoidReasonBright'),
    vivid: t('reportCard.avoidReasonBright'),
    muted: t('reportCard.avoidReasonMuted'),
    soft: t('reportCard.avoidReasonMuted'),
  };
  const reportAvoidNote = avoidNoteFor(
    pcData,
    pcSubtype,
    personaWorst.length > 0,
    AVOID_REASON_BY_SUBTYPE,
    t('reportCard.avoidReasonDefault')
  );
  const reportData: PersonaReportData = {
    attrs: reportAttrs,
    checklist: persona?.keyInsights,
    accents: personaAccents,
    metals: personaMetals,
    axisRows: reportAxisRows,
    skinNote: extractSkinConcerns(axes.skin),
    hairStyles: extractHairStyles(axes.hair),
    sealText: reportSeal,
    avoidNote: reportAvoidNote,
    actionItems: actionPlan.items.map(({ title, why }) => ({ title, why })),
    note: persona?.narrative,
    confidenceText: unknownSet.has('personal_color')
      ? t('unknownProvenance.confidenceLabel')
      : confidenceLabelFor(pcData, usedFallbackSet.has('personal_color'), (value) =>
          t('reportCard.confidence', { value })
        ),
    reproducibilityText: t('reportCard.repro'),
    dateText: new Date(session.created_at).toLocaleDateString(dateLocale),
  };

  return (
    <div
      className="min-h-[calc(100vh-80px)] bg-surface-ground"
      data-testid="integrated-result-page"
    >
      <div className="mx-auto max-w-lg space-y-6 px-4 py-8 md:max-w-[880px]">
        {/* 헤더 — 에디토리얼 리스킨(2026-07-15): 다크 섬 해체, 공개 리포트 아이브로우 관례 통일 */}
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">YIROOM REPORT</p>
          {/* 왜 "리포트": 이 페이지는 세션 1회의 기록 — "내 정체성 5축 결과"는 프로필 전체를
              주장하는 제목이라 부분 세션에서 "완성 5/5인데 왜 3축이 없어?" 모순을 유발했음 */}
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t('meta.title')}</h1>
          <p className="text-xs text-muted-foreground">
            {new Date(session.created_at).toLocaleString(dateLocale)}
          </p>
        </header>

        {/* ADR-104 체크리스트 #1: 나 프로필 내러티브 (상단 히어로).
            왜 최상단: 첫 미팅 산출물은 verdict가 먼저다 — 경고 2종이 히어로보다 먼저
            렌더되던 에러-퍼스트 위계를 교정(2026-08 배치 D). 정직성 계약(문구·
            usedFallback 노출·재분석 링크)은 아래 배너 2종에 전량 보존, 순서만 조정 */}
        <PersonaNarrativeCard persona={persona} />

        {/* Partial Success 안내 — 히어로 바로 아래(정직성 유지, 위계만 격하) */}
        <PartialSuccessBanner axesCompleted={axesCompleted} axesFailed={axesFailed} />

        {/* 정직성: Mock Fallback으로 대체된 축을 샘플 결과로 명시 (감사 B7) */}
        <AxisFallbackNotice usedFallback={usedFallbackAxes} unknownAxes={unknownAxes} />

        {/* 프로필 폴백 고지 — 이번 세션에 없던 축을 최신 진단으로 채웠음을 정직하게 표시
            (선택 재분석에서 유지한 축·단독 진단만 마친 축 모두 포함) */}
        {profileFallbackLabels && (
          <p
            className="rounded-2xl border bg-card px-4 py-3 text-xs text-muted-foreground"
            data-testid="profile-fallback-notice"
          >
            {t('profileFallback', { axes: profileFallbackLabels })}
          </p>
        )}

        {/* 정체성 공유 카드 — "뽐내기" 정서(2026-07-12 인사이트): 페르소나를 자랑 가능한
            이미지 배지로. 사진 미포함(생체정보), 성공 축 뱃지만 표시 */}
        {persona?.oneLine && (
          <PersonaShareSection
            oneLine={persona.oneLine}
            toneName={pcToneName}
            badges={personaBadges}
            palette={personaPalette}
            worstPalette={personaWorst}
            serialNo={issueNo}
            report={reportData}
            reportPhotoUrl={faceImageUrl}
          />
        )}

        {/* 드레이핑 비교 — 내 사진 + 진단 베스트/워스트 색천(캔버스 합성, 기기 내 처리).
            퍼컬 성공 + 사진이 있을 때만 (지어내지 않음) */}
        {faceImageUrl && personaPalette.length > 0 && (
          <DrapingSectionDynamic
            imageUrl={faceImageUrl}
            bestColors={personaPalette}
            worstColors={personaWorst}
            tone={resolveDrapingTone(pcData?.season, pcSubtype)}
          />
        )}

        {/* 얼굴 포함 드레이핑 카드 — 명시적 옵트인(기본 OFF)·기기 내 생성·서버 미저장.
            디폴트 공유는 여전히 얼굴 없는 PersonaShareSection이 담당 */}
        {faceImageUrl && personaPalette.length > 0 && (
          <DrapingShareSection
            imageUrl={faceImageUrl}
            toneName={pcToneName}
            bestColors={personaPalette}
            serialNo={issueNo}
          />
        )}

        {!faceImageUrl && personaPalette.length > 0 && (
          <IntegratedImageStorageNotice
            consentGiven={imageStorageConsent}
            wasPurged={imageStorageWasPurged}
            storageFailure={imageStorageFailure}
            accessState={storedImageAccessState}
          />
        )}

        {/* ADR-104 체크리스트 #2: 다음 행동 3단계 */}
        <ActionPlanCard plan={actionPlan} />

        {/* 결과 → 루틴 다리 — 관계 5단계 '첫 미팅 → 매일 브리핑' 고리.
            분석이 1회성 리포트로 끝나지 않고 매일의 관리로 이어지는 정적 링크
            (NextStepsLinks 카드 행 문법 재사용) */}
        <Link
          href="/capsule/daily"
          className="group flex items-center gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-secondary/50"
          data-testid="routine-bridge-link"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
            <CalendarCheck className="h-5 w-5 text-primary" />
          </div>
          <p className="min-w-0 flex-1 text-sm font-semibold text-foreground">
            {t('routineBridge.title')}
          </p>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        </Link>

        {/* ADR-104 체크리스트 #4: 축 간 연결 인사이트 */}
        <CrossInsightsCard insights={crossInsights} />

        {/* ADR-104 체크리스트 #5: 통합 큐레이션 (제품 세트 + 실제 제품 3개) */}
        <CurationCard curation={curation} products={curationProducts} />

        {/* 더 깊이 — 축별 심화 링크 (개별 결과 페이지가 축 상세의 정본, ADR-111 One Canon).
            실패 축은 '미완성' 행으로 노출해 회복 경로(다시 촬영)를 제공 */}
        <NextStepsLinks
          axesCompleted={axesCompleted}
          axesFailed={axesFailed}
          axisSummaries={axisSummaries}
        />

        {/* 스타일 리포트 공유 — 사진 없는 공개 링크 (바이럴 루프) */}
        <ShareReportButton sessionId={session.id} />

        {/* 하단 안내 */}
        <div className="space-y-1 pt-4 text-center text-[11px] text-muted-foreground">
          {/* 재현성 실측 — 과장 없이 "같은 입력 → 같은 판정"만 (퍼스널컬러·피부에서 검증) */}
          <p>{t('footer.reproducibility')}</p>
          <p>
            {usedFallbackAxes.length > 0 || unknownAxes.length > 0
              ? t('footer.referenceDisclaimer')
              : t('footer.aiDisclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
}
