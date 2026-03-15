import { describe, it, expect } from 'vitest';
import {
  getSupplementRecommendations,
  BODY_TYPE_TO_CATEGORY,
} from '@/lib/nutrition/supplementInsight';

describe('getSupplementRecommendations - 체형 연동', () => {
  it('체형 없으면 bodyTypeSupplements 빈 배열', () => {
    const result = getSupplementRecommendations('health');
    expect(result.bodyTypeSupplements).toHaveLength(0);
  });

  it('V형(상체 우세) → 단백질 보충제 추천', () => {
    const result = getSupplementRecommendations('health', undefined, 'V');
    expect(result.bodyTypeSupplements.length).toBeGreaterThan(0);
    expect(result.bodyTypeSupplements.some((s) => s.category === 'protein')).toBe(true);
  });

  it('O형(체지방 높음) → 대사 촉진 영양제 추천', () => {
    const result = getSupplementRecommendations('health', undefined, 'O');
    expect(result.bodyTypeSupplements.length).toBeGreaterThan(0);
    expect(result.bodyTypeSupplements.some((s) => s.name.includes('카르니틴'))).toBe(true);
  });

  it('I형(근육량 적음) → 크레아틴 추천', () => {
    const result = getSupplementRecommendations('health', undefined, 'I');
    expect(result.bodyTypeSupplements.some((s) => s.name.includes('크레아틴'))).toBe(true);
  });

  it('X형(균형) → 체형 영양제 없음', () => {
    const result = getSupplementRecommendations('health', undefined, 'X');
    expect(result.bodyTypeSupplements).toHaveLength(0);
  });

  it('목표 + 피부 + 체형 통합 시 중복 제거', () => {
    // muscle 목표에 크레아틴 포함, I형에도 크레아틴 포함 → 중복 제거
    const result = getSupplementRecommendations('muscle', undefined, 'I');
    const creatineCount = result.allSupplements.filter((s) => s.name.includes('크레아틴')).length;
    expect(creatineCount).toBe(1);
  });

  it('체형 영양제가 요약 메시지에 포함됨', () => {
    const result = getSupplementRecommendations('health', undefined, 'O');
    expect(result.summary).toContain('체형에 맞는');
  });

  it('알 수 없는 체형은 체형 영양제 없음', () => {
    const result = getSupplementRecommendations('health', undefined, 'Z');
    expect(result.bodyTypeSupplements).toHaveLength(0);
  });

  it('모든 8-Type에 카테고리 매핑 존재', () => {
    const types = ['X', 'A', 'V', 'H', 'O', 'I', 'Y', '8'];
    for (const t of types) {
      expect(BODY_TYPE_TO_CATEGORY[t]).toBeDefined();
    }
  });
});
