/**
 * 의류 분류 API 테스트
 *
 * 보안: 서버가 fetch하는 imageUrl은 Supabase Storage 화이트리스트로 제한(SSRF 방지).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/gemini/client', () => ({
  generateContent: vi.fn(),
  isGeminiAvailable: vi.fn(() => true),
  FAST_MODEL: 'fast-model',
}));

import { POST, isAllowedImageUrl } from '@/app/api/inventory/classify/route';
import { auth } from '@clerk/nextjs/server';
import { generateContent, isGeminiAvailable } from '@/lib/gemini/client';
import { NextRequest } from 'next/server';

describe('isAllowedImageUrl (SSRF 화이트리스트)', () => {
  const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  beforeEach(() => {
    // 테스트 결정성: 알려진 Supabase 프로젝트 호스트로 고정
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://testproj.supabase.co';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
  });

  it('Supabase Storage 호스트를 허용한다', () => {
    expect(
      isAllowedImageUrl(
        'https://testproj.supabase.co/storage/v1/object/sign/inventory/a.png?token=x'
      )
    ).toBe(true);
    expect(isAllowedImageUrl('https://supabase.co/x.png')).toBe(true);
    expect(isAllowedImageUrl('https://other.supabase.co/x.png')).toBe(true);
  });

  it('HTTPS가 아닌 스킴을 차단한다', () => {
    // eslint-disable-next-line sonarjs/no-clear-text-protocols -- SSRF 차단 검증용 의도적 http URL (차단됨을 단언)
    expect(isAllowedImageUrl('http://testproj.supabase.co/x.png')).toBe(false);
    expect(isAllowedImageUrl('file:///etc/passwd')).toBe(false);
    expect(isAllowedImageUrl('data:image/png;base64,AAAA')).toBe(false);
  });

  it('임의 외부·내부 호스트를 차단한다', () => {
    expect(isAllowedImageUrl('https://evil.example.com/x.png')).toBe(false);
    expect(isAllowedImageUrl('https://localhost/x.png')).toBe(false);
    expect(isAllowedImageUrl('https://127.0.0.1/x.png')).toBe(false);
    // 클라우드 메타데이터 endpoint (SSRF 대표 표적)
    expect(isAllowedImageUrl('https://169.254.169.254/latest/meta-data')).toBe(false);
  });

  it('접미사/서브도메인 위조 우회를 차단한다', () => {
    expect(isAllowedImageUrl('https://supabase.co.evil.com/x.png')).toBe(false);
    expect(isAllowedImageUrl('https://notsupabase.co/x.png')).toBe(false);
    expect(isAllowedImageUrl('https://evilsupabase.co/x.png')).toBe(false);
  });

  it('URL이 아니면 차단한다', () => {
    expect(isAllowedImageUrl('not a url')).toBe(false);
    expect(isAllowedImageUrl('')).toBe(false);
  });
});

describe('POST /api/inventory/classify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isGeminiAvailable).mockReturnValue(true);
    vi.mocked(auth).mockResolvedValue({ userId: 'user_1' } as never);
  });

  it('인증되지 않으면 401을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const request = new NextRequest('http://localhost/api/inventory/classify', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: 'data:image/png;base64,AAAA' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('허용되지 않은 imageUrl은 400을 반환하고 fetch하지 않는다', async () => {
    const request = new NextRequest('http://localhost/api/inventory/classify', {
      method: 'POST',
      body: JSON.stringify({ imageUrl: 'https://evil.example.com/steal.png' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('허용되지 않은');
    // 차단되었으므로 Gemini 호출도 발생하지 않아야 한다
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('imageUrl/imageBase64 둘 다 없으면 400을 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/inventory/classify', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('imageBase64 경로는 정상 분류한다 (SSRF 검증 미적용)', async () => {
    vi.mocked(generateContent).mockResolvedValue({
      text: JSON.stringify({
        category: 'top',
        subCategory: '티셔츠',
        suggestedName: '화이트 티셔츠',
        colors: ['화이트'],
        pattern: 'solid',
        seasons: ['summer'],
        occasions: ['casual'],
        confidence: 0.9,
      }),
    } as never);

    const request = new NextRequest('http://localhost/api/inventory/classify', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: 'data:image/png;base64,AAAA' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.category).toBe('top');
    expect(generateContent).toHaveBeenCalled();
  });
});
