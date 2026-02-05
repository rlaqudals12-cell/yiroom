import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  unauthorizedError,
  badRequestError,
  notFoundError,
  internalError,
  createSuccessResponse,
} from '@/lib/api/error-response';

/**
 * GET /api/analyze/personal-color/[id]
 * 특정 ID의 퍼스널 컬러 분석 결과 조회
 *
 * @param params.id - 분석 결과 ID (UUID)
 * @returns 분석 결과 데이터
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedError();
    }

    const { id } = await params;

    if (!id) {
      return badRequestError('분석 ID가 필요합니다.');
    }

    const supabase = createServiceRoleClient();

    // 분석 결과 조회 (본인 데이터만)
    const { data, error } = await supabase
      .from('personal_color_assessments')
      .select('*')
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundError('분석 결과를 찾을 수 없습니다.');
      }
      console.error('[PC-1] Database query error:', error);
      return internalError('데이터 조회에 실패했습니다.', error.message);
    }

    // face_image_url이 경로만 저장된 경우, 서명된 URL로 변환
    // (1시간 유효 - 드레이핑 시뮬레이션용)
    let responseData = { ...data };
    if (data.face_image_url && !data.face_image_url.startsWith('http')) {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('personal-color-images')
        .createSignedUrl(data.face_image_url, 3600); // 1시간 유효

      if (signedUrlData && !signedUrlError) {
        responseData = { ...data, face_image_url: signedUrlData.signedUrl };
        console.log('[PC-1] Generated signed URL for face image');
      } else if (signedUrlError) {
        console.warn('[PC-1] Failed to generate signed URL:', signedUrlError.message);
      }
    }

    return createSuccessResponse(responseData);
  } catch (error) {
    console.error('[PC-1] Get by ID error:', error);
    return internalError(
      '서버 오류가 발생했습니다.',
      error instanceof Error ? error.message : undefined
    );
  }
}
