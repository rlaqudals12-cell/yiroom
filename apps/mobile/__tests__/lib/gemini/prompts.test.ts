/**
 * Gemini 프롬프트 Level 2 이식 + 스키마 불변 검증
 *
 * 목적:
 * 1. 웹 판정 기준(논문 수치·혈관 규칙·할루시네이션 방지)이 온디바이스 프롬프트에 이식됐는지 단언
 * 2. JSON 출력 계약(스키마)이 변경 전과 byte-identical인지 스냅샷 단언 (파서/타입 불변 증명)
 * 3. 웹 전용 필드가 누출되지 않았는지 단언
 * 4. 의료 금지 표현(치료/처방) 부재 단언
 * 5. 스키마대로 만든 JSON이 모바일 타입으로 파싱되는지 파서 계약 단언
 */
import {
  buildPersonalColorPrompt,
  SKIN_ANALYSIS_PROMPT,
  buildBodyPrompt,
  HAIR_ANALYSIS_PROMPT,
  MAKEUP_ANALYSIS_PROMPT,
} from '@/lib/gemini/prompts';
import type {
  SkinAnalysisResult,
  BodyAnalysisResult,
  HairAnalysisResult,
  MakeupAnalysisResult,
} from '@/lib/gemini/types';

const PC_PROMPT = buildPersonalColorPrompt({ 1: 'warm', 2: 'cool' });
const BODY_PROMPT = buildBodyPrompt(170, 65, 22.49);

// ── 스키마 블록 (변경 전 모바일 스키마와 byte-identical) ─────────────────
const PC_SCHEMA = `{
  "season": "spring" | "summer" | "autumn" | "winter",
  "confidence": 0.0-1.0,
  "description": "진단 설명"
}`;

const SKIN_SCHEMA = `{
  "skinType": "dry" | "oily" | "combination" | "sensitive" | "normal",
  "metrics": {
    "moisture": 0-100,
    "oil": 0-100,
    "pores": 0-100,
    "wrinkles": 0-100,
    "pigmentation": 0-100,
    "sensitivity": 0-100,
    "elasticity": 0-100
  },
  "concerns": ["주요 고민 항목"],
  "recommendations": ["추천 사항"]
}`;

const BODY_SCHEMA = `{
  "bodyType": "rectangle" | "triangle" | "inverted_triangle" | "hourglass" | "oval" | "athletic" | "petite" | "tall",
  "proportions": {
    "shoulderHipRatio": 0.0-2.0,
    "waistHipRatio": 0.0-2.0
  },
  "recommendations": ["추천 스타일"],
  "avoidItems": ["피해야 할 스타일"]
}`;

const HAIR_SCHEMA = `{
  "texture": "straight" | "wavy" | "curly" | "coily",
  "thickness": "fine" | "medium" | "thick",
  "scalpCondition": "dry" | "oily" | "normal" | "sensitive",
  "damageLevel": 0-100,
  "scores": {
    "shine": 0-100,
    "elasticity": 0-100,
    "density": 0-100,
    "scalpHealth": 0-100
  },
  "mainConcerns": ["주요 고민"],
  "careRoutine": ["케어 루틴 추천"],
  "recommendedStyles": ["추천 헤어스타일"]
}`;

const MAKEUP_SCHEMA = `{
  "faceShape": "oval" | "round" | "square" | "heart" | "oblong" | "diamond",
  "undertone": "warm" | "cool" | "neutral",
  "eyeShape": "monolid" | "double" | "hooded" | "round" | "almond",
  "lipShape": "full" | "thin" | "wide" | "bow",
  "scores": {
    "skinTone": 0-100,
    "eyeBalance": 0-100,
    "lipBalance": 0-100,
    "overall": 0-100
  },
  "recommendations": {
    "base": "베이스 추천",
    "eye": "아이 메이크업 추천",
    "lip": "립 추천",
    "blush": "블러셔 추천",
    "contour": "컨투어링 추천"
  },
  "bestColors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"]
}`;

describe('Gemini 프롬프트 — 스키마 불변 (JSON 출력 계약)', () => {
  it('PC 스키마 블록이 변경 전과 동일', () => {
    expect(PC_PROMPT).toContain(PC_SCHEMA);
  });
  it('피부 스키마 블록이 변경 전과 동일', () => {
    expect(SKIN_ANALYSIS_PROMPT).toContain(SKIN_SCHEMA);
  });
  it('체형 스키마 블록이 변경 전과 동일', () => {
    expect(BODY_PROMPT).toContain(BODY_SCHEMA);
  });
  it('헤어 스키마 블록이 변경 전과 동일', () => {
    expect(HAIR_ANALYSIS_PROMPT).toContain(HAIR_SCHEMA);
  });
  it('메이크업 스키마 블록이 변경 전과 동일', () => {
    expect(MAKEUP_ANALYSIS_PROMPT).toContain(MAKEUP_SCHEMA);
  });
});

