'use client';

import { useState } from 'react';
import {
  Brush,
  Contrast,
  Droplet,
  Droplets,
  Gem,
  Heart,
  Leaf,
  Palette,
  Shirt,
  Sun,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import {
  type PersonalColorResult,
  type GroomingRecommendation,
  type ClothingRecommendation,
  type StyleDescription,
  type SeasonType,
  type ColorInfo,
  type FoundationRecommendation,
  SEASON_INFO,
  GROOMING_RECOMMENDATIONS,
  MALE_CLOTHING_RECOMMENDATIONS,
  MALE_STYLE_DESCRIPTIONS,
} from '@/lib/mock/personal-color';
import { ScaleIn } from '@/components/animations';
import { MockDataNotice } from '@/components/common/MockDataNotice';
import { TopActionsCard, type TopAction } from '@/components/analysis/TopActionsCard';
import { ProgressiveDisclosure } from '@/components/common/ProgressiveDisclosure';
import { getKoreanColorName } from '@/lib/utils/color-names';
import { TextureSwatch, type TextureKind } from '@/components/share/TextureSwatch';
import { PAPER_GRAIN_URI } from '@/components/share/paper-grain';
import { getCardPalette, type CardLocale } from '@/lib/share/tone-palettes';
import { useLocale } from 'next-intl';
import { getDateLocale } from '@/lib/utils/date-format';
import {
  PersonalColorEvidenceSummary,
  type PersonalColorEvidenceSummaryProps,
} from '@/components/analysis/EvidenceSummary';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getGenderAdaptiveTerm, type GenderPreference } from '@/lib/content/gender-adaptive';
import { selectByKey } from '@/lib/utils/conditional-helpers';
import { toast } from 'sonner';
import {
  ReportEyebrow,
  SectionHeader,
  AttrRow,
  RowTable,
  TrustFooter,
} from '@/components/analysis/report';
import { getRelativeLuminance, hexToRgb } from '@/lib/a11y';
import { TONE_PALETTES, type TwelveTone, type TonePalette } from '@/lib/analysis/personal-color-v2';
import { cn } from '@/lib/utils';

// 계절 인장 텍스트 — 점수 없는 타입 확정 스탬프(진단지 문법). 히어로 진단명(한국어)과
// 겹치지 않도록 영문 세리프로 — 아이브로우(PERSONAL COLOR REPORT) 영문 관례와 세트
const SEASON_SEAL: Record<SeasonType, string> = {
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
};

// 퍼스널 대비(모발-피부 명도 실측, ADR-116) 안내 — 호스트(result 페이지)의 인디고 박스를
// 진단 속성표 행 + 풀이 한 줄로 흡수. 실측값이 있을 때만 렌더(지어내지 않음)
const CONTRAST_COPY: Record<'low' | 'medium' | 'high', { label: string; line: string }> = {
  low: {
    label: '낮은 대비',
    line: '얼굴의 밝고 어두움 차이(대비)가 낮은 편이에요 — 톤온톤·인접 명도 배색이 잘 어울려요.',
  },
  medium: {
    label: '중간 대비',
    line: '얼굴의 밝고 어두움 차이(대비)가 중간이에요 — 배색 강도를 자유롭게 조절해도 잘 받아요.',
  },
  high: {
    label: '높은 대비',
    line: '얼굴의 밝고 어두움 차이(대비)가 높은 편이에요 — 명확한 명암 배색·진한 발색이 잘 어울려요.',
  },
};

// "왜 피해요?" 한 줄 — 시즌 정의에서 파생(계측 아님, 정의 서술)
const AVOID_NOTES: Record<SeasonType, string> = {
  spring: '어둡고 탁한 색은 봄 웜톤의 맑은 혈색을 가라앉혀 보이게 해요.',
  summer: '강한 원색과 노란 기가 도는 색은 여름 쿨톤의 부드러운 인상을 흐려요.',
  autumn: '차갑고 선명한 파스텔은 가을 웜톤의 깊이를 밋밋하게 만들어요.',
  winter: '흐릿한 중간 톤은 겨울 쿨톤의 또렷한 대비를 죽여요.',
};

// "왜 이 색이 어울리나" 한 줄 — 구 상세 리포트 탭(2026-08-01 삭제) 시즌 설명의
// whyThisColor를 이관. 언더톤 근거까지 담아 팔레트 섹션의 짧은 문구를 승격한다(시즌 정의 서술)
const SEASON_WHY: Record<SeasonType, string> = {
  spring:
    '봄 웜톤은 피부에 노란 언더톤이 있어서, 따뜻하고 맑은 색상이 피부를 밝고 건강하게 보이게 해요.',
  summer:
    '여름 쿨톤은 피부에 핑크 언더톤이 있어서, 부드럽고 시원한 파스텔 계열이 피부를 맑게 보이게 해요.',
  autumn:
    '가을 웜톤은 피부에 황금빛 언더톤이 있어서, 깊고 따뜻한 어스 톤이 피부에 깊이감을 더해줘요.',
  winter:
    '겨울 쿨톤은 피부에 푸른 언더톤이 있어서, 선명하고 대비가 강한 색이 얼굴에 생동감을 줘요.',
};

// 입술 자연색 → 판정 근거 1줄 — 구 상세 탭 "내 분석 근거" 문구 이관.
// neutral은 어느 톤의 근거도 아니라 미표시(지어내지 않음)
const LIP_EVIDENCE_NOTES: Record<'pink' | 'coral', string> = {
  pink: '입술 자연색이 핑크빛이라 쿨톤 근거가 돼요.',
  coral: '입술 자연색이 코랄빛이라 웜톤 근거가 돼요.',
};

/**
 * 구 상세 탭 톤 스펙트럼 바 흡수 — veinScore(0~100 쿨톤 확률)를 판정 톤 기준 경향(%)으로
 * 환산해 속성표 행 + 풀이 1줄로. 구 표기는 웜톤에서도 쿨톤 확률 수치를 그대로 라벨링하던
 * 결함이 있어(웜톤 25% 표기), 웜톤은 100-veinScore로 정직하게 환산한다.
 * 실측값이 없으면(0 또는 미저장) undefined — 행 미렌더.
 * @internal export는 테스트 전용
 */
export function deriveToneTendency(
  tone: PersonalColorResult['tone'],
  veinScore?: number
): { value: string; note: string } | undefined {
  if (veinScore === undefined || veinScore <= 0 || veinScore > 100) return undefined;
  const isCool = tone === 'cool';
  const strength = isCool ? veinScore : 100 - veinScore;
  const toneLabel = isCool ? '쿨톤' : '웜톤';
  let note: string;
  if (strength > 70) {
    note = isCool
      ? '뚜렷한 쿨톤이에요. 시원한 계열의 색상이 잘 어울려요.'
      : '뚜렷한 웜톤이에요. 따뜻한 계열의 색상이 잘 어울려요.';
  } else if (strength > 40) {
    note = '중성 톤에 가까워서 다양한 색상을 소화할 수 있어요.';
  } else {
    note = isCool
      ? '약한 쿨톤이에요. 따뜻한 색도 어느 정도 어울려요.'
      : '약한 웜톤이에요. 시원한 색도 어느 정도 어울려요.';
  }
  return { value: `${toneLabel} 경향 ${strength}%`, note };
}

// 12톤 서브타입 접두사 → 명도·채도 정의 서술 (12톤 표준 정의에서 파생 — 계측이 아니라 톤 정의).
// 키 = paletteToneKey 접두사, PERSONAL_COLOR_SUBTYPES shortLabel과 1:1 대응
// (light=라이트, bright=브라이트, true=트루, muted=뮤트, deep=딥) — 라벨 정본과 일치 확인됨
const SUBTYPE_ATTRS: Record<string, { brightness: string; saturation: string }> = {
  light: { brightness: '높은 명도', saturation: '부드러운 채도' },
  bright: { brightness: '높은 명도', saturation: '높은 채도' },
  true: { brightness: '중간 명도', saturation: '중간 채도' },
  muted: { brightness: '중간 명도', saturation: '차분한 채도' },
  deep: { brightness: '낮은 명도', saturation: '풍부한 채도' },
};

// paletteToneKey('muted-summer' 등 12톤 키)에서 명도·채도 정의 서술 파생 — 시즌 키('spring' 등,
// 서브타입 미저장 구 데이터)면 undefined 반환 → 행 미렌더(지어내지 않음)
function deriveSubtypeAttrs(
  paletteToneKey?: string
): { brightness: string; saturation: string } | undefined {
  if (!paletteToneKey || !paletteToneKey.includes('-')) return undefined;
  return SUBTYPE_ATTRS[paletteToneKey.split('-')[0]];
}

