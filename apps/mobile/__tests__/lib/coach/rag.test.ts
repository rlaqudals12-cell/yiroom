/**
 * 코치 RAG 모듈 테스트
 * 도메인별 RAG 함수 및 질문 분류기 테스트
 */

import type { UserContext } from '../../../lib/coach/index';
import {
  classifyQuestion,
  getRAGContext,
  getPersonalColorRAG,
  getSkinRAG,
  getWorkoutRAG,
  getNutritionRAG,
  getFashionRAG,
} from '../../../lib/coach/rag';

// ============================================
// classifyQuestion
// ============================================

describe('classifyQuestion', () => {
  it('퍼스널컬러 키워드를 올바르게 분류한다', () => {
    expect(classifyQuestion('퍼스널 컬러 알려줘')).toBe('personalColor');
    expect(classifyQuestion('내 톤에 맞는 색 추천해줘')).toBe('personalColor');
    expect(classifyQuestion('립스틱 색상 추천')).toBe('personalColor');
  });

  it('패션 키워드를 올바르게 분류한다', () => {
    expect(classifyQuestion('오늘 옷 뭐 입지?')).toBe('fashion');
    expect(classifyQuestion('코디 추천해줘')).toBe('fashion');
    expect(classifyQuestion('데이트룩 알려줘')).toBe('fashion');
    expect(classifyQuestion('출근할 때 스타일')).toBe('fashion');
  });

  it('운동 키워드를 올바르게 분류한다', () => {
    expect(classifyQuestion('운동 추천해줘')).toBe('workout');
    expect(classifyQuestion('스트레칭 방법')).toBe('workout');
    expect(classifyQuestion('요가 루틴 알려줘')).toBe('workout');
  });

  it('영양 키워드를 올바르게 분류한다', () => {
    expect(classifyQuestion('간식 추천해줘')).toBe('nutrition');
    expect(classifyQuestion('단백질 많은 음식')).toBe('nutrition');
    expect(classifyQuestion('칼로리 얼마나 먹어야 해?')).toBe('nutrition');
    expect(classifyQuestion('물 많이 마셔야 해?')).toBe('nutrition');
  });

  it('피부 키워드를 올바르게 분류한다', () => {
    expect(classifyQuestion('피부 관리법')).toBe('skin');
    expect(classifyQuestion('여드름 어떻게 해?')).toBe('skin');
    expect(classifyQuestion('보습 크림 추천')).toBe('skin');
  });

  it('매칭되지 않는 질문은 general로 분류한다', () => {
    expect(classifyQuestion('안녕하세요')).toBe('general');
    expect(classifyQuestion('오늘 기분이 좋아')).toBe('general');
  });
});

// ============================================
// getRAGContext
// ============================================

describe('getRAGContext', () => {
  it('ctx가 undefined이면 null을 반환한다', () => {
    expect(getRAGContext(undefined, '퍼스널 컬러 알려줘')).toBeNull();
  });

  it('일반 질문은 null을 반환한다', () => {
    const ctx: UserContext = {};
    expect(getRAGContext(ctx, '안녕하세요')).toBeNull();
  });

  it('퍼스널컬러 질문을 personalColor RAG로 라우팅한다', () => {
    const ctx: UserContext = { personalColor: { season: 'Spring' } };
    const result = getRAGContext(ctx, '내 퍼스널 컬러에 맞는 색은?');
    expect(result).toContain('Spring');
  });

  it('피부 질문을 skin RAG로 라우팅한다', () => {
    const ctx: UserContext = { skinAnalysis: { skinType: 'oily' } };
    const result = getRAGContext(ctx, '피부 관리법 알려줘');
    expect(result).toContain('지성');
  });

  it('운동 질문을 workout RAG로 라우팅한다', () => {
    const ctx: UserContext = { workout: { goal: 'weight_loss' } };
    const result = getRAGContext(ctx, '운동 추천해줘');
    expect(result).toBeTruthy();
  });
});

// ============================================
// getPersonalColorRAG
// ============================================

