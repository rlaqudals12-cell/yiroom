/**
 * E+ 공유카드 데이터 해석 — 통합 결과 → 카드 주입값 (웹 결과 페이지 규칙 미러)
 *
 * @module lib/share/card-data
 * @description
 *   웹 정본(apps/web/.../result/[sessionId]/page.tsx resolveCardPalettes + raw row 매퍼)과 동일 규칙:
 *   - 팔레트: 개인 실측 best_colors({name,hex})가 이름까지 4개+ 있으면 우선,
 *     아니면 진단 톤의 표준 큐레이션(@yiroom/shared getCardPalette — 오프라인 진단 관습).
 *   - 피해야 할 색: 항상 톤 표준 큐레이션(개인 실측이 존재하지 않는 영역).
 *   - 히어로: 12톤 ko 라벨 우선, 없으면 4계절 — 미지 값이면 null(원시 영문키 금지),
 *     이때 카드는 은유(oneLine)를 히어로로 쓴다.
 *   - 서명 뱃지: 성공 축의 저장값만(지어내지 않음) + 영문 enum → ko 라벨(웹 labels SSOT 미러).
 *
 *   ⚠️ 데이터가 두 형태로 들어온다 (적대 리뷰 2026-07-23에서 확인):
 *   ① 분석 직후 POST payload — camelCase(tone/season 소문자/skinType…)
 *   ② 재방문 Supabase raw row(useIntegratedSession) — tone은 image_analysis.tone JSONB,
 *      season은 DB CHECK로 'Summer' 대문자, 뱃지는 skin_type 등 snake_case.
 *   웹은 page.tsx 매퍼가 ②→①로 정규화하지만 모바일 훅은 무변환 캐스팅이므로 여기서 양형태를 해석한다.
 */

import { getCardPalette, toneHeroLabelKo } from '@yiroom/shared';
import type { IntegratedAnalysisResult, AxisData, AxisResult } from '@/lib/api';

export interface CardPaletteColor {
  hex: string;
  name?: string;
}

export interface CardBadge {
  label: string;
  value: string;
}

export interface PersonaCardData {
  oneLine: string;
  toneName?: string;
  badges: CardBadge[];
  palette: CardPaletteColor[];
  worstPalette: { hex: string }[];
}

/** #RGB / #RRGGBB만 통과 — 웹 정본 parsePaletteItem과 동일(8자리 알파는 카드 스와치 부적합) */
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// 영문 enum → ko 라벨 (정본 = 웹 labels.ts SKIN_TYPE/FACE_SHAPE·body/mapper.ts BODY_SHAPE_LABELS)
const SKIN_TYPE_KO: Record<string, string> = {
  dry: '건성',
  oily: '지성',
  combination: '복합성',
  normal: '중성',
  sensitive: '민감성',
};
const BODY_TYPE_KO: Record<string, string> = {
  S: '스트레이트',
  W: '웨이브',
  N: '내추럴',
  hourglass: '모래시계형',
  pear: '배형',
  invertedTriangle: '역삼각형',
  apple: '사과형',
  rectangle: '직사각형',
  trapezoid: '사다리꼴형',
};
const FACE_SHAPE_KO: Record<string, string> = {
  oval: '계란형',
  round: '둥근형',
  square: '각진형',
  heart: '하트형',
  oblong: '긴 얼굴형',
  diamond: '다이아몬드형',
};

function axisData(axis: AxisResult<AxisData>): AxisData | null {
  return axis.success ? axis.data : null;
}

/** 비어있지 않은 문자열 값만 (placeholder '-' 제외) */
function cleanValue(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const v = raw.trim();
  return v.length > 0 && v !== '-' ? v : null;
}

/** camelCase(POST payload) 우선, snake_case(raw row) 폴백 */
function pick(d: AxisData | null, camel: string, snake: string): string | null {
  return cleanValue(d?.[camel]) ?? cleanValue(d?.[snake]);
}

