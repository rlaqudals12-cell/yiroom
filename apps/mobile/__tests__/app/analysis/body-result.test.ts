/**
 * C-1 체형 분석 결과 화면 - 비즈니스 로직 테스트
 *
 * 테스트 대상:
 * - BMI 계산 및 상태 판정 로직
 * - 체형 타입 데이터 일관성
 * - 체형 타입 매핑 로직
 */

import type { BodyType } from '@yiroom/shared';

// ============================================================
// 체형 타입 데이터 (result.tsx에서 추출)
// ============================================================

const BODY_TYPE_DATA: Record<
  BodyType,
  {
    name: string;
    description: string;
    recommendations: string[];
    avoidItems: string[];
  }
> = {
  Rectangle: {
    name: '직사각형 체형',
    description:
      '어깨, 허리, 엉덩이 너비가 비슷한 체형입니다. 허리 라인을 강조하는 스타일이 잘 어울려요.',
    recommendations: ['벨트로 허리 강조', 'A라인 스커트', '페플럼 탑', '랩 원피스'],
    avoidItems: ['일자 실루엣', '박시한 상의'],
  },
  Triangle: {
    name: '삼각형 체형',
    description: '엉덩이가 어깨보다 넓은 체형입니다. 상체를 강조하고 하체는 심플하게 연출하세요.',
    recommendations: ['보트넥', '퍼프 소매', 'A라인 스커트', '부츠컷 팬츠'],
    avoidItems: ['스키니진', '밝은 색 하의', '힙 포켓 디테일'],
  },
  InvertedTriangle: {
    name: '역삼각형 체형',
    description:
      '어깨가 엉덩이보다 넓은 체형입니다. 하체에 볼륨을 주고 어깨 라인은 심플하게 연출하세요.',
    recommendations: ['V넥', '래글런 소매', '플레어 스커트', '와이드 팬츠'],
    avoidItems: ['패드 있는 어깨', '보트넥', '호리존탈 스트라이프 상의'],
  },
  Hourglass: {
    name: '모래시계 체형',
    description:
      '어깨와 엉덩이가 비슷하고 허리가 잘록한 체형입니다. 곡선을 살리는 스타일이 잘 어울려요.',
    recommendations: ['허리 강조 원피스', '벨트', '바디컨 스타일', '랩 탑'],
    avoidItems: ['박시한 옷', '오버사이즈', '일자 실루엣'],
  },
  Oval: {
    name: '타원형 체형',
    description: '복부가 가장 넓은 체형입니다. 세로 라인을 강조하고 편안한 실루엣을 선택하세요.',
    recommendations: ['세로 스트라이프', 'V넥', 'A라인', '하이웨이스트'],
    avoidItems: ['벨트 강조', '타이트한 복부', '가로 스트라이프'],
  },
  Diamond: {
    name: '다이아몬드 체형',
    description: '허리가 넓고 어깨와 엉덩이가 좁은 체형입니다. 상하체 균형을 맞추세요.',
    recommendations: ['어깨 강조', '와이드 팬츠', 'A라인', '스트럭처드 재킷'],
    avoidItems: ['타이트한 허리', '벨트 강조', '펜슬 스커트'],
  },
  Pear: {
    name: '배 체형',
    description: '하체가 상체보다 넓은 체형입니다. 상체를 강조하고 하체는 심플하게 연출하세요.',
    recommendations: ['보트넥', '퍼프 소매', 'A라인 스커트', '부츠컷 팬츠'],
    avoidItems: ['스키니진', '밝은 색 하의', '힙 포켓 디테일'],
  },
  Athletic: {
    name: '운동선수 체형',
    description: '탄탄하고 균형 잡힌 체형입니다. 다양한 스타일을 소화할 수 있어요.',
    recommendations: ['핏된 옷', '스포티 룩', '캐주얼', '미니멀'],
    avoidItems: ['과도한 레이어링', '너무 루즈한 핏'],
  },
};

// ============================================================
// BMI 정직 표기 상수 (result.tsx에서 추출) — 웹 W4 정합
// '과체중/비만' 낙인 라벨을 제거하고 숫자는 "참고 수치"로만 제시한다.
// ============================================================

const BMI_CAVEAT = 'BMI는 근육량에 따라 실제와 다를 수 있어요';
const BMI_REFERENCE_LABEL = '참고 수치';

// ============================================================
// 체형 타입 매핑 (result.tsx에서 추출)
// ============================================================

function mapBodyType(geminiType: string): BodyType {
  const bodyTypeMap: Record<string, BodyType> = {
    rectangle: 'Rectangle',
    triangle: 'Triangle',
    inverted_triangle: 'InvertedTriangle',
    hourglass: 'Hourglass',
    oval: 'Oval',
    diamond: 'Diamond',
    pear: 'Pear',
    athletic: 'Athletic',
  };

  return bodyTypeMap[geminiType] || 'Rectangle';
}

// ============================================================
// BMI 계산 및 상태 테스트
// ============================================================

