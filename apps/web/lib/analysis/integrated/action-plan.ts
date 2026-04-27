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

import type {
  AxisResult,
  AxisCode,
  PersonalColorAxisData,
  SkinAxisData,
  BodyAxisData,
  HairAxisData,
  MakeupAxisData,
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

/** PC 성공 시 액션 후보. 우선순위: now > this_week */
function pcActions(data: PersonalColorAxisData): ActionItem[] {
  const warm = data.undertone?.toLowerCase() === 'warm';
  return [
    {
      horizon: 'now',
      axis: 'personal_color',
      title: warm ? '코랄 계열 립틴트 1개 써보기' : '로즈 계열 립틴트 1개 써보기',
      why: `${data.season} ${data.undertone}톤에 혈색이 가장 잘 살아나요.`,
    },
    {
      horizon: 'this_week',
      axis: 'personal_color',
      title: `${data.tone} 팔레트로 옷장 정리`,
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
        why: '유분 조절로 피부 바이탈리티가 올라가요.',
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
      title: lowScore ? '기본 보습·자외선 차단 루틴 점검' : '현재 루틴 유지 + 주 1회 각질 관리',
      why: lowScore ? '바이탈리티를 올리기 위한 기초부터.' : '좋은 상태를 유지하는 데 집중.',
    },
  ];
}

/** C 성공 시 */
function bodyActions(data: BodyAxisData): ActionItem[] {
  const type = data.bodyType ?? '';
  return [
    {
      horizon: 'this_month',
      axis: 'body',
      title: `${type} 체형에 맞는 실루엣 아이템 1개 추가`,
      why: '핏 포인트를 살리는 아이템으로 스타일 완성도가 올라가요.',
    },
  ];
}

/** H 성공 시 */
function hairActions(data: HairAxisData): ActionItem[] {
  const shape = data.faceShape ?? 'oval';
  return [
    {
      horizon: 'this_month',
      axis: 'hair',
      title: `${shape}형에 어울리는 컷 시도`,
      why: '얼굴선과 균형 있는 헤어라인이 인상을 바꿔요.',
    },
  ];
}

/** M 성공 시 */
function makeupActions(data: MakeupAxisData): ActionItem[] {
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
  const candidates: ActionItem[] = [];

  if (input.personalColor.success) {
    candidates.push(...pcActions(input.personalColor.data));
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
    candidates.push(...makeupActions(input.makeup.data));
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

  return { items };
}
