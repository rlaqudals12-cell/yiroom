/**
 * T2-MOD-2: 신고 API 라우트 테스트
 * POST /api/feed/[id]/report
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

// Mock repository
const mockReportPost = vi.fn();
vi.mock('@/lib/feed', () => ({
  reportPost: (...args: unknown[]) => mockReportPost(...args),
}));

// Dynamic import 후 테스트 (mock 적용 보장)
async function callPOST(body: unknown, postId = 'post_123'): Promise<Response> {
  const { POST } = await import('@/app/api/feed/[id]/report/route');
  const request = new NextRequest('http://localhost/api/feed/post_123/report', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return POST(request, { params: Promise.resolve({ id: postId }) });
}

describe('POST /api/feed/[id]/report', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_1' });
  });

  it('should create a report with valid reason', async () => {
    const mockReport = {
      id: 'report_1',
      reporter_clerk_user_id: 'user_1',
      post_id: 'post_123',
      reason: 'spam',
      status: 'pending',
    };
    mockReportPost.mockResolvedValue(mockReport);

    const response = await callPOST({ reason: 'spam' });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.report).toEqual(mockReport);
    expect(mockReportPost).toHaveBeenCalledWith('user_1', {
      post_id: 'post_123',
      reason: 'spam',
      description: undefined,
    });
  });

  it('should create a report with description', async () => {
    mockReportPost.mockResolvedValue({ id: 'report_2' });

    const response = await callPOST({
      reason: 'harassment',
      description: '욕설이 포함되어 있습니다',
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await callPOST({ reason: 'spam' });

    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid reason', async () => {
    const response = await callPOST({ reason: 'invalid_reason' });

    expect(response.status).toBe(400);
  });

  it('should return 400 when reason is missing', async () => {
    const response = await callPOST({});

    expect(response.status).toBe(400);
  });

  it('should return 409 for duplicate report', async () => {
    mockReportPost.mockRejectedValue({ code: '23505', message: 'duplicate key' });

    const response = await callPOST({ reason: 'spam' });

    expect(response.status).toBe(409);
  });

  it('should return 500 for unexpected errors', async () => {
    mockReportPost.mockRejectedValue(new Error('Unexpected'));

    const response = await callPOST({ reason: 'spam' });

    expect(response.status).toBe(500);
  });
});
