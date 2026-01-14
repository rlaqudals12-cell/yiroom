import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * Storage Signed URL 생성 API
 * Private bucket의 이미지에 접근하기 위한 signed URL 생성
 *
 * POST /api/storage/signed-url
 * Body: { bucket: string, path: string, expiresIn?: number }
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bucket, path, expiresIn = 3600 } = body;

    if (!bucket || !path) {
      return NextResponse.json({ error: 'bucket and path are required' }, { status: 400 });
    }

    // 보안: 사용자가 자신의 폴더에만 접근할 수 있도록 확인
    // 경로 형식: userId/timestamp_suffix.jpg
    const pathParts = path.split('/');
    if (pathParts[0] !== userId) {
      console.warn(`[signed-url] Unauthorized access attempt: ${userId} tried to access ${path}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);

    if (error) {
      console.error('[signed-url] Error creating signed URL:', error);
      return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (error) {
    console.error('[signed-url] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
