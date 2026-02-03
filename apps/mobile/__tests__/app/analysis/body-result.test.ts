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
    recommendations: [
      '벨트로 허리 강조',
      'A라인 스커트',
      '페플럼 탑',
      '랩 원피스',
    ],
    avoidItems: ['일자 실루엣', '박시한 상의'],
  },
  Triangle: {
    name: '삼각형 체형',
    description:
      '엉덩이가 어깨보다 넓은 체형입니다. 상체를 강조하고 하체는 심플하게 연출하세요.',
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
    description:
      '복부가 가장 넓은 체형입니다. 세로 라인을 강조하고 편안한 실루엣을 선택하세요.',
    recommendations: ['세로 스트라이프', 'V넥', 'A라인', '하이웨이스트'],
    avoidItems: ['벨트 강조', '타이트한 복부', '가로 스트라이프'],
  },
  Diamond: {
    name: '다이아몬드 체형',
    description:
      '허리가 넓고 어깨와 엉덩이가 좁은 체형입니다. 상하체 균형을 맞추세요.',
    recommendations: ['어깨 강조', '와이드 팬츠', 'A라인', '스트럭처드 재킷'],
    avoidItems: ['타이트한 허리', '벨트 강조', '펜슬 스커트'],
  },
  Pear: {
    name: '배 체형',
    description:
      '하체가 상체보다 넓은 체형입니다. 상체를 강조하고 하체는 심플하게 연출하세요.',
    recommendations: ['보트넥', '퍼프 소매', 'A라인 스커트', '부츠컷 팬츠'],
    avoidItems: ['스키니진', '밝은 색 하의', '힙 포켓 디테일'],
  },
  Athletic: {
    name: '운동선수 체형',
    description:
      '탄탄하고 균형 잡힌 체형입니다. 다양한 스타일을 소화할 수 있어요.',
    recommendations: ['핏된 옷', '스포티 룩', '캐주얼', '미니멀'],
    avoidItems: ['과도한 레이어링', '너무 루즈한 핏'],
  },
};

// ============================================================
// BMI 상태 판정 함수 (result.tsx에서 추출)
// ============================================================

interface BmiStatus {
  label: string;
  color: string;
}

function getBmiStatus(bmiValue: number): BmiStatus {
  if (bmiValue < 18.5) return { label: '저체중', color: '#3b82f6' };
  if (bmiValue < 23) return { label: '정상', color: '#22c55e' };
  if (bmiValue < 25) return { label: '과체중', color: '#eab308' };
  return { label: '비만', color: '#ef4444' };
}

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

describe('C-1 체형 분석 - BMI 계산', () => {
  describe('getBmiStatus', () => {
    it('BMI 18.5 미만은 저체중이어야 한다', () => {
      expect(getBmiStatus(15).label).toBe('저체중');
      expect(getBmiStatus(17).label).toBe('저체중');
      expect(getBmiStatus(18.4).label).toBe('저체중');
    });

    it('BMI 18.5-22.9는 정상이어야 한다', () => {
      expect(getBmiStatus(18.5).label).toBe('정상');
      expect(getBmiStatus(20).label).toBe('정상');
      expect(getBmiStatus(22.9).label).toBe('정상');
    });

    it('BMI 23-24.9는 과체중이어야 한다', () => {
      expect(getBmiStatus(23).label).toBe('과체중');
      expect(getBmiStatus(24).label).toBe('과체중');
      expect(getBmiStatus(24.9).label).toBe('과체중');
    });

    it('BMI 25 이상은 비만이어야 한다', () => {
      expect(getBmiStatus(25).label).toBe('비만');
      expect(getBmiStatus(30).label).toBe('비만');
      expect(getBmiStatus(40).label).toBe('비만');
    });

    it('각 상태는 고유한 색상을 가져야 한다', () => {
      const colors = [
        getBmiStatus(15).color,
        getBmiStatus(20).color,
        getBmiStatus(24).color,
        getBmiStatus(30).color,
      ];
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(4);
    });

    it('색상은 유효한 hex 값이어야 한다', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      [15, 20, 24, 30].forEach((bmi) => {
        expect(getBmiStatus(bmi).color).toMatch(hexRegex);
      });
    });
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
  it('BMI 상태 라벨은 사용자에게 이해 가능해야 한다', () => {
    const validLabels = ['저체중', '정상', '과체중', '비만'];

    [15, 20, 24, 30].forEach((bmi) => {
      const status = getBmiStatus(bmi);
      expect(validLabels).toContain(status.label);
    });
  });

  it('체형 설명은 스타일 추천 이유를 포함해야 한다', () => {
    Object.values(BODY_TYPE_DATA).forEach((data) => {
      // 설명이 30자 이상이어야 충분한 정보 제공
      expect(data.description.length).toBeGreaterThan(30);
    });
  });
});
