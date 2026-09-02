import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/security/rate-limit';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { MakeupAnalysisResult } from '@/lib/mock/makeup-analysis';
import { generateMockMakeupAnalysisResult, type MakeupConcernId } from '@/lib/analysis/makeup';
import { analyzeMakeup } from '@/lib/gemini';
import { isGeminiAvailable } from '@/lib/gemini/client';
import { addXp, type BadgeAwardResult } from '@/lib/gamification';
import {
  createSkinToneNutritionAlert,
  createCollagenBoostAlert,
  type CrossModuleAlertData,
} from '@/lib/alerts';
import {
  unauthorizedError,
  validationError,
  internalError,
  dbError,
} from '@/lib/api/error-response';
import { requireAgeVerified } from '@/lib/api/age-verification-gate';
import { requireBiometricConsent } from '@/lib/api/biometric-consent';
import { checkConsentAndUploadImages } from '@/lib/api/image-consent';
import { buildFallbackSeed } from '@/lib/utils/seeded-random';
import { getLatestPersonalColorResult } from '@/lib/analysis/cross-module';
import { FOUNDATION_RECOMMENDATIONS, type SeasonType } from '@/lib/mock/personal-color';
import {
  createAnalysisImageFingerprint,
  createVerdictCacheEntry,
  findCachedVerdictForUser,
  syncCachedVerdictImagesForUser,
} from '@/lib/analysis/verdict-cache';

// Gemini 응답에서 유효한 값만 필터링하기 위한 Zod 스키마
const makeupConcernSchema = z.enum([
  'dark-circles',
  'redness',
  'uneven-tone',
  'large-pores',
  'oily-tzone',
  'dry-patches',
  'acne-scars',
  'fine-lines',
]);

const makeupStyleSchema = z.enum(['natural', 'glam', 'cute', 'chic', 'vintage', 'edgy']);

const colorCategorySchema = z.enum(['foundation', 'lip', 'eyeshadow', 'blush', 'contour']);

const makeupAnalysisRequestSchema = z.object({
  imageBase64: z.string().min(1),
  useMock: z.boolean().optional().default(false),
  imageStorageAllowed: z.boolean().optional(),
});

// Gemini 응답 문자열 배열에서 유효한 값만 필터링
function filterValidConcerns(concerns: string[]): MakeupConcernId[] {
  return concerns.filter((c): c is MakeupConcernId => makeupConcernSchema.safeParse(c).success);
}

function filterValidStyles(styles: string[]): MakeupAnalysisResult['recommendedStyles'] {
  return styles.filter(
    (s): s is MakeupAnalysisResult['recommendedStyles'][number] =>
      makeupStyleSchema.safeParse(s).success
  );
}

function parseColorCategory(
  category: string
): MakeupAnalysisResult['colorRecommendations'][0]['category'] | null {
  const result = colorCategorySchema.safeParse(category);
  return result.success ? result.data : null;
}

// XP 보상 상수
const XP_ANALYSIS_COMPLETE = 15;

// 환경변수: Mock 모드 강제 여부 (개발/테스트용)
const FORCE_MOCK = process.env.FORCE_MOCK_AI === 'true';

const PERSONAL_COLOR_SEASONS = new Set<SeasonType>(['spring', 'summer', 'autumn', 'winter']);

function normalizePersonalColorSeason(value: unknown): SeasonType | null {
  if (typeof value !== 'string') return null;
  const normalized = value.toLowerCase() as SeasonType;
  return PERSONAL_COLOR_SEASONS.has(normalized) ? normalized : null;
}

