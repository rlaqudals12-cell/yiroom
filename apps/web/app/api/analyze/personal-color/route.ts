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
      // 이미지 저장 여부 (동의 시만 true)
      saveImage = false,
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

        // AI 결과에 analysisEvidence/imageQuality가 없으면 기본값 제공
        const isCool = aiResult.tone === 'cool';
        const reliability = determineReliability(hasMultiAngle, !!wristImageBase64);

        if (!aiResult.analysisEvidence) {
          console.log('[PC-1] Adding default analysisEvidence');
          aiResult.analysisEvidence = {
            veinColor: isCool ? 'blue' : 'green',
            veinScore: isCool ? 70 : 30,
            skinUndertone: isCool ? 'pink' : 'yellow',
            skinHairContrast: 'medium',
            eyeColor: 'brown',
            lipNaturalColor: isCool ? 'pink' : 'coral',
          };
        }

        if (!aiResult.imageQuality) {
          console.log('[PC-1] Adding default imageQuality');
          aiResult.imageQuality = {
            lightingCondition: 'mixed',
            makeupDetected: false,
            wristImageProvided: !!wristImageBase64,
            analysisReliability: reliability,
          };
        }

        // 서버 측 일관성 검증: veinColor와 tone 일치 확인
        // 혈관색이 blue/purple이면 반드시 cool 톤이어야 함
        const veinColor = aiResult.analysisEvidence?.veinColor;
        const skinUndertone = aiResult.analysisEvidence?.skinUndertone;
        const originalTone = aiResult.tone;
        const originalSeason = aiResult.seasonType;

        // 혈관색 기반 검증
        if (veinColor) {
          const isCoolVein = ['blue', 'purple', 'blue_purple'].includes(veinColor.toLowerCase());
          const isWarmVein = ['green', 'olive', 'green_olive'].includes(veinColor.toLowerCase());
          const isUncertainVein = ['mixed', 'unknown'].includes(veinColor.toLowerCase());

          // 혈관색과 톤 불일치 시 수정
          if (isCoolVein && aiResult.tone !== 'cool') {
            console.log(
              `[PC-1] Consistency fix: veinColor=${veinColor} but tone=${aiResult.tone}, correcting to cool`
            );
            aiResult.tone = 'cool';
          } else if (isWarmVein && aiResult.tone !== 'warm') {
            console.log(
              `[PC-1] Consistency fix: veinColor=${veinColor} but tone=${aiResult.tone}, correcting to warm`
            );
            aiResult.tone = 'warm';
          } else if (isUncertainVein) {
            // 혈관색이 불확실한 경우: skinUndertone으로 2차 검증
            // 명확한 모순이 있는 경우에만 신뢰도 낮춤 (불명확한 경우는 AI 판정 신뢰)
            const isCoolSkin = skinUndertone === 'pink' || skinUndertone === 'neutral';
            const isWarmSkin = skinUndertone === 'yellow' || skinUndertone === 'olive';

            if (isCoolSkin && aiResult.tone === 'warm') {
              // 피부 언더톤과 판정 결과가 명확히 불일치 → 신뢰도 약간 낮춤
              console.log(
                `[PC-1] Uncertain vein: skinUndertone=${skinUndertone} suggests cool but tone=${aiResult.tone}`
              );
              aiResult.confidence = Math.min(aiResult.confidence || 85, 75);
            } else if (isWarmSkin && aiResult.tone === 'cool') {
              // 피부 언더톤과 판정 결과가 명확히 불일치 → 신뢰도 약간 낮춤
              console.log(
                `[PC-1] Uncertain vein: skinUndertone=${skinUndertone} suggests warm but tone=${aiResult.tone}`
              );
              aiResult.confidence = Math.min(aiResult.confidence || 85, 75);
            }
            // 불명확한 경우는 AI 판정을 신뢰 (신뢰도 유지)
          }
        }
        // veinColor가 없어도 신뢰도는 유지 (AI 판정 신뢰)
        // 명확한 모순이 없으면 AI의 원래 confidence 값 사용

        // Cool 톤일 때 Summer vs Winter 결정
        // Winter는 피부-머리카락 대비가 매우 높아야 함 (very_high)
        // 그 외 cool 톤은 Summer로 분류 (더 일반적)
        if (aiResult.tone === 'cool') {
          const contrast = aiResult.analysisEvidence?.skinHairContrast;
          const isVeryHighContrast = contrast === 'very_high';

          if (aiResult.seasonType === 'winter' && !isVeryHighContrast) {
            // Winter인데 대비가 높지 않으면 Summer로 수정
            console.log(
              `[PC-1] Season correction: winter but contrast=${contrast}, changing to summer`
            );
            aiResult.seasonType = 'summer';
            aiResult.seasonLabel = '여름 쿨톤';
            aiResult.seasonDescription = '차갑고 부드러운 색상이 잘 어울리는 여름 쿨톤입니다.';
            aiResult.depth = 'light';
          } else if (aiResult.seasonType === 'autumn') {
            // Autumn인데 cool 톤이면 Summer로 수정 (Autumn은 항상 warm)
            console.log('[PC-1] Season correction: autumn with cool tone, changing to summer');
            aiResult.seasonType = 'summer';
            aiResult.seasonLabel = '여름 쿨톤';
            aiResult.seasonDescription = '차갑고 부드러운 색상이 잘 어울리는 여름 쿨톤입니다.';
            aiResult.depth = 'light';
          } else if (aiResult.seasonType === 'spring') {
            // Spring인데 cool 톤이면 Summer로 수정 (Spring은 항상 warm)
            console.log('[PC-1] Season correction: spring with cool tone, changing to summer');
            aiResult.seasonType = 'summer';
            aiResult.seasonLabel = '여름 쿨톤';
            aiResult.seasonDescription = '차갑고 부드러운 색상이 잘 어울리는 여름 쿨톤입니다.';
            aiResult.depth = 'light';
          }
        }

        // Warm 톤일 때 Spring vs Autumn 결정
        if (aiResult.tone === 'warm') {
          if (aiResult.seasonType === 'summer' || aiResult.seasonType === 'winter') {
            // Summer/Winter인데 warm 톤이면 수정
            const depth = aiResult.depth || 'light';
            const newSeason = depth === 'deep' ? 'autumn' : 'spring';
            console.log(
              `[PC-1] Season correction: ${aiResult.seasonType} with warm tone, changing to ${newSeason}`
            );
            if (newSeason === 'autumn') {
              aiResult.seasonType = 'autumn';
              aiResult.seasonLabel = '가을 웜톤';
              aiResult.seasonDescription = '따뜻하고 깊은 색상이 잘 어울리는 가을 웜톤입니다.';
              aiResult.depth = 'deep';
            } else {
              aiResult.seasonType = 'spring';
              aiResult.seasonLabel = '봄 웜톤';
              aiResult.seasonDescription = '밝고 따뜻한 색상이 잘 어울리는 봄 웜톤입니다.';
              aiResult.depth = 'light';
            }
          }
        }

        // 수정이 있었으면 로그
        if (originalTone !== aiResult.tone || originalSeason !== aiResult.seasonType) {
          console.log(
            `[PC-1] Result corrected: ${originalSeason} ${originalTone} → ${aiResult.seasonType} ${aiResult.tone}`
          );
        }
      } catch (aiError) {
        // 신뢰성 문제로 랜덤 Mock Fallback 금지 - 에러를 사용자에게 전달
        console.error('[PC-1] Gemini error:', aiError);
        const errorMessage = aiError instanceof Error ? aiError.message : 'AI 분석에 실패했습니다.';
        return NextResponse.json(
          {
            error: 'AI 분석 실패',
            message: errorMessage,
            retryable: true,
          },
          { status: 503 }
        );
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

    // 이미지 업로드 (사용자 동의 시에만 저장 - GDPR/PIPA 준수)
    const primaryImage = frontImageBase64 || imageBase64;
    let faceImageUrl: string | null = null;
    let leftImageUrl: string | null = null;
    let rightImageUrl: string | null = null;

    if (primaryImage && saveImage) {
      console.log('[PC-1] User consented to image storage, uploading...');
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
    } else if (primaryImage && !saveImage) {
      console.log('[PC-1] User did not consent to image storage, skipping upload');
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
