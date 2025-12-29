/**
 * 사이즈 기록 API 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/smart-matching/size-history/route';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-user-id' }),
}));

vi.mock('@/lib/smart-matching', () => ({
  getSizeHistory: vi.fn(),
  getSizeHistoryByBrand: vi.fn(),
  getSizeHistoryByCategory: vi.fn(),
  addSizeHistory: vi.fn(),
}));

import {
  getSizeHistory,
  getSizeHistoryByBrand,
  getSizeHistoryByCategory,
  addSizeHistory,
} from '@/lib/smart-matching';

describe('GET /api/smart-matching/size-history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('전체 사이즈 기록을 조회한다', async () => {
    vi.mocked(getSizeHistory).mockResolvedValue([
      {
        id: 'history-1',
        clerkUserId: 'test-user-id',
        brandId: 'nike',
        brandName: 'Nike',
        category: 'top',
        size: 'M',
        fit: 'perfect',
        createdAt: new Date(),
      },
    ]);

    const request = new NextRequest('http://localhost/api/smart-matching/size-history');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].brandName).toBe('Nike');
  });

  it('브랜드별 사이즈 기록을 조회한다', async () => {
    vi.mocked(getSizeHistoryByBrand).mockResolvedValue([
      {
        id: 'history-1',
        clerkUserId: 'test-user-id',
        brandId: 'nike',
        brandName: 'Nike',
        category: 'top',
        size: 'M',
        createdAt: new Date(),
      },
    ]);

    const request = new NextRequest(
      'http://localhost/api/smart-matching/size-history?brandId=nike'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(getSizeHistoryByBrand).toHaveBeenCalledWith('test-user-id', 'nike');
  });

  it('카테고리별 사이즈 기록을 조회한다', async () => {
    vi.mocked(getSizeHistoryByCategory).mockResolvedValue([
      {
        id: 'history-1',
        clerkUserId: 'test-user-id',
        brandId: 'nike',
        brandName: 'Nike',
        category: 'bottom',
        size: '32',
        createdAt: new Date(),
      },
    ]);

    const request = new NextRequest(
      'http://localhost/api/smart-matching/size-history?category=bottom'
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(getSizeHistoryByCategory).toHaveBeenCalledWith('test-user-id', 'bottom');
  });
});

describe('POST /api/smart-matching/size-history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('새 사이즈 기록을 추가한다', async () => {
    vi.mocked(addSizeHistory).mockResolvedValue({
      id: 'history-new',
      clerkUserId: 'test-user-id',
      brandId: 'adidas',
      brandName: 'Adidas',
      category: 'shoes',
      size: '270',
      fit: 'perfect',
      createdAt: new Date(),
    });

    const request = new NextRequest('http://localhost/api/smart-matching/size-history', {
      method: 'POST',
      body: JSON.stringify({
        brandId: 'adidas',
        brandName: 'Adidas',
        category: 'shoes',
        size: '270',
        fit: 'perfect',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.brandName).toBe('Adidas');
    expect(data.size).toBe('270');
  });

  it('필수 필드 누락 시 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/smart-matching/size-history', {
      method: 'POST',
      body: JSON.stringify({
        brandId: 'adidas',
        // brandName, category, size 누락
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('저장 실패 시 500 에러를 반환한다', async () => {
    vi.mocked(addSizeHistory).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/smart-matching/size-history', {
      method: 'POST',
      body: JSON.stringify({
        brandId: 'adidas',
        brandName: 'Adidas',
        category: 'shoes',
        size: '270',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
