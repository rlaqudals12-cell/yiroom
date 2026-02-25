/**
 * 도메인별 RAG (Retrieval-Augmented Generation)
 * 오프라인/에러 시 사용자 컨텍스트 기반 맞춤 응답 생성
 * 웹 RAG 모듈(personal-color-rag, skin-rag 등)의 모바일 경량 버전
 */

import type { UserContext } from './index';

// ============================================
// 퍼스널 컬러 RAG
// ============================================

const SEASON_COLORS: Record<string, { recommended: string[]; avoid: string[] }> = {
  Spring: {
    recommended: [
      '코랄', '피치', '살구', '웜 핑크', '아이보리',
      '밝은 오렌지', '골드', '카멜', '따뜻한 베이지',
    ],
    avoid: ['블루 그레이', '차가운 핑크', '순수 화이트', '블랙'],
  },
  Summer: {
    recommended: [
      '라벤더', '로즈', '스카이 블루', '민트', '소프트 핑크',
      '쿨 그레이', '라일락', '파우더 블루', '모브',
    ],
    avoid: ['오렌지', '머스타드', '카멜', '진한 골드'],
  },
  Autumn: {
    recommended: [
      '버건디', '올리브', '머스타드', '테라코타', '카키',
      '브라운', '다크 오렌지', '딥 골드', '와인',
    ],
    avoid: ['핑크', '라벤더', '파스텔 블루', '네온 컬러'],
  },
  Winter: {
    recommended: [
      '블랙', '퓨어 화이트', '네이비', '로열 블루', '체리 레드',
      '실버', '아이시 핑크', '딥 퍼플', '에메랄드',
    ],
    avoid: ['베이지', '카멜', '머스타드', '살구'],
  },
};

const SEASON_TIPS: Record<string, string[]> = {
  Spring: [
    '밝고 따뜻한 색상이 잘 어울려요',
    '골드 액세서리가 안색을 화사하게 만들어요',
    '파스텔 톤보다는 생생한 웜톤이 좋아요',
  ],
  Summer: [
    '부드럽고 차분한 색상이 좋아요',
    '실버 액세서리가 잘 어울려요',
    '높은 채도보다는 낮은 채도의 쿨톤이 베스트예요',
  ],
  Autumn: [
    '깊고 따뜻한 어스 톤이 매력을 살려줘요',
    '골드, 구리 액세서리가 조화로워요',
    '자연에서 온 색감(갈색, 올리브)이 잘 어울려요',
  ],
  Winter: [
    '선명하고 대비가 강한 색상이 좋아요',
    '실버, 플래티넘 액세서리가 빛나요',
    '무채색 + 포인트 컬러 조합이 효과적이에요',
  ],
};

export function getPersonalColorRAG(
  ctx: UserContext,
  query: string
): string | null {
  const season = ctx.personalColor?.season;
  if (!season || !SEASON_COLORS[season]) return null;

  const colors = SEASON_COLORS[season];
  const tips = SEASON_TIPS[season] || [];

  const parts: string[] = [];
  parts.push(`${season} 타입에 대한 정보예요.`);
  parts.push(`추천 색상: ${colors.recommended.slice(0, 5).join(', ')}`);
  parts.push(`피하면 좋은 색상: ${colors.avoid.join(', ')}`);

  // 질문에 따라 특화 팁 추가
  const lq = query.toLowerCase();
  if (lq.includes('립') || lq.includes('립스틱')) {
    const lipTips: Record<string, string> = {
      Spring: '코랄, 피치, 웜 핑크 계열의 립 컬러를 추천해요.',
      Summer: '로즈, 베리, 쿨 핑크 계열이 잘 어울려요.',
      Autumn: '테라코타, 브릭, 웜 레드 립이 매력적이에요.',
      Winter: '체리 레드, 와인, 퓨시아 립이 돋보여요.',
    };
    parts.push(lipTips[season] || '');
  } else if (lq.includes('옷') || lq.includes('코디') || lq.includes('패션')) {
    tips.forEach((tip) => parts.push(tip));
  } else {
    parts.push(tips[0] || '');
  }

  return parts.filter(Boolean).join(' ');
}

