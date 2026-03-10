/**
 * T2-MOD-3: 차단 API 라우트 테스트
 * GET/POST/DELETE /api/user/blocks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

// Mock repository
const mockBlockUser = vi.fn();
const mockUnblockUser = vi.fn();
const mockGetBlockedUserIds = vi.fn();

vi.mock('@/lib/feed', () => ({
  blockUser: (...args: unknown[]) => mockBlockUser(...args),
  unblockUser: (...args: unknown[]) => mockUnblockUser(...args),
  getBlockedUserIds: (...args: unknown[]) => mockGetBlockedUserIds(...args),
}));

async function callGET(): Promise<Response> {
  const { GET } = await import('@/app/api/user/blocks/route');
  return GET();
}

async function callPOST(body: unknown): Promise<Response> {
  const { POST } = await import('@/app/api/user/blocks/route');
  const request = new NextRequest('http://localhost/api/user/blocks', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return POST(request);
}

async function callDELETE(body: unknown): Promise<Response> {
  const { DELETE } = await import('@/app/api/user/blocks/route');
  const request = new NextRequest('http://localhost/api/user/blocks', {
    method: 'DELETE',
    body: JSON.stringify(body),
  });
  return DELETE(request);
}

describe('GET /api/user/blocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_1' });
  });

  it('should return blocked user IDs', async () => {
    mockGetBlockedUserIds.mockResolvedValue(['user_2', 'user_3']);

    const response = await callGET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.blockedUserIds).toEqual(['user_2', 'user_3']);
  });

  it('should return empty array when no blocks', async () => {
    mockGetBlockedUserIds.mockResolvedValue([]);

    const response = await callGET();
    const data = await response.json();

    expect(data.blockedUserIds).toEqual([]);
  });

  it('should return 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await callGET();

    expect(response.status).toBe(401);
  });
});

describe('POST /api/user/blocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_1' });
  });

  it('should block a user', async () => {
    const mockBlock = {
      id: 'block_1',
      blocker_clerk_user_id: 'user_1',
      blocked_clerk_user_id: 'user_2',
    };
    mockBlockUser.mockResolvedValue(mockBlock);

    const response = await callPOST({ blockedUserId: 'user_2' });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockBlockUser).toHaveBeenCalledWith('user_1', 'user_2');
  });

  it('should return 400 when self-blocking', async () => {
    const response = await callPOST({ blockedUserId: 'user_1' });

    expect(response.status).toBe(400);
  });

  it('should return 400 when blockedUserId missing', async () => {
    const response = await callPOST({});

    expect(response.status).toBe(400);
  });

  it('should return 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await callPOST({ blockedUserId: 'user_2' });

    expect(response.status).toBe(401);
  });

  it('should return 409 for duplicate block', async () => {
    mockBlockUser.mockRejectedValue({ code: '23505', message: 'duplicate' });

    const response = await callPOST({ blockedUserId: 'user_2' });

    expect(response.status).toBe(409);
  });
});

describe('DELETE /api/user/blocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_1' });
  });

  it('should unblock a user', async () => {
    mockUnblockUser.mockResolvedValue(undefined);

    const response = await callDELETE({ blockedUserId: 'user_2' });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUnblockUser).toHaveBeenCalledWith('user_1', 'user_2');
  });

  it('should return 400 when blockedUserId missing', async () => {
    const response = await callDELETE({});

    expect(response.status).toBe(400);
  });

  it('should return 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await callDELETE({ blockedUserId: 'user_2' });

    expect(response.status).toBe(401);
  });
});
