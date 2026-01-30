/**
 * Clerk Webhook Handler
 *
 * @description Clerk 이벤트(사용자 생성, 업데이트, 삭제 등) 수신 및 처리
 * Clerk Dashboard에서 이 엔드포인트 URL을 웹훅으로 등록해야 합니다.
 *
 * @see https://clerk.com/docs/webhooks/sync-data
 *
 * ## 설정 방법
 * 1. Clerk Dashboard > Webhooks > Add Endpoint
 * 2. URL: https://your-domain.com/api/webhooks/clerk
 * 3. Events: user.created, user.updated, user.deleted
 * 4. Signing Secret을 CLERK_WEBHOOK_SECRET 환경변수에 설정
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/** Clerk Webhook Event 타입 */
interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
    created_at?: number;
    updated_at?: number;
    deleted?: boolean;
  };
}

/**
 * Svix 서명 검증
 *
 * @description Clerk는 Svix를 통해 웹훅을 전송하므로 Svix 라이브러리로 검증
 * @see https://docs.svix.com/receiving/verifying-payloads/how
 */
async function verifyWebhookSignature(
  payload: string,
  headersList: Headers
): Promise<ClerkWebhookEvent | null> {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('[Clerk Webhook] CLERK_WEBHOOK_SECRET 환경변수 미설정');
    return null;
  }

  const svix_id = headersList.get('svix-id');
  const svix_timestamp = headersList.get('svix-timestamp');
  const svix_signature = headersList.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('[Clerk Webhook] Svix 헤더 누락');
    return null;
  }

  const wh = new Webhook(WEBHOOK_SECRET);

  try {
    const evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkWebhookEvent;

    return evt;
  } catch (err) {
    console.error('[Clerk Webhook] 서명 검증 실패:', err);
    return null;
  }
}

/**
 * 사용자 생성/업데이트 처리
 */
async function handleUserUpsert(data: ClerkWebhookEvent['data']): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const email = data.email_addresses?.[0]?.email_address || null;

  const { error } = await supabase
    .from('users')
    .upsert(
      {
        clerk_user_id: data.id,
        email,
        first_name: data.first_name || null,
        last_name: data.last_name || null,
        image_url: data.image_url || null,
      },
      {
        onConflict: 'clerk_user_id',
      }
    );

  if (error) {
    console.error('[Clerk Webhook] User upsert 실패:', error);
    return false;
  }

  console.log(`[Clerk Webhook] User upserted: ${data.id}`);
  return true;
}

/**
 * 사용자 삭제 처리
 *
 * @description 실제 삭제 대신 soft delete (GDPR 요구사항)
 */
async function handleUserDelete(data: ClerkWebhookEvent['data']): Promise<boolean> {
  const supabase = createServiceRoleClient();

  // Soft delete: deleted_at 필드 설정
  const { error } = await supabase
    .from('users')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', data.id);

  if (error) {
    console.error('[Clerk Webhook] User soft delete 실패:', error);
    return false;
  }

  console.log(`[Clerk Webhook] User soft deleted: ${data.id}`);
  return true;
}

/**
 * POST /api/webhooks/clerk
 * Clerk 웹훅 수신 및 처리
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const headersList = await headers();

    // 서명 검증
    const evt = await verifyWebhookSignature(payload, headersList);

    if (!evt) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { type, data } = evt;

    console.log(`[Clerk Webhook] Received event: ${type}`);

    // 이벤트 타입별 처리
    switch (type) {
      case 'user.created':
      case 'user.updated': {
        const success = await handleUserUpsert(data);
        if (!success) {
          return NextResponse.json({ error: 'Failed to process user' }, { status: 500 });
        }
        break;
      }

      case 'user.deleted': {
        const success = await handleUserDelete(data);
        if (!success) {
          return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
        }
        break;
      }

      default:
        console.log(`[Clerk Webhook] Unhandled event type: ${type}`);
    }

    return NextResponse.json({ success: true, type });
  } catch (error) {
    console.error('[Clerk Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/clerk
 * 헬스체크 (Clerk 설정 확인용)
 */
export async function GET() {
  const hasSecret = !!process.env.CLERK_WEBHOOK_SECRET;

  return NextResponse.json({
    endpoint: '/api/webhooks/clerk',
    status: hasSecret ? 'configured' : 'missing_secret',
    message: hasSecret
      ? 'Webhook endpoint ready'
      : 'CLERK_WEBHOOK_SECRET 환경변수를 설정하세요',
    supportedEvents: ['user.created', 'user.updated', 'user.deleted'],
  });
}