// ============================================
// 피부 RAG
// ============================================

const SKIN_TYPE_TIPS: Record<string, string[]> = {
  dry: [
    '세라마이드, 히알루론산 성분의 보습 크림을 추천해요',
    '클렌징 오일이나 밀크 타입이 피부 장벽을 보호해요',
    '미스트보다는 에센스 → 크림 순서로 수분을 잡아주세요',
  ],
  oily: [
    '가벼운 젤 타입 수분 크림으로 유수분 밸런스를 맞춰요',
    '나이아신아마이드 성분이 피지 조절에 도움이 돼요',
    '주 1-2회 클레이 마스크로 모공 관리를 해보세요',
  ],
  combination: [
    'T존과 U존을 나눠 관리하면 효과적이에요',
    'T존은 가벼운 수분 크림, U존은 영양 크림을 발라주세요',
    '부분 마스크 팩으로 맞춤 케어가 가능해요',
  ],
  sensitive: [
    '시카, 판테놀, 마데카소사이드 성분이 진정에 좋아요',
    '새 제품은 팔 안쪽에 먼저 테스트해보세요',
    '향료, 알코올이 없는 저자극 제품을 선택해주세요',
  ],
  normal: [
    '현재 피부 상태가 좋으니 기본 루틴을 유지해주세요',
    '자외선 차단제만 꾸준히 발라도 피부 노화를 늦출 수 있어요',
    '계절에 따라 보습력을 조절해주세요',
  ],
};

export function getSkinRAG(
  ctx: UserContext,
  query: string
): string | null {
  const skinType = ctx.skinAnalysis?.skinType;
  if (!skinType) return null;

  const tips = SKIN_TYPE_TIPS[skinType] || SKIN_TYPE_TIPS.normal;
  const concerns = ctx.skinAnalysis?.concerns || [];

  const parts: string[] = [];
  parts.push(`${skinType === 'dry' ? '건성' : skinType === 'oily' ? '지성' : skinType === 'combination' ? '복합성' : skinType === 'sensitive' ? '민감성' : '정상'} 피부 맞춤 조언이에요.`);

  // 질문 기반 팁 선택
  const lq = query.toLowerCase();
  if (lq.includes('루틴') || lq.includes('순서')) {
    parts.push('기본 루틴: 클렌징 → 토너 → 에센스 → 크림 → 자외선 차단');
    parts.push(tips[0]);
  } else if (lq.includes('여드름') || lq.includes('트러블')) {
    parts.push('살리실산(BHA) 성분이 모공 속 피지를 녹여줘요.');
    parts.push('트러블 부위에 스팟 패치를 붙이면 회복이 빨라요.');
  } else {
    tips.forEach((tip) => parts.push(tip));
  }

  if (concerns.length > 0) {
    parts.push(`현재 관심사: ${concerns.slice(0, 3).join(', ')}`);
  }

  return parts.join(' ');
}

// ============================================
// 운동 RAG
// ============================================

const BODY_TYPE_WORKOUT: Record<string, string[]> = {
  hourglass: ['코어 강화 운동 (플랭크, 사이드 플랭크)', '전신 밸런스 유지를 위한 필라테스'],
  pear: ['상체 근력 운동 (푸시업, 덤벨 프레스)', '하체 스트레칭으로 라인 정리'],
  apple: ['유산소 (걷기, 수영)', '코어 운동으로 복부 강화'],
  rectangle: ['전체 근력 운동으로 실루엣 만들기', '스쿼트, 힙 쓰러스트로 곡선 만들기'],
  inverted_triangle: ['하체 운동 강화 (런지, 레그 프레스)', '상체는 유연성 운동 위주'],
};

const GOAL_WORKOUT: Record<string, string[]> = {
  weight_loss: [
    '주 3-4회 30분 이상 유산소 운동을 추천해요',
    '인터벌 트레이닝이 칼로리 소모에 효과적이에요',
    '근력 운동으로 기초대사량을 높여보세요',
  ],
  muscle_gain: [
    '주 4-5회 근력 운동, 부위별 분할이 효과적이에요',
    '단백질 섭취를 체중 kg당 1.6-2.2g으로 맞춰보세요',
    '점진적 과부하 원칙으로 중량을 올려가세요',
  ],
  maintenance: [
    '주 3회 이상 30분 운동으로 건강을 유지해요',
    '유산소와 근력 운동을 번갈아 하면 좋아요',
    '스트레칭을 빼먹지 마세요!',
  ],
};

