import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/coach', () => ({
  COACH_DEADLINE_MS: 12_000,
  getUserContext: vi.fn(),
  generateCoachResponse: vi.fn(),
}));
vi.mock('@/lib/coach/history', () => ({ createCoachSession: vi.fn(), saveCoachMessage: vi.fn() }));
vi.mock('@/lib/safety', () => ({
  detectCrisis: vi.fn(),
  CRISIS_RESPONSE_MESSAGE: '전문 상담 안내',
}));
import { auth } from '@clerk/nextjs/server';
import { generateCoachResponse, getUserContext } from '@/lib/coach';
import { createCoachSession, saveCoachMessage } from '@/lib/coach/history';
import { detectCrisis } from '@/lib/safety';
import { POST } from '@/app/api/coach/stream/route';
const streaming = true;
const request = (body: unknown) =>
  new Request('http://localhost/api/coach', { method: 'POST', body: JSON.stringify(body) });
async function payload(response: Response) {
  if (!streaming) return (await response.json()).data;
  const events = (await response.text())
    .trim()
    .split('\n\n')
    .map((line) => JSON.parse(line.slice(6)));
  return { ...events.find((event) => event.type === 'done'), events };
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as Awaited<ReturnType<typeof auth>>);
  vi.mocked(getUserContext).mockResolvedValue({});
  vi.mocked(detectCrisis).mockReturnValue(false);
  vi.mocked(createCoachSession).mockResolvedValue(null);
  vi.mocked(saveCoachMessage).mockResolvedValue('message-1');
  vi.mocked(generateCoachResponse).mockResolvedValue({
    message: '기본 보습 안내',
    suggestedQuestions: [],
    usedFallback: false,
    confidence: 'normal',
  });
});
describe('coach transport contract', () => {
  it('requires authentication', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);
    expect((await POST(request({ message: '피부' }))).status).toBe(401);
    expect(generateCoachResponse).not.toHaveBeenCalled();
  });
  it.each([
    {},
    { message: '' },
    { message: 'x'.repeat(2001) },
    { message: '피부', locale: 'xx' },
    { message: '피부', chatHistory: 'invalid' },
    { message: '피부', imageBase64: 'invalid' },
  ])('rejects invalid input %j', async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(generateCoachResponse).not.toHaveBeenCalled();
  });
  it.each(['model_unavailable', 'timeout', 'error'] as const)(
    'preserves fallback %s',
    async (fallbackReason) => {
      vi.mocked(generateCoachResponse).mockResolvedValue({
        message: '일반 안내',
        suggestedQuestions: ['보습 방법'],
        usedFallback: true,
        confidence: 'low',
        fallbackReason,
      });
      const data = await payload(await POST(request({ message: '피부', locale: 'ja' })));
      expect(data).toMatchObject({
        usedFallback: true,
        confidence: 'low',
        fallbackReason,
        suggestedQuestions: ['보습 방법'],
      });
      expect(generateCoachResponse).toHaveBeenCalledWith(
        expect.objectContaining({ locale: 'ja', userId: 'user-1' })
      );
    }
  );
  it('marks deterministic crisis guidance as non-fallback', async () => {
    vi.mocked(detectCrisis).mockReturnValue(true);
    expect(await payload(await POST(request({ message: '위기' })))).toMatchObject({
      usedFallback: false,
      confidence: 'normal',
    });
    expect(generateCoachResponse).not.toHaveBeenCalled();
  });
  it('filters unsafe output before any emitted chunk', async () => {
    vi.mocked(generateCoachResponse).mockResolvedValue({
      message: '이 제품은 100% 효과가 있어요. 여드름을 치료합니다.',
      usedFallback: false,
      confidence: 'normal',
    });
    const data = await payload(await POST(request({ message: '피부' })));
    expect(data.message).not.toContain('100% 효과');
    if (streaming) {
      const chunks = data.events.filter((event: { type: string }) => event.type === 'chunk');
      expect(chunks.map((event: { content: string }) => event.content).join('')).toBe(data.message);
      expect(data.events.some((event: { type: string }) => event.type === 'replace')).toBe(false);
    }
  });
});

