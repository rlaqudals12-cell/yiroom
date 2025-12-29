/**
 * 바코드 API 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/smart-matching/barcodes/route';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-user-id' }),
}));

vi.mock('@/lib/smart-matching', () => ({
  findByBarcode: vi.fn(),
  createBarcode: vi.fn(),
}));

import { findByBarcode, createBarcode } from '@/lib/smart-matching';

describe('POST /api/smart-matching/barcodes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('존재하는 바코드를 조회한다', async () => {
    vi.mocked(findByBarcode).mockResolvedValue({
      id: 'barcode-1',
      barcode: '8801234567890',
      barcodeType: 'EAN13',
      productName: '테스트 제품',
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost/api/smart-matching/barcodes', {
      method: 'POST',
      body: JSON.stringify({
        barcode: '8801234567890',
        action: 'lookup',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.found).toBe(true);
    expect(data.data.barcode).toBe('8801234567890');
  });

  it('존재하지 않는 바코드 조회 시 found: false를 반환한다', async () => {
    vi.mocked(findByBarcode).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/smart-matching/barcodes', {
      method: 'POST',
      body: JSON.stringify({
        barcode: '0000000000000',
        action: 'lookup',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.found).toBe(false);
  });

  it('새 바코드를 등록한다', async () => {
    vi.mocked(findByBarcode).mockResolvedValue(null);
    vi.mocked(createBarcode).mockResolvedValue({
      id: 'barcode-new',
      barcode: '8809999999999',
      barcodeType: 'EAN13',
      productName: '새 제품',
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost/api/smart-matching/barcodes', {
      method: 'POST',
      body: JSON.stringify({
        barcode: '8809999999999',
        action: 'register',
        productData: {
          productName: '새 제품',
          brand: '새 브랜드',
        },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.barcode).toBe('8809999999999');
  });

  it('이미 등록된 바코드 등록 시 409 에러를 반환한다', async () => {
    vi.mocked(findByBarcode).mockResolvedValue({
      id: 'barcode-1',
      barcode: '8801234567890',
      barcodeType: 'EAN13',
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost/api/smart-matching/barcodes', {
      method: 'POST',
      body: JSON.stringify({
        barcode: '8801234567890',
        action: 'register',
        productData: {
          productName: '중복 제품',
        },
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(409);
  });

  it('바코드 없이 요청하면 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/smart-matching/barcodes', {
      method: 'POST',
      body: JSON.stringify({
        action: 'lookup',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
