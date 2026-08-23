import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  storageFrom: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth }));
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({ storage: { from: mocks.storageFrom } }),
}));

import { POST } from '@/app/api/storage/signed-url/route';

describe('POST /api/storage/signed-url — integrated 서버 전용 경계', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: 'user-1' });
  });

  it.each([{ path: 'user-1/session-1/face.jpg' }, { paths: ['user-1/session-1/face.jpg'] }])(
    '단건·일괄 공용 endpoint에서 integrated-sessions를 서명하지 않는다',
    async (body) => {
      const response = await POST(
        new Request('http://localhost:3000/api/storage/signed-url', {
          method: 'POST',
          body: JSON.stringify({ bucket: 'integrated-sessions', ...body }),
        })
      );

      expect(response.status).toBe(403);
      expect(mocks.storageFrom).not.toHaveBeenCalled();
    }
  );
});
