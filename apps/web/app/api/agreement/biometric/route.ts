/**
 * 생체정보 동의 철회 API
 * DELETE /api/agreement/biometric
 * Body: { confirm: true }
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { revokeBiometricConsentAndPurge } from '@/lib/api/biometric-withdrawal';
import { logConsentRevoke } from '@/lib/audit/logger';

const requestSchema = z.object({ confirm: z.literal(true) }).strict();

interface PublicWithdrawalDetails {
  consentRevoked: boolean;
  imagesDeleted: number;
  databaseTargetsCleared: number;
  fullyPurged: boolean;
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  userMessage: string,
  details?: PublicWithdrawalDetails
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        userMessage,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse(401, 'AUTH_ERROR', 'User not authenticated', '로그인이 필요합니다.');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(
      400,
      'VALIDATION_ERROR',
      'Invalid JSON request body',
      '철회 확인 정보를 다시 확인해주세요.'
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      400,
      'VALIDATION_ERROR',
      'Biometric withdrawal confirmation is required',
      '생체정보 동의 철회를 확인해주세요.'
    );
  }

  try {
    const supabase = createServiceRoleClient();
    const result = await revokeBiometricConsentAndPurge(supabase, userId);

    // 민감 이미지나 파일 경로는 감사 상세에 남기지 않고 결과 개수·상태만 기록한다.
    const auditSaved = await logConsentRevoke(userId, 'biometric', {
      consentRevoked: result.consentRevoked,
      imagesDeleted: result.imagesDeleted,
      databaseTargetsCleared: result.databaseTargetsCleared,
      fullyPurged: result.fullyPurged,
      failedTargets: result.failedTargets,
    });
    if (!auditSaved) {
      // 감사 저장 실패는 운영 경고로 남기되, 실제 동의 철회·이미지 파기 결과를 뒤집지 않는다.
      console.warn('[Biometric withdrawal] Audit log persistence failed');
    }

    if (!result.fullyPurged) {
      const userMessage = result.consentRevoked
        ? '생체정보 동의는 철회했지만 일부 이미지 파기가 끝나지 않았습니다. 잠시 후 다시 시도해주세요.'
        : '생체정보 동의 철회와 이미지 파기 일부를 완료하지 못했습니다. 잠시 후 다시 시도해주세요.';
      return errorResponse(
        500,
        'PARTIAL_PURGE_ERROR',
        'Biometric consent withdrawal completed partially',
        userMessage,
        {
          consentRevoked: result.consentRevoked,
          imagesDeleted: result.imagesDeleted,
          databaseTargetsCleared: result.databaseTargetsCleared,
          fullyPurged: false,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        consentRevoked: true,
        imagesDeleted: result.imagesDeleted,
        databaseTargetsCleared: result.databaseTargetsCleared,
        fullyPurged: true,
      },
    });
  } catch {
    // 원문 예외에는 DB/Storage 식별자가 포함될 수 있어 민감 경계에서 직접 출력하지 않는다.
    console.error('[Biometric withdrawal] Unexpected failure');
    return errorResponse(
      500,
      'INTERNAL_ERROR',
      'Biometric withdrawal failed unexpectedly',
      '생체정보 동의 철회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    );
  }
}
