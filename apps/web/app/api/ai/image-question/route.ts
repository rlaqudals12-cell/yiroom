/**
 * 이미지 질문 API
 * POST /api/ai/image-question
 *
 * 인벤토리 아이템 이미지에 대해 AI에게 질문
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { askAboutImage, type ImageQuestionInput } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // 필수 필드 검증
    if (!body.imageBase64 || !body.question) {
      return NextResponse.json({ error: 'imageBase64 and question are required' }, { status: 400 });
    }

    // 질문 길이 제한
    if (body.question.length > 500) {
      return NextResponse.json(
        { error: 'Question is too long (max 500 characters)' },
        { status: 400 }
      );
    }

    const input: ImageQuestionInput = {
      imageBase64: body.imageBase64,
      question: body.question,
      context: body.context,
    };

    const result = await askAboutImage(input);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[AI Image Question API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