describe('getPersonalColorRAG', () => {
  it('시즌 정보가 없으면 null을 반환한다', () => {
    expect(getPersonalColorRAG({}, '추천 색상')).toBeNull();
  });

  it('유효하지 않은 시즌이면 null을 반환한다', () => {
    const ctx: UserContext = { personalColor: { season: 'Unknown' } };
    expect(getPersonalColorRAG(ctx, '색상 추천')).toBeNull();
  });

  it('Spring 타입의 추천/비추천 색상을 포함한다', () => {
    const ctx: UserContext = { personalColor: { season: 'Spring' } };
    const result = getPersonalColorRAG(ctx, '어떤 색이 어울려?')!;
    expect(result).toContain('Spring 타입');
    expect(result).toContain('코랄');
    expect(result).toContain('블루 그레이');
  });

  it('립스틱 질문 시 립 특화 팁을 추가한다', () => {
    const ctx: UserContext = { personalColor: { season: 'Winter' } };
    const result = getPersonalColorRAG(ctx, '립스틱 추천해줘')!;
    expect(result).toContain('체리 레드');
  });

  it('패션 질문 시 모든 시즌 팁을 포함한다', () => {
    const ctx: UserContext = { personalColor: { season: 'Autumn' } };
    const result = getPersonalColorRAG(ctx, '코디 추천해줘')!;
    expect(result).toContain('깊고 따뜻한 어스 톤');
    expect(result).toContain('골드, 구리 액세서리');
  });
});

// ============================================
// getSkinRAG
// ============================================

describe('getSkinRAG', () => {
  it('skinType이 없으면 null을 반환한다', () => {
    expect(getSkinRAG({}, '피부 관리')).toBeNull();
  });

  it('건성 피부 타입 한국어 라벨을 표시한다', () => {
    const ctx: UserContext = { skinAnalysis: { skinType: 'dry' } };
    const result = getSkinRAG(ctx, '피부 관리법')!;
    expect(result).toContain('건성 피부');
  });

  it('루틴 질문 시 기본 루틴 순서를 포함한다', () => {
    const ctx: UserContext = { skinAnalysis: { skinType: 'oily' } };
    const result = getSkinRAG(ctx, '스킨케어 루틴 순서 알려줘')!;
    expect(result).toContain('클렌징 → 토너 → 에센스 → 크림 → 자외선 차단');
  });

  it('여드름 질문 시 BHA/스팟패치 팁을 포함한다', () => {
    const ctx: UserContext = { skinAnalysis: { skinType: 'combination' } };
    const result = getSkinRAG(ctx, '여드름 어떻게 관리해?')!;
    expect(result).toContain('살리실산');
    expect(result).toContain('스팟 패치');
  });

  it('concerns가 있으면 관심사를 표시한다', () => {
    const ctx: UserContext = {
      skinAnalysis: { skinType: 'sensitive', concerns: ['건조', '홍조', '가려움'] },
    };
    const result = getSkinRAG(ctx, '피부 상태 알려줘')!;
    expect(result).toContain('현재 관심사: 건조, 홍조, 가려움');
  });
});

// ============================================
// getWorkoutRAG
// ============================================

