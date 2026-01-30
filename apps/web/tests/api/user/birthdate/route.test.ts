/**
 * 생년월일 API 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/user/birthdate/route';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock Supabase - 체인 가능한 mock 객체
const createMockSupabase = () => {
  const mock = {
    from: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  };

  // 체인 설정
  mock.from.mockReturnValue(mock);
  mock.select.mockReturnValue(mock);
  mock.update.mockReturnValue(mock);
  mock.eq.mockReturnValue(mock);

  return mock;
};

let mockSupabase = createMockSupabase();

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => mockSupabase,
}));

import { auth } from '@clerk/nextjs/server';

describe('POST /api/user/birthdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
  });

  it('should return 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

    const request = new NextRequest('http://localhost/api/user/birthdate', {
      method: 'POST',
      body: JSON.stringify({ birthDate: '2000-01-01' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('AUTH_ERROR');
  });

  it('should return 400 for invalid birthdate format', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

    const request = new NextRequest('http://localhost/api/user/birthdate', {
      method: 'POST',
      body: JSON.stringify({ birthDate: 'invalid-date' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  it('should return 403 for minor (under 14)', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

    // 현재 기준 10세
    const minorBirthDate = new Date();
    minorBirthDate.setFullYear(minorBirthDate.getFullYear() - 10);
    const birthDateStr = minorBirthDate.toISOString().split('T')[0];

    const request = new NextRequest('http://localhost/api/user/birthdate', {
      method: 'POST',
      body: JSON.stringify({ birthDate: birthDateStr }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('AGE_RESTRICTION');
    expect(data.isMinor).toBe(true);
  });

  it('should save birthdate for adult (14+)', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

    // update().eq() 체인 결과
    mockSupabase.eq.mockResolvedValue({ error: null });

    // 현재 기준 20세
    const adultBirthDate = new Date();
    adultBirthDate.setFullYear(adultBirthDate.getFullYear() - 20);
    const birthDateStr = adultBirthDate.toISOString().split('T')[0];

    const request = new NextRequest('http://localhost/api/user/birthdate', {
      method: 'POST',
      body: JSON.stringify({ birthDate: birthDateStr }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.birthDate).toBe(birthDateStr);
  });

  it('should allow exactly 14 years old', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

    mockSupabase.eq.mockResolvedValue({ error: null });

    // 정확히 14년 전
    const exactlyFourteen = new Date();
    exactlyFourteen.setFullYear(exactlyFourteen.getFullYear() - 14);
    const birthDateStr = exactlyFourteen.toISOString().split('T')[0];

    const request = new NextRequest('http://localhost/api/user/birthdate', {
      method: 'POST',
      body: JSON.stringify({ birthDate: birthDateStr }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe('GET /api/user/birthdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
  });

  it('should return 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('AUTH_ERROR');
  });

  it('should return birthdate when exists', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

    // select().eq().single() 체인 결과
    mockSupabase.single.mockResolvedValue({
      data: { birth_date: '2000-01-01' },
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.birthDate).toBe('2000-01-01');
    expect(data.data.hasBirthDate).toBe(true);
  });

  it('should return null when birthdate not set', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

    mockSupabase.single.mockResolvedValue({
      data: { birth_date: null },
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.birthDate).toBeNull();
    expect(data.data.hasBirthDate).toBe(false);
  });
});
