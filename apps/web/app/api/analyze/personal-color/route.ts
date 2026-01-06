import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  analyzePersonalColor,
  type GeminiPersonalColorResult,
  type PersonalColorMultiAngleInput,
} from '@/lib/gemini';
import {
  generateMockPersonalColorResult,
  STYLE_DESCRIPTIONS,
  type SeasonType,
} from '@/lib/mock/personal-color';
import {
  awardAnalysisBadge,
  checkAndAwardAllAnalysisBadge,
  addXp,
  type BadgeAwardResult,
} from '@/lib/gamification';

// XP 보상 상수
const XP_ANALYSIS_COMPLETE = 10;

// 환경변수: Mock 모드 강제 여부 (개발/테스트용)
const FORCE_MOCK = process.env.FORCE_MOCK_AI === 'true';

/**
 * PC-1 퍼스널 컬러 분석 API (Real AI + Mock Fallback)
 *
 * POST /api/analyze/personal-color
 * Body: {
 *   // 기존 (하위 호환)
 *   imageBase64?: string,                   // 얼굴 이미지 (단일)
 *   wristImageBase64?: string,              // 손목 이미지 (선택)
 *
 *   // 다각도 지원 (신규)
 *   frontImageBase64?: string,              // 정면 이미지 (필수 when 다각도)
 *   leftImageBase64?: string,               // 좌측 이미지 (선택)
 *   rightImageBase64?: string,              // 우측 이미지 (선택)
 *
 *   useMock?: boolean                       // Mock 모드 강제 (선택)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   data: PersonalColorAssessment,   // DB 저장된 데이터
 *   result: PersonalColorResult,     // AI 분석 결과
 *   usedMock: boolean,               // Mock 사용 여부
 *   analysisReliability: string      // 분석 신뢰도 (high/medium/low)
 * }
 */
