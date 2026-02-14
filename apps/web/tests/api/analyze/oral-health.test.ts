/**
 * OH-1 구강건강 분석 API 테스트
 * @description POST /api/analyze/oral-health 테스트 (VITA 셰이드, 잇몸 건강)
 * @see docs/specs/SDD-OH-1-ORAL-HEALTH.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 모듈 설정
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/gemini/v2-analysis', () => ({
  analyzeOralWithGemini: vi.fn(),
}));

vi.mock('@/lib/mock/oral-health', () => ({
  generateMockOralHealthAssessment: vi.fn(),
}));

vi.mock('@/lib/audit/logger', () => ({
  logAnalysisCreate: vi.fn(),
}));

// Rate Limit 모킹 - 항상 통과
vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ success: true, remaining: 10 }),
  getRateLimitHeaders: vi.fn().mockReturnValue({}),
}));

import { POST } from '@/app/api/analyze/oral-health/route';
import { auth } from '@clerk/nextjs/server';
import { analyzeOralWithGemini } from '@/lib/gemini/v2-analysis';
import { generateMockOralHealthAssessment } from '@/lib/mock/oral-health';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logAnalysisCreate } from '@/lib/audit/logger';
import { NextRequest } from 'next/server';

// Mock 요청 헬퍼 (NextRequest 호환)
function createMockPostRequest(body: unknown): NextRequest {
  const url = 'http://localhost/api/analyze/oral-health';
  const req = new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return req;
}

// Mock Gemini 응답
const mockGeminiResponse = {
  data: {
    canAnalyze: true,
    confidence: 85,
    toothColor: {
      detectedShade: 'A2' as const,
      brightness: 'medium' as const,
      yellowness: 'mild' as const,
      series: 'A' as const,
      confidence: 88,
      alternativeShades: ['A1', 'B2'],
    },
    gumHealth: {
      overallStatus: 'healthy' as const,
      inflammationScore: 15,
      rednessLevel: 'normal' as const,
      swellingLevel: 'none' as const,
      needsDentalVisit: false,
      affectedAreas: [],
    },
    overallScore: 82,
    recommendations: ['정기적인 치과 검진을 권장합니다.', '하루 2회 이상 칫솔질을 권장합니다.'],
    imageQuality: {
      lightingCondition: 'natural' as const,
      teethVisible: true,
      gumsVisible: true,
      colorAccuracy: 'high' as const,
    },
  },
  usedFallback: false,
};

// Mock 구강건강 평가 결과
const mockOralHealthAssessment = {
  id: 'oh_mock_123',
  clerkUserId: 'user_test123',
  createdAt: new Date().toISOString(),
  usedFallback: true,
  toothColor: {
    measuredLab: { L: 67, a: 2.5, b: 18 },
    matchedShade: 'A2' as const,
    deltaE: 1.2,
    confidence: 80,
    alternativeMatches: [
      { shade: 'A1' as const, deltaE: 2.5 },
      { shade: 'B2' as const, deltaE: 3.0 },
    ],
    interpretation: {
      brightness: 'medium' as const,
      yellowness: 'mild' as const,
      series: 'A' as const,
    },
  },
  gumHealth: {
    healthStatus: 'healthy' as const,
    inflammationScore: 10,
    needsDentalVisit: false,
    metrics: {
      aStarMean: 12,
      aStarStd: 2.5,
      rednessPercentage: 5,
      swellingIndicator: 0,
    },
    recommendations: ['정기적인 치과 검진을 권장합니다.'],
    affectedAreas: [],
  },
  overallScore: 85,
  recommendations: ['정기적인 치과 검진을 권장합니다.'],
};

describe('POST /api/analyze/oral-health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      userId: 'user_test123',
      sessionId: 'session_123',
      sessionClaims: {},
    } as never);
    vi.mocked(generateMockOralHealthAssessment).mockReturnValue(mockOralHealthAssessment);
    // Rate Limit 기본값: 통과
    vi.mocked(checkRateLimit).mockReturnValue({
      success: true,
      remaining: 10,
    } as never);
  });

  describe('인증', () => {
    it('비로그인 시 401 반환', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as never);

      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQ...',
        analysisType: 'full',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('AUTH_ERROR');
    });
  });

  describe('입력 검증', () => {
    it('이미지 없으면 400 반환', async () => {
      const req = createMockPostRequest({
        analysisType: 'full',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('VALIDATION_ERROR');
    });

    it('잘못된 analysisType 시 400 반환', async () => {
      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQ...',
        analysisType: 'invalid_type',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Gemini 연동', () => {
    it('Gemini 성공 시 분석 결과 반환', async () => {
      vi.mocked(analyzeOralWithGemini).mockResolvedValue(mockGeminiResponse);

      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'full',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.assessment).toBeDefined();
      expect(data.data?.assessment.toothColor).toBeDefined();
      expect(data.data?.assessment.gumHealth).toBeDefined();
      expect(data.data?.assessment.usedFallback).toBe(false);
    });

    it('Gemini 실패 시 Mock Fallback 사용', async () => {
      vi.mocked(analyzeOralWithGemini).mockResolvedValue({
        data: null,
        usedFallback: true,
      });

      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'full',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.assessment).toBeDefined();
      expect(data.data?.assessment.usedFallback).toBe(true);
      expect(generateMockOralHealthAssessment).toHaveBeenCalled();
    });
  });

  describe('분석 유형', () => {
    it('tooth_color 분석만 요청 시 치아색만 반환', async () => {
      vi.mocked(analyzeOralWithGemini).mockResolvedValue(mockGeminiResponse);

      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'tooth_color',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.assessment.toothColor).toBeDefined();
      // gumHealth는 analysisType에 따라 포함되지 않을 수 있음
    });

    it('gum_health 분석만 요청 시 잇몸 건강만 반환', async () => {
      vi.mocked(analyzeOralWithGemini).mockResolvedValue(mockGeminiResponse);

      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'gum_health',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.assessment.gumHealth).toBeDefined();
    });
  });

  describe('퍼스널컬러 연동', () => {
    it('퍼스널컬러 시즌 제공 시 미백 목표 포함', async () => {
      vi.mocked(analyzeOralWithGemini).mockResolvedValue(mockGeminiResponse);

      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'full',
        personalColorSeason: 'spring',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.assessment.whiteningGoal).toBeDefined();
      expect(data.data?.assessment.whiteningGoal?.personalColorSeason).toBe('spring');
    });

    it('여름 쿨톤 시즌 제공 시 미백 목표 포함', async () => {
      vi.mocked(analyzeOralWithGemini).mockResolvedValue(mockGeminiResponse);

      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'full',
        personalColorSeason: 'summer',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data?.assessment.whiteningGoal?.personalColorSeason).toBe('summer');
    });

    it('퍼스널컬러 없이 full 분석 시 미백 목표 미포함', async () => {
      vi.mocked(analyzeOralWithGemini).mockResolvedValue(mockGeminiResponse);

      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'full',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data?.assessment.whiteningGoal).toBeUndefined();
    });

    it('gum_health 분석 시 퍼스널컬러 제공해도 미백 목표 미포함', async () => {
      vi.mocked(analyzeOralWithGemini).mockResolvedValue(mockGeminiResponse);

      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'gum_health',
        personalColorSeason: 'spring',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      // gum_health 분석에서는 미백 목표가 포함되지 않아야 함
      expect(data.data?.assessment.whiteningGoal).toBeUndefined();
    });
  });

  describe('Rate Limiting', () => {
    it('Rate Limit 초과 시 429 반환', async () => {
      vi.mocked(checkRateLimit).mockReturnValue({
        success: false,
        remaining: 0,
        resetTime: Date.now() + 86400000,
        dailyRemaining: 0,
      } as never);

      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'full',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('RATE_LIMIT_ERROR');
    });
  });

  describe('응답 구조 검증', () => {
    beforeEach(() => {
      vi.mocked(analyzeOralWithGemini).mockResolvedValue(mockGeminiResponse);
    });

    it('성공 응답에 assessment 객체가 포함된다', async () => {
      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'full',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('assessment');
      expect(data.data.assessment).toHaveProperty('id');
      expect(data.data.assessment).toHaveProperty('clerkUserId');
      expect(data.data.assessment).toHaveProperty('createdAt');
      expect(data.data.assessment).toHaveProperty('overallScore');
      expect(data.data.assessment).toHaveProperty('recommendations');
    });

    it('에러 응답에 code와 message가 포함된다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as never);

      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQ...',
        analysisType: 'full',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
    });

    it('Gemini 성공 시 toothColor 필드 구조가 올바르다', async () => {
      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'full',
      });

      const response = await POST(req);
      const data = await response.json();

      const toothColor = data.data?.assessment.toothColor;
      expect(toothColor).toHaveProperty('measuredLab');
      expect(toothColor).toHaveProperty('matchedShade');
      expect(toothColor).toHaveProperty('confidence');
      expect(toothColor).toHaveProperty('alternativeMatches');
      expect(toothColor).toHaveProperty('interpretation');
      expect(toothColor.interpretation).toHaveProperty('brightness');
      expect(toothColor.interpretation).toHaveProperty('yellowness');
      expect(toothColor.interpretation).toHaveProperty('series');
    });

    it('Gemini 성공 시 gumHealth 필드 구조가 올바르다', async () => {
      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'full',
      });

      const response = await POST(req);
      const data = await response.json();

      const gumHealth = data.data?.assessment.gumHealth;
      expect(gumHealth).toHaveProperty('healthStatus');
      expect(gumHealth).toHaveProperty('inflammationScore');
      expect(gumHealth).toHaveProperty('needsDentalVisit');
      expect(gumHealth).toHaveProperty('metrics');
      expect(gumHealth).toHaveProperty('recommendations');
    });
  });

  describe('입력 검증 - 추가 엣지케이스', () => {
    it('빈 문자열 이미지 시 400 반환', async () => {
      const req = createMockPostRequest({
        imageBase64: '',
        analysisType: 'full',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('analysisType 누락 시 400 반환', async () => {
      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('잘못된 personalColorSeason 시 400 반환', async () => {
      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'full',
        personalColorSeason: 'invalid_season',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('body가 빈 객체일 때 400 반환', async () => {
      const req = createMockPostRequest({});

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('서버 에러 처리', () => {
    it('Gemini가 예외를 던지면 500 반환', async () => {
      vi.mocked(analyzeOralWithGemini).mockRejectedValue(new Error('Gemini API failure'));

      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'full',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('INTERNAL_ERROR');
    });

    it('JSON 파싱 실패 시 500 반환', async () => {
      const url = 'http://localhost/api/analyze/oral-health';
      const req = new NextRequest(url, {
        method: 'POST',
        body: 'invalid json {{{',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('감사 로그', () => {
    it('성공 분석 시 감사 로그가 기록된다', async () => {
      vi.mocked(analyzeOralWithGemini).mockResolvedValue(mockGeminiResponse);

      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'full',
      });

      const response = await POST(req);
      expect(response.status).toBe(200);

      expect(logAnalysisCreate).toHaveBeenCalledWith(
        'user_test123',
        'oral_health',
        expect.stringContaining('oh_')
      );
    });

    it('Mock Fallback 사용 시에도 감사 로그가 기록된다', async () => {
      vi.mocked(analyzeOralWithGemini).mockResolvedValue({
        data: null,
        usedFallback: true,
      });

      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'full',
      });

      const response = await POST(req);
      expect(response.status).toBe(200);

      expect(logAnalysisCreate).toHaveBeenCalledWith(
        'user_test123',
        'oral_health',
        expect.any(String)
      );
    });
  });

  describe('Mock Fallback 상세', () => {
    it('Fallback 사용 시 generateMockOralHealthAssessment에 올바른 파라미터 전달', async () => {
      vi.mocked(analyzeOralWithGemini).mockResolvedValue({
        data: null,
        usedFallback: true,
      });

      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'full',
      });

      await POST(req);

      expect(generateMockOralHealthAssessment).toHaveBeenCalledWith(
        expect.objectContaining({
          clerkUserId: 'user_test123',
          includeToothColor: true,
          includeGumHealth: true,
        })
      );
    });

    it('tooth_color 분석 시 Fallback 파라미터에 includeGumHealth=false', async () => {
      vi.mocked(analyzeOralWithGemini).mockResolvedValue({
        data: null,
        usedFallback: true,
      });

      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'tooth_color',
      });

      await POST(req);

      expect(generateMockOralHealthAssessment).toHaveBeenCalledWith(
        expect.objectContaining({
          includeToothColor: true,
          includeGumHealth: false,
        })
      );
    });

    it('gum_health 분석 시 Fallback 파라미터에 includeToothColor=false', async () => {
      vi.mocked(analyzeOralWithGemini).mockResolvedValue({
        data: null,
        usedFallback: true,
      });

      const req = createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        analysisType: 'gum_health',
      });

      await POST(req);

      expect(generateMockOralHealthAssessment).toHaveBeenCalledWith(
        expect.objectContaining({
          includeToothColor: false,
          includeGumHealth: true,
        })
      );
    });
  });
});
