/**
 * 메이크업 전용 RAG (모바일)
 * @description 메이크업 추천 Q&A를 위한 하드코딩 팁 기반 RAG
 * 웹 버전(apps/web/lib/coach/makeup-rag.ts)의 모바일 경량 버전
 * DB 접근 없이 하드코딩 데이터로 운영
 */

import type { UserContext } from './index';

// ============================================
// 언더톤별 메이크업 팁
// ============================================

const UNDERTONE_TIPS: Record<string, { lip: string[]; eye: string[]; base: string[] }> = {
  warm: {
    lip: [
      '코랄, 피치, 웜 핑크 계열의 립이 잘 어울려요',
      '오렌지 베이스 틴트가 혈색을 살려줘요',
      '브릭, 테라코타 립은 가을 느낌의 시크한 연출이 가능해요',
    ],
    eye: [
      '브라운, 골드, 코퍼 계열 아이섀도가 눈을 돋보이게 해요',
      '웜톤 글리터는 화사한 느낌을 줘요',
      '올리브, 카키 계열도 자연스러운 포인트가 돼요',
    ],
    base: [
      '옐로우 베이스 파운데이션을 선택해주세요',
      '피치톤 블러셔가 자연스러운 혈색을 만들어요',
      '골드 하이라이터가 피부에 자연스러운 광을 줘요',
    ],
  },
  cool: {
    lip: [
      '로즈, 베리, 쿨 핑크 계열의 립이 맑은 느낌을 줘요',
      '체리 레드, 와인 립은 분위기 있는 연출이 가능해요',
      '퓨시아, 딥 로즈 컬러도 잘 어울려요',
    ],
    eye: [
      '라벤더, 로즈 골드, 그레이 계열이 잘 어울려요',
      '실버 글리터가 시원한 느낌을 줘요',
      '버건디, 플럼 계열로 깊이감을 줄 수 있어요',
    ],
    base: [
      '핑크 베이스 파운데이션을 선택해주세요',
      '로즈톤 블러셔가 자연스러운 혈색을 만들어요',
      '실버/핑크 하이라이터가 투명한 광을 줘요',
    ],
  },
  neutral: {
    lip: [
      'MLBB(My Lips But Better) 컬러가 가장 자연스러워요',
      '뉴드 핑크, 로즈 등 중간 톤이 다양하게 어울려요',
      '웜/쿨 모두 시도해서 더 좋은 쪽을 찾아보세요',
    ],
    eye: [
      '베이지, 토프, 소프트 브라운이 무난하게 어울려요',
      '대부분의 컬러가 잘 어울리는 편이에요',
      '골드와 실버 모두 시도해볼 수 있어요',
    ],
    base: [
      '뉴트럴 베이스 파운데이션을 선택해주세요',
      '피치/로즈 블러셔 모두 잘 어울리는 편이에요',
      '자연광에서 파운데이션 색을 테스트하면 정확해요',
    ],
  },
};

// ============================================
// 퍼스널 컬러 시즌별 메이크업 팁
// ============================================

const SEASON_MAKEUP_TIPS: Record<string, string[]> = {
  Spring: [
    '밝고 생기 있는 코랄, 피치 계열이 베스트예요',
    '가벼운 글로시 립이 봄 타입의 화사함을 살려줘요',
    '과한 스모키보다는 밝은 브라운 계열 아이 메이크업이 좋아요',
  ],
  Summer: [
    '부드럽고 차분한 로즈, 라벤더 계열이 어울려요',
    '맑은 느낌의 투명 립글로스나 쉬어 립이 좋아요',
    '파스텔 톤 아이섀도로 소프트한 느낌을 연출해보세요',
  ],
  Autumn: [
    '깊고 따뜻한 브릭, 테라코타 계열이 매력적이에요',
    '매트 립이 가을 타입의 깊이감을 살려줘요',
    '골드, 브론즈 계열 아이섀도가 잘 어울려요',
  ],
  Winter: [
    '선명하고 대비가 강한 체리 레드, 와인이 돋보여요',
    '볼드한 립 컬러가 겨울 타입의 강점이에요',
    '딥한 컬러의 아이라이너로 포인트를 줘보세요',
  ],
};

// ============================================
// 얼굴형별 메이크업 팁
// ============================================

