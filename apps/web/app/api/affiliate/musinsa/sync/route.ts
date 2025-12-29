/**
 * 무신사 제품 동기화 API
 * @description POST /api/affiliate/musinsa/sync
 * @note 큐레이터 API 연동 시 구현
 */

import { NextRequest, NextResponse } from 'next/server';
import { isMusinsaConfigured } from '@/lib/affiliate/musinsa';

export async function POST(request: NextRequest) {
  try {
    // 환경변수 확인
    if (!isMusinsaConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Mock 모드: 실제 동기화는 무신사 큐레이터 가입 후 가능합니다',
        isMock: true,
        syncedCount: 0,
      });
    }

    const body = await request.json().catch(() => ({}));
    const { category, fullSync = false } = body as { category?: string; fullSync?: boolean };

    // TODO: 무신사 큐레이터 API 연동
    // 1. 제품 목록 조회
    // 2. DB에 upsert
    // 3. 품절/가격 변동 업데이트

    // 현재는 placeholder 응답
    return NextResponse.json({
      success: true,
      message: fullSync
        ? '전체 동기화가 예약되었습니다'
        : `${category || '전체'} 카테고리 동기화가 예약되었습니다`,
      isMock: false,
      syncedCount: 0,
      note: '무신사 큐레이터 승인 후 구현 예정입니다',
    });
  } catch (error) {
    console.error('[Musinsa Sync API] Error:', error);
    return NextResponse.json(
      { error: '동기화 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
