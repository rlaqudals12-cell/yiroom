/**
 * 모바일 액션 플랜 (ADR-104 체크리스트 #2)
 *
 * @module lib/integrated/action-plan
 * @description
 *   웹 apps/web/lib/analysis/integrated/action-plan.ts와 동일 로직 복제 (모노레포 공유 전까지).
 *   모바일은 API 응답(AxisResult 형태)을 그대로 받아 composeActionPlan 호출.
 *
 * @see apps/web/lib/analysis/integrated/action-plan.ts (원본)
 * @see docs/adr/ADR-104-yiroom-launch-criteria.md §2.1
 */

import type { AxisResult, AxisCode, AxisData, IntegratedAnalysisResult } from '@/lib/api';

export type ActionHorizon = 'now' | 'this_week' | 'this_month';

export interface ActionItem {
  horizon: ActionHorizon;
  axis: AxisCode;
  title: string;
  why: string;
}

export interface ActionPlan {
  items: ActionItem[];
}

const HORIZON_ORDER: ActionHorizon[] = ['now', 'this_week', 'this_month'];

function pcActions(data: AxisData): ActionItem[] {
  const undertone = String(data.undertone ?? '').toLowerCase();
  const warm = undertone === 'warm';
  const season = String(data.season ?? '');
  const tone = String(data.tone ?? season);
  return [
    {
      horizon: 'now',
      axis: 'personal_color',
      title: warm ? '코랄 계열 립틴트 1개 써보기' : '로즈 계열 립틴트 1개 써보기',
      why: `${season} ${undertone}톤에 혈색이 가장 잘 살아나요.`,
    },
    {
      horizon: 'this_week',
      axis: 'personal_color',
      title: `${tone} 팔레트로 옷장 정리`,
      why: '기존 옷 중 어울리는 3벌을 고르고 자주 입어보세요.',
    },
  ];
}

function skinActions(data: AxisData): ActionItem[] {
  const type = String(data.skinType ?? '').toLowerCase();
  const score = Number(data.overallScore ?? 70);
  const lowScore = score < 65;

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

function bodyActions(data: AxisData): ActionItem[] {
  const type = String(data.bodyType ?? '');
  return [
    {
      horizon: 'this_month',
      axis: 'body',
      title: `${type} 체형에 맞는 실루엣 아이템 1개 추가`,
      why: '핏 포인트를 살리는 아이템으로 스타일 완성도가 올라가요.',
    },
  ];
}

function hairActions(data: AxisData): ActionItem[] {
  const shape = String(data.faceShape ?? 'oval');
  return [
    {
      horizon: 'this_month',
      axis: 'hair',
      title: `${shape}형에 어울리는 컷 시도`,
      why: '얼굴선과 균형 있는 헤어라인이 인상을 바꿔요.',
    },
  ];
}

function makeupActions(data: AxisData): ActionItem[] {
  return [
    {
      horizon: 'now',
      axis: 'makeup',
      title: String(data.baseRecommendation ?? '어울리는 메이크업 베이스 시도'),
      why: 'PC·피부 분석을 한 번에 반영한 추천이에요.',
    },
  ];
}

/**
 * 성공한 축별 후보 액션을 모은 뒤, 시점별 1개씩 선택.
 */
export function composeActionPlan(axes: IntegratedAnalysisResult['axes']): ActionPlan {
  const candidates: ActionItem[] = [];

  if (axes.personalColor.success) candidates.push(...pcActions(axes.personalColor.data));
  if (axes.skin.success) candidates.push(...skinActions(axes.skin.data));
  if (axes.body.success) candidates.push(...bodyActions(axes.body.data));
  if (axes.hair.success) candidates.push(...hairActions(axes.hair.data));
  if (axes.makeup.success) candidates.push(...makeupActions(axes.makeup.data));

  const priorityByHorizon: Record<ActionHorizon, AxisCode[]> = {
    now: ['makeup', 'personal_color', 'skin', 'body', 'hair'],
    this_week: ['skin', 'personal_color', 'makeup', 'body', 'hair'],
    this_month: ['body', 'hair', 'personal_color', 'skin', 'makeup'],
  };

  const items: ActionItem[] = [];
  for (const horizon of HORIZON_ORDER) {
    const pool = candidates.filter((c) => c.horizon === horizon);
    if (pool.length === 0) continue;
    let picked: ActionItem | undefined;
    for (const axis of priorityByHorizon[horizon]) {
      const found = pool.find((c) => c.axis === axis);
      if (found) {
        picked = found;
        break;
      }
    }
    items.push(picked ?? pool[0]);
  }

  return { items };
}

const HORIZON_LABEL: Record<ActionHorizon, string> = {
  now: '지금 바로',
  this_week: '이번 주 안에',
  this_month: '이번 달 안에',
};

export function getHorizonLabel(h: ActionHorizon): string {
  return HORIZON_LABEL[h];
}
