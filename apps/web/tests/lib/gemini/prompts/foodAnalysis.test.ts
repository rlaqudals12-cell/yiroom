/**
 * N-1 음식 분석 프롬프트 모듈 테스트
 * Task 2.2: 음식 분석 AI 프롬프트
 */

import { describe, it, expect } from 'vitest';
import {
  buildFoodAnalysisPrompt,
  parseFoodAnalysisResponse,
  parseSimpleFoodResponse,
  calculateTrafficLight,
  extractGramsFromPortion,
  summarizeFoodAnalysis,
  TRAFFIC_LIGHT_THRESHOLDS,
  MEAL_TYPE_LABELS,
  STANDARD_SERVING_SIZES,
} from '@/lib/gemini/prompts/foodAnalysis';

describe('buildFoodAnalysisPrompt', () => {
  it('기본 프롬프트를 생성한다', () => {
    const prompt = buildFoodAnalysisPrompt();

    expect(prompt).toContain('전문 영양사');
    expect(prompt).toContain('식사 사진');
    expect(prompt).toContain('JSON');
  });

  it('아침 식사 프롬프트를 생성한다', () => {
    const prompt = buildFoodAnalysisPrompt('breakfast');

    expect(prompt).toContain('아침 사진');
  });

  it('점심 식사 프롬프트를 생성한다', () => {
    const prompt = buildFoodAnalysisPrompt('lunch');

    expect(prompt).toContain('점심 사진');
  });

  it('저녁 식사 프롬프트를 생성한다', () => {
    const prompt = buildFoodAnalysisPrompt('dinner');

    expect(prompt).toContain('저녁 사진');
  });

  it('간식 프롬프트를 생성한다', () => {
    const prompt = buildFoodAnalysisPrompt('snack');

    expect(prompt).toContain('간식 사진');
  });

  it('한국 음식 인식 가이드가 포함된다', () => {
    const prompt = buildFoodAnalysisPrompt();

    expect(prompt).toContain('한국 음식');
    expect(prompt).toContain('밥류');
    expect(prompt).toContain('국/찌개');
    expect(prompt).toContain('반찬');
    expect(prompt).toContain('김치');
  });

  it('신호등 시스템 설명이 포함된다 (눔 방식)', () => {
    const prompt = buildFoodAnalysisPrompt();

    // 신호등 색상
    expect(prompt).toContain('green');
    expect(prompt).toContain('yellow');
    expect(prompt).toContain('red');
    // 눔 방식 - 칼로리 밀도 기준
    expect(prompt).toContain('칼로리 밀도');
    expect(prompt).toContain('100g당 100kcal 미만');
    expect(prompt).toContain('100g당 100~250kcal');
    expect(prompt).toContain('100g당 250kcal 초과');
  });

  it('JSON 응답 형식이 포함된다', () => {
    const prompt = buildFoodAnalysisPrompt();

    expect(prompt).toContain('"foods"');
    expect(prompt).toContain('"calories"');
    expect(prompt).toContain('"trafficLight"');
    expect(prompt).toContain('"confidence"');
  });

  it('양 추정 가이드가 포함된다', () => {
    const prompt = buildFoodAnalysisPrompt();

    expect(prompt).toContain('밥 1공기');
    expect(prompt).toContain('210g');
    expect(prompt).toContain('310kcal');
  });
});

