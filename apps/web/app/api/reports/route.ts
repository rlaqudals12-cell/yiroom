import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import { contentReportRequestSchema } from '@/lib/content-report/contract';
import { submitContentReport } from '@/lib/content-report/server';

function errorResponse(
  status: number,
  code: string,
  message: string,
  userMessage: string
): NextResponse {
  return NextResponse.json({ success: false, error: { code, message, userMessage } }, { status });
}

/**
 * POST /api/reports
 *
 * 코치 메시지·5축 분석 결과·AI 트윈 결과를 앱 안에서 신고한다.
 * Clerk 세션을 먼저 확인하고 Zod 허용 목록을 통과한 필드만 운영 큐에 보낸다.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Clerk의 정본 보호 가드를 라우트 본문보다 먼저 실행해 미인증 요청이 저장 로직에
  // 닿지 않게 한다. Clerk 예외는 API 공통 실패 봉투로만 바꿔 내부 정보를 숨긴다.
  let userId: string;
  try {
    ({ userId } = await auth.protect());
  } catch {
    return errorResponse(
      401,
      'AUTH_REQUIRED',
      'Authenticated user is required',
      '로그인 후 신고해 주세요.'
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse(
        400,
        'INVALID_JSON',
        'Request body must be valid JSON',
        '신고 내용을 확인해 주세요.'
      );
    }

    const parsed = contentReportRequestSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Content report payload is invalid',
        '신고 내용을 확인해 주세요.'
      );
    }

    const report = await submitContentReport(userId, parsed.data);

    return NextResponse.json({ success: true, data: { reportId: report.id } }, { status: 201 });
  } catch (error) {
    console.error('[Content Report API] Failed to submit report:', error);
    return errorResponse(
      500,
      'REPORT_SUBMISSION_FAILED',
      'Failed to persist content report',
      '신고를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.'
    );
  }
}