// 회피 칩 취소선 색 — 어두운 칩에서 검정 취소선이 식별 불가하므로 칩 명도에 따라 흰색 전환.
// 0.179 = 흰/검 텍스트 대비율이 교차하는 상대 휘도 경계(WCAG 공식 파생).
// culori는 devDependency 테스트 오라클 전용(런타임 반입 금지 계약) — lib/a11y contrast-utils 재사용.
// @internal export는 테스트 전용 (jsdom이 linear-gradient 스타일을 보존하지 않아 단위 검증 필요)
export function getAvoidStrokeColor(hex: string): string {
  return getRelativeLuminance(hexToRgb(hex)) <= 0.179
    ? 'rgba(255,255,255,0.6)'
    : 'rgba(0,0,0,0.45)';
}

// paletteToneKey가 v2 12톤 키일 때만 톤 팔레트 총람(정적 정의 데이터) 조회 — 없는 키는 미렌더
function getTonePaletteOverview(paletteToneKey?: string): TonePalette | undefined {
  if (!paletteToneKey || !(paletteToneKey in TONE_PALETTES)) return undefined;
  return TONE_PALETTES[paletteToneKey as TwelveTone];
}

// ─── R1 색명에 색 동행 — 이 결과에 이미 실린 색 데이터(베스트·회피·포인트·금속·립·그루밍)만
// 소스로 색명→hex 사전을 조립한다. 신규 색 반입 0 — 사전에 없는 색명은 스와치 없이 텍스트 유지.
// @internal export는 테스트 전용
export function buildNamedHexMap(
  sources: ReadonlyArray<ReadonlyArray<{ name?: string; hex: string }>>
): Map<string, string> {
  const map = new Map<string, string>();
  for (const list of sources) {
    for (const { name, hex } of list) {
      if (!name) continue;
      const key = name.replace(/\s+/g, '');
      // 같은 이름이 여러 소스에 있으면 먼저 등록된 소스(베스트 팔레트) 우선 — 진단 팔레트가 정본
      if (!map.has(key)) map.set(key, hex);
    }
  }
  return map;
}

// 색명 → 결과 데이터의 hex. 정확 일치 우선, 없으면 색명 안에 포함된 가장 긴 등록 색명으로
// 폴백('피치 핑크' ⊃ '피치' — 기존 hex 재사용일 뿐 새 색을 지어내지 않는다).
// 매핑 실패는 undefined — 호출부가 무스와치로 렌더한다.
// @internal export는 테스트 전용
export function resolveNamedHex(map: Map<string, string>, name: string): string | undefined {
  const key = name.replace(/\s+/g, '');
  const exact = map.get(key);
  if (exact) return exact;
  let bestKey: string | undefined;
  for (const candidate of map.keys()) {
    // 2글자 미만 후보는 우연 일치 위험이 커 제외 ('레드'·'골드' 등 2글자부터 허용)
    if (candidate.length >= 2 && key.includes(candidate)) {
      if (!bestKey || candidate.length > bestKey.length) bestKey = candidate;
    }
  }
  return bestKey ? map.get(bestKey) : undefined;
}

// ─── G6 색명 동의 표기쌍 — 같은 색의 한글/외래 표기(순수 표기 번역). 결과 데이터에 이미 실린
// hex를 다른 표기로도 찾게 등록할 뿐, 새 hex를 만들지 않는다(회피 행 "신규 hex 금지" 계약).
const COLOR_NAME_SYNONYM_PAIRS: ReadonlyArray<[string, string]> = [
  ['검정', '블랙'],
  ['검은색', '블랙'],
  ['흰색', '화이트'],
  ['회색', '그레이'],
  ['남색', '네이비'],
  ['빨간색', '레드'],
  ['빨강', '레드'],
  ['주황색', '오렌지'],
  ['주황', '오렌지'],
  ['보라', '퍼플'],
];

/**
 * 등록된 색명의 동의 표기를 같은 hex로 추가 등록 — 회피 칩('검정' vs worstColors '블랙')처럼
 * 표기만 다른 결손을 해소한다. 양쪽 다 없으면 아무것도 하지 않는다(지어내기 금지).
 * @internal export는 테스트 전용
 */
export function registerColorNameSynonyms(map: Map<string, string>): Map<string, string> {
  for (const [a, b] of COLOR_NAME_SYNONYM_PAIRS) {
    const hexA = map.get(a);
    const hexB = map.get(b);
    if (hexA !== undefined && !map.has(b)) map.set(b, hexA);
    else if (hexB !== undefined && !map.has(a)) map.set(a, hexB);
  }
  return map;
}

// ─── G7 표준 색명 사전 — getKoreanColorName 계열 색명(레드·코랄·…·로즈)과 패션 통용 표기의
// 표준 hex 상수(CSS 표준색·관용 표준색). 진단 데이터가 아니라 표준 색명의 표기 번역이며,
// 통용 hex가 하나로 수렴하지 않는 색명(카키 등)과 재질명(진주 등)은 싣지 않는다 — 매핑 실패는
// 무색 유지가 계약. 진단 결과에 실린 색이 항상 우선(resolveRecommendedHex 참조).
// 한계: resolveNamedHex의 부분일치는 단방향(질의 ⊃ 등록명)만 — 질의가 등록명보다 짧으면
// 표준 사전 폴백으로 넘어간다(역방향 최장일치는 '핑크'⊃'피치핑크' 오탐 위험으로 비채택).
const STANDARD_COLOR_ENTRIES: ReadonlyArray<{ name: string; hex: string }> = [
  { name: '화이트', hex: '#FFFFFF' },
  { name: '아이보리', hex: '#FFFFF0' },
  { name: '베이지', hex: '#F5F5DC' },
  { name: '블랙', hex: '#000000' },
  { name: '그레이', hex: '#808080' },
  { name: '라이트 그레이', hex: '#D3D3D3' },
  { name: '차콜', hex: '#36454F' },
  { name: '네이비', hex: '#000080' },
  { name: '블루', hex: '#0000FF' },
  { name: '스카이블루', hex: '#87CEEB' },
  { name: '하늘색', hex: '#87CEEB' },
  { name: '민트', hex: '#3EB489' },
  { name: '그린', hex: '#008000' },
  { name: '올리브', hex: '#808000' },
  { name: '레드', hex: '#FF0000' },
  { name: '버건디', hex: '#800020' },
  { name: '와인', hex: '#722F37' },
  { name: '코랄', hex: '#FF7F50' },
  { name: '오렌지', hex: '#FFA500' },
  { name: '겨자색', hex: '#FFDB58' },
  { name: '골드', hex: '#FFD700' },
  { name: '옐로', hex: '#FFFF00' },
  { name: '노란색', hex: '#FFFF00' },
  { name: '연노랑', hex: '#FFFFE0' },
  { name: '핑크', hex: '#FFC0CB' },
  { name: '분홍', hex: '#FFC0CB' },
  { name: '연분홍', hex: '#FFB6C1' },
  { name: '진분홍', hex: '#FF1493' },
  { name: '로즈', hex: '#FF007F' },
  { name: '퍼플', hex: '#800080' },
  { name: '바이올렛', hex: '#EE82EE' },
  { name: '라벤더', hex: '#E6E6FA' },
  { name: '연보라', hex: '#C8A2C8' },
  { name: '브라운', hex: '#8B4513' },
  { name: '갈색', hex: '#8B4513' },
  { name: '카멜', hex: '#C19A6B' },
  { name: '살구색', hex: '#FBCEB1' },
];

// 표준 사전도 같은 정규화·부분 폴백 규칙을 태우기 위해 Map으로 조립(동의 표기까지 등록)
const STANDARD_NAME_MAP = registerColorNameSynonyms(buildNamedHexMap([STANDARD_COLOR_ENTRIES]));

/**
 * G7 패션 '추천 컬러' 해석 — 진단 결과 데이터 우선, 없으면 표준 색명 사전 폴백.
 * 둘 다 실패하면 undefined(무색 유지). 회피 행에는 쓰지 않는다(신규 hex 금지 — G6).
 * @internal export는 테스트 전용
 */
export function resolveRecommendedHex(map: Map<string, string>, name: string): string | undefined {
  return resolveNamedHex(map, name) ?? resolveNamedHex(STANDARD_NAME_MAP, name);
}

/** R1 색명 동행 스와치 — 14px 실색 사각 전치. hex 매핑이 없으면 렌더하지 않는다(지어내기 금지) */
function NamedColorDot({ hex }: { hex?: string }): React.JSX.Element | null {
  if (!hex) return null;
  return (
    <span
      className="inline-block h-3.5 w-3.5 shrink-0 rounded-[4px] border border-border/60"
      style={{ backgroundColor: hex }}
      aria-hidden="true"
    />
  );
}