describe('parseFoodAnalysisResponse', () => {
  describe('정상 응답 파싱', () => {
    it('유효한 JSON 응답을 파싱한다', () => {
      const response = JSON.stringify({
        foods: [
          {
            name: '김치찌개',
            portion: '1인분 (약 300g)',
            calories: 200,
            protein: 12,
            carbs: 15,
            fat: 10,
            trafficLight: 'yellow',
            confidence: 0.85,
          },
        ],
        totalCalories: 200,
        totalProtein: 12,
        totalCarbs: 15,
        totalFat: 10,
        mealType: 'lunch',
        insight: '균형 잡힌 식사입니다.',
      });

      const { data, validation } = parseFoodAnalysisResponse(response);

      expect(data).not.toBeNull();
      expect(validation.isValid).toBe(true);
      expect(data?.foods[0].name).toBe('김치찌개');
      expect(data?.totalCalories).toBe(200);
      expect(data?.mealType).toBe('lunch');
    });

    it('다중 음식 응답을 파싱한다', () => {
      const response = JSON.stringify({
        foods: [
          { name: '밥', portion: '1공기', calories: 310, protein: 6, carbs: 68, fat: 1, trafficLight: 'yellow', confidence: 0.9 },
          { name: '김치', portion: '1접시', calories: 15, protein: 1, carbs: 2, fat: 0, trafficLight: 'green', confidence: 0.85 },
        ],
        totalCalories: 325,
      });

      const { data, validation } = parseFoodAnalysisResponse(response);

      expect(validation.isValid).toBe(true);
      expect(data?.foods).toHaveLength(2);
      expect(data?.foods[0].name).toBe('밥');
      expect(data?.foods[1].name).toBe('김치');
    });

    it('JSON 코드 블록을 제거하고 파싱한다', () => {
      const response = '```json\n{"foods":[{"name":"비빔밥","portion":"1인분","calories":550,"protein":15,"carbs":80,"fat":12,"trafficLight":"yellow","confidence":0.8}],"totalCalories":550}\n```';

      const { data, validation } = parseFoodAnalysisResponse(response);

      expect(validation.isValid).toBe(true);
      expect(data?.foods[0].name).toBe('비빔밥');
    });

    it('```만 있는 코드 블록도 처리한다', () => {
      const response = '```\n{"foods":[{"name":"떡볶이","portion":"1인분","calories":400,"protein":8,"carbs":70,"fat":10,"trafficLight":"red","confidence":0.9}],"totalCalories":400}\n```';

      const { data, validation } = parseFoodAnalysisResponse(response);

      expect(validation.isValid).toBe(true);
      expect(data?.foods[0].name).toBe('떡볶이');
    });
  });

  describe('기본값 적용', () => {
    it('신호등 색상이 없으면 기본값을 적용한다', () => {
      const response = JSON.stringify({
        foods: [
          { name: '밥', portion: '1공기 (약 210g)', calories: 310, protein: 6, carbs: 68, fat: 1, confidence: 0.9 },
        ],
        totalCalories: 310,
      });

      const { data, validation } = parseFoodAnalysisResponse(response);

      expect(data).not.toBeNull();
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(data?.foods[0].trafficLight).toBeDefined();
    });

    it('신뢰도가 없으면 기본값 0.75를 적용한다', () => {
      const response = JSON.stringify({
        foods: [
          { name: '밥', portion: '1공기', calories: 310, protein: 6, carbs: 68, fat: 1, trafficLight: 'yellow' },
        ],
        totalCalories: 310,
      });

      const { data, validation } = parseFoodAnalysisResponse(response);

      expect(data?.foods[0].confidence).toBe(0.75);
      expect(validation.warnings.length).toBeGreaterThan(0);
    });

    it('portion이 없으면 "1인분"을 적용한다', () => {
      const response = JSON.stringify({
        foods: [
          { name: '김치', calories: 15, protein: 1, carbs: 2, fat: 0, trafficLight: 'green', confidence: 0.8 },
        ],
        totalCalories: 15,
      });

      const { data } = parseFoodAnalysisResponse(response);

      expect(data?.foods[0].portion).toBe('1인분');
    });

    it('총 영양소가 없으면 합계를 계산한다', () => {
      const response = JSON.stringify({
        foods: [
          { name: '밥', portion: '1공기', calories: 310, protein: 6, carbs: 68, fat: 1, trafficLight: 'yellow', confidence: 0.9 },
          { name: '김치', portion: '1접시', calories: 15, protein: 1, carbs: 2, fat: 0, trafficLight: 'green', confidence: 0.8 },
        ],
      });

      const { data } = parseFoodAnalysisResponse(response);

      expect(data?.totalCalories).toBe(325);
      expect(data?.totalProtein).toBe(7);
      expect(data?.totalCarbs).toBe(70);
      expect(data?.totalFat).toBe(1);
    });
  });

  describe('에러 처리', () => {
    it('유효하지 않은 JSON을 처리한다', () => {
      const response = 'not a json';

      const { data, validation } = parseFoodAnalysisResponse(response);

      expect(data).toBeNull();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('JSON 파싱 실패: 유효하지 않은 응답 형식');
    });

    it('빈 foods 배열을 처리한다', () => {
      const response = JSON.stringify({ foods: [] });

      const { data, validation } = parseFoodAnalysisResponse(response);

      expect(data).toBeNull();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('foods 배열'))).toBe(true);
    });

    it('foods가 없는 응답을 처리한다', () => {
      const response = JSON.stringify({ totalCalories: 500 });

      const { data, validation } = parseFoodAnalysisResponse(response);

      expect(data).toBeNull();
      expect(validation.isValid).toBe(false);
    });

    it('필수 필드가 없는 음식 항목을 처리한다', () => {
      const response = JSON.stringify({
        foods: [
          { name: '밥' }, // calories, protein, carbs, fat 누락
        ],
      });

      const { data, validation } = parseFoodAnalysisResponse(response);

      expect(data).toBeNull();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('calories'))).toBe(true);
    });

    it('음수 칼로리를 처리한다', () => {
      const response = JSON.stringify({
        foods: [
          { name: '밥', calories: -100, protein: 6, carbs: 68, fat: 1, trafficLight: 'yellow', confidence: 0.9 },
        ],
      });

      const { validation } = parseFoodAnalysisResponse(response);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('양수'))).toBe(true);
    });
  });

  describe('경고 처리', () => {
    it('영양소 합계와 칼로리 차이가 크면 경고한다', () => {
      const response = JSON.stringify({
        foods: [
          {
            name: '밥',
            portion: '1공기',
            calories: 1000, // 실제 계산값(310)보다 훨씬 큼
            protein: 6,
            carbs: 68,
            fat: 1,
            trafficLight: 'yellow',
            confidence: 0.9,
          },
        ],
        totalCalories: 1000,
      });

      const { validation } = parseFoodAnalysisResponse(response);

      expect(validation.warnings.some(w => w.includes('영양소 합계'))).toBe(true);
    });
  });
});

