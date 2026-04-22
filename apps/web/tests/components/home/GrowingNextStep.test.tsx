import { describe, it, expect } from 'vitest';
import { getNextStep } from '@/app/(main)/home/_components/GrowingNextStep';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';

function createAnalysis(type: string, summary: string, daysAgo: number = 0): AnalysisSummary {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id: type + '-1',
    type: type as AnalysisSummary['type'],
    createdAt: date,
    summary,
  };
}

describe('getNextStep', () => {
  it('빈 배열이면 null 반환', () => {
    expect(getNextStep([])).toBeNull();
  });

  it('personal-color 완료 → body 추천', () => {
    const analyses = [createAnalysis('personal-color', '봄 웜톤')];
    const result = getNextStep(analyses);

    expect(result).not.toBeNull();
    expect(result!.href).toBe('/analysis/body');
    expect(result!.message).toContain('코디를 추천하려면 체형 정보가 필요해요');
  });

  it('skin 완료 → makeup 추천', () => {
    const analyses = [createAnalysis('skin', '75점')];
    const result = getNextStep(analyses);

    expect(result).not.toBeNull();
    expect(result!.href).toBe('/analysis/makeup');
    expect(result!.message).toContain('메이크업 스타일');
  });

  it('body 완료 → hair 추천', () => {
    const analyses = [createAnalysis('body', '모래시계형')];
    const result = getNextStep(analyses);

    expect(result).not.toBeNull();
    expect(result!.href).toBe('/analysis/hair');
  });

  it('가장 최근 분석 기준으로 추천', () => {
    const analyses = [
      createAnalysis('personal-color', '봄 웜톤', 3),
      createAnalysis('skin', '75점', 0), // 더 최근
    ];
    const result = getNextStep(analyses);

    // skin(최근) → makeup 추천
    expect(result!.href).toBe('/analysis/makeup');
  });

  it('추천 분석이 이미 완료되면 다음 매핑으로', () => {
    const analyses = [
      createAnalysis('personal-color', '봄 웜톤', 1),
      createAnalysis('body', '모래시계형', 0), // body 이미 완료
    ];
    const result = getNextStep(analyses);

    // personal-color → body지만 body 완료 → body → hair
    expect(result!.href).toBe('/analysis/hair');
  });

  it('모든 매핑 소진 시 미완료 중 첫 번째 fallback', () => {
    // ADR-098 OH-1 제거 후: ANALYSIS_ORDER = [personal-color, skin, body, hair, makeup]
    // personal-color+body+hair+makeup 완료 → 미완료인 skin이 fallback
    const analyses = [
      createAnalysis('personal-color', '봄 웜톤'),
      createAnalysis('body', '모래시계형'),
      createAnalysis('hair', '직모'),
      createAnalysis('makeup', '웜톤'),
    ];
    const result = getNextStep(analyses);

    expect(result!.href).toBe('/analysis/skin');
  });
});