/** PC 조회 실패는 메이크업 분석을 막지 않는다. 값이 있을 때만 기존 처방을 연결한다. */
async function loadStoredPersonalColorSeason(userId: string): Promise<SeasonType | null> {
  try {
    const supabase = createServiceRoleClient();
    const personalColor = await getLatestPersonalColorResult(supabase, userId);
    // 왜: 예시 PC 결과를 실진단 입력처럼 재사용하면 메이크업 처방까지 사실로 오인된다.
    // 구행(undefined)은 호환상 허용하되 명시적 폴백 표식만 fail-closed로 제외한다.
    if (
      personalColor?.image_analysis?.usedMock === true ||
      personalColor?.image_analysis?.usedFallback === true
    ) {
      return null;
    }
    return normalizePersonalColorSeason(personalColor?.season);
  } catch (error) {
    console.error('[M-1] Stored personal color lookup failed (non-blocking):', error);
    return null;
  }
}

/**
 * M-1 메이크업 분석 API
 *
 * POST /api/analyze/makeup
 * Body: {
 *   imageBase64: string,    // 얼굴 이미지 (필수)
 *   useMock?: boolean       // Mock 모드 강제 (선택)
 * }
 */
// Gemini 3.5-flash 상세 분석 15~19초 — Hobby 함수 기본 10초 제한 초과 방지 (2026-07-07)
export const maxDuration = 60;

