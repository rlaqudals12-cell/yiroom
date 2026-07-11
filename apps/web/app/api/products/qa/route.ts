/**
 * 제품 Q&A API
 * POST /api/products/qa
 *
 * 프롬프트 IP를 서버에만 두기 위한 라우트.
 * 이전에는 클라이언트가 askProductQuestion을 직접 호출해 프롬프트가 브라우저 번들에 노출됐고,
 * 서버 전용 Gemini 키 때문에 prod에서는 항상 Mock만 반환됐다.
 * 이제 클라이언트는 이 라우트를 호출하고, 실제 Gemini 호출은 서버에서만 일어난다.
 */
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { askProductQuestion } from '@/lib/rag/product-qa';
import type { ProductQARequest } from '@/lib/rag/product-qa-shared';

export async function POST(request: Request) {
  // 인증 확인 — 미들웨어 보호에 더해 익명 Gemini 호출을 방어적으로 차단
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  // 요청 파싱
  let body: ProductQARequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 });
  }

  if (!body?.question || !body?.product || !body?.productType) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
  }

  try {
    const result = await askProductQuestion(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Product QA API] Error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