const FACE_SHAPE_TIPS: Record<string, string[]> = {
  oval: [
    '계란형 얼굴은 대부분의 메이크업 스타일이 잘 어울려요',
    '자연스러운 블러셔 위치는 광대뼈 위가 좋아요',
  ],
  round: [
    '동그란 얼굴은 셰이딩으로 턱라인을 강조하면 날씬해 보여요',
    '세로로 긴 블러셔 라인이 얼굴을 갸름하게 만들어요',
  ],
  square: [
    '각진 얼굴은 둥근 블러셔로 부드러운 느낌을 줘보세요',
    '눈썹을 아치형으로 다듬으면 부드러운 인상이 돼요',
  ],
  long: [
    '긴 얼굴은 가로로 넓게 블러셔를 발라주면 밸런스가 좋아요',
    '눈썹을 길게 그리면 얼굴이 짧아 보이는 효과가 있어요',
  ],
  heart: [
    '하트형 얼굴은 이마 셰이딩으로 밸런스를 맞춰보세요',
    '입술을 강조하면 균형 잡힌 느낌이 돼요',
  ],
};

// ============================================
// 메이크업 RAG 메인
// ============================================

/**
 * 메이크업 도메인 RAG 컨텍스트 생성
 * 사용자의 퍼스널 컬러, 언더톤, 얼굴형을 기반으로 맞춤 팁 반환
 */
export function getMakeupRAG(ctx: UserContext, query: string): string | null {
  const undertone = ctx.makeupAnalysis?.undertone;
  const faceShape = ctx.makeupAnalysis?.faceShape;
  const season = ctx.personalColor?.season;

  const lq = query.toLowerCase();

  const parts: string[] = [];

  // 1. 질문 카테고리별 팁 (립, 아이, 베이스)
  const toneKey = undertone === 'warm' || undertone === 'cool' ? undertone : 'neutral';
  const toneTips = UNDERTONE_TIPS[toneKey];

  if (
    lq.includes('립') ||
    lq.includes('틴트') ||
    lq.includes('립스틱') ||
    lq.includes('립글로스')
  ) {
    if (undertone) {
      parts.push(
        `${undertone === 'warm' ? '웜톤' : undertone === 'cool' ? '쿨톤' : '뉴트럴'} 맞춤 립 추천이에요.`
      );
    }
    toneTips.lip.slice(0, 2).forEach((tip) => parts.push(tip));
  } else if (
    lq.includes('아이') ||
    lq.includes('섀도') ||
    lq.includes('마스카라') ||
    lq.includes('아이라이너')
  ) {
    toneTips.eye.slice(0, 2).forEach((tip) => parts.push(tip));
  } else if (
    lq.includes('파운데이션') ||
    lq.includes('쿠션') ||
    lq.includes('베이스') ||
    lq.includes('블러셔')
  ) {
    toneTips.base.slice(0, 2).forEach((tip) => parts.push(tip));
  } else {
    // 일반 메이크업 질문: 언더톤 기반 종합 팁
    if (undertone) {
      const toneLabel = undertone === 'warm' ? '웜톤' : undertone === 'cool' ? '쿨톤' : '뉴트럴';
      parts.push(`${toneLabel} 메이크업 조언이에요.`);
    }
    parts.push(toneTips.lip[0]);
    parts.push(toneTips.eye[0]);
  }

  // 2. 퍼스널 컬러 시즌 팁
  if (season && SEASON_MAKEUP_TIPS[season]) {
    const seasonTips = SEASON_MAKEUP_TIPS[season];
    parts.push(seasonTips[0]);
  }

  // 3. 얼굴형 팁
  if (faceShape && FACE_SHAPE_TIPS[faceShape]) {
    const shapeTips = FACE_SHAPE_TIPS[faceShape];
    parts.push(shapeTips[0]);
  }

  // 4. 상황별 팁
  if (lq.includes('데일리') || lq.includes('출근')) {
    parts.push('데일리 메이크업은 베이스 + 눈썹 + 립 3가지만 챙겨도 충분해요.');
  } else if (lq.includes('면접')) {
    parts.push('면접 메이크업은 깔끔한 베이스에 자연스러운 누드톤이 좋아요.');
  } else if (lq.includes('파티') || lq.includes('결혼식')) {
    parts.push('파티/결혼식은 글리터 포인트와 볼드한 립으로 화려하게 연출해보세요.');
  }

  if (parts.length === 0) return null;
  return parts.join(' ');
}