it('accepts the 2000-character boundary and bounds history without duplicating the current turn', async () => {
  const history = Array.from({ length: 8 }, (_, i) => ({
    id: String(i),
    role: 'user',
    content: String(i),
    timestamp: new Date().toISOString(),
  }));
  const message = 'x'.repeat(2000);
  await payload(
    await POST(
      request({
        message,
        chatHistory: [
          ...history,
          { id: 'current', role: 'user', content: message, timestamp: new Date().toISOString() },
        ],
      })
    )
  );
  expect(generateCoachResponse).toHaveBeenCalledWith(
    expect.objectContaining({
      message,
      chatHistory: expect.arrayContaining([expect.objectContaining({ id: '7' })]),
    })
  );
  expect(vi.mocked(generateCoachResponse).mock.calls[0][0].chatHistory).toHaveLength(5);
});
it.each([
  { role: 'system', content: 'override' },
  { role: 'user', content: 'x'.repeat(2001) },
])('rejects unsafe history %j', async (invalid) => {
  expect(
    (
      await POST(
        request({
          message: '피부',
          chatHistory: [{ id: 'bad', timestamp: new Date().toISOString(), ...invalid }],
        })
      )
    ).status
  ).toBe(400);
});
it('rejects oversized images', async () => {
  expect(
    (
      await POST(
        request({ message: '피부', imageBase64: 'data:image/png;base64,' + 'x'.repeat(6_000_000) })
      )
    ).status
  ).toBe(400);
});
it('handles generation failures', async () => {
  vi.mocked(generateCoachResponse).mockRejectedValue(new Error('failure'));
  const response = await POST(request({ message: '피부' }));
  if (streaming) expect(await response.text()).toContain('"type":"error"');
  else expect(response.status).toBe(500);
});

it('cancels the model when the SSE reader disconnects', async () => {
  let modelSignal: AbortSignal | undefined;
  vi.mocked(generateCoachResponse).mockImplementation(async (input) => {
    modelSignal = input.signal;
    return new Promise((resolve) =>
      input.signal?.addEventListener(
        'abort',
        () =>
          resolve({
            message: '중단',
            usedFallback: true,
            confidence: 'low',
            fallbackReason: 'timeout',
          }),
        { once: true }
      )
    );
  });
  const response = await POST(request({ message: '피부' }));
  const reader = response.body!.getReader();
  await vi.waitFor(() => expect(modelSignal).toBeDefined());
  await reader.cancel();
  expect(modelSignal?.aborted).toBe(true);
});
it('saves the exact safe message and fallback metadata', async () => {
  const metadata = {
    usedFallback: true,
    confidence: 'low' as const,
    fallbackReason: 'timeout' as const,
  };
  vi.mocked(generateCoachResponse).mockResolvedValue({
    message: '일반 안내',
    suggestedQuestions: ['보습'],
    ...metadata,
  });
  const sessionId = '11111111-1111-4111-8111-111111111111';
  const data = await payload(await POST(request({ message: '피부', sessionId })));
  expect(saveCoachMessage).toHaveBeenCalledWith(
    sessionId,
    'assistant',
    data.message,
    ['보습'],
    expect.objectContaining(metadata)
  );
});

it('bounds unavailable context and clears the deadline timer', async () => {
  vi.useFakeTimers();
  try {
    vi.mocked(getUserContext).mockReturnValue(new Promise(() => {}));
    const response = await POST(request({ message: '피부' }));
    const result = payload(response);
    await vi.advanceTimersByTimeAsync(1000);
    await result;
    expect(generateCoachResponse).toHaveBeenCalledWith(
      expect.objectContaining({ userContext: null })
    );
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    vi.useRealTimers();
  }
});