export async function POST(req: Request) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      // 하위 호환
      imageBase64,
      wristImageBase64,
      // 다각도 지원
      frontImageBase64,
      leftImageBase64,
      rightImageBase64,
      useMock = false,
    } = body;

    // 이미지 입력 검증: 다각도 또는 단일 이미지 필요
    const hasFrontImage = !!frontImageBase64;
    const hasLegacyImage = !!imageBase64;

    if (!hasFrontImage && !hasLegacyImage) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // 분석용 이미지 입력 구성
    const analysisInput: PersonalColorMultiAngleInput = {
      frontImageBase64: frontImageBase64 || imageBase64,
      leftImageBase64,
      rightImageBase64,
      wristImageBase64,
    };

    // 다각도 분석 여부 (신뢰도 결정에 사용)
    const hasMultiAngle = !!(leftImageBase64 || rightImageBase64);
    const imagesCount = 1 + (leftImageBase64 ? 1 : 0) + (rightImageBase64 ? 1 : 0);

    // 다각도 분석 시 신뢰도 결정
    const determineReliability = (
      hasMulti: boolean,
      hasWrist: boolean
    ): 'high' | 'medium' | 'low' => {
      if (hasMulti && hasWrist) return 'high';
      if (hasMulti || hasWrist) return 'high';
      return 'medium';
    };

    // AI 분석 실행 (Real AI 또는 Mock)
    let aiResult: GeminiPersonalColorResult;
    let usedMock = false;

    if (FORCE_MOCK || useMock) {
      // Mock 모드
      const mockResult = generateMockPersonalColorResult();
      const isCool = mockResult.tone === 'cool';
      const reliability = determineReliability(hasMultiAngle, !!wristImageBase64);
      aiResult = {
        seasonType: mockResult.seasonType,
        seasonLabel: mockResult.seasonLabel,
        seasonDescription: mockResult.seasonDescription,
        tone: mockResult.tone,
        depth: mockResult.depth,
        confidence: mockResult.confidence,
        bestColors: mockResult.bestColors,
        worstColors: mockResult.worstColors,
        lipstickRecommendations: mockResult.lipstickRecommendations,
        clothingRecommendations: mockResult.clothingRecommendations,
        styleDescription: mockResult.styleDescription,
        insight: mockResult.insight,
        // 분석 근거 데이터 (Mock)
        analysisEvidence: {
          veinColor: isCool ? 'blue' : 'green',
          veinScore: isCool ? 75 : 25,
          skinUndertone: isCool ? 'pink' : 'yellow',
          skinHairContrast: 'medium',
          eyeColor: 'brown',
          lipNaturalColor: isCool ? 'pink' : 'coral',
        },
        imageQuality: {
          lightingCondition: 'natural',
          makeupDetected: false,
          wristImageProvided: !!wristImageBase64,
          analysisReliability: reliability,
        },
      };
      usedMock = true;
      console.log(
        `[PC-1] Using mock analysis (${imagesCount} image(s), reliability: ${reliability})`
      );
    } else {
      // Real AI 분석
      try {
        console.log(`[PC-1] Starting Gemini analysis with ${imagesCount} image(s)...`);
        console.log('[PC-1] Multi-angle:', hasMultiAngle, '/ Wrist:', !!wristImageBase64);
        aiResult = await analyzePersonalColor(analysisInput);
        console.log('[PC-1] Gemini analysis completed');
      } catch (aiError) {
        // AI 실패 시 Mock으로 폴백
        console.error('[PC-1] Gemini error, falling back to mock:', aiError);
        const mockResult = generateMockPersonalColorResult();
        const isCool = mockResult.tone === 'cool';
        const reliability = determineReliability(hasMultiAngle, !!wristImageBase64);
        aiResult = {
          seasonType: mockResult.seasonType,
          seasonLabel: mockResult.seasonLabel,
          seasonDescription: mockResult.seasonDescription,
          tone: mockResult.tone,
          depth: mockResult.depth,
          confidence: mockResult.confidence,
          bestColors: mockResult.bestColors,
          worstColors: mockResult.worstColors,
          lipstickRecommendations: mockResult.lipstickRecommendations,
          clothingRecommendations: mockResult.clothingRecommendations,
          styleDescription: mockResult.styleDescription,
          insight: mockResult.insight,
          // 분석 근거 데이터 (Mock)
          analysisEvidence: {
            veinColor: isCool ? 'blue' : 'green',
            veinScore: isCool ? 75 : 25,
            skinUndertone: isCool ? 'pink' : 'yellow',
            skinHairContrast: 'medium',
            eyeColor: 'brown',
            lipNaturalColor: isCool ? 'pink' : 'coral',
          },
          imageQuality: {
            lightingCondition: 'artificial',
            makeupDetected: false,
            wristImageProvided: !!wristImageBase64,
            analysisReliability: reliability,
          },
        };
        usedMock = true;
      }
    }

    // AI 결과에 styleDescription이 없는 경우 기본값 사용
    const result = {
      ...aiResult,
      styleDescription:
        aiResult.styleDescription || STYLE_DESCRIPTIONS[aiResult.seasonType as SeasonType],
    };

    // 분석 신뢰도 결정
    const analysisReliability =
      aiResult.imageQuality?.analysisReliability ||
      determineReliability(hasMultiAngle, !!wristImageBase64);

    const supabase = createServiceRoleClient();

    // 이미지 업로드 (정면 이미지 우선)
    const primaryImage = frontImageBase64 || imageBase64;
    let faceImageUrl: string | null = null;
    let leftImageUrl: string | null = null;
    let rightImageUrl: string | null = null;

    if (primaryImage) {
      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}.jpg`;

      // Base64 데이터 정리
      const base64Data = primaryImage.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('personal-color-images')
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('Image upload error:', uploadError);
        // 이미지 업로드 실패해도 분석 결과는 저장
      } else {
        faceImageUrl = uploadData.path;
      }

      // 좌측 이미지 업로드 (다각도 분석 시)
      if (leftImageBase64) {
        const leftBase64 = leftImageBase64.replace(/^data:image\/\w+;base64,/, '');
        const leftBuffer = Buffer.from(leftBase64, 'base64');
        const { data: leftUpload } = await supabase.storage
          .from('personal-color-images')
          .upload(`${userId}/${timestamp}_left.jpg`, leftBuffer, {
            contentType: 'image/jpeg',
            upsert: false,
          });
        if (leftUpload) leftImageUrl = leftUpload.path;
      }

      // 우측 이미지 업로드 (다각도 분석 시)
      if (rightImageBase64) {
        const rightBase64 = rightImageBase64.replace(/^data:image\/\w+;base64,/, '');
        const rightBuffer = Buffer.from(rightBase64, 'base64');
        const { data: rightUpload } = await supabase.storage
          .from('personal-color-images')
          .upload(`${userId}/${timestamp}_right.jpg`, rightBuffer, {
            contentType: 'image/jpeg',
            upsert: false,
          });
        if (rightUpload) rightImageUrl = rightUpload.path;
      }
    }

    // 계절 타입 변환 (소문자 → DB 형식)
    const seasonMap: Record<string, string> = {
      spring: 'Spring',
      summer: 'Summer',
      autumn: 'Autumn',
      winter: 'Winter',
    };
    const season = seasonMap[result.seasonType] || result.seasonType;

    // 언더톤 변환
    const undertoneMap: Record<string, string> = {
      warm: 'Warm',
      cool: 'Cool',
    };
    const undertone = undertoneMap[result.tone] || 'Neutral';

    // DB에 저장
    const { data, error } = await supabase
      .from('personal_color_assessments')
      .insert({
        clerk_user_id: userId,
        questionnaire_answers: {}, // 문진 응답 (현재 미사용)
        face_image_url: faceImageUrl,
        left_image_url: leftImageUrl,
        right_image_url: rightImageUrl,
        images_count: imagesCount,
        analysis_reliability: analysisReliability,
        season: season,
        undertone: undertone,
        confidence: result.confidence,
        season_scores: {
          spring: result.seasonType === 'spring' ? result.confidence : 0,
          summer: result.seasonType === 'summer' ? result.confidence : 0,
          autumn: result.seasonType === 'autumn' ? result.confidence : 0,
          winter: result.seasonType === 'winter' ? result.confidence : 0,
        },
        // AI 분석 원본 데이터 저장
        image_analysis: {
          seasonType: result.seasonType,
          tone: result.tone,
          depth: result.depth,
          insight: result.insight,
          styleDescription: result.styleDescription, // 연예인 매칭 대체
          // 분석 근거 및 이미지 품질 정보 (신뢰성 리포트용)
          analysisEvidence: aiResult.analysisEvidence || null,
          imageQuality: aiResult.imageQuality || null,
          // 다각도 분석 메타데이터
          multiAngle: hasMultiAngle
            ? {
                imagesCount,
                leftProvided: !!leftImageBase64,
                rightProvided: !!rightImageBase64,
              }
            : null,
        },
        best_colors: result.bestColors,
        worst_colors: result.worstColors,
        makeup_recommendations: {
          lipstick: result.lipstickRecommendations,
          insight: result.insight,
          styleDescription: result.styleDescription,
        },
        fashion_recommendations: {
          clothing: result.clothingRecommendations,
          styleDescription: result.styleDescription,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save analysis', details: error.message },
        { status: 500 }
      );
    }

    // users 테이블에 PC-1 결과 동기화 (비정규화 - 빠른 조회용)
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        latest_pc_assessment_id: data.id,
        personal_color_season: season,
        personal_color_undertone: undertone,
        face_image_url: faceImageUrl,
      })
      .eq('clerk_user_id', userId);

    if (userUpdateError) {
      // 동기화 실패해도 분석 결과는 이미 저장되었으므로 경고만 출력
      console.warn('[PC-1] Failed to sync to users table:', userUpdateError);
    } else {
      console.log('[PC-1] Synced PC result to users table');
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
      // XP 추가 (분석 완료 시 10 XP)
      await addXp(supabase, userId, XP_ANALYSIS_COMPLETE);
      gamificationResult.xpAwarded = XP_ANALYSIS_COMPLETE;

      // 퍼스널 컬러 분석 완료 배지
      const pcBadge = await awardAnalysisBadge(supabase, userId, 'personal-color');
      if (pcBadge) {
        gamificationResult.badgeResults.push(pcBadge);
      }

      // 모든 분석 완료 여부 체크
      const allBadge = await checkAndAwardAllAnalysisBadge(supabase, userId);
      if (allBadge) {
        gamificationResult.badgeResults.push(allBadge);
      }
    } catch (gamificationError) {
      console.error('[PC-1] Gamification error:', gamificationError);
    }

    return NextResponse.json({
      success: true,
      data: data,
      result: {
        ...result,
        analyzedAt: new Date().toISOString(),
      },
      usedMock,
      analysisReliability,
      imagesCount,
      gamification: gamificationResult,
    });
  } catch (error) {
    console.error('Personal color analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * 최근 PC-1 분석 결과 조회 API
 *
 * GET /api/analyze/personal-color
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('personal_color_assessments')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Database query error:', error);
      return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || null,
      hasResult: !!data,
    });
  } catch (error) {
    console.error('Get personal color error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
