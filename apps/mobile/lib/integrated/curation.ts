/**
 * 모바일 통합 큐레이션 (ADR-104 체크리스트 #5)
 *
 * @module lib/integrated/curation
 * @description
 *   웹 apps/web/lib/analysis/integrated/curation.ts 동일 로직 복제.
 *   모바일은 IntegratedAnalysisResult.axes를 직접 입력.
 *   href는 모바일 Expo Router 경로 규칙 따름.
 *
 * @see apps/web/lib/analysis/integrated/curation.ts (원본)
 */

import type { AxisData, IntegratedAnalysisResult } from '@/lib/api';
// 소비자 눈높이 라벨 (원시 영문/코드 season·skinType·bodyType → 한국어) — 웹 정본 미러
import { seasonKo, skinTypeKo, bodyTypeKo } from './labels';

export type CurationCategory = 'lip' | 'base' | 'skincare' | 'outfit' | 'hair';

export interface CurationItem {
  category: CurationCategory;
  title: string;
  reason: string;
  href: string;
  cta: string;
}

export interface Curation {
  items: CurationItem[];
}

// ============================================
// URL 빌더 (모바일 Expo Router 경로)
// ============================================

function buildBeautyPath(
  category: string,
  extras: Record<string, string>,
  sessionId: string
): string {
  const params = new URLSearchParams({
    category,
    ...extras,
    source: 'integrated',
    session: sessionId,
  });
  return `/(tabs)/beauty?${params.toString()}`;
}

function buildClosetPath(extras: Record<string, string>, sessionId: string): string {
  const params = new URLSearchParams({
    ...extras,
    source: 'integrated',
    session: sessionId,
  });
  return `/(closet)/recommend?${params.toString()}`;
}

// ============================================
// 축 데이터 추출
// ============================================

function getPC(r: IntegratedAnalysisResult['axes']['personalColor']): AxisData | null {
  return r.success ? r.data : null;
}

function getSkin(r: IntegratedAnalysisResult['axes']['skin']): AxisData | null {
  return r.success ? r.data : null;
}

function getBody(r: IntegratedAnalysisResult['axes']['body']): AxisData | null {
  return r.success ? r.data : null;
}

// ============================================
// 큐레이션 조립
// ============================================

export interface ComposeCurationOptions {
  /**
   * 사용자가 옷장에 아이템을 등록했는지 여부.
   * 왜: outfit 카드는 `/(closet)/recommend`로 보내는데, 옷장이 비면 빈 상태를 마주침.
   * 비었다면 CTA를 "먼저 옷장 등록하기"로 바꾸고 목적지를 `/(closet)` 메인으로 변경.
   * undefined면 정보 없음 → 기본 경로 사용.
   */
  hasClosetItems?: boolean;
}

export function composeCuration(
  axes: IntegratedAnalysisResult['axes'],
  sessionId: string,
  options: ComposeCurationOptions = {}
): Curation {
  const pc = getPC(axes.personalColor);
  const skin = getSkin(axes.skin);
  const body = getBody(axes.body);
  const { hasClosetItems } = options;

  const items: CurationItem[] = [];

  // Beauty (PC + S)
  if (pc) {
    const undertone = String(pc.undertone ?? '').toLowerCase();
    const warm = undertone === 'warm';
    const tone = warm ? '코랄' : '로즈';
    const toneKey = warm ? 'warm' : 'cool';

    items.push({
      category: 'lip',
      title: `${tone} 계열 립틴트`,
      // 원시 season/undertone(spring·warm) 노출 금지 — seasonKo가 '봄 웜톤'까지 담음
      reason: `${seasonKo(pc.season) || '당신의'} 혈색을 가장 자연스럽게 살려요.`,
      href: buildBeautyPath('lip', { tone: toneKey }, sessionId),
      cta: '립 보러가기',
    });

    if (skin) {
      const skinType = String(skin.skinType ?? '').toLowerCase();
      let finish = 'satin';
      let label = '사틴';
      if (skinType.includes('oil')) {
        finish = 'matte';
        label = '매트';
      } else if (skinType.includes('dry')) {
        finish = 'dewy';
        label = '듀이';
      } else if (skinType.includes('combination')) {
        finish = 'semi-matte';
        label = '세미매트';
      }
      items.push({
        category: 'base',
        title: `${label} 베이스 메이크업`,
        // 원시 영문 피부타입(combination 등) 노출 금지 — skinTypeKo로 한국어화
        reason: `${skinTypeKo(skin.skinType) || '당신'} 피부에 ${label} 피니시가 잘 맞아요.`,
        href: buildBeautyPath('base', { finish, tone: toneKey }, sessionId),
        cta: '베이스 보러가기',
      });
    }
  } else if (skin) {
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
    // 원시 영문 타입 노출 금지 + '바이탈리티' 전문용어 제거 — 웹과 동일하게 '컨디션 점수'로 순화
    const skinTypeLabel = skinTypeKo(skin.skinType) || '내';
    items.push({
      category: 'skincare',
      title: `${focus} 스킨케어 루틴`,
      reason: `${skinTypeLabel} 피부(컨디션 점수 ${skin.overallScore ?? 70}점)에 맞춘 추천이에요.`,
      href: buildBeautyPath('skincare', { focus: query }, sessionId),
      cta: '스킨케어 보러가기',
    });
  }

  // Outfit (체형)
  if (body) {
    // href 쿼리 파라미터용 원값(recommend 화면이 파싱) — 표시용과 분리 유지
    const bodyType = String(body.bodyType ?? '');
    // 체형 코드/영문(W, hourglass 등) 노출 금지 — bodyTypeKo로 'W(웨이브)'/'모래시계형' 병기
    const bodyTypeLabel = bodyTypeKo(body.bodyType);
    const toneQuery = pc && String(pc.undertone ?? '').toLowerCase() === 'warm' ? 'warm' : 'cool';

    // 중첩 삼항 방지
    let toneLabel = '';
    if (pc) {
      toneLabel = toneQuery === 'warm' ? '따뜻한' : '시원한';
    }
    const title = `${bodyTypeLabel} 체형 × ${toneLabel || '나'} 톤 코디`;

    if (hasClosetItems === false) {
      // 옷장이 비어있으면 옷 추가 화면으로 우회
      const params = new URLSearchParams({
        source: 'integrated',
        session: sessionId,
      });
      items.push({
        category: 'outfit',
        title,
        reason: '분석 결과에 맞춘 코디를 받으려면 먼저 옷장을 등록해주세요.',
        href: `/(closet)/add?${params.toString()}`,
        cta: '먼저 옷장 등록하기',
      });
    } else {
      // 원시 spring/warm 노출 제거 — seasonKo('봄 웜톤')로 대체
      const paletteDescription = pc ? seasonKo(pc.season) || '컬러 팔레트' : '컬러 팔레트';
      items.push({
        category: 'outfit',
        title,
        reason: `체형 핏 포인트와 ${paletteDescription}이 함께 반영된 코디 제안이에요.`,
        href: buildClosetPath({ body: bodyType, tone: toneQuery }, sessionId),
        cta: '코디 보러가기',
      });
    }
  }

  return { items: items.slice(0, 3) };
}