describe('getWorkoutRAG', () => {
  it('컨텍스트가 비어있어도 기본 maintenance 팁을 반환한다', () => {
    // goal 기본값이 'maintenance'이므로 항상 팁이 반환됨
    const result = getWorkoutRAG({}, '아무 질문')!;
    expect(result).toContain('주 3회 이상');
  });

  it('스트릭 3일은 일반 격려 메시지를 표시한다', () => {
    const ctx: UserContext = { workout: { streak: 3 } };
    const result = getWorkoutRAG(ctx, '운동 추천')!;
    expect(result).toContain('3일째 운동 중이에요');
  });

  it('스트릭 7일 이상은 대단해요 메시지를 표시한다', () => {
    const ctx: UserContext = { workout: { streak: 10 } };
    const result = getWorkoutRAG(ctx, '운동 루틴')!;
    expect(result).toContain('10일 연속 운동 중이시네요! 대단해요!');
  });

  it('체형 기반 운동 추천을 포함한다', () => {
    const ctx: UserContext = { bodyAnalysis: { bodyType: 'pear' } };
    const result = getWorkoutRAG(ctx, '어떤 운동이 좋아?')!;
    expect(result).toContain('상체 근력 운동');
  });

  it('목표 기반 팁을 반환한다 (weight_loss)', () => {
    const ctx: UserContext = { workout: { goal: 'weight_loss' } };
    const result = getWorkoutRAG(ctx, '어떤 운동?')!;
    expect(result).toContain('유산소 운동');
  });

  it('스트레칭 질문 시 스트레칭 팁을 반환한다', () => {
    const ctx: UserContext = { workout: { goal: 'maintenance' } };
    const result = getWorkoutRAG(ctx, '스트레칭 방법 알려줘')!;
    expect(result).toContain('부상 예방');
  });
});

// ============================================
// getNutritionRAG
// ============================================

describe('getNutritionRAG', () => {
  it('목표 칼로리를 포함한다', () => {
    const ctx: UserContext = { nutrition: { targetCalories: 2000 } };
    const result = getNutritionRAG(ctx, '식단 알려줘')!;
    expect(result).toContain('2000kcal');
  });

  it('스트릭을 표시한다', () => {
    const ctx: UserContext = { nutrition: { streak: 5 } };
    const result = getNutritionRAG(ctx, '뭐 먹을까')!;
    expect(result).toContain('5일 연속 식단 기록');
  });

  it('간식 질문 시 간식 추천을 반환한다', () => {
    const ctx: UserContext = {};
    const result = getNutritionRAG(ctx, '간식 추천해줘')!;
    expect(result).toContain('그릭 요거트');
    expect(result).toContain('견과류');
  });

  it('단백질 질문 시 단백질 음식을 반환한다', () => {
    const ctx: UserContext = {};
    const result = getNutritionRAG(ctx, '단백질 많은 음식')!;
    expect(result).toContain('닭가슴살');
    expect(result).toContain('1.2-1.6g');
  });

  it('다이어트 질문 시 칼로리 목표를 연동한다', () => {
    const ctx: UserContext = { nutrition: { targetCalories: 1800 } };
    const result = getNutritionRAG(ctx, '다이어트 어떻게 해?')!;
    expect(result).toContain('1800kcal');
    expect(result).toContain('꾸준한 적자');
  });

  it('물/수분 질문 시 수분 섭취 팁을 반환한다', () => {
    const ctx: UserContext = {};
    const result = getNutritionRAG(ctx, '물 얼마나 마셔야 해?')!;
    expect(result).toContain('체중(kg)');
    expect(result).toContain('30ml');
  });
});

// ============================================
// getFashionRAG
// ============================================

describe('getFashionRAG', () => {
  it('컨텍스트가 비어있으면 null을 반환한다', () => {
    expect(getFashionRAG({}, '아무 질문')).toBeNull();
  });

  it('퍼스널컬러 + 체형 조합 정보를 포함한다', () => {
    const ctx: UserContext = {
      personalColor: { season: 'Summer' },
      bodyAnalysis: { bodyType: 'hourglass' },
    };
    const result = getFashionRAG(ctx, '뭐 입을까?')!;
    expect(result).toContain('Summer 타입에 어울리는 색상');
    expect(result).toContain('라벤더');
    expect(result).toContain('허리 라인을 강조');
  });

  it('데이트 질문 시 데이트룩 팁을 추가한다', () => {
    const ctx: UserContext = { personalColor: { season: 'Spring' } };
    const result = getFashionRAG(ctx, '데이트 갈 때 뭐 입지?')!;
    expect(result).toContain('데이트룩');
  });

  it('출근 질문 시 오피스룩 팁을 추가한다', () => {
    const ctx: UserContext = { bodyAnalysis: { bodyType: 'rectangle' } };
    const result = getFashionRAG(ctx, '출근할 때 코디')!;
    expect(result).toContain('오피스룩');
  });
});