/** raw row의 image_analysis JSONB에서 12톤 추출 (웹 page.tsx extractNested 미러) */
function nestedTone(d: AxisData | null): string | null {
  const ia = d?.image_analysis;
  if (typeof ia === 'object' && ia !== null) {
    return cleanValue((ia as Record<string, unknown>).tone);
  }
  return null;
}

/**
 * enum 값 → ko 라벨. 매핑이 없으면: 이미 한글이면 그대로, 영문이면 null(원시 영문 금지 — 지어내지 않음).
 */
function toKoLabel(raw: string | null, map: Record<string, string>): string | null {
  if (!raw) return null;
  if (map[raw]) return map[raw];
  // 한글 등 비ASCII 값은 이미 로케일된 표시값으로 간주
  return /[^\x00-\x7F]/.test(raw) ? raw : null;
}

/** 개인 실측 best_colors JSONB → {hex,name} 배열 (형태 보장 없음 — 방어적 추출, 웹 미러: string hex도 수용) */
function extractStoredPalette(raw: unknown): CardPaletteColor[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): CardPaletteColor | null => {
      // 통합 세션 저장 형태 = bare hex string[] — 버리면 최종 폴백이 웹과 갈라진다
      if (typeof item === 'string') {
        return HEX_COLOR_PATTERN.test(item) ? { hex: item } : null;
      }
      if (typeof item === 'object' && item !== null) {
        const { hex, color, name } = item as { hex?: unknown; color?: unknown; name?: unknown };
        const value = typeof hex === 'string' ? hex : typeof color === 'string' ? color : null;
        if (value && HEX_COLOR_PATTERN.test(value)) {
          return {
            hex: value,
            ...(typeof name === 'string' && name.length > 0 ? { name } : {}),
          };
        }
      }
      return null;
    })
    .filter((c): c is CardPaletteColor => c !== null)
    .slice(0, 6);
}

/**
 * 통합 결과에서 E+ 카드 주입 데이터를 조립한다.
 * persona가 없으면(성공 축 0) 카드를 만들 수 없어 null.
 */
export function resolvePersonaCardData(result: IntegratedAnalysisResult): PersonaCardData | null {
  if (!result.persona?.oneLine) return null;

  const pc = axisData(result.axes.personalColor);
  // 재방문 raw row: tone은 image_analysis.tone에, season은 'Summer' 대문자로 저장됨
  const tone = cleanValue(pc?.tone) ?? nestedTone(pc);
  const season = cleanValue(pc?.season)?.toLowerCase() ?? null;
  const toneName = toneHeroLabelKo(tone, season) ?? undefined;

  // 팔레트 해석 — 개인 실측(이름 포함 4+) 우선, 아니면 톤 표준 큐레이션, 그것도 없으면 실측 hex만
  const stored = extractStoredPalette(pc?.best_colors);
  const curated = getCardPalette(tone ?? season, 'ko');
  const palette =
    stored.length >= 4 && stored.every((c) => !!c.name) ? stored : (curated?.best ?? stored);

  // 서명 뱃지 — 성공 축의 저장값만 + ko 라벨 해석. 퍼컬은 toneName이 히어로로 담당(중복 금지)
  const badges: CardBadge[] = [];
  const skin = axisData(result.axes.skin);
  const skinType = toKoLabel(pick(skin, 'skinType', 'skin_type'), SKIN_TYPE_KO);
  if (skinType) badges.push({ label: '피부', value: skinType });
  const body = axisData(result.axes.body);
  const bodyType = toKoLabel(pick(body, 'bodyType', 'body_type'), BODY_TYPE_KO);
  if (bodyType) badges.push({ label: '체형', value: bodyType });
  const hair = axisData(result.axes.hair);
  const faceShape = toKoLabel(pick(hair, 'faceShape', 'face_shape'), FACE_SHAPE_KO);
  if (faceShape) badges.push({ label: '헤어', value: faceShape });

  return {
    oneLine: result.persona.oneLine,
    toneName,
    badges,
    palette,
    worstPalette: curated?.avoid ?? [],
  };
}
