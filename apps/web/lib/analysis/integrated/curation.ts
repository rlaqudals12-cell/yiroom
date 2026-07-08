/**
 * 통합 큐레이션 (ADR-104 체크리스트 #5 — "통합 프로필 기반 제품 세트")
 *
 * @module lib/analysis/integrated/curation
 * @description
 *   5축 결과 기반으로 사용자에게 추천할 제품 카테고리 3개 이내 큐레이션.
 *   축별 개별 링크가 아닌 "통합 프로필을 반영한 세트"로 제시.
 *   기존 제품 DB(`/beauty`, `/closet`) 링크로 연결 + 쿼리 파라미터로 필터 전달.
 *   규칙 기반 (결정론적, DB 저장 없음).
 *
 * @see docs/adr/ADR-104-yiroom-launch-criteria.md §2.1 체크리스트 #5
 */

import { getBodyShapeLabel } from '@/lib/body';
import { seasonKo, skinTypeKo } from './labels';
import type {
  AxisResult,
  PersonalColorAxisData,
  SkinAxisData,
  BodyAxisData,
  HairAxisData,
  MakeupAxisData,
  RecommendationGender,
} from './types';

// ============================================
// 1. 타입
// ============================================

export type CurationCategory = 'lip' | 'base' | 'skincare' | 'outfit' | 'hair';

export interface CurationItem {
  /** 카테고리 (UI 아이콘/색상 판단) */
  category: CurationCategory;
  /** 카드 제목 */
  title: string;
  /** 한 줄 설명 (왜 당신에게 어울리는지) */
  reason: string;
  /** 이동할 URL (기존 제품 DB 경로 + 쿼리) */
  href: string;
  /** 버튼 문구 */
  cta: string;
}

export interface Curation {
  items: CurationItem[];
}

export interface ComposeCurationInput {
  personalColor: AxisResult<PersonalColorAxisData>;
  skin: AxisResult<SkinAxisData>;
  body: AxisResult<BodyAxisData>;
  hair: AxisResult<HairAxisData>;
  makeup: AxisResult<MakeupAxisData>;
  /** 세션 ID (URL 추적용, 향후 어필리에이트 기여도 추적) */
  sessionId: string;
  /**
   * 성별 (추천 분기 전용). 남성이면 립틴트 대신 그루밍(선크림·립밤)으로 대체.
   * 미지정 시 'neutral' — 기존 립/베이스 유지.
   */
  gender?: RecommendationGender;
  /**
   * 사용자가 옷장에 아이템을 등록했는지 여부.
   * 왜: outfit 카드는 `/closet/recommend`로 보내는데, 옷장이 비면 빈 상태를 마주치게 됨.
   * 비어있다면 CTA를 "먼저 옷장 등록하기"로 바꾸고 목적지를 `/closet/add`로 변경.
   * undefined면 정보 없음으로 간주 — 기본 `/closet/recommend` 경로 사용.
   */
  hasClosetItems?: boolean;
}

// ============================================
// 2. 카테고리별 URL 빌더
// ============================================

function buildBeautyUrl(params: Record<string, string>, sessionId: string): string {
  const p = new URLSearchParams({ ...params, source: 'integrated', session: sessionId });
  return `/beauty?${p.toString()}`;
}

function buildClosetUrl(params: Record<string, string>, sessionId: string): string {
  const p = new URLSearchParams({ ...params, source: 'integrated', session: sessionId });
  return `/closet/recommend?${p.toString()}`;
}

// ============================================
// 3. 축 조합 → 큐레이션 규칙
// ============================================

/** PC + S (or PC 단독) → 립/베이스 큐레이션 */
function buildBeautyCuration(
  pc: PersonalColorAxisData | null,
  skin: SkinAxisData | null,
  sessionId: string,
  gender: RecommendationGender
): CurationItem[] {
  if (!pc) return [];
  const warm = String(pc.undertone ?? '').toLowerCase() === 'warm';
  const tone = warm ? '코랄' : '로즈';
  const toneKey = warm ? 'warm' : 'cool';
  const items: CurationItem[] = [];

  // 왜: 남성에게 립틴트 큐레이션은 이질적 → 톤 보정 그루밍(선크림·립밤)으로 대체
  if (gender === 'male') {
    items.push({
      category: 'skincare',
      title: '톤 보정 선크림 · 립밤',
      reason: `${seasonKo(pc.season) || '당신의'} 인상을 부담 없이 정돈해줘요.`,
      href: buildBeautyUrl({ category: 'sunscreen', tone: toneKey }, sessionId),
      cta: '그루밍 보러가기',
    });
  } else {
    // 립
    items.push({
      category: 'lip',
      title: `${tone} 계열 립틴트`,
      reason: `${seasonKo(pc.season) || '당신의'} 혈색을 가장 자연스럽게 살려요.`,
      href: buildBeautyUrl({ category: 'lip', tone: toneKey }, sessionId),
      cta: '립 보러가기',
    });
  }

  // 베이스 — 피부 타입 반영 (남성은 베이스 메이크업 제외, 위 그루밍 카드로 대체)
  if (skin && gender !== 'male') {
    const skinType = String(skin.skinType ?? '').toLowerCase();
    let finish = 'satin';
    let finishLabel = '사틴';
    if (skinType.includes('oil')) {
      finish = 'matte';
      finishLabel = '매트';
    } else if (skinType.includes('dry')) {
      finish = 'dewy';
      finishLabel = '듀이';
    } else if (skinType.includes('combination')) {
      finish = 'semi-matte';
      finishLabel = '세미매트';
    }
    items.push({
      category: 'base',
      title: `${finishLabel} 베이스 메이크업`,
      reason: `${skin.skinType ?? '당신'} 피부에 ${finishLabel} 피니시가 잘 맞아요.`,
      href: buildBeautyUrl({ category: 'base', finish, tone: toneKey }, sessionId),
      cta: '베이스 보러가기',
    });
  }

  return items;
}

