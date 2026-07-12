/**
 * 의류 AI 분류 API
 * Gemini Vision을 사용하여 이미지에서 의류 카테고리, 색상 등 자동 추출
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateContent, isGeminiAvailable, FAST_MODEL } from '@/lib/gemini/client';
import type { ClothingCategory, Pattern, Season, Occasion } from '@/types/inventory';
import { extractJsonObject } from '@/lib/utils/json-extract';

// 의류 분류 Mock 결과
const generateMockClassification = () => ({
  category: 'top' as ClothingCategory,
  subCategory: '티셔츠',
  suggestedName: '캐주얼 티셔츠',
  colors: ['화이트'],
  pattern: 'solid' as Pattern,
  seasons: [] as Season[],
  occasions: [] as Occasion[],
  confidence: 0.5,
});

const VALID_SEASONS: ReadonlySet<string> = new Set(['spring', 'summer', 'autumn', 'winter']);
const VALID_OCCASIONS: ReadonlySet<string> = new Set([
  'casual',
  'formal',
  'workout',
  'date',
  'travel',
]);

/**
 * SSRF 방지: 서버가 직접 fetch할 수 있는 이미지 URL 화이트리스트 검증.
 *
 * 인벤토리(옷장) 이미지는 Supabase Storage 비공개 버킷에만 저장되므로
 * Supabase 호스트로만 제한한다. 이렇게 하지 않으면 사용자가 임의의 URL을
 * 넘겨 서버가 내부망(localhost·사설 IP·클라우드 메타데이터 endpoint 등)이나
 * 임의 외부 호스트로 요청하도록 유도할 수 있다(OWASP A10:2021 SSRF).
 */
export function isAllowedImageUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  // HTTPS만 허용 (http/data/file/gopher 등 차단)
  if (parsed.protocol !== 'https:') return false;

  const host = parsed.hostname.toLowerCase();

  // Supabase Storage 도메인 (프로젝트별 서브도메인 포함)
  if (host === 'supabase.co' || host.endsWith('.supabase.co')) return true;

  // 환경변수로 지정된 Supabase 프로젝트 호스트 정확 매칭 (self-host 대비)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const configuredHost = new URL(supabaseUrl).hostname.toLowerCase();
      if (host === configuredHost) return true;
    } catch {
      // 잘못된 env는 화이트리스트에 반영하지 않음
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl, imageBase64 } = await request.json();

    if (!imageUrl && !imageBase64) {
      return NextResponse.json({ error: 'imageUrl or imageBase64 is required' }, { status: 400 });
    }

    // Gemini API 키 확인
    if (!isGeminiAvailable()) {
      console.warn('[Classify] Gemini not available, using mock');
      return NextResponse.json(generateMockClassification());
    }

    try {
      // 프롬프트
      const prompt = `You are a fashion expert AI. Analyze this clothing item image and classify it.

Return a JSON object with these fields:
{
  "category": "outer" | "top" | "bottom" | "dress" | "shoes" | "bag" | "accessory",
  "subCategory": "specific type in Korean (e.g., 티셔츠, 청바지, 트렌치코트)",
  "suggestedName": "descriptive Korean name (e.g., 베이지 트렌치코트)",
  "colors": ["primary color in Korean", "secondary color if any"],
  "pattern": "solid" | "stripe" | "check" | "floral" | "dot" | "geometric" | "animal" | "abstract",
  "seasons": ["spring" | "summer" | "autumn" | "winter"],
  "occasions": ["casual" | "formal" | "workout" | "date" | "travel"],
  "confidence": 0.0-1.0
}

seasons: seasons this item suits based on fabric weight/sleeve length (e.g., padding → ["winter"], linen shirt → ["spring","summer"]). Empty array if not determinable.
occasions: where this item fits. Most items are ["casual"]; suits/blouses add "formal", athleisure adds "workout". Empty array if not determinable.

Categories:
- outer: coats, jackets, cardigans, paddings
- top: t-shirts, shirts, blouses, knits, hoodies
- bottom: jeans, slacks, skirts, shorts
- dress: dresses, jumpsuits
- shoes: sneakers, boots, heels, sandals
- bag: backpacks, totes, crossbodies
- accessory: hats, scarves, belts, jewelry

Korean color names: 화이트, 블랙, 베이지, 네이비, 그레이, 브라운, 레드, 블루, 그린, 핑크, 옐로우, 카멜, 아이보리

Only return the JSON object, no other text.`;

      let imageData: string;
      let mimeType: string;

      if (imageBase64) {
        imageData = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        mimeType = 'image/png';
      } else {
        // SSRF 방지: 화이트리스트(Supabase Storage) 도메인만 서버 fetch 허용
        if (!isAllowedImageUrl(imageUrl)) {
          return NextResponse.json({ error: '허용되지 않은 이미지 URL입니다.' }, { status: 400 });
        }
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        imageData = Buffer.from(imageBuffer).toString('base64');
        mimeType = imageResponse.headers.get('content-type') || 'image/png';
      }

      const imagePart = {
        inlineData: { data: imageData, mimeType },
      };

      // 구조화 추출 = FAST_MODEL (2026-07-07 A/B: 판정 동일·3~6초·1/6 가격)
      // 일괄 등록에서 N장 연속 호출되므로 속도가 UX에 직결
      const result = await generateContent({
        model: FAST_MODEL,
        contents: [{ text: prompt }, imagePart],
        config: { temperature: 0.1, thinkingConfig: { thinkingLevel: 'low' } },
      });
      const text = result.text;

      // JSON 파싱 (정규식 대신 문자열 탐색으로 ReDoS 방지)
      const jsonStr = extractJsonObject(text);
      if (!jsonStr) {
        console.error('[Classify] Invalid response format:', text);
        return NextResponse.json(generateMockClassification());
      }

      const classification = JSON.parse(jsonStr);

      return NextResponse.json({
        category: classification.category || 'top',
        subCategory: classification.subCategory || '기타',
        suggestedName: classification.suggestedName || '의류',
        colors: classification.colors || [],
        pattern: classification.pattern || 'solid',
        seasons: Array.isArray(classification.seasons)
          ? classification.seasons.filter((s: string) => VALID_SEASONS.has(s))
          : [],
        occasions: Array.isArray(classification.occasions)
          ? classification.occasions.filter((o: string) => VALID_OCCASIONS.has(o))
          : [],
        confidence: classification.confidence || 0.8,
      });
    } catch (aiError) {
      console.error('[Classify] Gemini error, using mock:', aiError);
      return NextResponse.json(generateMockClassification());
    }
  } catch (error) {
    console.error('[API] POST /api/inventory/classify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
