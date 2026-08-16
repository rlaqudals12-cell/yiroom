/**
 * 인벤토리 이미지 업로드 API 라우트 테스트
 * POST /api/inventory/upload — service role 업로드 (RLS 403 근본 수리 회귀 방지)
 * GET /api/inventory/upload — 서명 URL 생성
 *
 * 왜 service role인가: 서버 기본 Clerk 토큰엔 role claim이 없어 RLS 클라이언트로는
 * 버킷 INSERT 정책(TO authenticated)에 항상 403 — 경로 화이트리스트가 보안 가드.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/inventory/upload/route';

// ============================================
// Mocks
// ============================================

const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockCreateSignedUploadUrl = vi.fn();
const mockStorageFrom = vi.fn(() => ({
  upload: mockUpload,
  // 회귀 감시용으로 남겨둔다 — 라우트가 다시 공개 URL을 만들면 테스트에서 드러난다
  getPublicUrl: mockGetPublicUrl,
  createSignedUploadUrl: mockCreateSignedUploadUrl,
}));
const mockCreateServiceRoleClient = vi.fn(() => ({
  storage: { from: mockStorageFrom },
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => mockCreateServiceRoleClient(),
}));

// RLS 클라이언트 회귀 감시 — 이 라우트가 다시 import하면 테스트에서 드러나도록 목 유지
const mockCreateClerkSupabaseClient = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => mockCreateClerkSupabaseClient(),
}));

// ============================================
// 헬퍼
// ============================================

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

/** jsdom FormData ↔ undici Request 비호환을 피하려 formData()만 흉내낸 요청 객체 */
function makePostRequest(fields: Record<string, unknown>): NextRequest {
  const map = new Map(Object.entries(fields));
  return {
    formData: async () => ({ get: (key: string) => map.get(key) ?? null }),
  } as unknown as NextRequest;
}

function makeGetRequest(params: Record<string, string>): NextRequest {
  const qs = new URLSearchParams(params).toString();
  return { url: `http://localhost/api/inventory/upload?${qs}` } as unknown as NextRequest;
}

function makeFile(overrides: Partial<{ size: number; type: string }> = {}): unknown {
  return {
    size: overrides.size ?? 1024,
    type: overrides.type ?? 'image/png',
    arrayBuffer: async () => new ArrayBuffer(8),
  };
}

function validFields(): Record<string, unknown> {
  return {
    file: makeFile(),
    category: 'closet',
    itemId: VALID_UUID,
    type: 'processed',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: 'user_123' });
  mockUpload.mockResolvedValue({
    data: { path: `user_123/closet/${VALID_UUID}_processed.png` },
    error: null,
  });
  mockGetPublicUrl.mockReturnValue({
    data: { publicUrl: `https://cdn.example/inventory-images/user_123/closet/x.png` },
  });
  mockCreateSignedUploadUrl.mockResolvedValue({
    data: {
      signedUrl: 'https://cdn.example/signed',
      path: `user_123/closet/${VALID_UUID}_processed.png`,
    },
    error: null,
  });
});

// ============================================
// POST
// ============================================

describe('POST /api/inventory/upload', () => {
  it('should return 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await POST(makePostRequest(validFields()));

    expect(res.status).toBe(401);
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('should return 400 when file is missing', async () => {
    const fields = validFields();
    delete fields.file;

    const res = await POST(makePostRequest(fields));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when category is not whitelisted', async () => {
    const res = await POST(makePostRequest({ ...validFields(), category: '../etc' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('should return 400 when itemId is not a uuid', async () => {
    const res = await POST(makePostRequest({ ...validFields(), itemId: '../../hack' }));

    expect(res.status).toBe(400);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('should return 400 when type is not whitelisted', async () => {
    const res = await POST(makePostRequest({ ...validFields(), type: 'raw' }));

    expect(res.status).toBe(400);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('should return 400 when file exceeds 10MB', async () => {
    const res = await POST(
      makePostRequest({ ...validFields(), file: makeFile({ size: 11 * 1024 * 1024 }) })
    );

    expect(res.status).toBe(400);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('should return 400 when mime type is not an allowed image', async () => {
    const res = await POST(
      makePostRequest({ ...validFields(), file: makeFile({ type: 'application/pdf' }) })
    );

    expect(res.status).toBe(400);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('should upload via service role client with server-built path and return the storage path', async () => {
    const res = await POST(makePostRequest(validFields()));
    const body = await res.json();

    expect(res.status).toBe(200);
    // service role 사용 + RLS 클라이언트 미사용 (403 근본 수리의 핵심)
    expect(mockCreateServiceRoleClient).toHaveBeenCalledTimes(1);
    expect(mockCreateClerkSupabaseClient).not.toHaveBeenCalled();
    expect(mockStorageFrom).toHaveBeenCalledWith('inventory-images');
    // 경로는 서버가 auth userId로 구성 — 소유권 가드
    expect(mockUpload).toHaveBeenCalledWith(
      `user_123/closet/${VALID_UUID}_processed.png`,
      expect.any(ArrayBuffer),
      { contentType: 'image/png', upsert: true }
    );
    // 성공 계약 = { path }. 클라이언트(closet/add 등)는 이 경로를 그대로 DB에 저장한다.
    expect(body.path).toBe(`user_123/closet/${VALID_UUID}_processed.png`);
  });

  // 보안 회귀 감시: inventory-images는 비공개 버킷이다. 영구 공개 URL을 다시 내보내면
  // URL만 아는 누구나 개인 사진을 열 수 있고 경로 첫 세그먼트인 Clerk userId까지 새어나간다.
  it('should never return a public URL (private bucket)', async () => {
    const res = await POST(makePostRequest(validFields()));
    const body = await res.json();

    expect(mockGetPublicUrl).not.toHaveBeenCalled();
    expect(body.url).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain('http');
  });

  it('should default type to processed when omitted', async () => {
    const fields = validFields();
    delete fields.type;

    const res = await POST(makePostRequest(fields));

    expect(res.status).toBe(200);
    expect(mockUpload).toHaveBeenCalledWith(
      `user_123/closet/${VALID_UUID}_processed.png`,
      expect.any(ArrayBuffer),
      expect.any(Object)
    );
  });

  it('should return 500 when storage upload fails', async () => {
    mockUpload.mockResolvedValue({ data: null, error: { message: 'boom' } });

    const res = await POST(makePostRequest(validFields()));

    expect(res.status).toBe(500);
  });
});

// ============================================
// GET
// ============================================

describe('GET /api/inventory/upload', () => {
  it('should return 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await GET(makeGetRequest({ category: 'closet', itemId: VALID_UUID }));

    expect(res.status).toBe(401);
  });

  it('should return 400 when category or itemId is invalid', async () => {
    const res = await GET(makeGetRequest({ category: 'feed', itemId: VALID_UUID }));

    expect(res.status).toBe(400);
    expect(mockCreateSignedUploadUrl).not.toHaveBeenCalled();
  });

  it('should create signed upload url via service role client', async () => {
    const res = await GET(makeGetRequest({ category: 'closet', itemId: VALID_UUID }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockCreateServiceRoleClient).toHaveBeenCalledTimes(1);
    expect(mockCreateSignedUploadUrl).toHaveBeenCalledWith(
      `user_123/closet/${VALID_UUID}_processed.png`
    );
    expect(body.signedUrl).toBe('https://cdn.example/signed');
  });
});
