/**
 * 액션 플랜 생성 (ADR-104 체크리스트 #2 — "다음 행동이 명확")
 *
 * @module lib/analysis/integrated/action-plan
 * @description
 *   5축 분석 결과를 입력으로 "지금 / 이번 주 / 다음 달" 3단계 조언을 규칙 기반으로 생성.
 *   Gemini 호출 없음 — 결정론적 + 빠름 + 무료.
 *   축 조합에 맞춰 우선순위 있는 실행 경로를 사용자에게 제시.
 *
 * @see docs/adr/ADR-104-yiroom-launch-criteria.md §2.1 체크리스트 #2
 */

import { getBodyShapeLabel } from '@/lib/body';
import { seasonKo, toneKo, faceShapeKo } from './labels';
import type {
  AxisResult,
  AxisCode,
  PersonalColorAxisData,
  SkinAxisData,
  BodyAxisData,
  HairAxisData,
  MakeupAxisData,
  RecommendationGender,
  RecommendationSituation,
} from './types';

// ============================================
// 1. 액션 타입
// ============================================

export type ActionHorizon = 'now' | 'this_week' | 'this_month';

export interface ActionItem {
  /** 시점: 지금 / 이번 주 / 이번 달 */
  horizon: ActionHorizon;
  /** 관련 축 (우선순위 판단/UI 아이콘용) */
  axis: AxisCode;
  /** 짧은 제목 (한 줄) */
  title: string;
  /** 보조 설명 (한 줄, 왜 필요한지) */
  why: string;
}

export interface ActionPlan {
  /** 시점별 1개씩 총 3개 (부족하면 2~1개 가능) */
  items: ActionItem[];
}

// ============================================
// 2. 축별 후보 액션 (규칙 기반)
// ============================================

const HORIZON_ORDER: ActionHorizon[] = ['now', 'this_week', 'this_month'];

/** 퍼스널 대비(ADR-116) 실측값이 있으면 립 발색 강도 한 줄 (없으면 빈 문자열 — 무변경) */
function contrastLipNote(level: 'low' | 'medium' | 'high' | undefined): string {
  if (level === 'high') return ' 대비가 높아 진한 발색도 잘 받아요.';
  if (level === 'low') return ' 대비가 낮아 은은한 발색(MLBB)이 더 자연스러워요.';
  return '';
}

/** PC 성공 시 액션 후보. 우선순위: now > this_week */
function pcActions(data: PersonalColorAxisData, gender: RecommendationGender): ActionItem[] {
  const warm = data.undertone?.toLowerCase() === 'warm';
  // 왜: 남성에게 "코랄 립틴트"를 첫 행동으로 제시하던 이탈 포인트 → 그루밍 톤으로 분기.
  // 립틴트는 화장 습관이 있는 여성/미상(neutral)에게만.
  // 원시 영문값(season='Autumn', undertone='Warm')을 한국어로 — 사용자 대면 문구 영문 누수 방지
  const seasonLabel = seasonKo(data.season);
  // 퍼스널 대비(ADR-116) 실측값이 있으면 립 발색 강도 한 줄 덧붙임 (없으면 무변경)
  const contrastNote = contrastLipNote(data.contrastLevel);
  const now: ActionItem =
    gender === 'male'
      ? {
          horizon: 'now',
          axis: 'personal_color',
          title: warm ? '톤 보정 선크림·립밤으로 혈색 살리기' : '톤 보정 선크림·립밤으로 화색 잡기',
          why: `${seasonLabel}에 맞는 무겁지 않은 베이스가 인상을 정돈해줘요.`,
        }
      : {
          horizon: 'now',
          axis: 'personal_color',
          title: warm ? '코랄 계열 립틴트 1개 써보기' : '로즈 계열 립틴트 1개 써보기',
          why: `${seasonLabel}에 혈색이 가장 잘 살아나요.${contrastNote}`,
        };
  return [
    now,
    {
      horizon: 'this_week',
      axis: 'personal_color',
      title: `${toneKo(data.tone)} 팔레트로 옷장 정리`,
      why: '기존 옷 중 어울리는 3벌을 고르고 자주 입어보세요.',
    },
  ];
}

