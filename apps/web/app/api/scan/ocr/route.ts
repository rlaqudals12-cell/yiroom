/**
 * 성분표 OCR API
 * - POST: 이미지에서 성분 추출
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeIngredientImage, generateMockOcrResult } from '@/lib/scan/ingredient-ocr';

export const maxDuration = 30; // 30초 타임아웃

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, useMock } = body as { image?: string; useMock?: boolean };

    // 이미지 검증
    if (!image) {
      return NextResponse.json({ error: '이미지가 필요합니다' }, { status: 400 });
    }

    // Base64 형식 검증 (간단한 체크)
    if (!image.includes('base64') && !image.match(/^[A-Za-z0-9+/=]+$/)) {
      return NextResponse.json({ error: '올바른 이미지 형식이 아닙니다' }, { status: 400 });
    }

    // Mock 모드 또는 개발 환경에서 Mock 사용
    if (useMock || process.env.FORCE_MOCK_AI === 'true') {
      const mockResult = generateMockOcrResult();
      return NextResponse.json(mockResult);
    }

    // Gemini OCR 분석
    const result = await analyzeIngredientImage(image);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'OCR 분석에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[OCR API] Error:', error);

    // 개발 환경에서는 Mock fallback
    if (process.env.NODE_ENV === 'development') {
      console.log('[OCR API] Falling back to mock result');
      const mockResult = generateMockOcrResult();
      return NextResponse.json(mockResult);
    }

    return NextResponse.json({ error: 'OCR 처리 중 오류가 발생했습니다' }, { status: 500 });
  }
}
