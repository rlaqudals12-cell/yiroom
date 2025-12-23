import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { analyzeSkin, type GeminiSkinAnalysisResult } from "@/lib/gemini";
import { generateMockAnalysisResult } from "@/lib/mock/skin-analysis";
import {
  getWarningIngredientsForSkinType,
  type SkinType,
} from "@/lib/ingredients";
import {
  generateProductRecommendations,
  formatProductsForDB,
} from "@/lib/product-recommendations";
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
 * S-1 피부 분석 API (Real AI + Mock Fallback)
 *
 * POST /api/analyze/skin
 * Body: {
 *   imageBase64: string,         // 피부 이미지 (필수)
 *   useMock?: boolean            // Mock 모드 강제 (선택)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   data: SkinAnalysis,          // DB 저장된 데이터
 *   result: SkinAnalysisResult,  // AI 분석 결과
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
    const { imageBase64, useMock = false } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    // AI 분석 실행 (Real AI 또는 Mock)
    let result: GeminiSkinAnalysisResult;
    let usedMock = false;

    if (FORCE_MOCK || useMock) {
      // Mock 모드
      const mockResult = generateMockAnalysisResult();
      result = {
        overallScore: mockResult.overallScore,
        metrics: mockResult.metrics,
        insight: mockResult.insight,
        recommendedIngredients: mockResult.recommendedIngredients,
      };
      usedMock = true;
      console.log("[S-1] Using mock analysis");
    } else {
      // Real AI 분석
      try {
        console.log("[S-1] Starting Gemini analysis...");
        result = await analyzeSkin(imageBase64);
        console.log("[S-1] Gemini analysis completed");
      } catch (aiError) {
        // AI 실패 시 Mock으로 폴백
        console.error("[S-1] Gemini error, falling back to mock:", aiError);
        const mockResult = generateMockAnalysisResult();
        result = {
          overallScore: mockResult.overallScore,
          metrics: mockResult.metrics,
          insight: mockResult.insight,
          recommendedIngredients: mockResult.recommendedIngredients,
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
        .from("skin-images")
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

    // 퍼스널 컬러 조회 (자동 연동 + 파운데이션 추천)
    const { data: pcData } = await supabase
      .from("personal_color_assessments")
      .select("season, makeup_recommendations")
      .eq("clerk_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const personalColorSeason = pcData?.season || null;

    // 퍼스널 컬러 기반 파운데이션 추천 생성
    let foundationRecommendation: string | null = null;
    if (pcData?.makeup_recommendations?.foundation) {
      // PC-1 결과에서 파운데이션 추천이 있으면 사용
      foundationRecommendation = pcData.makeup_recommendations.foundation;
    } else if (personalColorSeason) {
      // 없으면 시즌 기반 기본 추천
      const seasonFoundationMap: Record<string, string> = {
        Spring: "웜톤 베이지 계열 (피치 베이지, 골드 베이지)",
        Summer: "쿨톤 베이지 계열 (핑크 베이지, 로즈 베이지)",
        Autumn: "웜톤 베이지 계열 (옐로우 베이지, 카멜 베이지)",
        Winter: "쿨톤 베이지 계열 (뉴트럴 베이지, 아이보리)",
      };
      foundationRecommendation =
        seasonFoundationMap[personalColorSeason] || null;
    }

    // metrics에서 각 지표 추출
    // Mock 데이터 ID: hydration, oil, pores, wrinkles, elasticity, pigmentation, trouble
    const metrics = result.metrics || [];
    const getMetricValue = (id: string, fallbackId?: string) => {
      const found = metrics.find(
        (m: { id: string; value: number }) => m.id === id
      );
      if (found) return found.value;
      // fallback ID로 재시도 (sensitivity → trouble 매핑)
      if (fallbackId) {
        const fallback = metrics.find(
          (m: { id: string; value: number }) => m.id === fallbackId
        );
        return fallback?.value ?? null;
      }
      return null;
    };

    // 피부 타입 결정 (유분도 + 민감도 기반)
    const oilLevel = getMetricValue("oil") || 50;
    const sensitivityLevel = getMetricValue("sensitivity", "trouble") || 50;

    let skinType: SkinType = "normal";
    if (sensitivityLevel >= 70) {
      // 민감도가 높으면 민감성 피부 우선
      skinType = "sensitive";
    } else if (oilLevel >= 60) {
      skinType = "oily";
    } else if (oilLevel <= 40) {
      skinType = "dry";
    } else if (oilLevel >= 45 && oilLevel <= 55) {
      // T존과 U존 차이가 있는 경우 복합성
      skinType = "combination";
    }

    // 피부 타입별 주의 성분 조회 (하이브리드 성분 분석)
    console.log(`[S-1] Fetching warning ingredients for ${skinType} skin`);
    const warningIngredients = await getWarningIngredientsForSkinType(skinType);

    // 피부 타입별 warning 레벨 계산 헬퍼
    const getWarningLevelForSkinType = (
      ing: (typeof warningIngredients)[0],
      type: SkinType
    ): "high" | "medium" | "low" => {
      let warningValue: number;

      switch (type) {
        case "sensitive":
          warningValue = ing.warning_sensitive;
          break;
        case "dry":
          warningValue = ing.warning_dry;
          break;
        case "oily":
          warningValue = ing.warning_oily;
          break;
        case "combination":
          warningValue = ing.warning_combination;
          break;
        case "normal":
        default:
          // normal 피부: 모든 타입의 평균값 사용
          warningValue = Math.round(
            (ing.warning_sensitive +
              ing.warning_dry +
              ing.warning_oily +
              ing.warning_combination) /
              4
          );
          break;
      }

      if (warningValue >= 4) return "high";
      if (warningValue >= 3) return "medium";
      return "low";
    };

    // ingredient_warnings 형식으로 변환
    const ingredientWarnings = warningIngredients.map((ing) => ({
      ingredient: ing.name_ko,
      ingredientEn: ing.name_en,
      level: getWarningLevelForSkinType(ing, skinType),
      ewgGrade: ing.ewg_grade,
      reason: ing.side_effects || "주의가 필요한 성분입니다.",
      alternatives: ing.alternatives,
      category: ing.category,
    }));

    console.log(
      `[S-1] Found ${ingredientWarnings.length} warning ingredients for ${skinType} skin`
    );

    // 제품 추천 생성
    const metricsForProducts = {
      hydration: getMetricValue("hydration"),
      oil_level: getMetricValue("oil"),
      pores: getMetricValue("pores"),
      pigmentation: getMetricValue("pigmentation"),
      wrinkles: getMetricValue("wrinkles"),
      sensitivity: getMetricValue("sensitivity", "trouble"),
    };

    const productRecommendations = generateProductRecommendations(
      skinType,
      metricsForProducts,
      personalColorSeason
    );

    // products 필드 형식으로 변환
    const productsForDB = formatProductsForDB(productRecommendations);

    console.log(
      `[S-1] Generated ${productRecommendations.routine.length} routine steps, ${productRecommendations.specialCare.length} special care products`
    );

    // DB에 저장
    const { data, error } = await supabase
      .from("skin_analyses")
      .insert({
        clerk_user_id: userId,
        image_url: imageUrl || "",
        skin_type: skinType,
        hydration: getMetricValue("hydration"),
        oil_level: getMetricValue("oil"),
        pores: getMetricValue("pores"),
        pigmentation: getMetricValue("pigmentation"),
        wrinkles: getMetricValue("wrinkles"),
        sensitivity: getMetricValue("sensitivity", "trouble"),
        overall_score: result.overallScore,
        recommendations: {
          insight: result.insight,
          ingredients: result.recommendedIngredients,
          // 문서 구조에 맞춘 루틴 정보
          morning_routine: [productRecommendations.skincareRoutine.morning],
          evening_routine: [productRecommendations.skincareRoutine.evening],
          weekly_care: productRecommendations.careTips.weeklyCare,
          lifestyle_tips: productRecommendations.careTips.lifestyleTips,
        },
        // 제품 추천 (피부 타입별 루틴 + 특화 제품)
        products: productsForDB,
        // 성분 분석 (화해 스타일) - 피부 타입별 주의 성분
        ingredient_warnings: ingredientWarnings,
        // 퍼스널 컬러 연동
        personal_color_season: personalColorSeason,
        foundation_recommendation: foundationRecommendation,
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

      // 피부 분석 완료 배지
      const skinBadge = await awardAnalysisBadge(supabase, userId, "skin");
      if (skinBadge) {
        gamificationResult.badgeResults.push(skinBadge);
      }

      // 모든 분석 완료 여부 체크
      const allBadge = await checkAndAwardAllAnalysisBadge(supabase, userId);
      if (allBadge) {
        gamificationResult.badgeResults.push(allBadge);
      }
    } catch (gamificationError) {
      console.error("[S-1] Gamification error:", gamificationError);
    }

    return NextResponse.json({
      success: true,
      data: data,
      result: {
        ...result,
        analyzedAt: new Date().toISOString(),
      },
      personalColorSeason,
      foundationRecommendation,
      ingredientWarnings,
      productRecommendations,
      usedMock,
      gamification: gamificationResult,
    });
  } catch (error) {
    console.error("Skin analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * 최근 S-1 분석 결과 목록 조회 API
 *
 * GET /api/analyze/skin
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("skin_analyses")
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
    console.error("Get skin analyses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