// ─── R2 계절 인장 색 — 라이트 시즌색 채움 + 다크 전경(백색 텍스트 금지, 명도 대비 확보).
// 진단 hex가 아닌 장식 오브젝트 토큰(도장 잉크) — 시즌 계열 색상으로 고정, 채도 증폭 없음.
const SEASON_SEAL_COLORS: Record<SeasonType, { bg: string; fg: string }> = {
  spring: { bg: '#F9E4D4', fg: '#8A4B2B' },
  summer: { bg: '#E4E8F3', fg: '#4A5480' },
  autumn: { bg: '#EFE4CE', fg: '#6E4E26' },
  winter: { bg: '#E3E8EE', fg: '#33415C' },
};

/** 계절 인장 — 점수 없는 타입 확정 스탬프. 시즌색 채움 + 미세 섀도 + rotate(지면 위 도장) */
function SeasonSeal({
  seasonType,
  seasonLabel,
  className,
}: {
  seasonType: SeasonType;
  seasonLabel: string;
  className?: string;
}): React.JSX.Element {
  const { bg, fg } = SEASON_SEAL_COLORS[seasonType];
  return (
    <div
      className={cn(
        'flex h-[76px] w-[76px] rotate-3 flex-col items-center justify-center gap-0.5 rounded-full border-[1.5px] shadow-[var(--shadow-rest)] dark:shadow-none',
        className
      )}
      // 도장 잉크 — 라이트 시즌색 채움 + 다크 전경 + 전경 계열 테두리(hex 알파 35%)
      style={{ backgroundColor: bg, borderColor: `${fg}59` }}
      data-testid="pc-season-seal"
    >
      <span
        className="break-keep px-1.5 text-center font-serif text-sm italic leading-tight"
        style={{ color: fg }}
      >
        {SEASON_SEAL[seasonType]}
      </span>
      {/* opacity 감산 금지 — 라이트 시즌 배경 위 10px 라벨이 AA(4.5:1) 미달됨(리뷰 실측) */}
      <span
        className="break-keep px-1.5 text-center text-[10px] leading-tight"
        style={{ color: fg }}
      >
        {seasonLabel}
      </span>
    </div>
  );
}

// 분석 근거 타입 (AnalysisEvidenceReport와 호환)
interface AnalysisEvidence {
  veinColor?: PersonalColorEvidenceSummaryProps['veinColor'];
  skinUndertone?: PersonalColorEvidenceSummaryProps['skinUndertone'];
  /** 0~100 쿨톤 확률 — 구 상세 탭 톤 스펙트럼의 데이터 원천(deriveToneTendency로 흡수) */
  veinScore?: number;
  /** 입술 자연색 — 판정 근거 보조(구 상세 탭 "내 분석 근거" 흡수) */
  lipNaturalColor?: 'coral' | 'pink' | 'neutral';
}

interface AnalysisResultProps {
  result: PersonalColorResult;
  evidence?: AnalysisEvidence | null;
  /** 퍼스널 대비 실측값(ADR-116) — 호스트가 저장값이 있을 때만 전달(없으면 행 미렌더) */
  contrastLevel?: 'low' | 'medium' | 'high' | null;
  /** 분석 원본 사진 URL — 있으면 md+ 히어로를 2단(사진|진단명)으로. 없으면 현 레이아웃(데모·구 데이터 폴백) */
  photoUrl?: string;
  /**
   * 공개 데모 등 "내 사진이 아닌 예시 결과"일 때 true — 시트 안에 샘플 고지 배지를 인쇄한다.
   * (시트만 캡처되면 진짜 진단과 구분할 수 없으므로 고지는 시트 내부에 있어야 한다)
   */
  isSample?: boolean;
}

// "그래서, 이렇게 하세요" 액션 조립 — 규칙 기반 (새 fetch/AI 없음). 컴포넌트 복잡도 절감 위해 분리.
function buildTopActions(args: {
  bestColors: PersonalColorResult['bestColors'];
  personalizedColors: PersonalColorResult['personalizedColors'];
  seasonLabel: string;
  isMale: boolean;
  lipstickRecommendations: PersonalColorResult['lipstickRecommendations'];
  groomingRecommendations: GroomingRecommendation[];
  actionTip?: string;
}): TopAction[] {
  const {
    bestColors,
    personalizedColors,
    seasonLabel,
    isMale,
    lipstickRecommendations,
    groomingRecommendations,
    actionTip,
  } = args;
  const actions: TopAction[] = [];

  // ① 베스트 컬러 3가지부터
  if (bestColors.length > 0) {
    actions.push({
      title: '베스트 컬러 3가지부터 활용해보세요',
      detail: personalizedColors
        ? '내 사진에서 찾은 맞춤 컬러예요'
        : `${seasonLabel} 타입에 잘 어울리는 컬러예요`,
      swatches: bestColors
        .slice(0, 3)
        .map((c) => ({ hex: c.hex, name: getKoreanColorName(c.hex) })),
    });
  }

  // ② 립(여성)/그루밍(남성) 첫 추천 — 립 데이터 없으면 그루밍 대체, 둘 다 없으면 생략
  if (!isMale && lipstickRecommendations.length > 0) {
    const lip = lipstickRecommendations[0];
    actions.push({
      title: `${lip.colorName} 립부터 발라보세요`,
      detail: lip.brandExample ?? lip.easyDescription,
      swatches: [{ hex: lip.hex, name: lip.colorName }],
    });
  } else if (isMale && groomingRecommendations.length > 0) {
    const g = groomingRecommendations[0];
    actions.push({
      title: `${g.itemName}부터 챙겨보세요`,
      detail: g.easyDescription ?? g.brandExample,
      swatches: [{ hex: g.hex, name: g.itemName }],
    });
  }

  // ③ 초보자 실천 팁
  if (actionTip) {
    actions.push({ title: actionTip });
  }

  return actions;
}

// next-intl 로케일 → 카드 팔레트 로케일 (미지원 로케일은 ko)
function toCardLocale(locale: string): CardLocale {
  return locale === 'en' || locale === 'ja' || locale === 'zh' ? locale : 'ko';
}

/** 소형 스와치 행(포인트·금속) — 색칩 + 이름. texture 지정 시 화장품 발색 질감으로 렌더 */
function SwatchChips({
  colors,
  testId,
  texture,
}: {
  colors: Array<{ hex: string; name?: string }>;
  testId: string;
  texture?: TextureKind;
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5" data-testid={testId}>
      {colors.map((c, i) => (
        <span key={`${c.hex}-${i}`} className="flex items-center gap-1.5">
          {texture ? (
            <TextureSwatch hex={c.hex} kind={texture} width={44} className="shrink-0" />
          ) : (
            <span
              className="h-4 w-4 rounded-full border border-border"
              style={{ backgroundColor: c.hex }}
              aria-hidden="true"
            />
          )}
          {c.name && <span className="text-xs text-muted-foreground">{c.name}</span>}
        </span>
      ))}
    </div>
  );
}

