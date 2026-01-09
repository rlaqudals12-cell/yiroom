/**
 * 의류 AI 분류 API
 * Gemini Vision을 사용하여 이미지에서 의류 카테고리, 색상 등 자동 추출
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ClothingCategory, Pattern } from '@/types/inventory';

// 의류 분류 Mock 결과
const generateMockClassification = () => ({
  category: 'top' as ClothingCategory,
  subCategory: '티셔츠',
  suggestedName: '캐주얼 티셔츠',
  colors: ['화이트'],
  pattern: 'solid' as Pattern,
  confidence: 0.5,
});

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
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.warn('[Classify] No API key, using mock');
      return NextResponse.json(generateMockClassification());
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      });

      // 프롬프트
      const prompt = `You are a fashion expert AI. Analyze this clothing item image and classify it.

Return a JSON object with these fields:
{
  "category": "outer" | "top" | "bottom" | "dress" | "shoes" | "bag" | "accessory",
  "subCategory": "specific type in Korean (e.g., 티셔츠, 청바지, 트렌치코트)",
  "suggestedName": "descriptive Korean name (e.g., 베이지 트렌치코트)",
  "colors": ["primary color in Korean", "secondary color if any"],
  "pattern": "solid" | "stripe" | "check" | "floral" | "dot" | "geometric" | "animal" | "abstract",
  "confidence": 0.0-1.0
}

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

      let result;

      if (imageBase64) {
        // Base64 이미지 처리
        const imagePart = {
          inlineData: {
            data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
            mimeType: 'image/png',
          },
        };
        result = await model.generateContent([prompt, imagePart]);
      } else {
        // URL 이미지 처리
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64 = Buffer.from(imageBuffer).toString('base64');
        const mimeType = imageResponse.headers.get('content-type') || 'image/png';

        const imagePart = {
          inlineData: {
            data: base64,
            mimeType,
          },
        };
        result = await model.generateContent([prompt, imagePart]);
      }

      const text = result.response.text();

      // JSON 파싱
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[Classify] Invalid response format:', text);
        return NextResponse.json(generateMockClassification());
      }

      const classification = JSON.parse(jsonMatch[0]);

      return NextResponse.json({
        category: classification.category || 'top',
        subCategory: classification.subCategory || '기타',
        suggestedName: classification.suggestedName || '의류',
        colors: classification.colors || [],
        pattern: classification.pattern || 'solid',
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
