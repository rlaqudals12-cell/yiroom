/**
 * 인벤토리 이미지 업로드 API
 * 서버에서 Supabase Storage에 업로드
 *
 * 근본 수리(2026-07-25): 기존 createClerkSupabaseClient(RLS 클라이언트)는 서버 기본
 * Clerk 토큰에 role claim이 없어 inventory-images 버킷 INSERT 정책(TO authenticated)에
 * 항상 403이 났다(버킷 객체 0 실측 — 한 번도 성공한 적 없음). 다른 모든 스토리지
 * 라우트와 동일하게 service role 클라이언트로 교체한다. 소유권 가드는 auth() 게이트 +
 * 서버가 구성하는 `${userId}/...` 경로가 담당한다.
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

const BUCKET_NAME = 'inventory-images';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// service role은 RLS를 우회하므로, 스토리지 경로에 들어가는 클라이언트 입력은
// 화이트리스트로 강제한다 — 경로 조작(`../`, 임의 접두사) 차단이 목적
const uploadParamsSchema = z.object({
  category: z.enum(['closet', 'beauty', 'equipment', 'supplement', 'pantry']),
  itemId: z.string().uuid(),
  type: z.enum(['processed', 'original']),
});

/** 400 검증 실패 — 에러 봉투 (클라이언트는 상태코드만 파싱하므로 형태 변경 안전) */
function validationError(message: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
        userMessage: '입력 정보를 확인해주세요.',
      },
    },
    { status: 400 }
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return validationError('File is required');
    }

    // 경로 구성 입력 검증 (category/itemId/type 화이트리스트)
    const parsed = uploadParamsSchema.safeParse({
      category: formData.get('category'),
      itemId: formData.get('itemId'),
      type: formData.get('type') ?? 'processed',
    });
    if (!parsed.success) {
      return validationError(parsed.error.issues[0]?.message ?? 'Invalid upload params');
    }
    const { category, itemId, type } = parsed.data;

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return validationError('File size exceeds 10MB limit');
    }

    // MIME 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return validationError('Only JPEG, PNG, and WebP images are allowed');
    }

    // 파일을 ArrayBuffer로 변환
    const buffer = await file.arrayBuffer();
    // userId는 서버(auth)에서만 오므로 타 사용자 경로로 쓸 수 없다
    const path = `${userId}/${category}/${itemId}_${type}.png`;

    const supabase = createServiceRoleClient();

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(path, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

    if (error) {
      console.error('[Upload] Storage error:', error);
      return NextResponse.json({ error: '파일 업로드에 실패했습니다.' }, { status: 500 });
    }

    // Public URL 생성
    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: data.path,
    });
  } catch (error) {
    console.error('[API] POST /api/inventory/upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Signed URL 생성 (클라이언트 직접 업로드용)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = uploadParamsSchema.safeParse({
      category: searchParams.get('category'),
      itemId: searchParams.get('itemId'),
      type: searchParams.get('type') ?? 'processed',
    });
    if (!parsed.success) {
      return validationError(parsed.error.issues[0]?.message ?? 'Invalid upload params');
    }
    const { category, itemId, type } = parsed.data;

    const path = `${userId}/${category}/${itemId}_${type}.png`;
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUploadUrl(path);

    if (error) {
      console.error('[Upload] Signed URL error:', error);
      return NextResponse.json({ error: '서명된 URL 생성에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path: data.path,
    });
  } catch (error) {
    console.error('[API] GET /api/inventory/upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
