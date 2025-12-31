/**
 * iHerb 제품 동기화 API
 * @description POST /api/affiliate/iherb/sync
 * @note CSV 피드 동기화 (Partnerize 연동 시 구현)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isIHerbConfigured } from '@/lib/affiliate';
import { isAdmin } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 관리자 권한 확인
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    // 환경변수 확인
    if (!isIHerbConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Mock 모드: 실제 동기화는 Partnerize 연동 후 가능합니다',
        isMock: true,
        syncedCount: 0,
      });
    }

    const body = await request.json().catch(() => ({}));
    const { category, fullSync = false } = body as { category?: string; fullSync?: boolean };

    // TODO: Partnerize CSV 피드 다운로드 및 파싱
    // 1. CSV 피드 URL에서 데이터 다운로드
    // 2. CSV 파싱
    // 3. DB에 upsert
    // 4. 품절/가격 변동 업데이트

    // 현재는 placeholder 응답
    return NextResponse.json({
      success: true,
      message: fullSync
        ? '전체 동기화가 예약되었습니다'
        : `${category || '전체'} 카테고리 동기화가 예약되었습니다`,
      isMock: false,
      syncedCount: 0,
      note: 'CSV 피드 동기화는 Partnerize 승인 후 구현 예정입니다',
    });
  } catch (error) {
    console.error('[iHerb Sync API] Error:', error);
    return NextResponse.json({ error: '동기화 중 오류가 발생했습니다' }, { status: 500 });
  }
}