export function getWorkoutRAG(
  ctx: UserContext,
  query: string
): string | null {
  const parts: string[] = [];

  // 스트릭 격려
  const streak = ctx.workout?.streak;
  if (streak && streak > 0) {
    if (streak >= 7) {
      parts.push(`${streak}일 연속 운동 중이시네요! 대단해요!`);
    } else {
      parts.push(`${streak}일째 운동 중이에요, 잘하고 있어요!`);
    }
  }

  // 체형 기반 추천
  const bodyType = ctx.bodyAnalysis?.bodyType;
  if (bodyType && BODY_TYPE_WORKOUT[bodyType]) {
    BODY_TYPE_WORKOUT[bodyType].forEach((tip) => parts.push(tip));
  }

  // 목표 기반 추천
  const goal = ctx.workout?.goal || 'maintenance';
  const goalTips = GOAL_WORKOUT[goal] || GOAL_WORKOUT.maintenance;

  const lq = query.toLowerCase();
  if (lq.includes('오늘') || lq.includes('추천')) {
    parts.push(goalTips[0]);
  } else if (lq.includes('스트레칭') || lq.includes('유연')) {
    parts.push('운동 전후 5-10분 스트레칭이 부상 예방에 필수예요.');
    parts.push('어깨, 허벅지, 종아리 위주로 해보세요.');
  } else {
    goalTips.forEach((tip) => parts.push(tip));
  }

  if (parts.length === 0) return null;
  return parts.join(' ');
}

// ============================================
// 영양 RAG
// ============================================

export function getNutritionRAG(
  ctx: UserContext,
  query: string
): string | null {
  const parts: string[] = [];
  const target = ctx.nutrition?.targetCalories;
  const streak = ctx.nutrition?.streak;

  if (streak && streak > 0) {
    parts.push(`${streak}일 연속 식단 기록 중이에요!`);
  }

  if (target) {
    parts.push(`하루 목표 칼로리는 ${target}kcal이에요.`);
  }

  const lq = query.toLowerCase();
  if (lq.includes('간식') || lq.includes('snack')) {
    parts.push('건강한 간식 추천: 그릭 요거트, 견과류, 삶은 달걀, 바나나');
    parts.push('단백질이 포함된 간식이 포만감이 오래 가요.');
  } else if (lq.includes('단백질')) {
    parts.push('단백질이 풍부한 음식: 닭가슴살, 연어, 두부, 달걀, 그릭 요거트');
    parts.push('체중 kg당 1.2-1.6g의 단백질 섭취를 권장해요.');
  } else if (lq.includes('다이어트') || lq.includes('살')) {
    if (target) {
      parts.push(`목표 칼로리(${target}kcal) 이내로 균형 잡힌 식단을 구성해보세요.`);
    }
    parts.push('급격한 식이 제한보다는 꾸준한 적자가 효과적이에요.');
    parts.push('채소를 먼저 먹으면 포만감이 빨리 와요.');
  } else if (lq.includes('물') || lq.includes('수분')) {
    parts.push('하루 물 섭취 권장량은 체중(kg) × 30ml이에요.');
    parts.push('한 번에 많이 마시기보다 자주 조금씩 마시는 게 좋아요.');
  } else {
    parts.push('균형 잡힌 식단: 탄수화물 50%, 단백질 30%, 지방 20% 비율을 목표로 해보세요.');
  }

  if (parts.length === 0) return null;
  return parts.join(' ');
}

// ============================================
// 패션 RAG
// ============================================

