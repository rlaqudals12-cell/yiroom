/**
 * W-2 스트레칭 처방 API
 *
 * @route POST /api/workout/stretching
 * @description 자세 분석 또는 스포츠 기반 스트레칭 루틴 생성
 * @see docs/specs/SDD-W-2-ADVANCED-STRETCHING.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

import {
  generatePostureCorrectionPrescription,
  generateSportStretchingPrescription,
  generateGeneralFlexibilityPrescription,
  generateWeeklyStretchingPlan,
} from '@/lib/workout/stretching';
import { logAnalysisCreate } from '@/lib/audit/logger';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/security/rate-limit';
import type {
  StretchingPrescription,
  WeeklyStretchingPlan,
  StretchingUserProfile,
  PostureAnalysisResult,
  SportType,
  Difficulty,
  Equipment,
  SpecialCondition,
} from '@/types/stretching';

// 요청 스키마
const userProfileSchema = z.object({
  age: z.number().int().min(10).max(100),
  gender: z.enum(['male', 'female']),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  stretchingExperience: z.enum(['none', 'some', 'regular']),
  primarySports: z.array(z.enum(['hiking', 'running', 'golf', 'cycling', 'swimming', 'tennis'])).optional(),
  sportsFrequency: z.enum(['daily', 'weekly', 'monthly', 'rarely']).optional(),
  contraindications: z.array(z.string()).optional(),
  specialConditions: z.array(z.enum([
    'pregnancy', 'senior', 'osteoporosis', 'disc_herniation',
    'spinal_stenosis', 'rheumatoid', 'hypermobility', 'recent_surgery'
  ])).optional(),
  availableEquipment: z.array(z.enum([
    'bodyweight', 'wall', 'chair', 'mat', 'foam_roller',
    'resistance_band', 'yoga_block', 'trekking_pole', 'golf_club'
  ])).optional(),
  preferredSessionDuration: z.number().int().min(5).max(60).optional(),
});

const postureAnalysisSchema = z.object({
  assessmentId: z.string(),
  createdAt: z.string(),
  angles: z.object({
    cva: z.number(),
    shoulderTilt: z.number(),
    thoracicKyphosis: z.number(),
    lumbarLordosis: z.number(),
    pelvicTilt: z.number(),
  }),
  overallScore: z.number(),
  category: z.enum(['excellent', 'good', 'moderate', 'poor']),
  imbalances: z.array(z.object({
    type: z.string(),
    severity: z.enum(['mild', 'moderate', 'severe']),
    affectedAngles: z.array(z.string()),
    description: z.string(),
  })),
  tightMuscles: z.array(z.string()),
  weakMuscles: z.array(z.string()),
}).optional();

const requestSchema = z.object({
  purpose: z.enum(['posture_correction', 'warmup', 'cooldown', 'general']),
  profile: userProfileSchema,
  postureAnalysis: postureAnalysisSchema.optional(),
  sport: z.enum(['hiking', 'running', 'golf', 'cycling', 'swimming', 'tennis']).optional(),
  availableMinutes: z.number().int().min(5).max(60).optional(),
  includeWeeklyPlan: z.boolean().optional(),
});

// 응답 타입
interface StretchingResponse {
  success: boolean;
  data?: {
    prescription: StretchingPrescription;
    weeklyPlan?: WeeklyStretchingPlan;
    summary: {
      totalExercises: number;
      totalDuration: number;
      targetMuscles: string[];
      warnings: string[];
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * POST /api/workout/stretching
 *
 * 스트레칭 처방 생성
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<StretchingResponse>> {
  const startTime = Date.now();

  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: '로그인이 필요합니다.',
          },
        },
        { status: 401 }
      );
    }

    // 2. Rate Limiting
    const rateCheck = checkRateLimit(userId, 'workout');
    if (!rateCheck.success) {
      const headers = getRateLimitHeaders(
        rateCheck.remaining,
        rateCheck.resetTime,
        rateCheck.dailyRemaining ?? 0
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_ERROR',
            message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          },
        },
        { status: 429, headers }
      );
    }

    // 3. 요청 검증
    const body = await request.json();
    const validated = requestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력 정보를 확인해주세요.',
          },
        },
        { status: 400 }
      );
    }

    const { purpose, profile, postureAnalysis, sport, availableMinutes, includeWeeklyPlan } = validated.data;

    // 4. 사용자 프로필 구성
    const userProfile: StretchingUserProfile = {
      userId,
      age: profile.age,
      gender: profile.gender,
      fitnessLevel: profile.fitnessLevel as Difficulty,
      stretchingExperience: profile.stretchingExperience,
      primarySports: (profile.primarySports || []) as SportType[],
      sportsFrequency: profile.sportsFrequency || 'rarely',
      contraindications: profile.contraindications || [],
      specialConditions: (profile.specialConditions || []) as SpecialCondition[],
      availableEquipment: (profile.availableEquipment || ['bodyweight', 'wall', 'chair', 'mat']) as Equipment[],
      preferredSessionDuration: profile.preferredSessionDuration || 15,
      preferredLanguage: 'ko',
    };

    // 5. 처방 생성
    let prescription: StretchingPrescription;

    switch (purpose) {
      case 'posture_correction':
        if (!postureAnalysis) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: '자세교정 처방에는 자세분석 결과가 필요합니다.',
              },
            },
            { status: 400 }
          );
        }
        prescription = generatePostureCorrectionPrescription(
          postureAnalysis as PostureAnalysisResult,
          userProfile,
          availableMinutes || 15
        );
        break;

      case 'warmup':
      case 'cooldown':
        if (!sport) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: '워밍업/쿨다운 처방에는 스포츠 종목이 필요합니다.',
              },
            },
            { status: 400 }
          );
        }
        prescription = generateSportStretchingPrescription(
          sport,
          purpose,
          userProfile,
          availableMinutes || 10
        );
        break;

      case 'general':
      default:
        prescription = generateGeneralFlexibilityPrescription(
          userProfile,
          availableMinutes || 15
        );
        break;
    }

    // 6. 주간 플랜 생성 (요청 시)
    let weeklyPlan: WeeklyStretchingPlan | undefined;
    if (includeWeeklyPlan) {
      weeklyPlan = generateWeeklyStretchingPlan(
        userProfile,
        postureAnalysis as PostureAnalysisResult | undefined,
        sport
      );
    }

    // 7. 요약 정보 생성
    const targetMuscles = new Set<string>();
    prescription.stretches.forEach(s => {
      s.exercise.targetMuscles.forEach(m => targetMuscles.add(m));
    });

    const summary = {
      totalExercises: prescription.stretches.length,
      totalDuration: prescription.totalDuration,
      targetMuscles: Array.from(targetMuscles),
      warnings: prescription.warnings,
    };

    // 8. 감사 로그
    await logAnalysisCreate(userId, 'stretching_prescription', prescription.prescriptionId);

    // 9. 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        prescription,
        weeklyPlan,
        summary,
      },
    });
  } catch (error) {
    console.error('[API] POST /workout/stretching error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '처방 생성 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    );
  }
}
