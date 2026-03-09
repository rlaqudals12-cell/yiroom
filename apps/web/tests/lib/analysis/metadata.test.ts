/**
 * 분석 결과 메타데이터 헬퍼 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => ({
    from: mockFrom,
  }),
}));

import {
  generateAnalysisMetadata,
  PERSONAL_COLOR_META,
  SKIN_META,
  BODY_META,
  ORAL_HEALTH_META,
} from '@/lib/analysis/metadata';

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue({ select: mockSelect });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ single: mockSingle });
});

describe('generateAnalysisMetadata', () => {
  it('should generate metadata with titleMapper', async () => {
    mockSingle.mockResolvedValue({
      data: { season: 'spring' },
      error: null,
    });

    const metadata = await generateAnalysisMetadata('test-id', PERSONAL_COLOR_META);

    expect(metadata.title).toBe('퍼스널컬러: 봄 웜톤 | 이룸');
    expect(metadata.description).toContain('봄 웜톤');
    expect(metadata.openGraph).toBeDefined();
  });

  it('should generate metadata for skin type', async () => {
    mockSingle.mockResolvedValue({
      data: { skin_type: 'combination' },
      error: null,
    });

    const metadata = await generateAnalysisMetadata('test-id', SKIN_META);

    expect(metadata.title).toBe('피부: 복합성 | 이룸');
  });

  it('should use raw value when no titleMapper match', async () => {
    mockSingle.mockResolvedValue({
      data: { body_type: '역삼각형' },
      error: null,
    });

    const metadata = await generateAnalysisMetadata('test-id', BODY_META);

    expect(metadata.title).toBe('체형: 역삼각형 | 이룸');
  });

  it('should add 점 suffix for numeric values', async () => {
    mockSingle.mockResolvedValue({
      data: { overall_score: 85 },
      error: null,
    });

    const metadata = await generateAnalysisMetadata('test-id', ORAL_HEALTH_META);

    expect(metadata.title).toBe('구강건강: 85점 | 이룸');
  });

  it('should return fallback on DB error', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'not found' },
    });

    const metadata = await generateAnalysisMetadata('test-id', PERSONAL_COLOR_META);

    expect(metadata.title).toBe('퍼스널컬러 분석 결과 | 이룸');
    expect(metadata.description).toContain('확인해보세요');
  });

  it('should return fallback on exception', async () => {
    mockSingle.mockRejectedValue(new Error('Network error'));

    const metadata = await generateAnalysisMetadata('test-id', PERSONAL_COLOR_META);

    expect(metadata.title).toBe('퍼스널컬러 분석 결과 | 이룸');
  });
});
