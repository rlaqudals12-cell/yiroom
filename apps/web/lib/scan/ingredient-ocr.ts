/**
 * 성분표 OCR 분석
 * - Gemini Vision API를 사용한 성분표 이미지 인식
 * - 다국어 성분 지원 (한국어, 영어, 일본어, 중국어)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ProductIngredient } from '@/types/scan';

// OCR 결과 타입
export interface OcrResult {
  success: boolean;
  productName?: string;
  brandName?: string;
  ingredients: ProductIngredient[];
  confidence: 'high' | 'medium' | 'low';
  language: 'ko' | 'en' | 'ja' | 'zh' | 'other';
  rawText?: string;
  error?: string;
}

// Gemini 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

// OCR 프롬프트
const INGREDIENT_OCR_PROMPT = `
이 화장품 성분표/전성분 이미지를 분석해주세요.

📋 추출할 정보:
1. 제품명 (있는 경우)
2. 브랜드명 (있는 경우)
3. 전성분 목록 (순서대로)

⚠️ 주의사항:
- 성분명은 가능한 INCI 명칭으로 변환
- 한글 성분명도 함께 제공
- 농도/함량이 표기되어 있으면 포함
- 읽기 어려운 부분은 "불명확"으로 표시
- 성분 순서는 성분표에 기재된 순서대로 (일반적으로 함량 순)

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):
{
  "productName": "[제품명 또는 null]",
  "brandName": "[브랜드명 또는 null]",
  "ingredients": [
    {
      "order": 1,
      "nameKo": "[한글명]",
      "inciName": "[INCI명]",
      "concentration": "[high|medium|low|unknown]",
      "note": "[특이사항 또는 null]"
    }
  ],
  "confidence": "[high|medium|low]",
  "language": "[ko|en|ja|zh|other]"
}
`;

/**
 * 이미지에서 성분표 추출
 */
export async function analyzeIngredientImage(imageBase64: string): Promise<OcrResult> {
  // API 키 확인
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return {
      success: false,
      ingredients: [],
      confidence: 'low',
      language: 'other',
      error: 'API 키가 설정되지 않았습니다',
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Base64 데이터 정리 (data:image 접두사 제거)
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      },
      INGREDIENT_OCR_PROMPT,
    ]);

    const response = result.response;
    const text = response.text();

    // JSON 파싱
    const parsed = parseOcrResponse(text);

    if (!parsed) {
      return {
        success: false,
        ingredients: [],
        confidence: 'low',
        language: 'other',
        rawText: text,
        error: 'OCR 결과 파싱 실패',
      };
    }

    return {
      success: true,
      productName: parsed.productName || undefined,
      brandName: parsed.brandName || undefined,
      ingredients: parsed.ingredients.map((ing, idx) => ({
        order: ing.order || idx + 1,
        inciName: ing.inciName || ing.nameKo || 'Unknown',
        nameKo: ing.nameKo,
        concentration: mapConcentration(ing.concentration),
        note: ing.note || undefined,
      })),
      confidence: parsed.confidence || 'medium',
      language: parsed.language || 'ko',
      rawText: text,
    };
  } catch (error) {
    console.error('[OCR] Gemini 분석 실패:', error);
    return {
      success: false,
      ingredients: [],
      confidence: 'low',
      language: 'other',
      error: error instanceof Error ? error.message : 'OCR 분석 실패',
    };
  }
}

/**
 * OCR 응답 JSON 파싱
 */
function parseOcrResponse(text: string): OcrParsedResult | null {
  try {
    // JSON 블록 추출
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch {
    console.error('[OCR] JSON 파싱 실패');
    return null;
  }
}

interface OcrParsedResult {
  productName: string | null;
  brandName: string | null;
  ingredients: Array<{
    order?: number;
    nameKo?: string;
    inciName?: string;
    concentration?: string;
    note?: string | null;
  }>;
  confidence?: 'high' | 'medium' | 'low';
  language?: 'ko' | 'en' | 'ja' | 'zh' | 'other';
}

/**
 * 농도 문자열을 타입으로 변환
 */
function mapConcentration(value?: string): 'high' | 'medium' | 'low' | undefined {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if (lower === 'high' || lower === '높음') return 'high';
  if (lower === 'medium' || lower === '중간') return 'medium';
  if (lower === 'low' || lower === '낮음') return 'low';
  return undefined;
}

/**
 * 텍스트에서 성분 목록 추출 (간단한 파싱)
 */
export function parseIngredientsFromText(text: string): ProductIngredient[] {
  if (!text || !text.trim()) return [];

  // 다양한 구분자 지원 (쉼표, 세미콜론, 슬래시, 한글 쉼표)
  const separators = /[,;\/、，]/;
  const parts = text.split(separators);

  return parts
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((name, index) => ({
      order: index + 1,
      inciName: name.toUpperCase(),
      nameKo: undefined,
      concentration: index < 5 ? 'high' : index < 15 ? 'medium' : ('low' as const),
    }));
}

/**
 * Mock OCR 결과 생성 (개발/테스트용)
 */
export function generateMockOcrResult(): OcrResult {
  return {
    success: true,
    productName: 'AHA BHA PHA 30 Days Miracle Toner',
    brandName: 'SOME BY MI',
    ingredients: [
      { order: 1, inciName: 'WATER', nameKo: '정제수', concentration: 'high' },
      { order: 2, inciName: 'BUTYLENE GLYCOL', nameKo: '부틸렌글라이콜', concentration: 'medium' },
      { order: 3, inciName: 'GLYCOLIC ACID', nameKo: '글리콜릭애씨드', concentration: 'low' },
      { order: 4, inciName: 'SALICYLIC ACID', nameKo: '살리실릭애씨드', concentration: 'low' },
      { order: 5, inciName: 'NIACINAMIDE', nameKo: '나이아신아마이드', concentration: 'medium' },
    ],
    confidence: 'high',
    language: 'ko',
  };
}
