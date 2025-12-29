import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  analyzePersonalColor,
  type GeminiPersonalColorResult,
} from "@/lib/gemini";
import {
  generateMockPersonalColorResult,
  STYLE_DESCRIPTIONS,
  type SeasonType,
} from "@/lib/mock/personal-color";
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
 * PC-1 퍼스널 컬러 분석 API (Real AI + Mock Fallback)
 *
 * POST /api/analyze/personal-color
 * Body: {
 *   imageBase64: string,                    // 얼굴 이미지 (필수)
 *   wristImageBase64?: string,              // 손목 이미지 (선택 - 웜/쿨 판단 정확도 향상)
 *   useMock?: boolean                       // Mock 모드 강제 (선택)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   data: PersonalColorAssessment,   // DB 저장된 데이터
 *   result: PersonalColorResult,     // AI 분석 결과
 *   usedMock: boolean                // Mock 사용 여부
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
    const { imageBase64, wristImageBase64, useMock = false } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    // AI 분석 실행 (Real AI 또는 Mock)
    let aiResult: GeminiPersonalColorResult;
    let usedMock = false;

    if (FORCE_MOCK || useMock) {
      // Mock 모드
      const mockResult = generateMockPersonalColorResult();
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
      };
      usedMock = true;
      console.log("[PC-1] Using mock analysis");
    } else {
      // Real AI 분석
      try {
        console.log("[PC-1] Starting Gemini analysis...");
        aiResult = await analyzePersonalColor(imageBase64, wristImageBase64);
        console.log("[PC-1] Gemini analysis completed");
      } catch (aiError) {
        // AI 실패 시 Mock으로 폴백
        console.error("[PC-1] Gemini error, falling back to mock:", aiError);
        const mockResult = generateMockPersonalColorResult();
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
        };
        usedMock = true;
      }
    }

    // AI 결과에 styleDescription이 없는 경우 기본값 사용
    const result = {
      ...aiResult,
      styleDescription: aiResult.styleDescription || STYLE_DESCRIPTIONS[aiResult.seasonType as SeasonType],
    };

    const supabase = createServiceRoleClient();

    // 이미지 업로드
    let faceImageUrl: string | null = null;
    if (imageBase64) {
      const fileName = `${userId}/${Date.now()}.jpg`;

      // Base64 데이터 정리
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("personal-color-images")
        .upload(fileName, buffer, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        console.error("Image upload error:", uploadError);
        // 이미지 업로드 실패해도 분석 결과는 저장
      } else {
        faceImageUrl = uploadData.path;
      }
    }

    // 계절 타입 변환 (소문자 → DB 형식)
    const seasonMap: Record<string, string> = {
      spring: "Spring",
      summer: "Summer",
      autumn: "Autumn",
      winter: "Winter",
    };
    const season = seasonMap[result.seasonType] || result.seasonType;

    // 언더톤 변환
    const undertoneMap: Record<string, string> = {
      warm: "Warm",
      cool: "Cool",
    };
    const undertone = undertoneMap[result.tone] || "Neutral";

    // DB에 저장
    const { data, error } = await supabase
      .from("personal_color_assessments")
      .insert({
        clerk_user_id: userId,
        questionnaire_answers: {}, // 문진 응답 (현재 미사용)
        face_image_url: faceImageUrl,
        season: season,
        undertone: undertone,
        confidence: result.confidence,
        season_scores: {
          spring: result.seasonType === "spring" ? result.confidence : 0,
          summer: result.seasonType === "summer" ? result.confidence : 0,
          autumn: result.seasonType === "autumn" ? result.confidence : 0,
          winter: result.seasonType === "winter" ? result.confidence : 0,
        },
        // AI 분석 원본 데이터 저장
        image_analysis: {
          seasonType: result.seasonType,
          tone: result.tone,
          depth: result.depth,
          insight: result.insight,
          styleDescription: result.styleDescription, // 연예인 매칭 대체
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
      console.error("Database insert error:", error);
      return NextResponse.json(
        { error: "Failed to save analysis", details: error.message },
        { status: 500 }
      );
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
      const pcBadge = await awardAnalysisBadge(supabase, userId, "personal-color");
      if (pcBadge) {
        gamificationResult.badgeResults.push(pcBadge);
      }

      // 모든 분석 완료 여부 체크
      const allBadge = await checkAndAwardAllAnalysisBadge(supabase, userId);
      if (allBadge) {
        gamificationResult.badgeResults.push(allBadge);
      }
    } catch (gamificationError) {
      console.error("[PC-1] Gamification error:", gamificationError);
    }

    return NextResponse.json({
      success: true,
      data: data,
      result: {
        ...result,
        analyzedAt: new Date().toISOString(),
      },
      usedMock,
      gamification: gamificationResult,
    });
  } catch (error) {
    console.error("Personal color analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("personal_color_assessments")
      .select("*")
      .eq("clerk_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Database query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch analysis" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || null,
      hasResult: !!data,
    });
  } catch (error) {
    console.error("Get personal color error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
