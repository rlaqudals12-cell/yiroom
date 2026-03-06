/**
 * Insight → ConnectionAwareness 브릿지 테스트
 *
 * @module tests/lib/connection-awareness/insight-bridge
 * @description insightToExposeRequest, getModuleLabel, analysisToConnectionModule 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  insightToExposeRequest,
  getModuleLabel,
  analysisToConnectionModule,
} from '@/lib/connection-awareness/insight-bridge';
import type { Insight, AnalysisModule } from '@/lib/insights';
import type { ConnectionModule } from '@/lib/connection-awareness/types';

// =============================================================================
// 헬퍼: Mock Insight 생성
// =============================================================================

function createMockInsight(overrides: Partial<Insight> = {}): Insight {
  return {
    id: 'insight_1',
    category: 'color_match',
    title: '봄 웜톤에 어울리는 립 컬러',
    description: '퍼스널컬러 분석 결과 코랄 계열이 잘 어울려요.',
    relatedModules: ['personal_color', 'skin'],
    priority: 'high',
    priorityScore: 80,
    createdAt: '2026-03-01T00:00:00Z',
    ...overrides,
  } as Insight;
}

// =============================================================================
// insightToExposeRequest
// =============================================================================

describe('insightToExposeRequest', () => {
  it('인사이트를 ExposeRequest로 변환한다', () => {
    const insight = createMockInsight({
      category: 'color_match',
      relatedModules: ['personal_color', 'skin'],
      title: '봄 웜톤에 어울리는 립 컬러',
    });

    const result = insightToExposeRequest(insight);

    expect(result).toHaveProperty('connectionId');
    expect(result).toHaveProperty('sourceModule');
    expect(result).toHaveProperty('targetDomain');
    expect(result).toHaveProperty('connectionRule');
  });

  it('connectionId를 결정적으로 생성한다 (같은 인사이트 → 같은 ID)', () => {
    const insight1 = createMockInsight({
      category: 'skin_care',
      relatedModules: ['skin', 'personal_color'],
    });

    const insight2 = createMockInsight({
      category: 'skin_care',
      relatedModules: ['skin', 'personal_color'],
      title: '다른 제목이지만 같은 카테고리/모듈',
    });

    const result1 = insightToExposeRequest(insight1);
    const result2 = insightToExposeRequest(insight2);

    expect(result1.connectionId).toBe(result2.connectionId);
  });

  it('connectionId에 카테고리와 정렬된 모듈이 포함된다', () => {
    const insight = createMockInsight({
      category: 'synergy',
      relatedModules: ['body', 'personal_color'],
    });

    const result = insightToExposeRequest(insight);

    // 모듈이 정렬되므로 body_personal_color 순서
    expect(result.connectionId).toBe('synergy::body_personal_color');
  });

  it('relatedModules가 1개면 sourceModule과 targetDomain이 같은 모듈이다', () => {
    const insight = createMockInsight({
      category: 'skin_care',
      relatedModules: ['skin'],
    });

    const result = insightToExposeRequest(insight);

    expect(result.sourceModule).toBe('skin');
    // 모듈 1개일 때 targetDomain은 category 기반
    expect(result.targetDomain).toBe('skin_care');
  });

  it('relatedModules가 2개면 첫 번째가 source, 두 번째가 target이다', () => {
    const insight = createMockInsight({
      relatedModules: ['personal_color', 'body'],
    });

    const result = insightToExposeRequest(insight);

    expect(result.sourceModule).toBe('personal-color');
    expect(result.targetDomain).toBe('body');
  });

  it('relatedModules가 비어있으면 fallback 값을 사용한다', () => {
    const insight = createMockInsight({
      category: 'health_alert',
      relatedModules: [],
    });

    const result = insightToExposeRequest(insight);

    // fallback: sourceModule = 'skin', targetDomain = category
    expect(result.sourceModule).toBe('skin');
    expect(result.targetDomain).toBe('health_alert');
  });

  it('connectionRule에 모듈 한글 라벨이 포함된다', () => {
    const insight = createMockInsight({
      relatedModules: ['personal_color', 'skin'],
      title: '피부 밝기와 컬러 조합',
    });

    const result = insightToExposeRequest(insight);

    expect(result.connectionRule).toContain('퍼스널컬러');
    expect(result.connectionRule).toContain('피부 분석');
    expect(result.connectionRule).toContain('피부 밝기와 컬러 조합');
  });

  it('relatedModules가 비어있으면 connectionRule은 title만 반환한다', () => {
    const insight = createMockInsight({
      relatedModules: [],
      title: '일반 건강 알림',
    });

    const result = insightToExposeRequest(insight);

    expect(result.connectionRule).toBe('일반 건강 알림');
  });
});

// =============================================================================
// getModuleLabel
// =============================================================================

describe('getModuleLabel', () => {
  const expectedLabels: Record<ConnectionModule, string> = {
    'personal-color': '퍼스널컬러',
    skin: '피부 분석',
    body: '체형 분석',
    hair: '헤어 분석',
    makeup: '메이크업',
    'oral-health': '구강건강',
    workout: '운동',
    nutrition: '영양',
    fashion: '패션',
  };

  for (const [module, label] of Object.entries(expectedLabels)) {
    it(`${module} → "${label}"을 반환한다`, () => {
      expect(getModuleLabel(module as ConnectionModule)).toBe(label);
    });
  }
});

// =============================================================================
// analysisToConnectionModule
// =============================================================================

describe('analysisToConnectionModule', () => {
  const expectedMappings: Record<AnalysisModule, ConnectionModule> = {
    personal_color: 'personal-color',
    face: 'skin',
    skin: 'skin',
    body: 'body',
    hair: 'hair',
    oral_health: 'oral-health',
  };

  for (const [analysis, connection] of Object.entries(expectedMappings)) {
    it(`${analysis} → "${connection}"으로 변환한다`, () => {
      expect(analysisToConnectionModule(analysis as AnalysisModule)).toBe(connection);
    });
  }

  it('face 모듈은 skin으로 매핑된다 (피부 분석에 포함)', () => {
    expect(analysisToConnectionModule('face')).toBe('skin');
  });
});