/** S 성공 시 */
function skinActions(data: SkinAxisData): ActionItem[] {
  const type = data.skinType?.toLowerCase() ?? 'normal';
  const lowScore = (data.overallScore ?? 70) < 65;

  if (type.includes('oil')) {
    return [
      {
        horizon: 'this_week',
        axis: 'skin',
        title: 'T존 매트 파우더 루틴 시작',
        why: '이마·코의 유분을 잡아주면 피부 컨디션 점수가 올라가요.',
      },
    ];
  }
  if (type.includes('dry')) {
    return [
      {
        horizon: 'this_week',
        axis: 'skin',
        title: '세라마이드 세럼 아침/저녁 사용',
        why: '수분 베리어 회복으로 촉촉함을 되찾아요.',
      },
    ];
  }
  if (type.includes('combination')) {
    return [
      {
        horizon: 'this_week',
        axis: 'skin',
        title: 'T존/U존 분리 케어 루틴',
        why: '복합성은 부위별 접근이 가장 효과적이에요.',
      },
    ];
  }
  if (type.includes('sensitiv')) {
    return [
      {
        horizon: 'this_week',
        axis: 'skin',
        title: '저자극 진정 라인으로 전환',
        why: '민감 피부는 단순화된 루틴이 최선이에요.',
      },
    ];
  }
  return [
    {
      horizon: 'this_week',
      axis: 'skin',
      // 초보자 눈높이: "어떤 루틴인지·어떻게 하는지"까지 구체화 (막연한 지시 금지)
      title: lowScore
        ? '기본 보습·자외선 차단부터 점검 (홈의 "오늘의 루틴" 참고)'
        : '홈의 "오늘의 루틴" 이어가기 + 주 1회 각질 케어',
      why: lowScore
        ? '피부 컨디션을 올리는 기초예요. 오늘의 루틴이 내 피부에 맞춘 순서를 알려드려요.'
        : '각질 케어는 세안 후 저자극 필링 패드(AHA/BHA)를 주 1회 밤에, 다음 날 자외선 차단과 함께 하면 돼요.',
    },
  ];
}

/** C 성공 시 — 타입별 구체 아이템 제시 (초보자는 "실루엣 아이템"이 뭔지 모른다) */
const BODY_ITEM_SUGGESTION: Record<string, { item: string; why: string }> = {
  스트레이트: {
    item: '어깨선이 깔끔한 셔츠나 테일러드 재킷',
    why: '직선이 살아있는 스트레이트 체형은 각 잡힌 어깨 라인이 몸의 장점을 살려줘요.',
  },
  웨이브: {
    item: '허리 라인이 들어간 상의나 하이웨이스트 하의',
    why: '곡선이 부드러운 웨이브 체형은 허리 위치를 높여주면 비율이 살아나요.',
  },
  내추럴: {
    item: '여유 있는 핏의 스트레이트 팬츠나 오버셔츠',
    why: '골격감이 자연스러운 내추럴 체형은 몸을 조이지 않는 여유 핏이 멋을 만들어요.',
  },
};

function bodyActions(data: BodyAxisData): ActionItem[] {
  const type = getBodyShapeLabel(data.bodyType);
  const suggestion = BODY_ITEM_SUGGESTION[type];
  return [
    {
      horizon: 'this_month',
      axis: 'body',
      title: suggestion
        ? `이번 달 옷 한 벌: ${suggestion.item}`
        : `${type} 체형에 어울리는 옷 1개 들이기`,
      why: suggestion?.why ?? '핏 포인트를 살리는 아이템으로 스타일 완성도가 올라가요.',
    },
  ];
}

/** H 성공 시 — 얼굴형 원시값(영문) 노출 금지 (faceShapeKo는 ./labels 공용 헬퍼) */
function hairActions(data: HairAxisData): ActionItem[] {
  const shapeKo = faceShapeKo(data.faceShape ?? 'oval');
  return [
    {
      horizon: 'this_month',
      axis: 'hair',
      title: `${shapeKo} 얼굴에 어울리는 컷 시도`,
      why: '얼굴선과 균형 있는 헤어라인이 인상을 바꿔요. 미용실에서 얼굴형을 말하면 어울리는 컷을 제안받기 쉬워요.',
    },
  ];
}

