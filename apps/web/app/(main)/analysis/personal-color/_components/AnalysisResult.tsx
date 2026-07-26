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
import { TopActionsCard, type TopAction } from '@/components/analysis/TopActionsCard';
import { ProgressiveDisclosure } from '@/components/common/ProgressiveDisclosure';
import { getKoreanColorName } from '@/lib/utils/color-names';
import { TextureSwatch, type TextureKind } from '@/components/share/TextureSwatch';
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

// 분석 근거 타입 (AnalysisEvidenceReport와 호환)
interface AnalysisEvidence {
  veinColor?: PersonalColorEvidenceSummaryProps['veinColor'];
  skinUndertone?: PersonalColorEvidenceSummaryProps['skinUndertone'];
}

interface AnalysisResultProps {
  result: PersonalColorResult;
  onRetry?: () => void;
  evidence?: AnalysisEvidence | null;
  onTabChange?: (tab: string) => void;
  /** 퍼스널 대비 실측값(ADR-116) — 호스트가 저장값이 있을 때만 전달(없으면 행 미렌더) */
  contrastLevel?: 'low' | 'medium' | 'high' | null;
  /** 분석 원본 사진 URL — 있으면 md+ 히어로를 2단(사진|진단명)으로. 없으면 현 레이아웃(데모·구 데이터 폴백) */
  photoUrl?: string;
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

/** 01 진단 속성표 — RowTable(+12톤 명도·채도 정의 행) + 대비 풀이 + 결론 + 판정 근거 요약 */
function AttrsSectionBody({
  seasonLabel,
  tone,
  characteristics,
  contrastLevel,
  evidence,
  subtypeAttrs,
}: {
  seasonLabel: string;
  tone: PersonalColorResult['tone'];
  characteristics: string;
  contrastLevel?: 'low' | 'medium' | 'high' | null;
  evidence?: AnalysisEvidence | null;
  /** 12톤 서브타입 저장 건에서만 파생되는 명도·채도 정의 서술 — 없으면 행 미렌더 */
  subtypeAttrs?: { brightness: string; saturation: string };
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
    </div>
  );
}

/** 03 컬러 팔레트 — 베스트 그리드(hex 캡션 급수) + 포인트·금속 큐레이션 + 취소선 회피 칩 + 톤 총람 */
function PaletteSectionBody({
  bestColors,
  worstColors,
  accentColors,
  metalColors,
  personalizedColors,
  seasonLabel,
  seasonType,
  onTabChange,
  tonePalette,
}: {
  bestColors: ColorInfo[];
  worstColors: ColorInfo[];
  accentColors: Array<{ hex: string; name?: string }>;
  metalColors: Array<{ hex: string; name?: string }>;
  personalizedColors?: boolean;
  seasonLabel: string;
  seasonType: SeasonType;
  onTabChange?: (tab: string) => void;
  /** 12톤 표준 정의 팔레트(v2 정적 데이터) — paletteToneKey가 12톤 키일 때만 존재 */
  tonePalette?: TonePalette;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-muted-foreground">
          베스트 컬러
          <span className="ml-1.5 font-normal">
            {personalizedColors
              ? '내 사진에서 찾은 맞춤 컬러예요'
              : `${seasonLabel} 타입에 잘 어울리는 컬러예요`}
          </span>
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5" data-testid="pc-best-grid">
          {bestColors.map((color, index) => (
            <button
              key={index}
              type="button"
              className="group cursor-pointer text-left"
              onClick={() => {
                navigator.clipboard.writeText(color.hex).then(() => {
                  toast.success(`${color.hex} 복사됨`, { duration: 1500 });
                });
              }}
            >
              <div
                className="aspect-square w-full rounded-lg border border-border transition-all group-hover:ring-2 group-hover:ring-primary/50"
                style={{ backgroundColor: color.hex }}
              />
              <p className="mt-1 truncate text-xs text-foreground/80">
                {color.name || getKoreanColorName(color.hex)}
              </p>
              {/* hex = 캡션 급수(이름보다 한 단계 아래) — 이름과 붙여 한 덩어리로 */}
              <p className="text-[10px] uppercase tabular-nums tracking-wide text-muted-foreground/70">
                {color.hex}
              </p>
            </button>
          ))}
        </div>
        {/* "왜 이 색이 어울리는지" 1줄 (상세는 리포트 탭 — 탭 전환 핸들러가 있을 때만 링크) */}
        <p className="mt-3 text-xs text-muted-foreground">
          {selectByKey(
            seasonType,
            {
              spring: '따뜻하고 맑은 색이 피부톤과 조화를 이뤄요.',
              summer: '부드러운 파스텔 톤이 피부를 맑게 보이게 해줘요.',
              autumn: '깊고 따뜻한 어스 톤이 고급스러운 인상을 줘요.',
            },
            '선명한 대비 컬러가 세련된 인상을 줘요.'
          )}
          {onTabChange && (
            <button
              type="button"
              className="ml-1 cursor-pointer text-primary/70 underline-offset-2 hover:text-primary hover:underline"
              onClick={() => onTabChange('detailed')}
            >
              상세 리포트에서 더 알아보기
            </button>
          )}
        </p>
      </div>
      {accentColors.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            포인트 컬러
            <span className="ml-1.5 font-normal">립·네일·강조에</span>
          </p>
          <div className="mt-2">
            {/* 포인트=립·네일 사용처 → 립 발색 질감으로(실물감) */}
            <SwatchChips colors={accentColors.slice(0, 3)} testId="pc-accent-chips" texture="lip" />
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
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6" data-testid="pc-avoid-chips">
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
      {/* 톤 팔레트 총람 — 12톤 표준 정의 데이터(v2 정적)의 사용처별 축소 스와치.
          이름 없는 hex 정의 데이터라 이름을 지어내지 않고 색면만 — 서브타입 저장 건에서만 렌더 */}
      {tonePalette && (
        <div data-testid="pc-tone-palette-overview">
          <p className="text-xs font-medium text-muted-foreground">
            톤 팔레트 총람
            <span className="ml-1.5 font-normal">12톤 표준 정의 팔레트예요</span>
          </p>
          <div className="mt-2 space-y-1.5">
            {(
              [
                ['립', tonePalette.lipColors],
                ['아이섀도', tonePalette.eyeshadowColors],
                ['블러셔', tonePalette.blushColors],
              ] as const
            ).map(([rowLabel, hexes]) => (
              <div key={rowLabel} className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-[10px] text-muted-foreground">{rowLabel}</span>
                <div className="flex flex-1 gap-1" aria-hidden="true">
                  {hexes.map((hex, i) => (
                    <span
                      key={`${hex}-${i}`}
                      className="h-5 flex-1 rounded-sm border border-border/50"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** 스타일 가이드 미니 카드 — 색면 박스 대신 중립 카드 + 라인아트 아이콘 muted 1색 */
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
    <div className="rounded-xl border border-border bg-card px-3.5 py-3">
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

/** 04 스타일 가이드 — 색면 박스 3종 → 2열 미니카드(키워드·메이크업/그루밍·패션·액세서리) */
function StyleCardsBody({
  styleDescription,
  userGender,
  isMale,
}: {
  styleDescription: StyleDescription;
  userGender: GenderPreference;
  isMale: boolean;
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2" data-testid="pc-style-cards">
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
              <div className="flex flex-wrap gap-1">
                {styleDescription.easyFashion.colors.map((color, idx) => (
                  <span
                    key={idx}
                    className="rounded border border-border px-2 py-0.5 text-xs text-foreground/80"
                  >
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
                    className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground line-through"
                  >
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

/** 06 추천 제품 — 립/그루밍 + 파운데이션 (접힘 유지, 이모지만 소거) */
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
  const productTitle = isMale ? '추천 그루밍 아이템' : '추천 립스틱';
  const productSummary = isMale
    ? (groomingRecommendations[0]?.itemName ?? '')
    : (lipstickRecommendations[0]?.colorName ?? '');
  const hasPrimary = (isMale ? groomingRecommendations : lipstickRecommendations).length > 0;

  return (
    <div className="space-y-3">
      {hasPrimary && (
        <ProgressiveDisclosure
          title={productTitle}
          summary={productSummary}
          icon={
            isMale ? (
              <Brush className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Heart className="h-4 w-4" strokeWidth={1.75} />
            )
          }
        >
          {isMale ? (
            <GroomingList items={groomingRecommendations} />
          ) : (
            <LipstickList items={lipstickRecommendations} />
          )}
        </ProgressiveDisclosure>
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

/** 컨설턴트 TIP — 전속 뷰티팀 총평 문법(세리프 이탤릭 인용), 풀블리드 밴드(목업 m03 하단 밴드) */
function InsightNote({
  easyInsight,
  insight,
}: {
  easyInsight: PersonalColorResult['easyInsight'];
  insight: string;
}) {
  return (
    <div
      className="-mx-5 mt-6 border-y border-border bg-muted/50 px-5 py-4 sm:-mx-7 sm:px-7"
      data-testid="pc-insight-note"
    >
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
  /** md+ 2단 병치 대상(속성표|액션, 스타일링|제품) — false/미지정이면 풀폭 */
  half?: boolean;
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
  onRetry: _onRetry,
  evidence,
  onTabChange,
  contrastLevel,
  photoUrl,
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

  // ─── 번호 섹션 — 데이터 있는 섹션만 조립, 번호는 렌더 시점에 매겨 결번을 막는다
  const sections: ReportSection[] = [];

  // 01 진단 속성표 — 실데이터 행만 (없는 행은 미렌더)
  sections.push({
    key: 'attrs',
    title: '진단 속성',
    half: true,
    body: (
      <AttrsSectionBody
        seasonLabel={seasonLabel}
        tone={result.tone}
        characteristics={info.characteristics}
        contrastLevel={contrastLevel}
        evidence={evidence}
        subtypeAttrs={subtypeAttrs}
      />
    ),
  });

  // 02 그래서 이렇게 — 기존 TopActionsCard 그대로 (내부 제목은 섹션 헤더와 중복이라 시각만 숨김)
  if (topActions.length > 0) {
    sections.push({
      key: 'actions',
      title: '그래서, 이렇게 하세요',
      half: true,
      body: (
        <div className="[&_h2]:sr-only">
          <TopActionsCard actions={topActions} />
        </div>
      ),
    });
  }

  // 03 컬러 팔레트
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
          onTabChange={onTabChange}
          tonePalette={tonePalette}
        />
      ),
    });
  }

  // 04 스타일 가이드
  sections.push({
    key: 'style',
    title: '스타일 가이드',
    body: (
      <StyleCardsBody
        styleDescription={genderStyleDescription}
        userGender={userGender}
        isMale={isMale}
      />
    ),
  });

  // 05 추천 스타일링 — 의류 (성별 적응형)
  if (genderClothingRecommendations.length > 0) {
    sections.push({
      key: 'clothing',
      title: '추천 스타일링',
      half: true,
      body: (
        <ol className="space-y-2.5" data-testid="pc-clothing-list">
          {genderClothingRecommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-2.5">
              {/* 항목 번호는 섹션 번호(primary)보다 낮은 회조 — 러닝 넘버 시스템은 하나 */}
              <span className="mt-[1px] shrink-0 font-serif text-xs italic tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {rec.item} — {rec.colorSuggestion}
                </p>
                <p className="text-xs text-muted-foreground">{rec.reason}</p>
              </div>
            </li>
          ))}
        </ol>
      ),
    });
  }

  // 06 추천 제품 — 접힘 유지
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
        {/* 진단지 한 장 — 히어로부터 신뢰 블록까지 단일 시트 (진단지 문법) */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="px-5 pb-6 pt-6 sm:px-7">
            {/* 히어로 — 아이브로우 + (md+ 사진 앵커) + 세리프 진단명 + 서브카피 + 계절 인장 */}
            <ReportEyebrow>PERSONAL COLOR REPORT</ReportEyebrow>
            <div className="mt-3 flex items-start gap-5">
              {/* 사진 앵커 — 분석 원본이 있을 때만 md+ 2단 좌측(모바일 1열 불변). 같은 페이지
                  드레이핑 탭이 이미 표시하는 이미지라 신규 프라이버시 노출 없음. 로드 실패 시 무사진 폴백 */}
              {photoUrl && !photoError && (
                <img
                  src={photoUrl}
                  alt="분석에 사용한 내 사진"
                  onError={() => setPhotoError(true)}
                  className="hidden h-40 w-32 shrink-0 rounded-xl border border-border object-cover md:block"
                  data-testid="pc-hero-photo"
                />
              )}
              <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1
                    className="break-keep font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground"
                    data-testid="pc-hero-title"
                  >
                    {heroTitle}
                  </h1>
                  {/* 12톤 라벨이 히어로일 때 계절 라벨은 속성표(01)가 담당 — 중복 표기 없음 */}
                  <p className="mt-2 break-keep text-sm text-muted-foreground">
                    {seasonDescription}
                  </p>
                </div>
                {/* 계절 인장 — 점수 없는 타입 확정 스탬프 (채움 배경 + 타입명 병기, 점수 없음 유지) */}
                <div
                  className="mt-1 flex h-[72px] w-[72px] shrink-0 rotate-3 flex-col items-center justify-center gap-0.5 rounded-full border-[1.5px] border-primary/60 bg-primary/10"
                  data-testid="pc-season-seal"
                >
                  <span className="break-keep px-1.5 text-center font-serif text-[11px] italic leading-tight text-primary">
                    {SEASON_SEAL[seasonType]}
                  </span>
                  <span className="break-keep px-1.5 text-center text-[9px] leading-tight text-primary/80">
                    {seasonLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* 풀블리드 팔레트 스트립 — 하드엣지 색 필드 + 하단 헤어라인 */}
            {bestColors.length > 0 && (
              <div
                className="-mx-5 mt-5 flex border-b border-border sm:-mx-7"
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
            )}

            {/* 번호 섹션들 — 데이터 있는 것만, 번호 자동 재부여.
                md+에서 half 섹션(01|02, 05|06)은 2단 병치, 풀폭 섹션은 col-span-2 (모바일 1열 불변) */}
            <div className="md:grid md:grid-cols-2 md:items-start md:gap-x-10">
              {sections.map((section, index) => (
                <div key={section.key} className={cn('mt-6', !section.half && 'md:col-span-2')}>
                  <SectionHeader no={index + 1} title={section.title} />
                  <div className="mt-4">{section.body}</div>
                </div>
              ))}
            </div>

            <InsightNote easyInsight={easyInsight} insight={insight} />

            {/* 푸터 신뢰 블록 — 신뢰도(진단의 점수) + 통계 + 분석 시간 (진단서의 직인) */}
            <TrustFooter confidence={confidence} testId="pc-trust-footer" className="mt-6">
              <p>
                전체 사용자 중 {info.percentage}%가 {seasonLabel}이에요
              </p>
              <p>분석 시간: {analyzedAt.toLocaleString(getDateLocale(locale))}</p>
            </TrustFooter>
          </div>
        </section>
      </ScaleIn>
    </div>
  );
}
