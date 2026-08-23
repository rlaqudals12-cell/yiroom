import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  unauthorizedError,
  badRequestError,
  notFoundError,
  internalError,
  createSuccessResponse,
} from '@/lib/api/error-response';
import { signConsentedAnalysisImageUrls } from '@/lib/consent/image-access';

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

    // face_image_url이 경로만 저장된 경우, 1시간 유효한 서명 URL로 변환한다.
    const [faceImageUrl] = await signConsentedAnalysisImageUrls(
      supabase,
      userId,
      'personal-color',
      [data.face_image_url]
    );
    const responseData = { ...data, face_image_url: faceImageUrl };

    return createSuccessResponse(responseData);
  } catch (error) {
    console.error('[PC-1] Get by ID error:', error);
    return internalError(
      '서버 오류가 발생했습니다.',
      error instanceof Error ? error.message : undefined
    );
  }
}
