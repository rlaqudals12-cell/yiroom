/**
 * 헤어 전용 RAG (모바일)
 * @description 헤어/두피 고민 Q&A를 위한 하드코딩 팁 기반 RAG
 * 웹 버전(apps/web/lib/coach/hair-rag.ts)의 모바일 경량 버전
 * DB 접근 없이 하드코딩 데이터로 운영
 */

import type { UserContext } from './index';

// ============================================
// 헤어 타입별 케어 팁
// ============================================

const HAIR_TYPE_TIPS: Record<string, string[]> = {
  straight: [
    '직모는 정전기가 생기기 쉬우니 헤어 오일이나 미스트로 수분을 보충해주세요',
    '볼륨이 부족하면 뿌리 쪽에 드라이를 반대 방향으로 해보세요',
    '얇은 직모는 가벼운 무스를 활용하면 자연스러운 볼륨이 생겨요',
  ],
  wavy: [
    '웨이브모는 컬 크림이나 무스로 웨이브를 살려주면 좋아요',
    '빗질은 젖은 상태에서 굵은 빗으로 부드럽게 해주세요',
    '디퓨저를 사용해 드라이하면 웨이브가 더 살아요',
  ],
  curly: [
    '곱슬머리는 수분이 핵심이에요. 딥 컨디셔닝을 주 1회 해주세요',
    '헤어 오일로 모발 끝을 코팅해주면 곱슬기가 줄어요',
    '잠잘 때 새틴 베개 커버를 사용하면 엉킴이 줄어요',
  ],
  damaged: [
    '손상모는 단백질 트리트먼트가 필수예요. 주 1-2회 헤어팩을 추천해요',
    '열 도구 사용 전 열 보호 스프레이를 꼭 뿌려주세요',
    '모발 끝이 갈라지면 정기적으로 1-2cm씩 다듬어주세요',
  ],
};

// ============================================
// 두피 타입별 케어 팁
// ============================================

const SCALP_TYPE_TIPS: Record<string, string[]> = {
  oily: [
    '지성 두피는 아침에 샴푸하고 저녁에는 물로만 헹궈도 괜찮아요',
    '살리실산(BHA) 성분의 두피 스케일러가 피지 조절에 좋아요',
    '너무 뜨거운 물은 피지 분비를 촉진하니 미지근한 물로 감아주세요',
  ],
  dry: [
    '건성 두피는 자극 없는 약산성 샴푸를 사용해주세요',
    '두피 에센스나 토닉으로 수분을 공급해주세요',
    '샴푸 횟수를 주 3-4회로 줄여보는 것도 좋아요',
  ],
  sensitive: [
    '민감 두피는 향료, 실리콘 프리 샴푸를 선택해주세요',
    '두피에 자극이 가는 스크럽이나 강한 마사지는 피해주세요',
    '시카, 판테놀 성분의 두피 진정 제품이 도움이 돼요',
  ],
  normal: [
    '건강한 두피를 유지하려면 주 2-3회 샴푸가 적당해요',
    '두피 마사지를 하면 혈액순환이 좋아져 모발 건강에 도움이 돼요',
    '자외선도 두피에 영향을 주니 모자를 쓰는 것도 좋아요',
  ],
};

// ============================================
// 헤어 고민별 팁
// ============================================

const CONCERN_TIPS: Record<string, string[]> = {
  탈모: [
    '탈모 예방을 위해 비오틴, 아연이 풍부한 음식을 섭취해주세요',
    '두피 마사지를 하루 5분 꾸준히 하면 혈액순환에 도움이 돼요',
    '카페인 성분의 두피 토닉이 모근 강화에 효과적이에요',
    '심한 탈모는 전문 의료기관 상담을 권장드려요',
  ],
  비듬: [
    '징크피리치온 성분의 비듬 전용 샴푸를 주 2-3회 사용해보세요',
    '두피 각질은 스크럽보다는 토너 타입의 각질 제거제가 부드러워요',
    '비듬이 심하면 피부과 상담을 통해 지루성 피부염 여부를 확인해보세요',
  ],
  건조: [
    '모발 건조는 주 1-2회 딥 컨디셔닝이 효과적이에요',
    '히알루론산, 아르간 오일 성분의 헤어 제품을 추천해요',
    '드라이어 사용 시 찬바람으로 마무리하면 수분 증발을 줄여줘요',
  ],
  손상: [
    '케라틴 트리트먼트가 손상모 복구에 효과적이에요',
    '염색/펌 간격은 최소 2-3개월을 두는 것이 좋아요',
    '열 도구 사용을 줄이고, 자연 건조를 더 자주 해보세요',
  ],
};

