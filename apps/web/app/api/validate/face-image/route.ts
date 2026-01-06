/**
 * 얼굴 이미지 검증 API
 * @description 다각도 촬영 시스템의 이미지 품질 검증
 *
 * POST /api/validate/face-image
 * Body: {
 *   imageBase64: string,     // Base64 인코딩된 이미지 (필수)
 *   expectedAngle: 'front' | 'left' | 'right'  // 기대 각도 (필수)
 * }
 *
 * Returns: ValidateFaceImageResponse
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { validateFaceImage } from '@/lib/gemini';
import type { FaceAngle } from '@/types/visual-analysis';

// 유효한 각도 값
const VALID_ANGLES: FaceAngle[] = ['front', 'left', 'right'];

export async function POST(req: Request) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { imageBase64, expectedAngle } = body;

    // 입력 검증
    if (!imageBase64) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    if (!expectedAngle || !VALID_ANGLES.includes(expectedAngle)) {
      return NextResponse.json(
        { error: 'Valid expectedAngle is required (front, left, right)' },
        { status: 400 }
      );
    }

    // AI 검증 실행
    console.log(`[FACE-VALIDATE] Starting validation for angle: ${expectedAngle}`);
    const result = await validateFaceImage(imageBase64, expectedAngle as FaceAngle);
    console.log(`[FACE-VALIDATE] Validation result:`, {
      suitable: result.suitable,
      detectedAngle: result.detectedAngle,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[FACE-VALIDATE] API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