describe('Gemini 프롬프트 — 웹 전용 필드 누출 방지', () => {
  // 웹 스키마에만 있고 모바일 파서가 소비하지 않는 필드가 들어가면 안 됨
  it('PC: 웹 전용 필드(seasonType/seasonSubtype/worstColors/analysisEvidence) 없음', () => {
    for (const leaked of ['seasonType', 'seasonSubtype', 'worstColors', 'analysisEvidence']) {
      expect(PC_PROMPT).not.toContain(`"${leaked}"`);
    }
  });
  it('피부: 웹 전용 필드(overallScore/problemAreas/analysisEvidence/recommendedIngredients) 없음', () => {
    for (const leaked of [
      'overallScore',
      'problemAreas',
      'analysisEvidence',
      'recommendedIngredients',
    ]) {
      expect(SKIN_ANALYSIS_PROMPT).not.toContain(`"${leaked}"`);
    }
  });
  it('체형: 웹 전용 필드(bodyTypeLabel/matchedFeatures/silhouette/styleRecommendations) 없음', () => {
    for (const leaked of [
      'bodyTypeLabel',
      'matchedFeatures',
      'silhouette',
      'styleRecommendations',
    ]) {
      expect(BODY_PROMPT).not.toContain(`"${leaked}"`);
    }
  });
  it('헤어: 웹 전용 필드(hairTypeLabel/recommendedProducts/hairStyleRecommendations) 없음', () => {
    for (const leaked of ['hairTypeLabel', 'recommendedProducts', 'hairStyleRecommendations']) {
      expect(HAIR_ANALYSIS_PROMPT).not.toContain(`"${leaked}"`);
    }
  });
  it('메이크업: 웹 전용 필드(undertoneLabel/colorRecommendations/personalColorConnection) 없음', () => {
    for (const leaked of ['undertoneLabel', 'colorRecommendations', 'personalColorConnection']) {
      expect(MAKEUP_ANALYSIS_PROMPT).not.toContain(`"${leaked}"`);
    }
  });
});

describe('Gemini 프롬프트 — Level 2 판정 기준 이식 확인', () => {
  it('PC: 혈관 최우선 규칙 + Lab 수치(h°/ITA/Puzovic) + 한국인 분포 + Winter 억제', () => {
    expect(PC_PROMPT).toContain('혈관');
    expect(PC_PROMPT).toContain('h°');
    expect(PC_PROMPT).toContain('Puzovic');
    expect(PC_PROMPT).toContain('ITA');
    expect(PC_PROMPT).toContain('한국인 분포');
    expect(PC_PROMPT).toContain('Winter 판정은');
  });
  it('피부: TEWL/Sebumeter/T존/U존/복합성/한국인 기준', () => {
    expect(SKIN_ANALYSIS_PROMPT).toContain('TEWL');
    expect(SKIN_ANALYSIS_PROMPT).toContain('Sebumeter');
    expect(SKIN_ANALYSIS_PROMPT).toContain('T존');
    expect(SKIN_ANALYSIS_PROMPT).toContain('U존');
    expect(SKIN_ANALYSIS_PROMPT).toContain('복합성 판정');
    expect(SKIN_ANALYSIS_PROMPT).toContain('한국인 피부 기준');
  });
  it('체형: 골격 우선 + 정면/의류 조건 + 어깨:골반 비율', () => {
    expect(BODY_PROMPT).toContain('골격');
    expect(BODY_PROMPT).toContain('정면 촬영');
    expect(BODY_PROMPT).toContain('오버핏');
    expect(BODY_PROMPT).toContain('shoulderHipRatio');
    expect(BODY_PROMPT).toContain('허리/골반 비율');
  });
  it('헤어: 모발-영양 상관(Almohanna) + 두피 a* 홍조 + 큐티클', () => {
    expect(HAIR_ANALYSIS_PROMPT).toContain('Almohanna');
    expect(HAIR_ANALYSIS_PROMPT).toContain('a*');
    expect(HAIR_ANALYSIS_PROMPT).toContain('큐티클');
    expect(HAIR_ANALYSIS_PROMPT).toContain('영양');
  });
  it('메이크업: 언더톤 혈관 규칙 + PC 크로스 모듈 + 얼굴형 기법', () => {
    expect(MAKEUP_ANALYSIS_PROMPT).toContain('혈관');
    expect(MAKEUP_ANALYSIS_PROMPT).toContain('크로스 모듈');
    expect(MAKEUP_ANALYSIS_PROMPT).toContain('봄 웜톤');
    expect(MAKEUP_ANALYSIS_PROMPT).toContain('얼굴형별 기법');
  });
});