// eslint-disable-next-line sonarjs/cognitive-complexity -- API route handler
export async function POST(req: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedError();
    }

    // Rate Limit 체크
    const rateLimitResult = applyRateLimit(req, userId);
    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }

    const parsed = makeupAnalysisRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return validationError('이미지가 필요합니다.');
    }
    const { imageBase64, useMock, imageStorageAllowed } = parsed.data;

    // 연령 확인 게이트 (fail-closed) — 생체분석 전 만 14세 이상 서버 강제
    const ageDenied = await requireAgeVerified(userId);
    if (ageDenied) return ageDenied;

    // 생체정보 수집·이용 동의 게이트 (fail-closed) — BIPA/PIPA 제23조, 미동의 시 403
    const bioDenied = await requireBiometricConsent(userId);
    if (bioDenied) return bioDenied;

    const personalColorSeason = await loadStoredPersonalColorSeason(userId);
    const verdictFingerprint = createAnalysisImageFingerprint(
      userId,
      'makeup',
      [['front', imageBase64]],
      { personalColorSeason }
    );
    if (!FORCE_MOCK && !useMock) {
      const cached = await findCachedVerdictForUser(userId, 'makeup', verdictFingerprint);
      if (cached) {
        const cachedData = await syncCachedVerdictImagesForUser({
          userId,
          axis: 'makeup',
          cachedData: cached.data,
          bucketName: 'makeup-images',
          images: { makeup: imageBase64 },
          imageStorageAllowed,
        });
        return NextResponse.json({
          ...cached.payload,
          success: true,
          data: cachedData,
          cacheHit: true,
        });
      }
    }

    const fallbackSeed = buildFallbackSeed(userId, 'makeup', imageBase64);
    const generateFallback = () =>
      generateMockMakeupAnalysisResult({
        seed: fallbackSeed,
        ...(personalColorSeason ? { personalColorSeason } : {}),
      });

    // AI 분석 실행
    let result: MakeupAnalysisResult;
    let usedMock = false;

    if (FORCE_MOCK || useMock || !isGeminiAvailable()) {
      // Mock 모드
      result = generateFallback();
      usedMock = true;
    } else {
      // Gemini AI 분석 실행
      try {
        const geminiResult = await analyzeMakeup({
          imageBase64,
          personalColorSeason: personalColorSeason ?? undefined,
        });
        // Gemini 결과를 MakeupAnalysisResult 형식으로 변환 (Zod 검증)
        const validConcerns = filterValidConcerns(geminiResult.concerns);
        const validStyles = filterValidStyles(geminiResult.recommendedStyles);
        const validColorRecs = geminiResult.colorRecommendations
          .map((cr) => {
            const category = parseColorCategory(cr.category);
            if (!category) return null;
            return {
              category,
              categoryLabel: cr.categoryLabel,
              colors: cr.colors,
            };
          })
          .filter((cr): cr is NonNullable<typeof cr> => cr !== null);

        result = {
          undertone: geminiResult.undertone,
          undertoneLabel: geminiResult.undertoneLabel,
          eyeShape: geminiResult.eyeShape,
          eyeShapeLabel: geminiResult.eyeShapeLabel,
          lipShape: geminiResult.lipShape,
          lipShapeLabel: geminiResult.lipShapeLabel,
          faceShape: geminiResult.faceShape,
          faceShapeLabel: geminiResult.faceShapeLabel,
          overallScore: geminiResult.overallScore,
          metrics: geminiResult.metrics,
          concerns: validConcerns,
          insight: geminiResult.insight,
          recommendedStyles: validStyles,
          colorRecommendations: validColorRecs,
          makeupTips: geminiResult.makeupTips,
          personalColorConnection: geminiResult.personalColorConnection,
          analyzedAt: new Date(),
          analysisReliability: geminiResult.analysisReliability,
        };
      } catch (aiError) {
        console.error('[M-1] Gemini error, falling back to mock:', aiError);
        result = generateFallback();
        usedMock = true;
      }
    }

    // PC 결과 화면이 쓰는 기존 처방 정본을 그대로 연결한다. 저장 진단이 없으면 지어내지 않는다.
    if (personalColorSeason) {
      result.foundationRecommendations = FOUNDATION_RECOMMENDATIONS[personalColorSeason];
      if (result.personalColorConnection) {
        result.personalColorConnection = {
          ...result.personalColorConnection,
          season: personalColorSeason,
        };
      }
    }

    const analyzedAt = new Date().toISOString();
    const responseResult = { ...result, analyzedAt };

    // DB 저장 및 후처리 (Mock 모드에서 DB 실패 시 합성 응답 반환)
    try {
      const supabase = createServiceRoleClient();

      // 분석 처리는 필수 생체동의로 허용하되, 원본 보존은 별도 이미지 저장 동의가 있을 때만 한다.
      // 동의 조회 실패도 hasConsent=false로 닫혀 이미지가 서버에 남지 않는다.
      const { uploadedImages } = await checkConsentAndUploadImages(
        supabase,
        userId,
        'makeup',
        'makeup-images',
        { makeup: imageBase64 },
        { imageStorageAllowed }
      );
      const imageUrl = uploadedImages.makeup ?? null;

      // metrics에서 각 지표 추출
      const getMetricValue = (id: string) => {
        const metric = result.metrics.find((m) => m.id === id);
        return metric?.value ?? null;
      };

      // DB에 저장
      const { data, error } = await supabase
        .from('makeup_analyses')
        .insert({
          clerk_user_id: userId,
          image_url: imageUrl || '',
          undertone: result.undertone,
          eye_shape: result.eyeShape,
          lip_shape: result.lipShape,
          face_shape: result.faceShape,
          skin_texture: getMetricValue('skinTexture'),
          skin_tone_uniformity: getMetricValue('skinTone'),
          hydration: getMetricValue('hydration'),
          pore_visibility: getMetricValue('poreVisibility'),
          oil_balance: getMetricValue('oilBalance'),
          overall_score: result.overallScore,
          concerns: result.concerns,
          recommendations: {
            insight: result.insight,
            styles: result.recommendedStyles,
            colors: result.colorRecommendations,
            tips: result.makeupTips,
            personalColorConnection: result.personalColorConnection,
            foundationRecommendations: result.foundationRecommendations,
            analysisReliability: result.analysisReliability,
            usedMock,
            ...(!usedMock
              ? {
                  verdictCache: createVerdictCacheEntry('makeup', verdictFingerprint, {
                    result: responseResult,
                    usedMock: false,
                    gamification: { badgeResults: [], xpAwarded: 0 },
                    alerts: [],
                  }),
                }
              : {}),
          },
          analysis_reliability: result.analysisReliability,
        })
        .select()
        .single();

      if (error) {
        console.error('[M-1] Database insert error:', error);
        // DB 저장 실패해도 분석 결과는 반환 (사용자 경험 우선)
      }

      // 게이미피케이션 연동
      const gamificationResult: {
        badgeResults: BadgeAwardResult[];
        xpAwarded: number;
      } = {
        badgeResults: [],
        xpAwarded: 0,
      };

      try {
        // XP 추가
        await addXp(supabase, userId, XP_ANALYSIS_COMPLETE);
        gamificationResult.xpAwarded = XP_ANALYSIS_COMPLETE;

        // P3: 메이크업 분석 배지 (게이미피케이션 확장 시 활성화)
        // const makeupBadge = await awardAnalysisBadge(supabase, userId, 'makeup');
      } catch (gamificationError) {
        console.error('[M-1] Gamification error:', gamificationError);
      }

      // BeautyProfile 자동 갱신 (비차단)
      try {
        const { updateBeautyProfileField, mapMakeupAnalysis } = await import('@/lib/capsule');
        await updateBeautyProfileField(
          userId,
          'M',
          mapMakeupAnalysis({
            undertone: result.undertone,
            face_shape: result.faceShape,
            eye_shape: result.eyeShape,
            lip_shape: result.lipShape,
            overall_score: result.overallScore,
            recommendations: { styles: result.recommendedStyles },
          })
        );
      } catch (profileError) {
        console.error('[M-1] BeautyProfile update failed (non-blocking):', profileError);
      }

      // 크로스 모듈 알림 생성 (M-1 → N-1)
      const alerts: CrossModuleAlertData[] = [];

      // 언더톤 및 피부 고민 기반 영양 추천 알림
      const undertone = result.undertone;
      const skinConcerns = result.concerns || [];
      if (skinConcerns.length > 0) {
        alerts.push(createSkinToneNutritionAlert(undertone, skinConcerns));
      }

      // 피부 텍스처/탄력 기반 콜라겐 추천 알림
      const skinTextureScore = getMetricValue('skinTexture') ?? 70;
      const hydrationScore = getMetricValue('hydration') ?? 70;
      // 피부 텍스처와 수분 점수의 평균을 탄력 proxy로 사용
      const elasticityProxy = Math.round((skinTextureScore + hydrationScore) / 2);
      if (elasticityProxy < 60) {
        alerts.push(createCollagenBoostAlert(elasticityProxy));
      }

      return NextResponse.json({
        success: true,
        data: data,
        result: responseResult,
        usedMock,
        gamification: gamificationResult,
        alerts, // 크로스 모듈 알림
      });
    } catch (dbOperationError) {
      // DB 실패 시 합성 응답 반환 (AI 분석 결과는 보존)
      console.warn('[M-1] DB operations failed, using synthetic response');
      console.error('[M-1] DB error details:', {
        error:
          dbOperationError instanceof Error ? dbOperationError.message : String(dbOperationError),
      });
      const syntheticId = crypto.randomUUID();
      return NextResponse.json({
        success: true,
        data: {
          id: syntheticId,
          clerk_user_id: userId,
          created_at: analyzedAt,
        },
        result: responseResult,
        usedMock,
        gamification: { badgeResults: [], xpAwarded: 0 },
        alerts: [],
        dbSaveFailed: true,
      });
    }
  } catch (error) {
    console.error('[M-1] Makeup analysis error:', error);
    return internalError('메이크업 분석 중 오류가 발생했습니다.');
  }
}

/**
 * 최근 M-1 분석 결과 목록 조회 API
 *
 * GET /api/analyze/makeup
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedError();
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('makeup_analyses')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[M-1] Database query error:', error);
      return dbError('분석 목록을 불러올 수 없습니다.');
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('[M-1] Get makeup analyses error:', error);
    return internalError();
  }
}