/** 진단 속성표(히어로 흡수, G1) — RowTable(+12톤 명도·채도 정의 행+톤 경향 실측 행) + 풀이 + 결론 + 판정 근거 요약 */
function AttrsSectionBody({
  seasonLabel,
  tone,
  characteristics,
  contrastLevel,
  evidence,
  subtypeAttrs,
  toneTendency,
  lipNote,
}: {
  seasonLabel: string;
  tone: PersonalColorResult['tone'];
  characteristics: string;
  contrastLevel?: 'low' | 'medium' | 'high' | null;
  evidence?: AnalysisEvidence | null;
  /** 12톤 서브타입 저장 건에서만 파생되는 명도·채도 정의 서술 — 없으면 행 미렌더 */
  subtypeAttrs?: { brightness: string; saturation: string };
  /** veinScore 실측 건에서만 파생되는 톤 경향(구 상세 탭 톤 스펙트럼 흡수) — 없으면 행 미렌더 */
  toneTendency?: { value: string; note: string };
  /** 입술 자연색 판정 근거 1줄(구 상세 탭 "내 분석 근거" 흡수) — 없으면 미렌더 */
  lipNote?: string;
}) {
  return (
    <div>
      <RowTable testId="pc-report-attrs">
        <AttrRow icon={Leaf} label="계절" value={seasonLabel} />
        <AttrRow
          icon={Droplets}
          label="언더톤"
          value={tone === 'warm' ? '웜 (옐로 베이스)' : '쿨 (핑크 베이스)'}
        />
        {/* 톤 경향 실측 행 — veinScore(쿨톤 확률) 저장 건에 한해(구 상세 탭 흡수) */}
        {toneTendency && <AttrRow icon={Droplet} label="톤 경향" value={toneTendency.value} />}
        {/* 12톤 정의 서술 행 — season_subtype 저장 건에 한해(정의 서술이지 계측 아님) */}
        {subtypeAttrs && (
          <>
            <AttrRow icon={Sun} label="명도" value={subtypeAttrs.brightness} />
            <AttrRow icon={Palette} label="채도" value={subtypeAttrs.saturation} />
          </>
        )}
        {contrastLevel && (
          <AttrRow icon={Contrast} label="대비" value={CONTRAST_COPY[contrastLevel].label} />
        )}
      </RowTable>
      {/* 톤 경향 풀이 — 뚜렷함/중성 정도 1줄 (구 톤 스펙트럼 바의 텍스트 핵심만 흡수) */}
      {toneTendency && (
        <p
          className="mt-2 text-xs leading-relaxed text-muted-foreground"
          data-testid="pc-tone-tendency-note"
        >
          {toneTendency.note}
        </p>
      )}
      {/* 퍼스널 대비 풀이 — 판정 보조 1줄 (구 인디고 박스 흡수, ADR-116) */}
      {contrastLevel && (
        <p
          className="mt-2 text-xs leading-relaxed text-muted-foreground"
          data-testid="pc-contrast-note"
        >
          {CONTRAST_COPY[contrastLevel].line}
        </p>
      )}
      {/* 결론 승격 — 특성 문단을 라벨 붙은 결론 블록으로 (목업 m03 결론 박스 문법) */}
      <div className="mt-3 rounded-lg bg-muted/60 px-3.5 py-2.5" data-testid="pc-attrs-conclusion">
        <p className="text-xs font-semibold text-primary">결론</p>
        <p className="mt-1 break-keep text-sm leading-relaxed text-foreground/80">
          {characteristics}
        </p>
      </div>
      {/* 핵심 판정 근거 요약 */}
      <PersonalColorEvidenceSummary
        veinColor={evidence?.veinColor}
        skinUndertone={evidence?.skinUndertone}
        tone={tone}
        className="mt-4"
      />
      {/* 입술 자연색 근거 보조 1줄 — 혈관·언더톤(요약 칩)에 없는 세 번째 근거만 텍스트로 */}
      {lipNote && (
        <p
          className="mt-2 text-xs leading-relaxed text-muted-foreground"
          data-testid="pc-lip-evidence-note"
        >
          {lipNote}
        </p>
      )}
    </div>
  );
}