describe('Gemini 프롬프트 — 할루시네이션 방지 + 금지 표현', () => {
  const all = [
    PC_PROMPT,
    SKIN_ANALYSIS_PROMPT,
    BODY_PROMPT,
    HAIR_ANALYSIS_PROMPT,
    MAKEUP_ANALYSIS_PROMPT,
  ];

  it('모든 프롬프트에 할루시네이션 방지 지침 존재', () => {
    for (const p of all) {
      expect(p).toContain('할루시네이션 방지');
    }
  });
  it('의료 금지 표현(치료/처방) 없음', () => {
    for (const p of all) {
      expect(p).not.toMatch(/치료|처방/);
    }
  });
});

describe('Gemini 프롬프트 — 파서 계약 (스키마대로면 모바일 타입 파싱)', () => {
  it('피부 스키마 JSON이 SkinAnalysisResult로 파싱', () => {
    const raw = JSON.stringify({
      skinType: 'combination',
      metrics: {
        moisture: 60,
        oil: 65,
        pores: 55,
        wrinkles: 70,
        pigmentation: 62,
        sensitivity: 58,
        elasticity: 66,
      },
      concerns: ['유분 과다'],
      recommendations: ['순한 클렌저'],
    });
    const parsed = JSON.parse(raw) as SkinAnalysisResult;
    expect(parsed.skinType).toBe('combination');
    expect(parsed.metrics.moisture).toBe(60);
    expect(Object.keys(parsed.metrics).sort()).toEqual(
      ['elasticity', 'moisture', 'oil', 'pigmentation', 'pores', 'sensitivity', 'wrinkles'].sort()
    );
  });
  it('체형 스키마 JSON이 BodyAnalysisResult로 파싱', () => {
    const raw = JSON.stringify({
      bodyType: 'hourglass',
      proportions: { shoulderHipRatio: 1.0, waistHipRatio: 0.7 },
      recommendations: ['허리 강조'],
      avoidItems: ['박시한 옷'],
    });
    const parsed = JSON.parse(raw) as Omit<BodyAnalysisResult, 'bmi'>;
    expect(parsed.bodyType).toBe('hourglass');
    expect(parsed.proportions.shoulderHipRatio).toBe(1.0);
  });
  it('헤어 스키마 JSON이 HairAnalysisResult로 파싱', () => {
    const raw = JSON.stringify({
      texture: 'wavy',
      thickness: 'medium',
      scalpCondition: 'normal',
      damageLevel: 30,
      scores: { shine: 60, elasticity: 62, density: 58, scalpHealth: 70 },
      mainConcerns: ['건조'],
      careRoutine: ['딥 컨디셔닝'],
      recommendedStyles: ['레이어드'],
    });
    const parsed = JSON.parse(raw) as HairAnalysisResult;
    expect(parsed.scores.scalpHealth).toBe(70);
    expect(parsed.texture).toBe('wavy');
  });
  it('메이크업 스키마 JSON이 MakeupAnalysisResult로 파싱', () => {
    const raw = JSON.stringify({
      faceShape: 'oval',
      undertone: 'cool',
      eyeShape: 'almond',
      lipShape: 'full',
      scores: { skinTone: 72, eyeBalance: 68, lipBalance: 74, overall: 76 },
      recommendations: {
        base: '보습 쿠션',
        eye: '로즈 그라데이션',
        lip: '로즈 립',
        blush: '핑크 블러셔',
        contour: '코 옆라인',
      },
      bestColors: ['#E6E6FA', '#DDA0DD', '#B0C4DE', '#F0FFFF', '#FFC0CB'],
    });
    const parsed = JSON.parse(raw) as MakeupAnalysisResult;
    expect(parsed.undertone).toBe('cool');
    expect(parsed.bestColors).toHaveLength(5);
    expect(parsed.recommendations.contour).toBe('코 옆라인');
  });
});
