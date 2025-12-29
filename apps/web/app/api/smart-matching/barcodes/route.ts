/**
 * 바코드 API
 * POST - 바코드 조회 또는 등록
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { findByBarcode, createBarcode } from '@/lib/smart-matching';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { barcode, action, productData } = body;

    if (!barcode) {
      return NextResponse.json({ error: '바코드가 필요합니다.' }, { status: 400 });
    }

    // 조회 모드
    if (action === 'lookup' || !action) {
      const result = await findByBarcode(barcode);

      if (!result) {
        return NextResponse.json({
          found: false,
          barcode,
          message: '등록되지 않은 바코드입니다.',
        });
      }

      return NextResponse.json({
        found: true,
        data: result,
      });
    }

    // 등록 모드
    if (action === 'register') {
      // 중복 체크
      const existing = await findByBarcode(barcode);
      if (existing) {
        return NextResponse.json({
          success: false,
          error: '이미 등록된 바코드입니다.',
          data: existing,
        }, { status: 409 });
      }

      const result = await createBarcode({
        barcode,
        barcodeType: productData?.barcodeType,
        productId: productData?.productId,
        productName: productData?.productName,
        brand: productData?.brand,
        category: productData?.category,
        imageUrl: productData?.imageUrl,
        source: 'user_report',
      });

      if (!result) {
        return NextResponse.json({ error: '바코드 등록에 실패했습니다.' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: result,
      }, { status: 201 });
    }

    return NextResponse.json({ error: '유효하지 않은 action입니다.' }, { status: 400 });
  } catch (error) {
    console.error('[API] Barcode error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
