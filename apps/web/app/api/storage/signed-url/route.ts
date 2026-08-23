import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { redactPii } from '@/lib/utils/redact-pii';
import { ANALYSIS_IMAGE_BUCKETS, hasActiveAnalysisImageAccess } from '@/lib/consent/image-access';
import type { AnalysisType } from '@/components/analysis/consent/types';

/**
 * Storage Signed URL 생성 API
 * Private bucket의 이미지에 접근하기 위한 signed URL 생성
 *
 * POST /api/storage/signed-url
 * Body: { bucket: string, path: string, expiresIn?: number }        → { signedUrl }
 *       { bucket: string, paths: string[], expiresIn?: number }     → { signedUrls: Record<path, url> }
 *
 * 일괄(paths) 모드가 있는 이유: 옷장 목록은 한 화면에 수십 장이라 장당 요청이면
 * N+1이 된다. 소유권 검사는 단건과 동일하게 **경로마다** 적용한다.
 */

/** 한 번에 서명할 수 있는 최대 경로 수 (남용 방어) */
const MAX_BATCH_PATHS = 200;
/** 통합 원본은 세션 pending·회차 동의·글로벌 생체 동의를 함께 검사하는 서버 결과 경로만 서명한다. */
const SERVER_ONLY_BUCKETS = new Set(['integrated-sessions']);
const ANALYSIS_TYPE_BY_BUCKET = Object.fromEntries(
  Object.entries(ANALYSIS_IMAGE_BUCKETS).map(([type, bucket]) => [bucket, type])
) as Record<string, AnalysisType>;
const ANALYSIS_SIGNED_URL_MAX_SECONDS = 60 * 60;

function cappedExpiry(expiresIn: unknown, isAnalysisImage: boolean): number {
  const requested =
    typeof expiresIn === 'number' && Number.isFinite(expiresIn) && expiresIn > 0
      ? expiresIn
      : ANALYSIS_SIGNED_URL_MAX_SECONDS;
  return isAnalysisImage ? Math.min(requested, ANALYSIS_SIGNED_URL_MAX_SECONDS) : requested;
}

/** 경로 첫 세그먼트가 요청자 userId인지 — 유일한 소유권 가드(service role은 RLS를 우회한다) */
function isOwnedPath(path: unknown, userId: string): path is string {
  return typeof path === 'string' && path.length > 0 && path.split('/')[0] === userId;
}

/** 일괄 서명 — 소유권 검사는 단건과 동일하게 경로마다 적용한다 */
async function handleBatch(
  bucket: unknown,
  paths: unknown[],
  expiresIn: number,
  userId: string
): Promise<NextResponse> {
  if (!bucket || typeof bucket !== 'string') {
    return NextResponse.json({ error: 'bucket is required' }, { status: 400 });
  }
  if (SERVER_ONLY_BUCKETS.has(bucket)) {
    return NextResponse.json(
      { error: 'Use the protected analysis result endpoint' },
      { status: 403 }
    );
  }
  if (paths.length === 0) {
    return NextResponse.json({ signedUrls: {} });
  }
  if (paths.length > MAX_BATCH_PATHS) {
    return NextResponse.json({ error: 'too many paths' }, { status: 400 });
  }
  // 하나라도 남의 경로가 섞여 있으면 전체를 거절한다 (부분 성공은 경로 탐색을 도와준다)
  if (!paths.every((candidate) => isOwnedPath(candidate, userId))) {
    console.warn(
      `[signed-url] Unauthorized batch attempt by ${redactPii.userId(userId)} (${paths.length} paths)`
    );
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ownedPaths = paths as string[];
  const supabase = createServiceRoleClient();
  const analysisType = ANALYSIS_TYPE_BY_BUCKET[bucket];
  if (analysisType && !(await hasActiveAnalysisImageAccess(supabase, analysisType, userId))) {
    return NextResponse.json({ error: 'Image storage consent required' }, { status: 403 });
  }
  const effectiveExpiresIn = cappedExpiry(expiresIn, Boolean(analysisType));
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(ownedPaths, effectiveExpiresIn);

  if (error || !data) {
    console.error('[signed-url] Error creating signed URLs:', error);
    return NextResponse.json({ error: 'Failed to create signed URLs' }, { status: 500 });
  }

  const signedUrls: Record<string, string> = {};
  data.forEach((entry, index) => {
    const entryPath = entry.path ?? ownedPaths[index];
    if (entryPath && entry.signedUrl) signedUrls[entryPath] = entry.signedUrl;
  });

  return NextResponse.json({ signedUrls });
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bucket, path, paths, expiresIn = 3600 } = body;

    // 일괄 모드
    if (Array.isArray(paths)) {
      return handleBatch(bucket, paths, expiresIn, userId);
    }

    if (!bucket || !path) {
      return NextResponse.json({ error: 'bucket and path are required' }, { status: 400 });
    }
    if (SERVER_ONLY_BUCKETS.has(bucket)) {
      return NextResponse.json(
        { error: 'Use the protected analysis result endpoint' },
        { status: 403 }
      );
    }

    // 보안: 사용자가 자신의 폴더에만 접근할 수 있도록 확인
    // 경로 형식: userId/timestamp_suffix.jpg
    const pathParts = path.split('/');
    if (pathParts[0] !== userId) {
      // PII 보호: userId와 생체 이미지 경로(첫 세그먼트 = 대상 userId) 마스킹 후 로깅
      console.warn(
        `[signed-url] Unauthorized access attempt: ${redactPii.userId(userId)} tried to access ${redactPii.userId(pathParts[0])}/${pathParts.slice(1).join('/')}`
      );
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const analysisType = ANALYSIS_TYPE_BY_BUCKET[bucket];
    if (analysisType && !(await hasActiveAnalysisImageAccess(supabase, analysisType, userId))) {
      return NextResponse.json({ error: 'Image storage consent required' }, { status: 403 });
    }
    const effectiveExpiresIn = cappedExpiry(expiresIn, Boolean(analysisType));

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, effectiveExpiresIn);

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