/** 02 컬러 팔레트 — 베스트 연속 스트립(이름·hex 명세) + 포인트·금속 큐레이션 + 취소선 회피 칩 + 톤 총람 */
function PaletteSectionBody({
  bestColors,
  worstColors,
  accentColors,
  metalColors,
  personalizedColors,
  seasonLabel,
  seasonType,
  tonePalette,
}: {
  bestColors: ColorInfo[];
  worstColors: ColorInfo[];
  accentColors: Array<{ hex: string; name?: string }>;
  metalColors: Array<{ hex: string; name?: string }>;
  personalizedColors?: boolean;
  seasonLabel: string;
  seasonType: SeasonType;
  /** 12톤 표준 정의 팔레트(v2 정적 데이터) — paletteToneKey가 12톤 키일 때만 존재 */
  tonePalette?: TonePalette;
}) {
  return (
    // R5 md+ 2열 — 좌 베스트 그리드 | 우 큐레이션(포인트·금속·회피·총람). 모바일 1열 불변
    <div className="space-y-5 md:grid md:grid-cols-2 md:items-start md:gap-x-10 md:space-y-0">
      <div>
        <p className="text-xs font-medium text-muted-foreground">
          베스트 컬러
          <span className="ml-1.5 font-normal">
            {personalizedColors
              ? '내 사진에서 찾은 맞춤 컬러예요'
              : `${seasonLabel} 타입에 잘 어울리는 컬러예요`}
          </span>
        </p>
        {/* 연속 페인트 스트립(G3) — 낱개 색카드 대신 간격 0 색면 이음(높이 72px), 양끝만
            미세 라운드(래퍼 클립). 히어로 풀블리드 스트립과 역할 구분: 히어로=색 필드(장식 마감),
            03=명세(이름·hex 병기 스펙). sm 미만은 basis 1/3로 3+3 두 줄 — 5색이면 3+2로
            늘어붙어 5+1 고아 구간이 자동 해소된다. 클릭 복사 유지 */}
        <div className="mt-2" data-testid="pc-best-grid">
          <div className="flex flex-wrap overflow-hidden rounded-md">
            {/* 실 AI 개인화 경로는 10색 반환 — 스트립은 히어로와 동일 6색 상한(초과 시 md 2열에서
                명세 전멸·모바일 고아 밴드가 생기던 실회귀, 2026-08 리뷰) */}
            {bestColors.slice(0, 6).map((color, index) => (
              <button
                key={index}
                type="button"
                className="group min-w-[33.333%] flex-1 cursor-pointer text-left sm:min-w-0"
                onClick={() => {
                  navigator.clipboard.writeText(color.hex).then(() => {
                    toast.success(`${color.hex} 복사됨`, { duration: 1500 });
                  });
                }}
              >
                {/* 호버 링은 inset — 간격 0 이음이라 바깥 링은 이웃 색면에 클리핑된다 */}
                <div
                  className="h-[72px] w-full group-hover:ring-2 group-hover:ring-inset group-hover:ring-primary/50"
                  style={{ backgroundColor: color.hex }}
                />
                <p className="mt-1 truncate pr-1.5 text-xs text-foreground/80">
                  {color.name || getKoreanColorName(color.hex)}
                </p>
                {/* hex = 캡션 급수(이름보다 한 단계 아래) — 이름과 붙여 한 덩어리로 */}
                <p className="truncate pr-1.5 text-[10px] uppercase tabular-nums tracking-wide text-muted-foreground/70">
                  {color.hex}
                </p>
              </button>
            ))}
          </div>
        </div>
        {/* "왜 이 색이 어울리는지" 1줄 — 구 상세 탭 시즌 설명(whyThisColor) 승격.
            상세 리포트 탭이 삭제되어(2026-08-01) 유도 링크 대신 언더톤 근거를 본문에 담는다 */}
        <p className="mt-3 break-keep text-xs text-muted-foreground" data-testid="pc-palette-why">
          {SEASON_WHY[seasonType]}
        </p>
      </div>
      {/* R5 우측 열 — 큐레이션 소섹션 묶음(모바일에선 그대로 세로 흐름) */}
      <div className="space-y-5">
        {accentColors.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              포인트 컬러
              <span className="ml-1.5 font-normal">립·네일·강조에</span>
            </p>
            <div className="mt-2">
              {/* 포인트=립·네일 사용처 → 립 발색 질감으로(실물감) */}
              <SwatchChips
                colors={accentColors.slice(0, 3)}
                testId="pc-accent-chips"
                texture="lip"
              />
            </div>
          </div>
        )}
        {metalColors.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">액세서리 금속</p>
            <div className="mt-2">
              <SwatchChips colors={metalColors.slice(0, 2)} testId="pc-metal-chips" />
            </div>
          </div>
        )}
        {worstColors.length > 0 && (
          <div data-testid="pc-avoid">
            <p className="text-xs font-medium text-muted-foreground">피하면 좋은 색</p>
            <div
              className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-4"
              data-testid="pc-avoid-chips"
            >
              {worstColors.slice(0, 4).map((color, index) => (
                <div key={`${color.hex}-${index}`}>
                  <div
                    className="h-8 w-full rounded-md"
                    // 취소선 오버레이(얇게) — 색은 정직 유지, 존재감은 크기로 억제 (공유카드 문법).
                    // 스트로크 색은 칩 명도 적응(어두운 칩=흰색) — getAvoidStrokeColor 참조
                    style={{
                      backgroundColor: color.hex,
                      backgroundImage: `linear-gradient(135deg, transparent 46%, ${getAvoidStrokeColor(color.hex)} 46%, ${getAvoidStrokeColor(color.hex)} 54%, transparent 54%)`,
                    }}
                    aria-hidden="true"
                  />
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                    {color.name || getKoreanColorName(color.hex)}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground" data-testid="pc-avoid-note">
              {AVOID_NOTES[seasonType]}
            </p>
          </div>
        )}
        {/* 톤 팔레트 총람 — 12톤 표준 정의 데이터(v2 정적)의 사용처별 스와치.
            이름 없는 hex 정의 데이터라 이름을 지어내지 않고 색면만 — 서브타입 저장 건에서만 렌더.
            R4: 사용처가 화장품이므로 발색 질감으로(립→lip, 아이섀도·블러셔→powder) — 히어로 스트립은 플랫 유지 */}
        {tonePalette && (
          <div data-testid="pc-tone-palette-overview">
            <p className="text-xs font-medium text-muted-foreground">
              톤 팔레트 총람
              <span className="ml-1.5 font-normal">12톤 표준 정의 팔레트예요</span>
            </p>
            {/* G11 밀도 — 행간·스와치 간격 절반 + 스와치 미세 확대(40→44) + 행 라벨 좌측 고정
                칼럼 + 행 사이 헤어라인 = '표' 인상. 발색 질감은 정본 유지 */}
            <div className="mt-2 divide-y divide-border/60">
              {(
                [
                  ['립', tonePalette.lipColors, 'lip'],
                  ['아이섀도', tonePalette.eyeshadowColors, 'powder'],
                  ['블러셔', tonePalette.blushColors, 'powder'],
                ] as const
              ).map(([rowLabel, hexes, texture]) => (
                <div key={rowLabel} className="flex items-center gap-2 py-[3px]">
                  <span className="w-12 shrink-0 text-[10px] text-muted-foreground">
                    {rowLabel}
                  </span>
                  <div className="flex flex-1 flex-wrap items-center gap-0.5" aria-hidden="true">
                    {hexes.map((hex, i) => (
                      <span key={`${hex}-${i}`} title={hex}>
                        <TextureSwatch hex={hex} kind={texture} width={44} />
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** 스타일 가이드 미니 구획 — 라운드 카드 외곽 해체, 소제목 위 얇은 상단 rule로만 구획(무박스 인쇄 문법, G2) */
function StyleMiniCard({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border pt-2.5">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

// 메이크업/그루밍 카드 내용 — 성별 분기 추출 (cognitive complexity 절감)
function StyleGuideSection({
  styleDescription,
  isMale,
}: {
  styleDescription: StyleDescription;
  isMale: boolean;
}) {
  if (isMale) {
    return styleDescription.easyGrooming ? (
      <div className="space-y-1.5 text-sm text-foreground/80">
        <p>
          <span className="mr-1.5 text-xs text-muted-foreground">피부</span>
          {styleDescription.easyGrooming.skin}
        </p>
        <p>
          <span className="mr-1.5 text-xs text-muted-foreground">헤어</span>
          {styleDescription.easyGrooming.hair}
        </p>
        <p>
          <span className="mr-1.5 text-xs text-muted-foreground">향수</span>
          {styleDescription.easyGrooming.scent}
        </p>
        <p className="text-xs text-muted-foreground">{styleDescription.easyGrooming.tip}</p>
      </div>
    ) : (
      <p className="text-sm leading-relaxed text-foreground/80">{styleDescription.makeupStyle}</p>
    );
  }

  return styleDescription.easyMakeup ? (
    <div className="space-y-1.5 text-sm text-foreground/80">
      <p>
        <span className="mr-1.5 text-xs text-muted-foreground">립</span>
        {styleDescription.easyMakeup.lip}
      </p>
      <p>
        <span className="mr-1.5 text-xs text-muted-foreground">눈</span>
        {styleDescription.easyMakeup.eye}
      </p>
      <p>
        <span className="mr-1.5 text-xs text-muted-foreground">볼</span>
        {styleDescription.easyMakeup.cheek}
      </p>
      <p className="text-xs text-muted-foreground">{styleDescription.easyMakeup.tip}</p>
    </div>
  ) : (
    <p className="text-sm leading-relaxed text-foreground/80">{styleDescription.makeupStyle}</p>
  );
}

/** 03 스타일 가이드 — 상단 rule 무박스 2열 구획(키워드·메이크업/그루밍·패션·액세서리) */
function StyleCardsBody({
  styleDescription,
  userGender,
  isMale,
  namedHexMap,
}: {
  styleDescription: StyleDescription;
  userGender: GenderPreference;
  isMale: boolean;
  /** R1 색명→hex 사전 — 패션 색명 칩에 실색 스와치 동행(매핑 없으면 텍스트만) */
  namedHexMap: Map<string, string>;
}) {
  // G6 회피 행 스와치는 행 단위 전부/전무 — 일부만 칠해지면 결손이 정보처럼 읽힌다.
  // 회피 색은 표준 사전 폴백 금지(신규 hex 금지) — 결과 데이터(동의 표기 포함)만 소스.
  const avoidDotHexes = (styleDescription.easyFashion?.avoid ?? []).map((color) =>
    resolveNamedHex(namedHexMap, color)
  );
  const showAvoidDots = avoidDotHexes.length > 0 && avoidDotHexes.every((hex) => hex !== undefined);

  return (
    // sm:items-start — 행 짝 카드의 세로 스트레치가 만들던 빈 하단 40% 소멸(G2).
    // 무박스 전환으로 구획은 rule이 담당 — 열 간격만 여유 있게
    <div
      className="grid gap-x-8 gap-y-5 sm:grid-cols-2 sm:items-start"
      data-testid="pc-style-cards"
    >
      <StyleMiniCard icon={Tag} label="스타일 키워드">
        <div className="flex flex-wrap gap-1.5">
          {styleDescription.imageKeywords.map((keyword, index) => (
            <span
              key={index}
              className="rounded-full border border-border px-2.5 py-0.5 text-xs text-foreground/80"
            >
              {getGenderAdaptiveTerm(keyword, userGender)}
            </span>
          ))}
        </div>
      </StyleMiniCard>

      <StyleMiniCard icon={Brush} label={isMale ? '그루밍' : '메이크업'}>
        <StyleGuideSection styleDescription={styleDescription} isMale={isMale} />
      </StyleMiniCard>

      <StyleMiniCard icon={Shirt} label="패션">
        {styleDescription.easyFashion ? (
          <div className="space-y-2">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">추천 컬러</p>
              <div className="flex flex-wrap gap-1" data-testid="pc-fashion-color-chips">
                {styleDescription.easyFashion.colors.map((color, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 rounded border border-border px-2 py-0.5 text-xs text-foreground/80"
                  >
                    {/* G7 색명에 색 동행 — 진단 데이터 우선 + 표준 색명 사전 폴백.
                        매핑 실패(재질명 등)는 무색 유지 */}
                    <NamedColorDot hex={resolveRecommendedHex(namedHexMap, color)} />
                    {color}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">덜 어울리는 컬러</p>
              <div className="flex flex-wrap gap-1">
                {styleDescription.easyFashion.avoid.map((color, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 rounded border border-border px-2 py-0.5 text-xs text-muted-foreground line-through"
                  >
                    {/* G6 행 단위 전부/전무 — 전원 매핑될 때만 스와치 동행 */}
                    {showAvoidDots && <NamedColorDot hex={avoidDotHexes[idx]} />}
                    {color}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm text-foreground/80">{styleDescription.easyFashion.style}</p>
            <p className="text-xs text-muted-foreground">{styleDescription.easyFashion.tip}</p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-foreground/80">
            {styleDescription.fashionStyle}
          </p>
        )}
      </StyleMiniCard>

      <StyleMiniCard icon={Gem} label="액세서리">
        {styleDescription.easyAccessory ? (
          <div className="space-y-1.5">
            <p className="text-sm text-foreground/80">
              <span className="font-medium">{styleDescription.easyAccessory.metal}</span>이 잘
              어울려요
            </p>
            <div className="flex flex-wrap gap-1">
              {styleDescription.easyAccessory.examples.map((item, idx) => (
                <span
                  key={idx}
                  className="rounded border border-border px-2 py-0.5 text-xs text-foreground/80"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-foreground/80">
            {styleDescription.accessories}
          </p>
        )}
      </StyleMiniCard>
    </div>
  );
}

/** 그루밍 추천 목록 (남성) — 접힘 내부 */
function GroomingList({ items }: { items: GroomingRecommendation[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-lg bg-muted p-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-border shadow-sm"
              style={{ backgroundColor: item.hex }}
            >
              <span className="text-xs text-foreground/50">{index + 1}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{item.itemName}</p>
                <span className="rounded border border-border bg-card px-1.5 py-0.5 text-xs text-muted-foreground">
                  {item.colorTone}
                </span>
              </div>
              {item.easyDescription && (
                <p className="mt-0.5 text-xs text-muted-foreground">{item.easyDescription}</p>
              )}
              {item.brandExample && (
                <p className="text-xs text-muted-foreground">{item.brandExample}</p>
              )}
            </div>
          </div>
          {item.oliveyoungAlt && (
            <p className="mt-2 pl-[52px] text-xs text-muted-foreground">
              올리브영: {item.oliveyoungAlt}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/** 립스틱 추천 목록 (여성) — 접힘 내부 */
function LipstickList({ items }: { items: PersonalColorResult['lipstickRecommendations'] }) {
  return (
    <div className="space-y-3">
      {items.map((lip, index) => (
        <div key={index} className="rounded-lg bg-muted p-3">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 flex-shrink-0 rounded-full border border-border shadow-sm"
              style={{ backgroundColor: lip.hex }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{lip.colorName}</p>
                {lip.easyDescription && (
                  <span className="text-xs text-muted-foreground">= {lip.easyDescription}</span>
                )}
              </div>
              {lip.brandExample && (
                <p className="text-xs text-muted-foreground">{lip.brandExample}</p>
              )}
            </div>
          </div>
          {lip.oliveyoungAlt && (
            <p className="mt-2 pl-[52px] text-xs text-muted-foreground">
              올리브영: {lip.oliveyoungAlt}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/** 파운데이션 추천 목록 — 접힘 내부 (이모지 아이콘 → 라인아트) */
function FoundationList({ items }: { items: FoundationRecommendation[] }) {
  return (
    <div className="space-y-3">
      {items.map((foundation, index) => (
        <div key={index} className="rounded-lg bg-muted p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-card">
              <Droplet
                className="h-4 w-4 text-muted-foreground"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{foundation.shadeName}</p>
                <span className="rounded border border-border bg-card px-1.5 py-0.5 text-xs text-muted-foreground">
                  {selectByKey(foundation.undertone, { warm: '웜', cool: '쿨' }, '뉴트럴')}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{foundation.easyDescription}</p>
              <p className="text-xs text-muted-foreground">{foundation.brandExample}</p>
            </div>
          </div>
          {foundation.oliveyoungAlt && (
            <p className="mt-2 pl-[52px] text-xs text-muted-foreground">
              올리브영: {foundation.oliveyoungAlt}
            </p>
          )}
          {foundation.tip && (
            <p className="mt-1 pl-[52px] text-xs text-muted-foreground">{foundation.tip}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/** 05 추천 제품 — 첫 립은 지면에 펼쳐 인쇄(G10), 나머지 립·그루밍·파운데이션은 접힘 유지 */
function ProductsSectionBody({
  isMale,
  groomingRecommendations,
  lipstickRecommendations,
  foundationRecommendations,
  foundationBaseLabel,
}: {
  isMale: boolean;
  groomingRecommendations: GroomingRecommendation[];
  lipstickRecommendations: PersonalColorResult['lipstickRecommendations'];
  foundationRecommendations?: FoundationRecommendation[];
  foundationBaseLabel: string;
}) {
  // G10 지면 개폐 — 첫 립 추천(제품명+이유 1줄)은 접힘 밖에 인쇄, 접힘엔 나머지만.
  // 인쇄물에서 첫 추천이 사라지지 않게 하는 조치라 남성 그루밍 접힘은 현행 유지(처방 범위)
  const [firstLip, ...restLips] = lipstickRecommendations;
  const firstLipReason = firstLip?.easyDescription ?? firstLip?.brandExample;

  return (
    <div className="space-y-3">
      {isMale
        ? groomingRecommendations.length > 0 && (
            <ProgressiveDisclosure
              title="추천 그루밍 아이템"
              summary={groomingRecommendations[0]?.itemName ?? ''}
              icon={<Brush className="h-4 w-4" strokeWidth={1.75} />}
            >
              <GroomingList items={groomingRecommendations} />
            </ProgressiveDisclosure>
          )
        : firstLip && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">추천 립스틱</p>
              <div className="mt-2 flex items-center gap-3" data-testid="pc-product-first">
                <span
                  className="h-8 w-8 shrink-0 rounded-full border border-border shadow-sm"
                  style={{ backgroundColor: firstLip.hex }}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{firstLip.colorName}</p>
                  {firstLipReason && (
                    <p className="truncate text-xs text-muted-foreground">{firstLipReason}</p>
                  )}
                </div>
              </div>
              {restLips.length > 0 && (
                <div className="mt-3">
                  <ProgressiveDisclosure
                    title="다른 추천 더 보기"
                    summary={`립스틱 ${restLips.length}개`}
                    icon={<Heart className="h-4 w-4" strokeWidth={1.75} />}
                  >
                    <LipstickList items={restLips} />
                  </ProgressiveDisclosure>
                </div>
              )}
            </div>
          )}

      {foundationRecommendations && foundationRecommendations.length > 0 && (
        <ProgressiveDisclosure
          title="추천 파운데이션"
          summary={foundationBaseLabel}
          icon={<Droplets className="h-4 w-4" strokeWidth={1.75} />}
        >
          <div>
            <p className="mb-4 text-sm text-muted-foreground">{foundationBaseLabel}</p>
            <FoundationList items={foundationRecommendations} />
          </div>
        </ProgressiveDisclosure>
      )}
    </div>
  );
}

/** 컨설턴트 TIP — 전속 뷰티팀 총평 문법(세리프 이탤릭 인용). 1px 괘선 박스·사각 모서리
 *  (목업 m03 하단 TIP 박스 문법, G10) — 배경은 지면 그대로, 핑크는 라벨 악센트만(G9) */
function InsightNote({
  easyInsight,
  insight,
}: {
  easyInsight: PersonalColorResult['easyInsight'];
  insight: string;
}) {
  return (
    <div className="mt-6 border border-border px-4 py-3.5" data-testid="pc-insight-note">
      <p className="text-xs font-semibold tracking-wide text-primary">컨설턴트 TIP</p>
      {easyInsight ? (
        <>
          <p className="mt-1.5 break-keep font-serif text-sm italic leading-relaxed text-foreground/80">
            {easyInsight.summary}
          </p>
          <p className="mt-1.5 break-keep text-sm leading-relaxed text-muted-foreground">
            {easyInsight.easyExplanation}
          </p>
        </>
      ) : (
        <p className="mt-1.5 break-keep font-serif text-sm italic leading-relaxed text-foreground/80">
          {insight}
        </p>
      )}
    </div>
  );
}

interface ReportSection {
  key: string;
  title: string;
  body: React.ReactNode;
  /** md+ 2단 병치 대상(스타일링|제품) — false/미지정이면 풀폭 */
  half?: boolean;
}

/**
 * 히어로 좌측 앵커 — 분석 원본 사진이 있으면 사진(같은 페이지 드레이핑 탭이 이미 표시하는
 * 이미지라 신규 프라이버시 노출 없음), 없거나 로드 실패면 드레이핑 색면 스택을 같은 자리에
 * (데모 포함 — 생성 인물 사진 배제 정본). md+는 두 행(타이틀+속성표) 옆을 세로로 채우는
 * row-span-2 (G1). 본체 분기 이관 — cognitive complexity 절감.
 */
function HeroAnchor({
  photoUrl,
  photoError,
  onPhotoError,
  bestColors,
}: {
  photoUrl?: string;
  photoError: boolean;
  onPhotoError: () => void;
  bestColors: ColorInfo[];
}): React.JSX.Element | null {
  if (photoUrl && !photoError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 서명 URL 원본(최적화 프록시 비대상)
      <img
        src={photoUrl}
        alt="분석에 사용한 내 사진"
        onError={onPhotoError}
        className="col-start-1 row-start-1 aspect-[3/4] w-full rounded-xl border border-border object-cover md:row-span-2"
        data-testid="pc-hero-photo"
      />
    );
  }
  if (bestColors.length === 0) return null;
  return (
    <div
      className="col-start-1 row-start-1 flex aspect-[3/4] w-full flex-col overflow-hidden rounded-xl border border-border md:row-span-2"
      data-testid="pc-hero-draping"
      aria-hidden="true"
    >
      {bestColors.slice(0, 5).map((color, index) => (
        <span
          key={`${color.hex}-${index}`}
          className="block w-full flex-1"
          style={{ backgroundColor: color.hex }}
        />
      ))}
    </div>
  );
}

/**
 * 단독 퍼스널컬러 결과 — 진단지 문법 재조립 (2026-07-25).
 *
 * 구세대 섬(시즌 원색 카드 + 이모지 아코디언 8연속)을 이미 채택된 진단지 문법
 * (ADR-120 · PersonaReportCard)으로 전환: 아이브로우 + 세리프 진단명 + 계절 인장 +
 * 풀블리드 팔레트 스트립 히어로, 번호 섹션(속성표 → 결론 → 팔레트 → 스타일 → 제품),
 * 푸터 신뢰 블록. 데이터 배선(buildTopActions 등)은 그대로 — 표현 레이어만 교체.
 * 공개 데모(demo/personal-color)가 이 컴포넌트를 재사용하므로 자동 전파된다.
 */
export default function AnalysisResult({
  result,
  evidence,
  contrastLevel,
  photoUrl,
  isSample = false,
}: AnalysisResultProps) {
  // 사진 앵커 로드 실패 시 무사진 히어로로 폴백 (만료된 서명 URL 등 — 깨진 이미지 노출 금지)
  const [photoError, setPhotoError] = useState(false);
  const {
    seasonType,
    seasonLabel,
    seasonDescription,
    confidence,
    bestColors,
    worstColors,
    lipstickRecommendations,
    foundationRecommendations,
    clothingRecommendations,
    styleDescription,
    insight,
    easyInsight,
    analyzedAt,
    undertoneLabel,
    personalizedColors,
  } = result;

  const info = SEASON_INFO[seasonType];

  const locale = useLocale();

  // 사용자 프로필에서 성별 가져오기 (스타일 키워드 적응에 사용)
  const { profile } = useUserProfile();
  const userGender = profile.gender || 'neutral';
  const isMale = userGender === 'male';

  // 성별에 따른 데이터 선택
  const genderStyleDescription: StyleDescription = isMale
    ? MALE_STYLE_DESCRIPTIONS[seasonType]
    : styleDescription;
  const genderClothingRecommendations: ClothingRecommendation[] = isMale
    ? MALE_CLOTHING_RECOMMENDATIONS[seasonType]
    : clothingRecommendations;
  const groomingRecommendations: GroomingRecommendation[] = GROOMING_RECOMMENDATIONS[seasonType];

  // 파운데이션 베이스 설명 — 접힘 요약으로 사용
  const foundationBaseLabel =
    result.tone === 'warm'
      ? '옐로 베이스 (웜톤용) 파운데이션이 잘 어울려요'
      : '핑크 베이스 (쿨톤용) 파운데이션이 잘 어울려요';

  // ─── ADR-111 표현 원칙 1: "결론 먼저" — 기존 결과 데이터에서 규칙 기반 조립 (새 fetch/AI 없음)
  const topActions = buildTopActions({
    bestColors,
    personalizedColors,
    seasonLabel,
    isMale,
    lipstickRecommendations,
    groomingRecommendations,
    actionTip: easyInsight?.actionTip,
  });

  // 포인트·금속 — 개인 실측이 존재하지 않는 영역이라 항상 진단 톤 표준 큐레이션(공유카드와 동일 소스)
  const curatedPalette = getCardPalette(result.paletteToneKey ?? seasonType, toCardLocale(locale));
  const accentColors = curatedPalette?.accent ?? [];
  const metalColors = curatedPalette?.metals ?? [];

  // 히어로 진단명 — 12톤/언더톤 라벨이 있으면 그것이 가장 정밀한 진단명(통합 리포트와 동일 문법)
  const heroTitle = undertoneLabel ?? seasonLabel;

  // 12톤 서브타입 저장 건에서만 파생되는 정의 데이터 — 명도·채도 행 + 톤 팔레트 총람
  const subtypeAttrs = deriveSubtypeAttrs(result.paletteToneKey);
  const tonePalette = getTonePaletteOverview(result.paletteToneKey);

  // 구 상세 리포트 탭 흡수(2026-08-01) — 실측 evidence가 있을 때만 파생(지어내지 않음)
  const toneTendency = deriveToneTendency(result.tone, evidence?.veinScore);
  const lipNote =
    evidence?.lipNaturalColor && evidence.lipNaturalColor !== 'neutral'
      ? LIP_EVIDENCE_NOTES[evidence.lipNaturalColor]
      : undefined;

  // R1 색명→hex 사전 — 이 결과에 실린 색 데이터만 소스(베스트 팔레트 우선).
  // 패션 색명 칩·스타일링 색 제안에 실색 스와치를 동행시킨다(매핑 없으면 텍스트만).
  // G6: 동의 표기('검정'↔'블랙' 등)를 같은 hex로 추가 등록 — 새 hex 반입 없음
  const namedHexMap = registerColorNameSynonyms(
    buildNamedHexMap([
      bestColors,
      worstColors,
      accentColors,
      metalColors,
      lipstickRecommendations.map((lip) => ({ name: lip.colorName, hex: lip.hex })),
      groomingRecommendations.map((item) => ({ name: item.colorTone, hex: item.hex })),
    ])
  );

  // 히어로 좌측 앵커(사진 또는 드레이핑 스택) 존재 여부 — 없으면 우측 칼럼이 풀폭을 쓴다(G1)
  const hasHeroAnchor = Boolean(photoUrl && !photoError) || bestColors.length > 0;

  // md 히어로 캡션의 진단일 — 기존 analyzedAt의 표기(신규 데이터 아님, G1)
  const heroDateLabel = analyzedAt.toLocaleDateString(getDateLocale(locale));

  // ─── 번호 섹션 — 데이터 있는 섹션만 조립, 번호는 렌더 시점에 매겨 결번을 막는다.
  // 구 01 진단 속성은 히어로가 흡수(G1) — 배열에서 빠지고 번호는 자동 재부여된다.

  const sections: ReportSection[] = [];

  // 01 그래서 이렇게 — 기존 TopActionsCard 그대로. 내부 제목은 섹션 헤더와 같은 문구라
  // headingHidden으로 아예 렌더하지 않는다(sr-only는 낭독이 남아 제목이 3중으로 읽혔음).
  // 속성표 흡수 후 홀로 남은 half는 md 우측 공백을 만들어 풀폭 밴드로 전환(G1)
  if (topActions.length > 0) {
    sections.push({
      key: 'actions',
      title: '그래서, 이렇게 하세요',
      body: (
        // G9 액션 존 배경 — 핑크 틴트 카드를 딥크림 지면으로 교체(핑크는 결론·TIP 악센트만 잔류).
        // 다크는 딥크림 토큰이 카드와 동색이라 단차 소멸 — 백색 3% 오버레이로 명도 단차 복원
        <TopActionsCard
          actions={topActions}
          headingHidden
          className="border-border bg-surface-ground-deep dark:bg-white/[0.03]"
        />
      ),
    });
  }

  // 02 컬러 팔레트
  if (bestColors.length > 0) {
    sections.push({
      key: 'palette',
      title: '컬러 팔레트',
      body: (
        <PaletteSectionBody
          bestColors={bestColors}
          worstColors={worstColors}
          accentColors={accentColors}
          metalColors={metalColors}
          personalizedColors={personalizedColors}
          seasonLabel={seasonLabel}
          seasonType={seasonType}
          tonePalette={tonePalette}
        />
      ),
    });
  }

  // 03 스타일 가이드
  sections.push({
    key: 'style',
    title: '스타일 가이드',
    body: (
      <StyleCardsBody
        styleDescription={genderStyleDescription}
        userGender={userGender}
        isMale={isMale}
        namedHexMap={namedHexMap}
      />
    ),
  });

  // 04 추천 스타일링 — 의류 (성별 적응형)
  if (genderClothingRecommendations.length > 0) {
    sections.push({
      key: 'clothing',
      title: '추천 스타일링',
      half: true,
      body: (
        <ol className="space-y-2.5" data-testid="pc-clothing-list">
          {genderClothingRecommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-2.5">
              {/* 항목 번호는 섹션 번호(primary)보다 낮은 회조 — 러닝 넘버 시스템은 하나.
                  소형 세리프 이탤릭(12px) 금지 대역이라 산세리프로 전환 (R6) */}
              <span className="mt-[1px] shrink-0 text-xs tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-foreground">
                  <span>{rec.item}</span>
                  {/* G6 em대시 자체 span — 텍스트 노드에 붙이면 flex gap이 왼쪽에만 걸려
                      좌우 간격이 비대칭이 된다 */}
                  <span aria-hidden="true" className="text-muted-foreground">
                    —
                  </span>
                  {/* R1 색명에 색 동행 — 결과 데이터에 있는 색만 실색 사각 전치 */}
                  <NamedColorDot hex={resolveNamedHex(namedHexMap, rec.colorSuggestion)} />
                  <span>{rec.colorSuggestion}</span>
                </p>
                <p className="text-xs text-muted-foreground">{rec.reason}</p>
              </div>
            </li>
          ))}
        </ol>
      ),
    });
  }

  // 05 추천 제품 — 첫 립은 인쇄, 나머지 접힘 유지(G10)
  const hasProducts =
    (isMale ? groomingRecommendations : lipstickRecommendations).length > 0 ||
    (foundationRecommendations?.length ?? 0) > 0;
  if (hasProducts) {
    sections.push({
      key: 'products',
      title: '추천 제품',
      half: true,
      body: (
        <ProductsSectionBody
          isMale={isMale}
          groomingRecommendations={groomingRecommendations}
          lipstickRecommendations={lipstickRecommendations}
          foundationRecommendations={foundationRecommendations}
          foundationBaseLabel={foundationBaseLabel}
        />
      ),
    });
  }

  return (
    <div data-testid="analysis-result">
      <ScaleIn>
        {/* 진단지 한 장 — 히어로부터 신뢰 블록까지 단일 시트 (진단지 문법)
            깊이: 크림 지면 위 백색 시트 — rest 섀도 + 종이 그레인 1겹(시트 한정, ≤0.05).
            word-break:keep-all 시트 일괄(G6) — 한국어 어절 중간 개행 금지, 히어로 h1의
            overflow-wrap:anywhere(클리핑 방어)는 그대로 우선한다 */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] [word-break:keep-all] dark:shadow-none">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.05] dark:hidden"
            style={{ backgroundImage: PAPER_GRAIN_URI }}
          />
          <div className="px-5 pb-6 pt-6 sm:px-7">
            {/* 마스트헤드 — 아이브로우 + 이중 헤어라인(신문 마스트헤드 관례, R6).
                md+에선 라벨이 히어로 캡션(리포트명·진단일 병치)으로 내려가므로 괘선만 남긴다(G1) */}
            <div className="flex items-center justify-between gap-2">
              <ReportEyebrow className="md:hidden">PERSONAL COLOR REPORT</ReportEyebrow>
              {/* 샘플 고지 — 시트를 그대로 캡처해도 예시임이 남도록 지면 안(마스트헤드)에 인쇄 */}
              {isSample && <MockDataNotice compact className="ml-auto" />}
            </div>
            <div aria-hidden="true" className="mt-2.5 md:mt-0">
              <div className="border-t border-border" />
              <div className="mt-[3px] border-t border-border" />
            </div>

            {/* 히어로 그리드 — 좌 사진/드레이핑 앵커 | 우 타이틀 블록. md+는 우측 칼럼이
                '타이틀(스케일 상향)+부제+캡션+진단 속성표+인장'으로 만석 — 1440 우측 백지 해소
                (m03 문법, G1). 모바일(1열 흐름)은 현행 유지: 앵커|타이틀 → 풀블리드 스트립 →
                진단 속성(히어로 아래 첫 블록). 속성표는 단일 DOM을 그리드 행 배치로만 이동시켜
                중복 렌더 없이 반응한다. */}
            <div className="mt-5 grid grid-cols-[min(40%,240px)_minmax(0,1fr)] gap-x-4 sm:gap-x-6">
              <HeroAnchor
                photoUrl={photoUrl}
                photoError={photoError}
                onPhotoError={() => setPhotoError(true)}
                bestColors={bestColors}
              />
              <div
                className={cn('row-start-1 min-w-0', hasHeroAnchor ? 'col-start-2' : 'col-span-2')}
              >
                {/* overflow-wrap:anywhere — break-keep+사진 40% 조합에서 303px 미만 뷰포트의
                    '브라이트' 어절이 시트 밖으로 클리핑되던 것 방어(넘칠 때만 어절 내 개행).
                    스케일 상향(G1)은 clamp 상한만 — 모바일 최소 급수(2.25rem)는 현행 유지 */}
                <h1
                  className="break-keep font-serif text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-tight tracking-tight text-foreground [overflow-wrap:anywhere]"
                  data-testid="pc-hero-title"
                >
                  {heroTitle}
                </h1>
                {/* 12톤 라벨이 히어로일 때 계절 라벨은 속성표가 담당 — 중복 표기 없음 */}
                <p className="mt-2 break-keep text-sm text-muted-foreground">{seasonDescription}</p>
                {/* md 캡션 — 마스트헤드 라벨·진단일 병치(초소형, G1). 기존 진단일 데이터의
                    표기일 뿐 신규 데이터 아님. 단일 텍스트 노드로 마스트헤드 라벨과 구분 */}
                <p
                  className="mt-3 hidden text-[10px] uppercase tracking-widest text-muted-foreground md:block"
                  data-testid="pc-hero-caption"
                >
                  PERSONAL COLOR REPORT · {heroDateLabel}
                </p>
                {/* 스트립이 없으면(베스트 컬러 0) 모바일 인장이 오버랩할 지면이 없어 여기 폴백 */}
                {bestColors.length === 0 && (
                  <SeasonSeal
                    seasonType={seasonType}
                    seasonLabel={seasonLabel}
                    className="mt-4 md:hidden"
                  />
                )}
              </div>
              {/* 진단 속성 — 구 01 섹션을 히어로가 흡수(G1). 모바일은 스트립 아래 첫 블록(풀폭),
                  md+는 우측 칼럼 2행. 인장 자리만큼 우측 패딩(92px=인장 76+여백) */}
              <div
                className={cn(
                  'col-span-2 row-start-3 mt-6 md:row-start-2 md:mt-5 md:pr-[92px]',
                  hasHeroAnchor && 'md:col-span-1 md:col-start-2'
                )}
              >
                <AttrsSectionBody
                  seasonLabel={seasonLabel}
                  tone={result.tone}
                  characteristics={info.characteristics}
                  contrastLevel={contrastLevel}
                  evidence={evidence}
                  subtypeAttrs={subtypeAttrs}
                  toneTendency={toneTendency}
                  lipNote={lipNote}
                />
              </div>
              {/* md 인장 — 속성표 우측 여백에 병치(m03 BEST TYPE 원형 문법).
                  모바일 인장은 스트립 오버랩 쪽이 담당(아래) — 양쪽 다 display 게이팅이라
                  스크린리더에 이중 노출되지 않는다 */}
              <SeasonSeal
                seasonType={seasonType}
                seasonLabel={seasonLabel}
                className="col-start-2 row-start-2 mt-5 hidden self-start justify-self-end md:flex"
              />
              {/* 풀블리드 팔레트 스트립 — 하드엣지 색 필드 + 하단 헤어라인(플랫 유지).
                  모바일은 타이틀 직후(row2)·md+는 속성표 아래(row3)가 히어로의 마감 괘선.
                  계절 인장이 상단 경계를 오버랩 — "지면 위 도장" (R2, 모바일 전용) */}
              {bestColors.length > 0 && (
                <div className="relative col-span-2 row-start-2 -mx-5 mt-6 sm:-mx-7 md:row-start-3">
                  <div
                    className="flex border-b border-border"
                    data-testid="pc-hero-strip"
                    aria-hidden="true"
                  >
                    {bestColors.slice(0, 6).map((color, index) => (
                      <span
                        key={`${color.hex}-${index}`}
                        className="block h-10 flex-1"
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                  </div>
                  <SeasonSeal
                    seasonType={seasonType}
                    seasonLabel={seasonLabel}
                    className="absolute -top-9 right-5 z-10 sm:right-7 md:hidden"
                  />
                </div>
              )}
            </div>

            {/* 번호 섹션들 — 데이터 있는 것만, 번호는 렌더 시점 자동 재부여(하드코딩 금지).
                md+에서 half 섹션(clothing|products 등)은 2단 병치, 풀폭 섹션은 col-span-2 (모바일 1열 불변) */}
            <div className="md:grid md:grid-cols-2 md:items-start md:gap-x-10">
              {sections.map((section, index) => (
                <div key={section.key} className={cn('mt-6', !section.half && 'md:col-span-2')}>
                  <SectionHeader no={index + 1} title={section.title} />
                  <div className="mt-4">{section.body}</div>
                </div>
              ))}
            </div>

            <InsightNote easyInsight={easyInsight} insight={insight} />

            {/* 지면 개폐 대칭(G10) — 마스트헤드 이중 헤어라인과 짝: 아래 1줄 + TrustFooter
                내장 상단 괘선이 두 번째 줄(3px 간격) */}
            <div aria-hidden="true" className="mt-6 border-t border-border" />

            {/* 푸터 신뢰 블록 — 신뢰도(진단의 점수) + 분석 시간 (진단서의 직인).
                구 "전체 사용자 중 N%" 줄은 출처 없는 자사 통계라 삭제(실집계 배선 전까지 미표시) */}
            <TrustFooter confidence={confidence} testId="pc-trust-footer" className="mt-[3px]">
              {/* 초 단위는 발행 정보(콜로폰)에 과잉 — 분까지만 (재현성 직인 인상) */}
              <p>
                분석 시간:{' '}
                {analyzedAt.toLocaleString(getDateLocale(locale), {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </p>
            </TrustFooter>
          </div>
        </section>
      </ScaleIn>
    </div>
  );
}
