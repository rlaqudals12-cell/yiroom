/**
 * 통합 분석 Zod 스키마 검증 테스트
 *
 * @see lib/analysis/integrated/types.ts
 * @see docs/specs/SDD-INTEGRATED-ANALYSIS.md §2 (입력 스펙)
 */

import { describe, it, expect } from 'vitest';
import {
  integratedAnalysisInputSchema,
  skinQuestionnaireSchema,
  hairQuestionnaireSchema,
  bodyQuestionnaireSchema,
  AXIS_CODES,
} from '@/lib/analysis/integrated';

describe('integratedAnalysisInputSchema', () => {
  const validFaceImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA';

  it('얼굴 이미지만으로 최소 입력 검증 통과', () => {
    const result = integratedAnalysisInputSchema.safeParse({
      faceImageBase64: validFaceImage,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.faceImageBase64).toBe(validFaceImage);
      expect(result.data.options.locale).toBe('ko');
      expect(result.data.options.skipMakeup).toBe(false);
    }
  });

  it('얼굴 이미지 없으면 실패', () => {
    const result = integratedAnalysisInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('잘못된 이미지 형식(data:image 접두사 아님) 실패', () => {
    const result = integratedAnalysisInputSchema.safeParse({
      faceImageBase64: 'not-base64',
    });
    expect(result.success).toBe(false);
  });

  it('전신 이미지는 선택 (없어도 통과)', () => {
    const result = integratedAnalysisInputSchema.safeParse({
      faceImageBase64: validFaceImage,
      bodyImageBase64: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('자가입력 포함 전체 입력 검증', () => {
    const result = integratedAnalysisInputSchema.safeParse({
      faceImageBase64: validFaceImage,
      bodyImageBase64: validFaceImage,
      questionnaire: {
        skin: { selfReportedType: 'combination', concerns: ['acne'] },
        hair: { length: 'medium', density: 'medium', curlType: 'straight' },
        body: { heightCm: 170, weightKg: 60, shoulderWidthCm: 40, waistCm: 70 },
      },
      options: { locale: 'en', skipMakeup: true },
    });
    expect(result.success).toBe(true);
  });

  it('잘못된 로케일 실패', () => {
    const result = integratedAnalysisInputSchema.safeParse({
      faceImageBase64: validFaceImage,
      options: { locale: 'fr' },
    });
    expect(result.success).toBe(false);
  });
});

describe('skinQuestionnaireSchema', () => {
  it('기본값 생성', () => {
    const result = skinQuestionnaireSchema.parse({});
    expect(result.selfReportedType).toBe('unknown');
    expect(result.concerns).toEqual([]);
  });

  it('concerns 최대 5개 제한', () => {
    const result = skinQuestionnaireSchema.safeParse({
      concerns: ['a', 'b', 'c', 'd', 'e', 'f'], // 6개
    });
    expect(result.success).toBe(false);
  });
});

describe('hairQuestionnaireSchema', () => {
  it('모든 필드 optional', () => {
    const result = hairQuestionnaireSchema.parse({});
    expect(result.length).toBeUndefined();
    expect(result.density).toBeUndefined();
    expect(result.curlType).toBeUndefined();
  });

  it('잘못된 length 값 실패', () => {
    const result = hairQuestionnaireSchema.safeParse({ length: 'xxl' });
    expect(result.success).toBe(false);
  });
});

describe('bodyQuestionnaireSchema', () => {
  it('측정값 범위 검증 (키 100-220)', () => {
    expect(bodyQuestionnaireSchema.safeParse({ heightCm: 170 }).success).toBe(true);
    expect(bodyQuestionnaireSchema.safeParse({ heightCm: 50 }).success).toBe(false);
    expect(bodyQuestionnaireSchema.safeParse({ heightCm: 250 }).success).toBe(false);
  });

  it('모든 필드 optional (전신 사진 사용 시)', () => {
    const result = bodyQuestionnaireSchema.parse({});
    expect(result.heightCm).toBeUndefined();
  });
});

describe('AXIS_CODES', () => {
  it('5개 축 정확히 정의', () => {
    expect(AXIS_CODES).toEqual(['personal_color', 'skin', 'body', 'hair', 'makeup']);
    expect(AXIS_CODES).toHaveLength(5);
  });
});