describe('parseSimpleFoodResponse', () => {
  it('유효한 응답을 파싱한다', () => {
    const response = JSON.stringify({
      foods: [
        { name: '김치찌개', portion: '1인분', calories: 200, protein: 12, carbs: 15, fat: 10, trafficLight: 'yellow', confidence: 0.85 },
      ],
      totalCalories: 200,
    });

    const result = parseSimpleFoodResponse(response);

    expect(result.foods[0].name).toBe('김치찌개');
  });

  it('유효하지 않은 응답에서 에러를 던진다', () => {
    const response = 'invalid json';

    expect(() => parseSimpleFoodResponse(response)).toThrow('음식 분석 파싱 실패');
  });
});

describe('calculateTrafficLight', () => {
  it('저칼로리 음식은 green을 반환한다 (칼로리 밀도 < 1.0)', () => {
    // 100g당 50kcal (밀도 0.5)
    const result = calculateTrafficLight(50, 100);
    expect(result).toBe('green');
  });

  it('중간 칼로리 음식은 yellow를 반환한다 (칼로리 밀도 1.0~2.5)', () => {
    // 100g당 150kcal (밀도 1.5)
    const result = calculateTrafficLight(150, 100);
    expect(result).toBe('yellow');
  });

  it('고칼로리 음식은 red를 반환한다 (칼로리 밀도 > 2.5)', () => {
    // 100g당 300kcal (밀도 3.0)
    const result = calculateTrafficLight(300, 100);
    expect(result).toBe('red');
  });

  it('0g 서빙에서 yellow를 반환한다', () => {
    const result = calculateTrafficLight(100, 0);
    expect(result).toBe('yellow');
  });

  it('경계값 99kcal/100g는 green을 반환한다 (밀도 < 1.0)', () => {
    const result = calculateTrafficLight(99, 100);
    expect(result).toBe('green');
  });

  it('경계값 100kcal/100g는 yellow를 반환한다 (밀도 = 1.0)', () => {
    // 경계값은 yellow에 포함 (>= 100)
    const result = calculateTrafficLight(100, 100);
    expect(result).toBe('yellow');
  });

  it('경계값 250kcal/100g는 yellow를 반환한다 (밀도 = 2.5)', () => {
    const result = calculateTrafficLight(250, 100);
    expect(result).toBe('yellow');
  });

  it('경계값 251kcal/100g는 red를 반환한다 (밀도 > 2.5)', () => {
    const result = calculateTrafficLight(251, 100);
    expect(result).toBe('red');
  });
});