/** M 성공 시 */
function makeupActions(data: MakeupAxisData, gender: RecommendationGender): ActionItem[] {
  // 남성: 풀메이크업 대신 눈썹 정리 + 톤 보정 그루밍 (과하지 않게 인상만 또렷하게)
  if (gender === 'male') {
    return [
      {
        horizon: 'now',
        axis: 'makeup',
        title: '눈썹 정리 + 톤 보정 선크림으로 인상 정돈',
        why: 'PC·피부 분석을 반영한 최소한의 그루밍이에요. 과하지 않아 부담 없어요.',
      },
    ];
  }
  return [
    {
      horizon: 'now',
      axis: 'makeup',
      title: data.baseRecommendation ?? '어울리는 메이크업 베이스 시도',
      why: 'PC·피부 분석을 한 번에 반영한 추천이에요.',
    },
  ];
}

// ============================================
// 3. 액션 플랜 조립
// ============================================

export interface ComposeActionPlanInput {
  personalColor: AxisResult<PersonalColorAxisData>;
  skin: AxisResult<SkinAxisData>;
  body: AxisResult<BodyAxisData>;
  hair: AxisResult<HairAxisData>;
  makeup: AxisResult<MakeupAxisData>;
  /** 성별 (추천 분기 전용). 미지정 시 'neutral' — 립틴트 등 유지 */
  gender?: RecommendationGender;
  /** 상황/TPO (선택) — now 액션 문구에 맥락 부여 */
  situation?: RecommendationSituation;
}

/** 상황 라벨 (액션 문구 접두사용). 'daily'는 접두사가 어색해 제외 */
const SITUATION_PREFIX: Partial<Record<RecommendationSituation, string>> = {
  date: '소개팅',
  interview: '면접',
  travel: '여행',
  party: '모임',
};

/** 상황(TPO)이 있으면 'now' 액션 제목에 맥락 접두사를 부여 ("소개팅 전까지 — ...") */
function applySituationPrefix(items: ActionItem[], situation?: RecommendationSituation): void {
  const prefix = situation ? SITUATION_PREFIX[situation] : undefined;
  if (!prefix) return;
  const nowItem = items.find((i) => i.horizon === 'now');
  if (nowItem) {
    nowItem.title = `${prefix} 전까지 — ${nowItem.title}`;
  }
}

/**
 * 성공한 축에서 후보 액션을 모은 뒤, 시점별(now/this_week/this_month) 1개씩 선택.
 *
 * 우선순위 규칙:
 * - now: makeup > personal_color 순
 * - this_week: skin > personal_color 순
 * - this_month: body > hair 순
 *
 * 후보 없으면 해당 시점 스킵. 결과가 빈 배열이면 빈 플랜 반환.
 */
export function composeActionPlan(input: ComposeActionPlanInput): ActionPlan {
  const gender: RecommendationGender = input.gender ?? 'neutral';
  const candidates: ActionItem[] = [];

  if (input.personalColor.success) {
    candidates.push(...pcActions(input.personalColor.data, gender));
  }
  if (input.skin.success) {
    candidates.push(...skinActions(input.skin.data));
  }
  if (input.body.success) {
    candidates.push(...bodyActions(input.body.data));
  }
  if (input.hair.success) {
    candidates.push(...hairActions(input.hair.data));
  }
  if (input.makeup.success) {
    candidates.push(...makeupActions(input.makeup.data, gender));
  }

  // 시점별 우선순위 축 선택
  const priorityByHorizon: Record<ActionHorizon, AxisCode[]> = {
    now: ['makeup', 'personal_color', 'skin', 'body', 'hair'],
    this_week: ['skin', 'personal_color', 'makeup', 'body', 'hair'],
    this_month: ['body', 'hair', 'personal_color', 'skin', 'makeup'],
  };

  const items: ActionItem[] = [];
  for (const horizon of HORIZON_ORDER) {
    const pool = candidates.filter((c) => c.horizon === horizon);
    if (pool.length === 0) continue;
    // 우선순위에 따라 첫 후보 선택
    for (const axis of priorityByHorizon[horizon]) {
      const found = pool.find((c) => c.axis === axis);
      if (found) {
        items.push(found);
        break;
      }
    }
    // 폴백: 우선순위 매칭 실패 시 첫 항목
    if (!items.find((i) => i.horizon === horizon)) {
      items.push(pool[0]);
    }
  }

  // 상황(TPO)이 있으면 'now' 액션 제목에 맥락 접두사 부여
  applySituationPrefix(items, input.situation);

  return { items };
}