// ============================================
// 질문 키워드 추출
// ============================================

const HAIR_KEYWORDS = [
  '탈모',
  '두피',
  '비듬',
  '각질',
  '건조',
  '지성',
  '가려움',
  '모발',
  '머릿결',
  '손상모',
  '염색',
  '펌',
  '볼륨',
  '샴푸',
  '컨디셔너',
  '트리트먼트',
  '헤어팩',
  '두피케어',
  '비오틴',
  '케라틴',
  '판테놀',
  '카페인',
];

function extractHairKeywords(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  return HAIR_KEYWORDS.filter((kw) => lowerQuery.includes(kw));
}

// ============================================
// 헤어 RAG 메인
// ============================================

/**
 * 헤어 도메인 RAG 컨텍스트 생성
 * 사용자의 헤어/두피 분석 결과와 질문 키워드를 기반으로 맞춤 팁 반환
 */
export function getHairRAG(ctx: UserContext, query: string): string | null {
  const hairType = ctx.hairAnalysis?.hairType;
  const scalpType = ctx.hairAnalysis?.scalpType;
  const concerns = ctx.hairAnalysis?.concerns || [];

  // 헤어 분석 결과가 없으면 키워드 기반으로만 응답
  const keywords = extractHairKeywords(query);

  const parts: string[] = [];

  // 1. 헤어 타입 기반 팁
  if (hairType && HAIR_TYPE_TIPS[hairType]) {
    parts.push(
      `${hairType === 'straight' ? '직모' : hairType === 'wavy' ? '웨이브모' : hairType === 'curly' ? '곱슬모' : '손상모'} 맞춤 조언이에요.`
    );
    const tips = HAIR_TYPE_TIPS[hairType];
    parts.push(tips[0]);
  }

  // 2. 두피 타입 기반 팁
  if (scalpType && SCALP_TYPE_TIPS[scalpType]) {
    const scalpLabel =
      scalpType === 'oily'
        ? '지성'
        : scalpType === 'dry'
          ? '건성'
          : scalpType === 'sensitive'
            ? '민감'
            : '정상';
    parts.push(`${scalpLabel} 두피에 맞는 케어가 중요해요.`);
    const tips = SCALP_TYPE_TIPS[scalpType];
    parts.push(tips[0]);
  }

  // 3. 고민별 팁 (사용자 고민 + 질문 키워드)
  const allConcerns = [...new Set([...concerns, ...keywords])];
  for (const concern of allConcerns) {
    const tips = CONCERN_TIPS[concern];
    if (tips) {
      tips.slice(0, 2).forEach((tip) => parts.push(tip));
      break; // 가장 관련 높은 고민 하나만
    }
  }

  // 4. 질문 특화 팁
  const lq = query.toLowerCase();
  if (lq.includes('샴푸') || lq.includes('추천')) {
    if (scalpType === 'oily') {
      parts.push('지성 두피에는 티트리, 페퍼민트 성분의 샴푸가 좋아요.');
    } else if (scalpType === 'dry' || scalpType === 'sensitive') {
      parts.push('건조/민감 두피에는 약산성, 무실리콘 샴푸를 추천해요.');
    } else {
      parts.push('두피 타입에 맞는 샴푸 선택이 헤어케어의 첫걸음이에요.');
    }
  } else if (lq.includes('탈모')) {
    if (!allConcerns.includes('탈모')) {
      const tips = CONCERN_TIPS['탈모'];
      if (tips) parts.push(tips[0]);
    }
  }

  if (parts.length === 0) return null;
  return parts.join(' ');
}
