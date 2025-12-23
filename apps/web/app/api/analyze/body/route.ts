import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { analyzeBody, type GeminiBodyAnalysisResult } from "@/lib/gemini";
import {
  generateMockBodyAnalysis,
  BODY_TYPES,
  type BodyType,
} from "@/lib/mock/body-analysis";
import {
  generateColorRecommendations,
  getColorTipsForBodyType,
} from "@/lib/color-recommendations";
import {
  awardAnalysisBadge,
  checkAndAwardAllAnalysisBadge,
  addXp,
  type BadgeAwardResult,
} from "@/lib/gamification";

// XP 보상 상수
const XP_ANALYSIS_COMPLETE = 10;

// 환경변수: Mock 모드 강제 여부 (개발/테스트용)
const FORCE_MOCK = process.env.FORCE_MOCK_AI === "true";

/**
 * C-1 체형 분석 API (Real AI + Mock Fallback)
 *
 * POST /api/analyze/body
 * Body: {
 *   imageBase64: string,         // 체형 이미지 (필수)
 *   userInput?: UserBodyInput,   // 사용자 입력 (키, 체중)
 *   useMock?: boolean            // Mock 모드 강제 (선택)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   data: BodyAnalysis,          // DB 저장된 데이터
 *   result: BodyAnalysisResult,  // AI 분석 결과
 *   personalColorSeason: string | null,
 *   usedMock: boolean            // Mock 사용 여부
 * }
 */
export async function POST(req: Request) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { imageBase64, userInput, useMock = false } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    // AI 분석 실행 (Real AI 또는 Mock)
    let result: GeminiBodyAnalysisResult;
    let usedMock = false;

    if (FORCE_MOCK || useMock) {
      // Mock 모드
      const mockResult = generateMockBodyAnalysis(userInput);
      result = {
        bodyType: mockResult.bodyType,
        bodyTypeLabel: mockResult.bodyTypeLabel,
        bodyTypeDescription: mockResult.bodyTypeDescription,
        measurements: mockResult.measurements,
        strengths: mockResult.strengths,
        insight: mockResult.insight,
        styleRecommendations: mockResult.styleRecommendations,
      };
      usedMock = true;
      console.log("[C-1] Using mock analysis");
    } else {
      // Real AI 분석
      try {
        console.log("[C-1] Starting Gemini analysis...");
        result = await analyzeBody(imageBase64);
        console.log("[C-1] Gemini analysis completed");
      } catch (aiError) {
        // AI 실패 시 Mock으로 폴백
        console.error("[C-1] Gemini error, falling back to mock:", aiError);
        const mockResult = generateMockBodyAnalysis(userInput);
        result = {
          bodyType: mockResult.bodyType,
          bodyTypeLabel: mockResult.bodyTypeLabel,
          bodyTypeDescription: mockResult.bodyTypeDescription,
          measurements: mockResult.measurements,
          strengths: mockResult.strengths,
          insight: mockResult.insight,
          styleRecommendations: mockResult.styleRecommendations,
        };
        usedMock = true;
      }
    }

    const supabase = createServiceRoleClient();

    // 이미지 업로드
    let imageUrl: string | null = null;
    if (imageBase64) {
      const fileName = `${userId}/${Date.now()}.jpg`;

      // Base64 데이터 정리
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("body-images")
        .upload(fileName, buffer, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        console.error("Image upload error:", uploadError);
      } else {
        imageUrl = uploadData.path;
      }
    }

    // 퍼스널 컬러 조회 (자동 연동)
    const { data: pcData } = await supabase
      .from("personal_color_assessments")
      .select("season, best_colors")
      .eq("clerk_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const personalColorSeason = pcData?.season || null;

    // measurements에서 어깨/허리/골반 추출
    const measurements = result.measurements || [];
    const getMeasurement = (name: string) =>
      measurements.find(
        (m: { name: string; value: number }) => m.name === name
      )?.value || null;

    // 퍼스널 컬러 + 체형 기반 코디 색상 추천 생성
    const colorRecommendations = generateColorRecommendations(
      personalColorSeason,
      result.bodyType
    );
    const colorTips = getColorTipsForBodyType(result.bodyType);

    console.log(
      `[C-1] Generated color recommendations for ${personalColorSeason || "no PC"} + ${result.bodyType} body type`
    );

    // DB에 저장
    const { data, error } = await supabase
      .from("body_analyses")
      .insert({
        clerk_user_id: userId,
        image_url: imageUrl || "",
        height: userInput?.height || null,
        weight: userInput?.weight || null,
        body_type: result.bodyType,
        shoulder: getMeasurement("어깨"),
        waist: getMeasurement("허리"),
        hip: getMeasurement("골반"),
        strengths: result.strengths,
        style_recommendations: {
          items: result.styleRecommendations,
          insight: result.insight,
          colorTips,
        },
        personal_color_season: personalColorSeason,
        // 퍼스널 컬러 + 체형 기반 색상 추천 (문서 구조에 맞춤)
        color_recommendations: colorRecommendations,
        target_weight: userInput?.targetWeight || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Database insert error:", error);
      return NextResponse.json(
        { error: "Failed to save analysis", details: error.message },
        { status: 500 }
      );
    }

    // BMI 계산 (userInput이 있는 경우)
    let bmi: number | undefined;
    let bmiCategory: string | undefined;

    if (userInput?.height && userInput?.weight) {
      bmi = userInput.weight / ((userInput.height / 100) ** 2);
      if (bmi < 18.5) bmiCategory = "저체중";
      else if (bmi < 23) bmiCategory = "정상";
      else if (bmi < 25) bmiCategory = "과체중";
      else bmiCategory = "비만";
    }

    // 체형 정보 보완 (BODY_TYPES에서 가져오기)
    const bodyTypeInfo = BODY_TYPES[result.bodyType as BodyType];

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

      // 체형 분석 완료 배지
      const bodyBadge = await awardAnalysisBadge(supabase, userId, "body");
      if (bodyBadge) {
        gamificationResult.badgeResults.push(bodyBadge);
      }

      // 모든 분석 완료 여부 체크
      const allBadge = await checkAndAwardAllAnalysisBadge(supabase, userId);
      if (allBadge) {
        gamificationResult.badgeResults.push(allBadge);
      }
    } catch (gamificationError) {
      console.error("[C-1] Gamification error:", gamificationError);
    }

    return NextResponse.json({
      success: true,
      data: data,
      result: {
        ...result,
        bodyTypeLabel: result.bodyTypeLabel || bodyTypeInfo?.label,
        bodyTypeDescription: result.bodyTypeDescription || bodyTypeInfo?.description,
        userInput,
        bmi,
        bmiCategory,
        analyzedAt: new Date().toISOString(),
      },
      personalColorSeason,
      colorRecommendations,
      colorTips,
      usedMock,
      gamification: gamificationResult,
    });
  } catch (error) {
    console.error("Body analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * 최근 C-1 분석 결과 목록 조회 API
 *
 * GET /api/analyze/body
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("body_analyses")
      .select("*")
      .eq("clerk_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Database query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch analyses" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("Get body analyses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
