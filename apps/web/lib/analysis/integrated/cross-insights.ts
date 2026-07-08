/**
 * 축 조합 인사이트 (ADR-104 체크리스트 #4 — "축 간 연결이 보임")
 *
 * @module lib/analysis/integrated/cross-insights
 * @description
 *   5축 중 2축 조합에서 의미 있는 5개 연결만 선별하여 인사이트 생성.
 *   규칙 기반 (결정론적), DB 저장 없음.
 *   사용자가 "단일 축 결과의 합"이 아닌 "축들이 대화하는" 경험을 하도록.
 *
 *   중요 조합 5쌍:
 *   1. PC × S  → 베이스 메이크업 방향
 *   2. PC × M  → 립/아이 색상 조합
 *   3. C × H   → 실루엣 + 얼굴형 밸런스
 *   4. S × M   → 피부 상태별 메이크업 제품
 *   5. PC × C  → 의류 색상 + 체형 스타일링
 *
 * @see docs/adr/ADR-104-yiroom-launch-criteria.md §2.1 체크리스트 #4
 */

import type {
  AxisResult,
  PersonalColorAxisData,
  SkinAxisData,
  BodyAxisData,
  HairAxisData,
  MakeupAxisData,
} from './types';
// ADR-107: 얼굴형 기반 헤어스타일 추천기 — C×H 인사이트에 구체 컷·피할스타일 결합
import { recommendHairstyles, getStylesToAvoid, type FaceShapeType } from '@/lib/analysis/hair';
import { getBodyShapeLabel } from '@/lib/body';

const VALID_FACE_SHAPES: readonly string[] = [
  'oval',
  'round',
  'square',
  'heart',
  'oblong',
  'diamond',
  'rectangle',
];

// ============================================
// 1. 타입
// ============================================

/** 조합 인사이트 한 개 */
export interface CrossInsight {
  /** 조합 식별자 (예: 'pc_s', 'c_h') */
  id: string;
  /** 조합 라벨 (UI 뱃지, 예: "색 × 피부") */
  combo: string;
  /** 짧은 제목 (1줄, 15자 이내 권장) */
  title: string;
  /** 보조 설명 (1-2문장) */
  body: string;
}

export interface CrossInsights {
  /** 의미 있는 조합 0-5개 */
  items: CrossInsight[];
}

export interface ComposeCrossInsightsInput {
  personalColor: AxisResult<PersonalColorAxisData>;
  skin: AxisResult<SkinAxisData>;
  body: AxisResult<BodyAxisData>;
  hair: AxisResult<HairAxisData>;
  makeup: AxisResult<MakeupAxisData>;
}

// ============================================
// 2. 축별 데이터 추출 헬퍼
// ============================================

function getPC(
  r: AxisResult<PersonalColorAxisData>
): { season: string; undertone: string; tone: string } | null {
  if (!r.success) return null;
  return {
    season: String(r.data.season ?? ''),
    undertone: String(r.data.undertone ?? '').toLowerCase(),
    tone: String(r.data.tone ?? ''),
  };
}

function getSkin(r: AxisResult<SkinAxisData>): { type: string; score: number } | null {
  if (!r.success) return null;
  return {
    type: String(r.data.skinType ?? '').toLowerCase(),
    score: Number(r.data.overallScore ?? 0),
  };
}

function getBody(r: AxisResult<BodyAxisData>): { type: string } | null {
  if (!r.success) return null;
  return { type: getBodyShapeLabel(r.data.bodyType) };
}

function getHair(r: AxisResult<HairAxisData>): { faceShape: string } | null {
  if (!r.success) return null;
  return { faceShape: String(r.data.faceShape ?? '') };
}

function getMakeup(r: AxisResult<MakeupAxisData>): { base: string } | null {
  if (!r.success) return null;
  return { base: String(r.data.baseRecommendation ?? '') };
}

// ============================================
// 3. 조합별 규칙
// ============================================

/** PC × S — 베이스 메이크업 방향 */
function pcXskin(
  pc: { undertone: string },
  skin: { type: string }
): Pick<CrossInsight, 'title' | 'body'> {
  const warm = pc.undertone === 'warm';
  const tone = warm ? '코랄' : '로즈';
  const typeKey = skin.type;

  let finish = '사틴 피니시';
  if (typeKey.includes('oil')) finish = '매트 피니시';
  else if (typeKey.includes('dry')) finish = '듀이 피니시';
  else if (typeKey.includes('combination')) finish = '세미매트 피니시';

  return {
    title: `${tone} × ${finish}`,
    body: `${pc.undertone}톤 혈색에 ${skin.type} 피부가 만나면 ${tone} 계열 베이스 + ${finish}가 가장 자연스러워요.`,
  };
}

/** PC × M — 립/아이 색상 */
function pcXmakeup(pc: {
  undertone: string;
  season: string;
}): Pick<CrossInsight, 'title' | 'body'> {
  const warm = pc.undertone === 'warm';
  const lipAccent = warm ? '코랄/오렌지' : '로즈/베리';
  const eyeAccent = warm ? '골드/브라운' : '실버/플럼';
  return {
    title: `${lipAccent} 립 + ${eyeAccent} 섀도`,
    body: `${pc.season} ${pc.undertone}톤 팔레트로 립은 ${lipAccent}, 아이는 ${eyeAccent} 조합이 얼굴을 가장 또렷하게 살려요.`,
  };
}