describe('C-1 체형 분석 - BMI 정직 표기 (낙인 제거, 웹 W4)', () => {
  it("BMI 표기에 '과체중'·'비만' 낙인 라벨이 없어야 한다", () => {
    const displayed = [BMI_REFERENCE_LABEL, BMI_CAVEAT];
    displayed.forEach((text) => {
      expect(text).not.toContain('과체중');
      expect(text).not.toContain('비만');
      expect(text).not.toContain('저체중');
    });
  });

  it("BMI는 '참고 수치'로만 제시된다", () => {
    expect(BMI_REFERENCE_LABEL).toBe('참고 수치');
  });

  it('BMI 캐비앳으로 근육량 편차를 안내한다', () => {
    expect(BMI_CAVEAT).toContain('근육량');
  });
});

// ============================================================
// 체형 타입 매핑 테스트
// ============================================================

describe('C-1 체형 분석 - 타입 매핑', () => {
  describe('mapBodyType', () => {
    it('소문자 체형 타입이 PascalCase로 변환되어야 한다', () => {
      expect(mapBodyType('rectangle')).toBe('Rectangle');
      expect(mapBodyType('triangle')).toBe('Triangle');
      expect(mapBodyType('hourglass')).toBe('Hourglass');
    });

    it('스네이크케이스 타입이 올바르게 변환되어야 한다', () => {
      expect(mapBodyType('inverted_triangle')).toBe('InvertedTriangle');
    });

    it('모든 유효한 타입이 변환되어야 한다', () => {
      const types = [
        'rectangle',
        'triangle',
        'inverted_triangle',
        'hourglass',
        'oval',
        'diamond',
        'pear',
        'athletic',
      ];

      types.forEach((type) => {
        const result = mapBodyType(type);
        expect(BODY_TYPE_DATA[result]).toBeDefined();
      });
    });

    it('알 수 없는 타입은 Rectangle으로 기본값 처리되어야 한다', () => {
      expect(mapBodyType('unknown')).toBe('Rectangle');
      expect(mapBodyType('')).toBe('Rectangle');
      expect(mapBodyType('RECTANGLE')).toBe('Rectangle');
    });
  });
});

// ============================================================
// 체형 타입 데이터 일관성 테스트
// ============================================================

describe('C-1 체형 분석 - 데이터 일관성', () => {
  describe('BODY_TYPE_DATA', () => {
    it('모든 체형 타입이 정의되어 있어야 한다', () => {
      const expectedTypes: BodyType[] = [
        'Rectangle',
        'Triangle',
        'InvertedTriangle',
        'Hourglass',
        'Oval',
        'Diamond',
        'Pear',
        'Athletic',
      ];

      expectedTypes.forEach((type) => {
        expect(BODY_TYPE_DATA[type]).toBeDefined();
      });
    });

    it('모든 체형 타입은 필수 필드를 가져야 한다', () => {
      Object.values(BODY_TYPE_DATA).forEach((data) => {
        expect(data.name).toBeDefined();
        expect(typeof data.name).toBe('string');
        expect(data.name.length).toBeGreaterThan(0);

        expect(data.description).toBeDefined();
        expect(typeof data.description).toBe('string');
        expect(data.description.length).toBeGreaterThan(10);

        expect(Array.isArray(data.recommendations)).toBe(true);
        expect(data.recommendations.length).toBeGreaterThanOrEqual(2);

        expect(Array.isArray(data.avoidItems)).toBe(true);
        expect(data.avoidItems.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('모든 체형 타입 이름은 한국어여야 한다', () => {
      const koreanRegex = /[\uAC00-\uD7AF]/;

      Object.values(BODY_TYPE_DATA).forEach((data) => {
        expect(data.name).toMatch(koreanRegex);
      });
    });

    it('추천/비추천 스타일이 중복되지 않아야 한다', () => {
      Object.entries(BODY_TYPE_DATA).forEach(([type, data]) => {
        const recommendations = new Set(data.recommendations);
        const avoidItems = new Set(data.avoidItems);

        // 추천과 비추천에 같은 아이템이 없어야 함
        data.recommendations.forEach((item) => {
          expect(avoidItems.has(item)).toBe(false);
        });

        // 각 배열 내 중복 없어야 함
        expect(recommendations.size).toBe(data.recommendations.length);
        expect(avoidItems.size).toBe(data.avoidItems.length);
      });
    });
  });
});

// ============================================================
// 접근성 테스트
// ============================================================

describe('C-1 체형 분석 - 접근성', () => {
  it('BMI 표기는 낙인 없이 이해 가능해야 한다', () => {
    // '참고 수치' + 캐비앳만 노출 — 판정성 라벨(비만 등) 없음
    expect(`${BMI_REFERENCE_LABEL} · ${BMI_CAVEAT}`).not.toMatch(/과체중|비만|저체중/);
  });

  it('체형 설명은 스타일 추천 이유를 포함해야 한다', () => {
    Object.values(BODY_TYPE_DATA).forEach((data) => {
      // 설명이 30자 이상이어야 충분한 정보 제공
      expect(data.description.length).toBeGreaterThan(30);
    });
  });
});
