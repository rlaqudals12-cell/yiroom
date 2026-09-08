import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST as jsonPost } from '@/app/api/coach/chat/route';
import { POST as streamPost } from '@/app/api/coach/stream/route';
import { generateContent } from '@/lib/gemini/client';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'shared-route-budget-user' }),
}));
vi.mock('@/lib/coach/context', () => ({
  getUserContext: vi.fn().mockResolvedValue(null),
  summarizeContext: vi.fn().mockReturnValue(''),
}));
vi.mock('@/lib/coach/history', () => ({
  createCoachSession: vi.fn().mockResolvedValue(null),
  saveCoachMessage: vi.fn().mockResolvedValue(null),
  getCoachSessions: vi.fn(),
  getSessionMessages: vi.fn(),
  deleteCoachSession: vi.fn(),
  updateSessionCategory: vi.fn(),
}));
vi.mock('@/lib/gemini/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/gemini/client')>()),
  isGeminiAvailable: vi.fn().mockReturnValue(true),
  generateContent: vi.fn().mockResolvedValue({ text: '보습 관리 방법을 확인해주세요.' }),
}));
vi.mock('@/lib/security/rate-limit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/security/rate-limit')>()),
  getUpstashRedisClient: vi.fn().mockReturnValue(null),
}));

afterEach(() => vi.unstubAllEnvs());

describe('실제 JSON·SSE → 코치 → 공통 quota 통합', () => {
  it('같은 사용자의 동시 21요청 중 실제 모델은 20회만 호출한다', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    const responses = await Promise.all(
      Array.from({ length: 21 }, async (_, index) => {
        const request = new Request(`http://localhost/api/coach/${index % 2 ? 'stream' : 'chat'}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: '안녕하세요', locale: 'ko' }),
        });
        const response = await (index % 2 ? streamPost(request) : jsonPost(request));
        expect(response.status).toBe(200);
        if (index % 2 === 0) return (await response.json()).data;
        const frames = (await response.text())
          .split('\n\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line.slice(6)));
        expect(frames.map((frame) => frame.type)).toEqual(['chunk', 'done']);
        return frames.find((frame) => frame.type === 'done');
      })
    );
    expect(generateContent).toHaveBeenCalledTimes(20);
    expect(
      responses.filter((response) => response.message === '보습 관리 방법을 확인해주세요.')
    ).toHaveLength(20);
    const limited = responses.filter((response) => response.message.includes('루틴을 열어'));
    expect(limited).toHaveLength(1);
    expect(limited[0]).toMatchObject({ usedFallback: false, confidence: 'normal' });
    expect(limited[0].message).not.toMatch(/구독|유료|결제/);
    expect(responses.every((response) => response.usedFallback === false)).toBe(true);
  });
});