/** C × H — 실루엣 × 얼굴형 밸런스 */
function bodyXhair(
  body: { type: string },
  hair: { faceShape: string }
): Pick<CrossInsight, 'title' | 'body'> {
  const faceKey = hair.faceShape.toLowerCase();
  // 설명형 가이드 (인사이트 한 줄용 — 얼굴형 의도 설명)
  let hairStyle = '레이어드 컷';
  if (faceKey.includes('round')) hairStyle = '얼굴선을 길게 빼는 사이드 컷';
  else if (faceKey.includes('square')) hairStyle = '턱선 부드럽게 감싸는 웨이브';
  else if (faceKey.includes('heart') || faceKey.includes('triangle'))
    hairStyle = '턱 아래 볼륨 주는 컷';
  else if (faceKey.includes('oval')) hairStyle = '자유로운 스타일';
  else if (faceKey.includes('oblong') || faceKey.includes('long'))
    hairStyle = '가로 볼륨을 만드는 뱅';

  // 구체 추천: 얼굴형이 유효하면 추천기에서 톱 스타일 + 피할 스타일 결합 (ADR-107)
  let example = '';
  let avoid = '';
  if (VALID_FACE_SHAPES.includes(faceKey)) {
    const top = recommendHairstyles(faceKey as FaceShapeType, { maxResults: 1 })[0];
    if (top) example = ` 예: ${top.name}.`;
    const avoidList = getStylesToAvoid(faceKey as FaceShapeType);
    if (avoidList[0]) avoid = ` ${avoidList[0]}은 피하세요.`;
  }

  return {
    title: `${body.type} × ${hairStyle}`,
    body: `${body.type} 실루엣과 ${hair.faceShape || '내'} 얼굴형 균형은 ${hairStyle}이(가) 완성해요.${example}${avoid}`,
  };
}

/** S × M — 피부 상태별 메이크업 제품 */
function skinXmakeup(skin: { type: string; score: number }): Pick<CrossInsight, 'title' | 'body'> {
  const typeKey = skin.type;
  const lowScore = skin.score < 65;

  if (typeKey.includes('oil')) {
    return {
      title: 'T존 컨트롤 + 세팅 파우더',
      body: '지성 피부는 프라이머-세팅 파우더 이중 구조로 유분을 붙잡아주는 게 핵심이에요.',
    };
  }
  if (typeKey.includes('dry')) {
    return {
      title: '보습 프라이머 + 쿠션',
      body: '건성 피부는 보습 프라이머 → 쿠션 순서로 겹쳐야 들뜸 없이 촉촉해요.',
    };
  }
  if (typeKey.includes('sensitiv')) {
    return {
      title: '저자극 베이스 + 미네랄 파우더',
      body: '민감 피부는 무향/무알코올 베이스 + 미네랄 파우더로 자극 없이 마무리.',
    };
  }
  if (typeKey.includes('combination')) {
    return {
      title: 'T존 매트 + U존 듀이',
      body: '복합성은 부위별 다른 피니시가 정답이에요. T존만 파우더로 세팅하세요.',
    };
  }
  // normal / default — "어떤 루틴/어떻게"까지 구체화 (초보자 눈높이)
  return {
    title: lowScore ? '기초 루틴 안정화 먼저' : '지금 스킨케어 그대로 + 주 1회 각질 케어',
    body: lowScore
      ? '메이크업 전 기본 보습/차단부터 1-2주 안정화하면 발색이 달라져요.'
      : '피부가 좋은 상태예요. 주 1회 밤에 저자극 필링 패드로 각질만 정리해주면 베이스 메이크업이 더 잘 밀착돼요.',
  };
}

/** PC × C — 의류 색상 + 체형 스타일링 */
function pcXbody(
  pc: { undertone: string; season: string },
  body: { type: string }
): Pick<CrossInsight, 'title' | 'body'> {
  const warm = pc.undertone === 'warm';
  const topTone = warm ? '따뜻한 아이보리/카멜' : '쿨 그레이/네이비';
  return {
    title: `${topTone} × ${body.type} 핏`,
    body: `${pc.season} ${pc.undertone}톤에 ${body.type} 체형은 ${topTone} 상의 + 핏 포인트를 살린 하의 조합이 안정적이에요.`,
  };
}

// ============================================
// 4. 조합기
// ============================================

/**
 * 성공한 축 조합으로부터 인사이트 0-5개 생성.
 * 필요한 두 축이 모두 성공해야 해당 조합 생성.
 * 생성 순서: 가치 높은 조합부터 (PC×S → PC×M → C×H → S×M → PC×C).
 */
export function composeCrossInsights(input: ComposeCrossInsightsInput): CrossInsights {
  const pc = getPC(input.personalColor);
  const skin = getSkin(input.skin);
  const body = getBody(input.body);
  const hair = getHair(input.hair);
  const makeup = getMakeup(input.makeup);

  const items: CrossInsight[] = [];

  if (pc && skin) {
    items.push({
      id: 'pc_s',
      combo: '색 × 피부',
      ...pcXskin(pc, skin),
    });
  }

  if (pc && makeup) {
    items.push({
      id: 'pc_m',
      combo: '색 × 메이크업',
      ...pcXmakeup(pc),
    });
  }

  if (body && hair) {
    items.push({
      id: 'c_h',
      combo: '체형 × 헤어',
      ...bodyXhair(body, hair),
    });
  }

  if (skin && makeup) {
    items.push({
      id: 's_m',
      combo: '피부 × 메이크업',
      ...skinXmakeup(skin),
    });
  }

  if (pc && body) {
    items.push({
      id: 'pc_c',
      combo: '색 × 체형',
      ...pcXbody(pc, body),
    });
  }

  return { items };
}