const BODY_TYPE_FASHION: Record<string, string[]> = {
  hourglass: ['허리 라인을 강조하는 벨트나 핏된 옷이 잘 어울려요', 'A라인 원피스도 좋은 선택이에요'],
  pear: ['상의에 포인트를 주면 밸런스가 좋아져요', 'A라인 스커트나 와이드 팬츠를 추천해요'],
  apple: ['V넥이나 세로 라인이 날씬해 보이는 효과가 있어요', '원포인트 액세서리로 시선을 분산해보세요'],
  rectangle: ['허리에 벨트를 하면 곡선이 생겨요', '레이어드 스타일링으로 볼륨감을 줘보세요'],
  inverted_triangle: ['하의에 볼륨감을 주면 밸런스가 좋아요', '와이드 팬츠나 플레어 스커트를 추천해요'],
};

export function getFashionRAG(
  ctx: UserContext,
  query: string
): string | null {
  const parts: string[] = [];

  // 퍼스널 컬러 연동
  const season = ctx.personalColor?.season;
  if (season && SEASON_COLORS[season]) {
    parts.push(`${season} 타입에 어울리는 색상: ${SEASON_COLORS[season].recommended.slice(0, 4).join(', ')}`);
  }

  // 체형별 팁
  const bodyType = ctx.bodyAnalysis?.bodyType;
  if (bodyType && BODY_TYPE_FASHION[bodyType]) {
    BODY_TYPE_FASHION[bodyType].forEach((tip) => parts.push(tip));
  }

  const lq = query.toLowerCase();
  if (lq.includes('데이트')) {
    parts.push('데이트룩은 깔끔하면서 포인트가 있는 스타일이 좋아요.');
  } else if (lq.includes('출근') || lq.includes('오피스')) {
    parts.push('오피스룩은 무채색 베이스에 한 가지 컬러 포인트가 세련돼요.');
  } else if (lq.includes('캐주얼')) {
    parts.push('캐주얼룩은 데님 + 깔끔한 상의 조합이 기본이에요.');
  }

  if (parts.length === 0) return null;
  return parts.join(' ');
}

// ============================================
// RAG 오케스트레이터
// ============================================

type DomainCategory = 'personalColor' | 'skin' | 'workout' | 'nutrition' | 'fashion' | 'general';

/**
 * 질문 도메인 분류
 */
export function classifyQuestion(query: string): DomainCategory {
  const lq = query.toLowerCase();

  // 퍼스널 컬러
  if (lq.includes('퍼스널') || lq.includes('컬러') || lq.includes('색') || lq.includes('립스틱') || lq.includes('톤')) {
    return 'personalColor';
  }
  // 패션/코디
  if (lq.includes('옷') || lq.includes('코디') || lq.includes('패션') || lq.includes('스타일') || lq.includes('데이트룩') || lq.includes('출근')) {
    return 'fashion';
  }
  // 운동
  if (lq.includes('운동') || lq.includes('헬스') || lq.includes('근육') || lq.includes('스트레칭') || lq.includes('요가') || lq.includes('러닝')) {
    return 'workout';
  }
  // 영양
  if (lq.includes('먹') || lq.includes('음식') || lq.includes('칼로리') || lq.includes('다이어트') || lq.includes('단백질') || lq.includes('간식') || lq.includes('물') || lq.includes('영양')) {
    return 'nutrition';
  }
  // 피부
  if (lq.includes('피부') || lq.includes('화장품') || lq.includes('스킨케어') || lq.includes('보습') || lq.includes('여드름') || lq.includes('트러블') || lq.includes('세럼')) {
    return 'skin';
  }

  return 'general';
}

/**
 * 도메인별 RAG 컨텍스트 가져오기
 * 오프라인/에러 시 사용자 분석 결과 기반 맞춤 응답을 위한 보강 컨텍스트
 */
export function getRAGContext(
  ctx: UserContext | undefined,
  query: string
): string | null {
  if (!ctx) return null;

  const domain = classifyQuestion(query);

  switch (domain) {
    case 'personalColor':
      return getPersonalColorRAG(ctx, query);
    case 'skin':
      return getSkinRAG(ctx, query);
    case 'workout':
      return getWorkoutRAG(ctx, query);
    case 'nutrition':
      return getNutritionRAG(ctx, query);
    case 'fashion':
      return getFashionRAG(ctx, query);
    default:
      return null;
  }
}
