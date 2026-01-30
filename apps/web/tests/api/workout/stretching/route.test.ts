/**
 * W-2 스트레칭 처방 API 테스트
 * @description POST /api/workout/stretching 테스트
 * @see docs/specs/SDD-W-2-ADVANCED-STRETCHING.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 모듈 설정
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/workout/stretching', () => ({
  generatePostureCorrectionPrescription: vi.fn(),
  generateSportStretchingPrescription: vi.fn(),
  generateGeneralFlexibilityPrescription: vi.fn(),
  generateWeeklyStretchingPlan: vi.fn(),
}));

vi.mock('@/lib/audit/logger', () => ({
  logAnalysisCreate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ success: true, remaining: 50 }),
  getRateLimitHeaders: vi.fn().mockReturnValue({}),
}));

import { POST } from '@/app/api/workout/stretching/route';
import { auth } from '@clerk/nextjs/server';
import {
  generatePostureCorrectionPrescription,
  generateSportStretchingPrescription,
  generateGeneralFlexibilityPrescription,
  generateWeeklyStretchingPlan,
} from '@/lib/workout/stretching';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { NextRequest } from 'next/server';
import type { StretchingPrescription, WeeklyStretchingPlan } from '@/types/stretching';

// Mock 요청 헬퍼
function createMockPostRequest(body: unknown): NextRequest {
  const url = 'http://localhost/api/workout/stretching';
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// Mock 사용자 프로필
const mockUserProfile = {
  age: 35,
  gender: 'male' as const,
  fitnessLevel: 'intermediate' as const,
  stretchingExperience: 'some' as const,
  primarySports: ['running'] as const,
  sportsFrequency: 'weekly' as const,
  availableEquipment: ['bodyweight', 'mat'] as const,
  preferredSessionDuration: 15,
};

// Mock 자세 분석 결과
const mockPostureAnalysis = {
  assessmentId: 'posture-123',
  createdAt: '2026-01-29T10:00:00Z',
  angles: {
    cva: 42,
    shoulderTilt: 3,
    thoracicKyphosis: 35,
    lumbarLordosis: 28,
    pelvicTilt: 8,
  },
  overallScore: 72,
  category: 'moderate' as const,
  imbalances: [
    {
      type: 'forward_head',
      severity: 'moderate' as const,
      affectedAngles: ['cva'],
      description: '거북목 자세 - 중등도',
    },
  ],
  tightMuscles: ['upper_trapezius', 'levator_scapulae', 'pectoralis_major'],
  weakMuscles: ['deep_neck_flexors', 'lower_trapezius', 'serratus_anterior'],
};

// Mock 처방 결과 (StretchingPrescription 타입 매칭)
const mockPrescription: StretchingPrescription = {
  prescriptionId: 'rx-123',
  createdAt: '2026-01-29T10:00:00Z',
  basedOn: {
    purpose: 'posture_correction',
    postureAnalysis: 'posture-123',
  },
  totalDuration: 15,
  frequency: '주 5-6회',
  stretches: [
    {
      order: 1,
      exercise: {
        id: 'stretch-001',
        nameKo: '목 옆 스트레칭',
        nameEn: 'Lateral Neck Stretch',
        type: 'static',
        category: 'posture_correction',
        targetMuscles: ['upper_trapezius', 'levator_scapulae'],
        secondaryMuscles: ['sternocleidomastoid'],
        equipment: ['bodyweight'],
        difficulty: 'beginner',
        defaultDuration: 30,
        durationUnit: 'seconds',
        sets: 2,
        restBetweenSets: 15,
        instructions: [
          '바르게 앉거나 서서 어깨를 내립니다.',
          '오른손으로 왼쪽 머리를 잡고 오른쪽으로 부드럽게 당깁니다.',
        ],
        breathingGuide: '당기면서 천천히 숨을 내쉽니다.',
        commonMistakes: ['어깨가 올라감', '과도한 힘 사용'],
        contraindications: ['cervical_disc_herniation', 'severe_neck_pain'],
        modifications: [],
        redFlags: ['극심한 통증', '어지러움'],
      },
      adjustedDuration: 60,
      adjustedSets: 2,
      notes: '양쪽 번갈아 실시',
    },
  ],
  warnings: ['목 통증이 심하면 의사와 상담하세요.'],
  medicalDisclaimer: '본 처방은 의료 목적이 아닙니다.',
};

// Mock 일일 루틴
const mockDailyRoutine = {
  type: 'stretch' as const,
  stretches: mockPrescription.stretches,
  duration: 15,
  notes: '오늘 스트레칭 하셨나요?',
};

// Mock 주간 플랜 (WeeklyStretchingPlan 타입 매칭)
const mockWeeklyPlan: WeeklyStretchingPlan = {
  planId: 'plan-123',
  userId: 'user_test123',
  weekStartDate: '2026-01-29',
  days: {
    monday: mockDailyRoutine,
    tuesday: mockDailyRoutine,
    wednesday: { type: 'rest' as const, stretches: [], duration: 0 },
    thursday: mockDailyRoutine,
    friday: mockDailyRoutine,
    saturday: { type: 'active_recovery' as const, stretches: [], duration: 10 },
    sunday: { type: 'rest' as const, stretches: [], duration: 0 },
  },
  progressionWeek: 1,
};

describe('POST /api/workout/stretching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as Awaited<
      ReturnType<typeof auth>
    >);
    vi.mocked(generatePostureCorrectionPrescription).mockReturnValue(mockPrescription);
    vi.mocked(generateSportStretchingPrescription).mockReturnValue(mockPrescription);
    vi.mocked(generateGeneralFlexibilityPrescription).mockReturnValue(mockPrescription);
    vi.mocked(generateWeeklyStretchingPlan).mockReturnValue(mockWeeklyPlan);
    vi.mocked(checkRateLimit).mockReturnValue({ success: true, remaining: 50, resetTime: Date.now() + 3600000 });
  });

  describe('인증', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const response = await POST(
        createMockPostRequest({
          purpose: 'general',
          profile: mockUserProfile,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error.code).toBe('AUTH_ERROR');
    });
  });

  describe('입력 검증', () => {
    it('필수 필드가 없으면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({}));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('잘못된 purpose 값은 400을 반환한다', async () => {
      const response = await POST(
        createMockPostRequest({
          purpose: 'invalid_purpose',
          profile: mockUserProfile,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('프로필 나이가 범위를 벗어나면 400을 반환한다', async () => {
      const response = await POST(
        createMockPostRequest({
          purpose: 'general',
          profile: { ...mockUserProfile, age: 5 },
        })
      );
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Rate Limiting', () => {
    it('요청 한도 초과 시 429를 반환한다', async () => {
      vi.mocked(checkRateLimit).mockReturnValue({
        success: false,
        remaining: 0,
        resetTime: Date.now() + 3600000,
        dailyRemaining: 0,
      });

      const response = await POST(
        createMockPostRequest({
          purpose: 'general',
          profile: mockUserProfile,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(429);
      expect(json.error.code).toBe('RATE_LIMIT_ERROR');
    });
  });

  describe('자세교정 처방', () => {
    it('postureAnalysis 없이 posture_correction 요청 시 400을 반환한다', async () => {
      const response = await POST(
        createMockPostRequest({
          purpose: 'posture_correction',
          profile: mockUserProfile,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe('VALIDATION_ERROR');
      expect(json.error.message).toContain('자세분석 결과');
    });

    it('postureAnalysis와 함께 성공적으로 처방을 생성한다', async () => {
      const response = await POST(
        createMockPostRequest({
          purpose: 'posture_correction',
          profile: mockUserProfile,
          postureAnalysis: mockPostureAnalysis,
          availableMinutes: 15,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.prescription).toBeDefined();
      expect(generatePostureCorrectionPrescription).toHaveBeenCalled();
    });
  });

  describe('스포츠 처방', () => {
    it('sport 없이 warmup 요청 시 400을 반환한다', async () => {
      const response = await POST(
        createMockPostRequest({
          purpose: 'warmup',
          profile: mockUserProfile,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe('VALIDATION_ERROR');
      expect(json.error.message).toContain('스포츠 종목');
    });

    it('sport 없이 cooldown 요청 시 400을 반환한다', async () => {
      const response = await POST(
        createMockPostRequest({
          purpose: 'cooldown',
          profile: mockUserProfile,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('sport와 함께 워밍업 처방을 생성한다', async () => {
      const response = await POST(
        createMockPostRequest({
          purpose: 'warmup',
          profile: mockUserProfile,
          sport: 'running',
          availableMinutes: 10,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.prescription).toBeDefined();
      expect(generateSportStretchingPrescription).toHaveBeenCalledWith(
        'running',
        'warmup',
        expect.any(Object),
        10
      );
    });

    it('sport와 함께 쿨다운 처방을 생성한다', async () => {
      const response = await POST(
        createMockPostRequest({
          purpose: 'cooldown',
          profile: mockUserProfile,
          sport: 'golf',
          availableMinutes: 10,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(generateSportStretchingPrescription).toHaveBeenCalledWith(
        'golf',
        'cooldown',
        expect.any(Object),
        10
      );
    });
  });

  describe('일반 유연성 처방', () => {
    it('general 처방을 성공적으로 생성한다', async () => {
      const response = await POST(
        createMockPostRequest({
          purpose: 'general',
          profile: mockUserProfile,
          availableMinutes: 20,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.prescription).toBeDefined();
      expect(generateGeneralFlexibilityPrescription).toHaveBeenCalledWith(
        expect.any(Object),
        20
      );
    });

    it('기본 시간(15분)이 적용된다', async () => {
      const response = await POST(
        createMockPostRequest({
          purpose: 'general',
          profile: mockUserProfile,
        })
      );

      expect(response.status).toBe(200);
      expect(generateGeneralFlexibilityPrescription).toHaveBeenCalledWith(
        expect.any(Object),
        15
      );
    });
  });

  describe('주간 플랜', () => {
    it('includeWeeklyPlan=true이면 주간 플랜이 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          purpose: 'general',
          profile: mockUserProfile,
          includeWeeklyPlan: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.weeklyPlan).toBeDefined();
      expect(json.data.weeklyPlan.planId).toBe('plan-123');
      expect(generateWeeklyStretchingPlan).toHaveBeenCalled();
    });

    it('includeWeeklyPlan=false이면 주간 플랜이 없다', async () => {
      const response = await POST(
        createMockPostRequest({
          purpose: 'general',
          profile: mockUserProfile,
          includeWeeklyPlan: false,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.weeklyPlan).toBeUndefined();
      expect(generateWeeklyStretchingPlan).not.toHaveBeenCalled();
    });
  });

  describe('응답 형식', () => {
    it('성공 응답에 필수 필드가 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          purpose: 'general',
          profile: mockUserProfile,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.prescription).toBeDefined();
      expect(json.data.summary).toBeDefined();
    });

    it('summary에 요약 정보가 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          purpose: 'general',
          profile: mockUserProfile,
        })
      );
      const json = await response.json();

      expect(json.data.summary.totalExercises).toBe(1);
      expect(json.data.summary.totalDuration).toBe(15);
      expect(json.data.summary.targetMuscles).toContain('upper_trapezius');
      expect(json.data.summary.warnings).toBeDefined();
    });
  });

  describe('특수 조건 처리', () => {
    it('specialConditions가 사용자 프로필에 반영된다', async () => {
      const response = await POST(
        createMockPostRequest({
          purpose: 'general',
          profile: {
            ...mockUserProfile,
            specialConditions: ['pregnancy', 'senior'],
          },
        })
      );

      expect(response.status).toBe(200);
      expect(generateGeneralFlexibilityPrescription).toHaveBeenCalledWith(
        expect.objectContaining({
          specialConditions: ['pregnancy', 'senior'],
        }),
        expect.any(Number)
      );
    });

    it('contraindications가 사용자 프로필에 반영된다', async () => {
      const response = await POST(
        createMockPostRequest({
          purpose: 'general',
          profile: {
            ...mockUserProfile,
            contraindications: ['cervical_disc_herniation'],
          },
        })
      );

      expect(response.status).toBe(200);
      expect(generateGeneralFlexibilityPrescription).toHaveBeenCalledWith(
        expect.objectContaining({
          contraindications: ['cervical_disc_herniation'],
        }),
        expect.any(Number)
      );
    });
  });

  describe('장비 옵션', () => {
    it('availableEquipment가 사용자 프로필에 반영된다', async () => {
      const response = await POST(
        createMockPostRequest({
          purpose: 'general',
          profile: {
            ...mockUserProfile,
            availableEquipment: ['bodyweight', 'foam_roller', 'yoga_block'],
          },
        })
      );

      expect(response.status).toBe(200);
      expect(generateGeneralFlexibilityPrescription).toHaveBeenCalledWith(
        expect.objectContaining({
          availableEquipment: ['bodyweight', 'foam_roller', 'yoga_block'],
        }),
        expect.any(Number)
      );
    });
  });
});