describe('extractGramsFromPortion', () => {
  it('"1인분 (약 210g)"에서 210을 추출한다', () => {
    const result = extractGramsFromPortion('1인분 (약 210g)');
    expect(result).toBe(210);
  });

  it('"300g"에서 300을 추출한다', () => {
    const result = extractGramsFromPortion('300g');
    expect(result).toBe(300);
  });

  it('"약 150G"에서 150을 추출한다 (대소문자 무관)', () => {
    const result = extractGramsFromPortion('약 150G');
    expect(result).toBe(150);
  });

  it('그램이 없는 문자열에서 null을 반환한다', () => {
    const result = extractGramsFromPortion('1인분');
    expect(result).toBeNull();
  });

  it('빈 문자열에서 null을 반환한다', () => {
    const result = extractGramsFromPortion('');
    expect(result).toBeNull();
  });
});

describe('summarizeFoodAnalysis', () => {
  it('단일 음식 요약을 생성한다', () => {
    const result = {
      foods: [
        { name: '김치찌개', portion: '1인분', calories: 200, protein: 12, carbs: 15, fat: 10, trafficLight: 'yellow' as const, confidence: 0.85 },
      ],
      totalCalories: 200,
    };

    const summary = summarizeFoodAnalysis(result);

    expect(summary).toContain('김치찌개');
    expect(summary).toContain('200kcal');
  });

  it('다중 음식 요약을 생성한다', () => {
    const result = {
      foods: [
        { name: '밥', portion: '1공기', calories: 310, protein: 6, carbs: 68, fat: 1, trafficLight: 'yellow' as const, confidence: 0.9 },
        { name: '김치', portion: '1접시', calories: 15, protein: 1, carbs: 2, fat: 0, trafficLight: 'green' as const, confidence: 0.85 },
      ],
      totalCalories: 325,
    };

    const summary = summarizeFoodAnalysis(result);

    expect(summary).toContain('밥, 김치');
    expect(summary).toContain('325kcal');
    expect(summary).toContain('🟢1');
    expect(summary).toContain('🟡1');
  });

  it('신호등 카운트를 표시한다', () => {
    const result = {
      foods: [
        { name: '삼겹살', portion: '1인분', calories: 580, protein: 28, carbs: 0, fat: 52, trafficLight: 'red' as const, confidence: 0.9 },
        { name: '상추', portion: '1접시', calories: 8, protein: 1, carbs: 1, fat: 0, trafficLight: 'green' as const, confidence: 0.85 },
      ],
      totalCalories: 588,
    };

    const summary = summarizeFoodAnalysis(result);

    expect(summary).toContain('🟢1');
    expect(summary).toContain('🔴1');
  });
});

describe('상수 검증', () => {
  it('TRAFFIC_LIGHT_THRESHOLDS가 눔 방식으로 정의되어 있다', () => {
    // 눔 방식: 칼로리 밀도 기준 (100g 기준)
    // green: < 100 (밀도 < 1.0)
    // yellow: 100~250 (밀도 1.0~2.5)
    // red: > 250 (밀도 > 2.5)
    expect(TRAFFIC_LIGHT_THRESHOLDS.green.maxCalories).toBe(100);
    expect(TRAFFIC_LIGHT_THRESHOLDS.yellow.minCalories).toBe(100);
    expect(TRAFFIC_LIGHT_THRESHOLDS.yellow.maxCalories).toBe(250);
    expect(TRAFFIC_LIGHT_THRESHOLDS.red.minCalories).toBe(250);
  });

  it('MEAL_TYPE_LABELS가 올바르게 정의되어 있다', () => {
    expect(MEAL_TYPE_LABELS.breakfast).toBe('아침');
    expect(MEAL_TYPE_LABELS.lunch).toBe('점심');
    expect(MEAL_TYPE_LABELS.dinner).toBe('저녁');
    expect(MEAL_TYPE_LABELS.snack).toBe('간식');
  });

  it('STANDARD_SERVING_SIZES가 올바르게 정의되어 있다', () => {
    expect(STANDARD_SERVING_SIZES['밥']).toBe(210);
    expect(STANDARD_SERVING_SIZES['고기']).toBe(150);
    expect(STANDARD_SERVING_SIZES['면류']).toBe(350);
  });
});