/** S 단독 → 스킨케어 큐레이션 (skin이 있으나 PC 없을 때) */
function buildSkincareCuration(skin: SkinAxisData, sessionId: string): CurationItem {
  const skinType = String(skin.skinType ?? '').toLowerCase();
  let focus = '기본';
  let query = 'basic';
  if (skinType.includes('oil')) {
    focus = 'T존 유분 조절';
    query = 'oil-control';
  } else if (skinType.includes('dry')) {
    focus = '수분 베리어';
    query = 'moisture';
  } else if (skinType.includes('sensitiv')) {
    focus = '저자극 진정';
    query = 'sensitive';
  } else if (skinType.includes('combination')) {
    focus = '부위별 밸런스';
    query = 'combination';
  }
  // 원시 영문 타입("normal") 노출 금지 — 초보자 눈높이 (skinTypeKo는 ./labels 공용 헬퍼)
  const skinTypeLabel = skinTypeKo(skin.skinType) || '내';
  return {
    category: 'skincare',
    title: `${focus} 스킨케어 루틴`,
    reason: `${skinTypeLabel} 피부(컨디션 점수 ${skin.overallScore ?? 70}점)에 맞춘 추천이에요.`,
    href: buildBeautyUrl({ category: 'skincare', focus: query }, sessionId),
    cta: '스킨케어 보러가기',
  };
}

/** C + H → 옷장 스타일링 큐레이션 */
function buildOutfitCuration(
  body: BodyAxisData | null,
  pc: PersonalColorAxisData | null,
  sessionId: string,
  hasClosetItems: boolean | undefined
): CurationItem | null {
  if (!body) return null;
  const bodyType = getBodyShapeLabel(body.bodyType);
  const toneQuery = pc && String(pc.undertone ?? '').toLowerCase() === 'warm' ? 'warm' : 'cool';

  // 중첩 삼항 방지: pc 유무 + tone에 따른 라벨을 if/else로 결정
  let toneLabel = '';
  if (pc) {
    toneLabel = toneQuery === 'warm' ? '따뜻한' : '시원한';
  }

  // 초보자 눈높이: 골격 용어에 짧은 풀이 병기 (웨이브가 뭔지 모르는 사용자 기준)
  const BODY_DESC: Record<string, string> = {
    스트레이트: '직선이 깔끔한',
    웨이브: '곡선이 부드러운',
    내추럴: '골격감이 자연스러운',
  };
  const bodyDesc = BODY_DESC[bodyType] ?? '';
  const title = `${bodyType} 체형 × ${toneLabel || '나'} 톤 코디`;

  // 왜: 옷장이 비어있으면 `/closet/recommend`가 빈 상태로 떠 사용자 기대 위반 → 옷장 등록으로 우회
  if (hasClosetItems === false) {
    const params = new URLSearchParams({
      source: 'integrated',
      session: sessionId,
    });
    return {
      category: 'outfit',
      title,
      reason: `${bodyDesc} ${bodyType} 체형에 맞춘 코디를 받으려면 먼저 갖고 있는 옷을 등록해주세요.`,
      href: `/closet/add?${params.toString()}`,
      cta: '먼저 옷장 등록하기',
    };
  }

  // 중첩 템플릿 리터럴 방지: pc 팔레트 설명을 별도 변수로 분리 (원시 영문 → 한국어)
  const paletteDescription = pc ? seasonKo(pc.season) || '컬러 팔레트' : '컬러 팔레트';

  return {
    category: 'outfit',
    title,
    reason: `체형 핏 포인트와 ${paletteDescription}이 함께 반영된 코디 제안이에요.`,
    href: buildClosetUrl({ body: bodyType, tone: toneQuery }, sessionId),
    cta: '코디 보러가기',
  };
}

// ============================================
// 4. 큐레이션 조립
// ============================================

/**
 * 5축 결과와 세션 ID로부터 0-3개 큐레이션 카드 생성.
 * 우선순위:
 *   1. Beauty (PC + S) — 립 + 베이스 (최대 2개)
 *   2. Outfit (C + optional PC)
 *   3. Skincare (PC 없고 S만 있을 때)
 *
 * 최대 3개. 성공 축이 적으면 그만큼 적게 반환.
 */
export function composeCuration(input: ComposeCurationInput): Curation {
  const pc = input.personalColor.success ? input.personalColor.data : null;
  const skin = input.skin.success ? input.skin.data : null;
  const body = input.body.success ? input.body.data : null;

  const gender: RecommendationGender = input.gender ?? 'neutral';
  const items: CurationItem[] = [];

  // PC가 있으면 Beauty 카테고리 2개 시도
  if (pc) {
    items.push(...buildBeautyCuration(pc, skin, input.sessionId, gender));
  } else if (skin) {
    // PC 없고 S만 → 스킨케어
    items.push(buildSkincareCuration(skin, input.sessionId));
  }

  // 옷장 (체형 있으면)
  const outfit = buildOutfitCuration(body, pc, input.sessionId, input.hasClosetItems);
  if (outfit) items.push(outfit);

  // 최대 3개로 제한
  return { items: items.slice(0, 3) };
}
