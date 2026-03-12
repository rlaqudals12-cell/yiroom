/**
 * 피부 일기 API 라우트 테스트
 * GET /api/skin-diary — 트렌드 + 캘린더 + 최근 엔트리 조회
 * POST /api/skin-diary — 메모 저장
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ============================================
// Mocks
// ============================================

const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

const mockSupabase = {};
vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => mockSupabase,
}));

const mockGetDiaryEntries = vi.fn();
const mockGetCalendarMonth = vi.fn();
const mockAnalyzeTrend = vi.fn();
const mockSaveDiaryNote = vi.fn();

vi.mock('@/lib/skin-diary', () => ({
  getDiaryEntries: (...args: unknown[]) => mockGetDiaryEntries(...args),
  getCalendarMonth: (...args: unknown[]) => mockGetCalendarMonth(...args),
  analyzeTrend: (...args: unknown[]) => mockAnalyzeTrend(...args),
  saveDiaryNote: (...args: unknown[]) => mockSaveDiaryNote(...args),
  CONDITION_EMOJIS: ['😊', '🙂', '😐', '😟', '😰'] as const,
}));

// ============================================
// Mock 데이터
// ============================================

const mockEntries = [
  {
    id: 'e1',
    date: '2026-03-12',
    vitalityScore: 72,
    skinType: 'combination',
    vitalityGrade: 'B',
    scoreBreakdown: { hydration: 70, elasticity: 75, clarity: 68, tone: 74 },
    primaryConcerns: [],
    zones: [],
  },
  {
    id: 'e2',
    date: '2026-03-11',
    vitalityScore: 68,
    skinType: 'combination',
    vitalityGrade: 'C',
    scoreBreakdown: { hydration: 65, elasticity: 70, clarity: 66, tone: 71 },
    primaryConcerns: [],
    zones: [],
  },
  {
    id: 'e3',
    date: '2026-03-10',
    vitalityScore: 65,
    skinType: 'combination',
    vitalityGrade: 'C',
    scoreBreakdown: { hydration: 62, elasticity: 68, clarity: 64, tone: 66 },
    primaryConcerns: [],
    zones: [],
  },
  {
    id: 'e4',
    date: '2026-03-09',
    vitalityScore: 60,
    skinType: 'combination',
    vitalityGrade: 'C',
    scoreBreakdown: { hydration: 58, elasticity: 63, clarity: 60, tone: 59 },
    primaryConcerns: [],
    zones: [],
  },
  {
    id: 'e5',
    date: '2026-03-08',
    vitalityScore: 55,
    skinType: 'combination',
    vitalityGrade: 'D',
    scoreBreakdown: { hydration: 52, elasticity: 58, clarity: 55, tone: 55 },
    primaryConcerns: [],
    zones: [],
  },
  {
    id: 'e6',
    date: '2026-03-07',
    vitalityScore: 50,
    skinType: 'combination',
    vitalityGrade: 'D',
    scoreBreakdown: { hydration: 48, elasticity: 53, clarity: 50, tone: 49 },
    primaryConcerns: [],
    zones: [],
  },
];

const mockCalendar = {
  year: 2026,
  month: 3,
  days: [
    { date: '2026-03-01', hasAssessment: true, conditionEmoji: '😊', isToday: false },
    { date: '2026-03-02', hasAssessment: false, isToday: false },
  ],
  assessmentCount: 1,
  averageScore: 72,
};

const mockTrend = {
  period: '30d' as const,
  entries: mockEntries,
  entryCount: 6,
  shortTermAvg: 68,
  longTermAvg: 62,
  trend: 'improving' as const,
  changeRate: 5,
  categoryTrends: {
    hydration: { trend: 'improving' as const, change: 5, changePercent: 8 },
    elasticity: { trend: 'stable' as const, change: 1, changePercent: 1 },
    clarity: { trend: 'improving' as const, change: 3, changePercent: 4 },
    tone: { trend: 'improving' as const, change: 4, changePercent: 6 },
  },
  alerts: [],
  analysisStreak: 2,
};

// ============================================
// 헬퍼
// ============================================

function createMockGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/skin-diary');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url);
}

function createMockPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/skin-diary', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// dynamic import로 mock 적용 보장
async function callGET(params: Record<string, string> = {}): Promise<Response> {
  const { GET } = await import('@/app/api/skin-diary/route');
  return GET(createMockGetRequest(params));
}

async function callPOST(body: unknown): Promise<Response> {
  const { POST } = await import('@/app/api/skin-diary/route');
  return POST(createMockPostRequest(body));
}

// ============================================
// 테스트
// ============================================

describe('GET /api/skin-diary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_123' });
    mockGetDiaryEntries.mockResolvedValue(mockEntries);
    mockGetCalendarMonth.mockResolvedValue(mockCalendar);
    mockAnalyzeTrend.mockReturnValue(mockTrend);
  });

  it('인증되지 않은 요청은 401을 반환한다', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await callGET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('AUTH_ERROR');
  });

  it('기본 파라미터로 조회에 성공한다 (period=30d)', async () => {
    const response = await callGET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // getDiaryEntries에 기본 period '30d' 전달 확인
    expect(mockGetDiaryEntries).toHaveBeenCalledWith(mockSupabase, 'user_123', '30d');
    // analyzeTrend에 entries와 period 전달 확인
    expect(mockAnalyzeTrend).toHaveBeenCalledWith(mockEntries, '30d');
  });

  it('커스텀 period/year/month 파라미터를 처리한다', async () => {
    const response = await callGET({ period: '7d', year: '2026', month: '1' });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    expect(mockGetDiaryEntries).toHaveBeenCalledWith(mockSupabase, 'user_123', '7d');
    expect(mockGetCalendarMonth).toHaveBeenCalledWith(mockSupabase, 'user_123', 2026, 1);
    expect(mockAnalyzeTrend).toHaveBeenCalledWith(mockEntries, '7d');
  });

  it('90d period 파라미터를 처리한다', async () => {
    const response = await callGET({ period: '90d' });

    expect(response.status).toBe(200);
    expect(mockGetDiaryEntries).toHaveBeenCalledWith(mockSupabase, 'user_123', '90d');
  });

  it('잘못된 period 파라미터는 400을 반환한다', async () => {
    const response = await callGET({ period: '1y' });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('잘못된 month 파라미터는 400을 반환한다 (0이나 13 등)', async () => {
    const response = await callGET({ month: '13' });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('응답에 trend, calendar, recentEntries가 포함된다', async () => {
    const response = await callGET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveProperty('trend');
    expect(data.data).toHaveProperty('calendar');
    expect(data.data).toHaveProperty('recentEntries');

    expect(data.data.trend).toEqual(mockTrend);
    expect(data.data.calendar).toEqual(mockCalendar);
  });

  it('recentEntries는 최대 5개로 제한된다', async () => {
    const response = await callGET();
    const data = await response.json();

    // mockEntries가 6개지만 recentEntries는 slice(0, 5)
    expect(data.data.recentEntries).toHaveLength(5);
    expect(data.data.recentEntries[0].id).toBe('e1');
    expect(data.data.recentEntries[4].id).toBe('e5');
  });

  it('getDiaryEntries 에러 시 500을 반환한다', async () => {
    mockGetDiaryEntries.mockRejectedValue(new Error('DB connection failed'));

    const response = await callGET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INTERNAL_ERROR');
  });

  it('getCalendarMonth 에러 시 500을 반환한다', async () => {
    mockGetCalendarMonth.mockRejectedValue(new Error('Calendar query failed'));

    const response = await callGET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INTERNAL_ERROR');
  });
});

describe('POST /api/skin-diary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_123' });
    mockSaveDiaryNote.mockResolvedValue({ success: true });
  });

  it('인증되지 않은 요청은 401을 반환한다', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await callPOST({
      date: '2026-03-12',
      conditionEmoji: '😊',
      text: '오늘 피부 컨디션 좋아요',
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('AUTH_ERROR');
  });

  it('유효한 메모를 성공적으로 저장한다', async () => {
    const response = await callPOST({
      date: '2026-03-12',
      conditionEmoji: '😊',
      text: '오늘 피부 상태가 좋아요',
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    expect(mockSaveDiaryNote).toHaveBeenCalledWith(mockSupabase, 'user_123', '2026-03-12', {
      conditionEmoji: '😊',
      text: '오늘 피부 상태가 좋아요',
    });
  });

  it('text 없이도 저장에 성공한다 (기본값 빈 문자열)', async () => {
    const response = await callPOST({
      date: '2026-03-12',
      conditionEmoji: '🙂',
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    expect(mockSaveDiaryNote).toHaveBeenCalledWith(mockSupabase, 'user_123', '2026-03-12', {
      conditionEmoji: '🙂',
      text: '',
    });
  });

  it('잘못된 JSON은 400을 반환한다', async () => {
    const { POST } = await import('@/app/api/skin-diary/route');
    const request = new NextRequest('http://localhost/api/skin-diary', {
      method: 'POST',
      body: 'not-json{{{',
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.message).toBe('Invalid JSON');
  });

  it('날짜 형식 오류는 400을 반환한다', async () => {
    const response = await callPOST({
      date: '03-12-2026', // YYYY-MM-DD가 아닌 형식
      conditionEmoji: '😊',
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('날짜가 누락되면 400을 반환한다', async () => {
    const response = await callPOST({
      conditionEmoji: '😊',
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('conditionEmoji가 허용 목록에 없으면 400을 반환한다', async () => {
    const response = await callPOST({
      date: '2026-03-12',
      conditionEmoji: '🤩', // 허용 목록에 없는 이모지
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('conditionEmoji가 누락되면 400을 반환한다', async () => {
    const response = await callPOST({
      date: '2026-03-12',
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('text가 200자를 초과하면 400을 반환한다', async () => {
    const response = await callPOST({
      date: '2026-03-12',
      conditionEmoji: '😊',
      text: '가'.repeat(201),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('saveDiaryNote가 실패 결과를 반환하면 500을 반환한다', async () => {
    mockSaveDiaryNote.mockResolvedValue({
      success: false,
      error: '해당 날짜에 이미 메모가 존재합니다.',
    });

    const response = await callPOST({
      date: '2026-03-12',
      conditionEmoji: '😊',
      text: '테스트',
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('DB_ERROR');
  });

  it('saveDiaryNote 예외 발생 시 500을 반환한다', async () => {
    mockSaveDiaryNote.mockRejectedValue(new Error('Unexpected DB error'));

    const response = await callPOST({
      date: '2026-03-12',
      conditionEmoji: '😐',
      text: '테스트 메모',
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INTERNAL_ERROR');
  });

  it('허용된 모든 conditionEmoji를 저장할 수 있다', async () => {
    const emojis = ['😊', '🙂', '😐', '😟', '😰'];

    for (const emoji of emojis) {
      vi.clearAllMocks();
      mockAuth.mockResolvedValue({ userId: 'user_123' });
      mockSaveDiaryNote.mockResolvedValue({ success: true });

      const response = await callPOST({
        date: '2026-03-12',
        conditionEmoji: emoji,
      });

      expect(response.status).toBe(200);
    }
  });
});
