/**
 * ChatInterface 스트리밍(SSE) 처리 — T1-b(dead-end 방지)·T1-c(replace 정화본 확정)
 *
 * T1-b: error 이벤트가 JSON.parse용 catch에 삼켜지지 않고 실제로 전파되어
 *        handleSend가 에러 메시지를 표시하는지 (침묵 dead-end 방지).
 * T1-c: 서버 환각 필터의 replace 이벤트를 반영해 미정화 원본이 아닌
 *        정화본으로 최종 확정하는지.
 */

import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// jsdom 미구현 API 스텁 (자동 스크롤)
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

// 실제 ko 문구로 번역 — errorMessage/inputPlaceholder 검증을 의미 있게 유지
vi.mock('next-intl', async () => {
  const messages = (await import('@/messages/ko.json')).default as unknown as Record<
    string,
    Record<string, string>
  >;
  return {
    useTranslations: (namespace?: string) => (key: string) =>
      (namespace ? messages[namespace]?.[key] : undefined) ?? key,
    useLocale: () => 'ko',
    useMessages: () => messages,
    NextIntlClientProvider: ({ children }: { children?: unknown }) => children,
  };
});

// 관심사 밖 자식 스텁
vi.mock('@/components/coach/ChatHistoryPanel', () => ({
  ChatHistoryPanel: () => null,
}));

// 메시지 버블은 content만 노출(role별 testid)해 최종 확정 텍스트를 검증
vi.mock('@/components/coach/MessageBubble', () => ({
  MessageBubble: ({ message }: { message: { role: string; content: string } }) => (
    <div data-testid={`msg-${message.role}`}>{message.content}</div>
  ),
}));

import { ChatInterface } from '@/components/coach/ChatInterface';

// SSE 프레임을 흉내내는 fetch 응답(ReadableStream.getReader) 생성
function streamResponse(events: Array<Record<string, unknown>>): Response {
  const encoder = new TextEncoder();
  const frames = events.map((e) => encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
  let idx = 0;
  return {
    ok: true,
    body: {
      getReader: () => ({
        read: async () =>
          idx < frames.length
            ? { done: false, value: frames[idx++] }
            : { done: true, value: undefined },
        releaseLock: () => {},
        cancel: async () => {},
      }),
    },
  } as unknown as Response;
}

const noop = async () => ({ message: '' });

function sendMessage(container: HTMLElement, text: string) {
  const input = screen.getByPlaceholderText('질문을 입력하세요...');
  fireEvent.change(input, { target: { value: text } });
  fireEvent.submit(container.querySelector('form')!);
}

describe('ChatInterface 스트리밍 처리', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('replace 이벤트를 받으면 미정화 원본이 아닌 정화본으로 확정한다 (T1-c)', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      streamResponse([
        { type: 'chunk', content: '이 성분으로 치료할 수 있어요.' },
        { type: 'replace', content: '이 성분은 (전문가 상담을 권장드려요).' },
        { type: 'done', suggestedQuestions: [] },
      ])
    );

    const { container } = render(
      <ChatInterface userContext={null} onSendMessage={noop} useStreaming />
    );

    sendMessage(container, '트러블 어떻게 해요?');

    await waitFor(() => {
      expect(screen.getByTestId('msg-assistant')).toHaveTextContent('전문가 상담을 권장드려요');
    });
    // 미정화 원본이 최종 확정되지 않았음
    expect(screen.getByTestId('msg-assistant')).not.toHaveTextContent('치료할 수 있어요');
  });

  it('error 이벤트를 받으면 침묵하지 않고 에러 메시지를 표시한다 (T1-b)', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(streamResponse([{ type: 'error', message: '응답 생성 중 오류' }]));

    const { container } = render(
      <ChatInterface userContext={null} onSendMessage={noop} useStreaming />
    );

    sendMessage(container, '안녕');

    await waitFor(() => {
      expect(
        screen.getByText('죄송해요, 잠시 문제가 생겼어요. 다시 시도해주세요.')
      ).toBeInTheDocument();
    });
  });

  it('불완전한 JSON 청크는 무시하되 정상 이벤트는 처리한다 (파싱 catch가 error를 삼키지 않음)', async () => {
    // 깨진 프레임 + 정상 청크/done — 깨진 프레임은 무시되고 정상 응답이 확정되어야
    const encoder = new TextEncoder();
    const frames = [
      encoder.encode('data: {깨진 json\n\n'),
      encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: '정상 응답이에요.' })}\n\n`),
      encoder.encode(`data: ${JSON.stringify({ type: 'done', suggestedQuestions: [] })}\n\n`),
    ];
    let idx = 0;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: async () =>
            idx < frames.length
              ? { done: false, value: frames[idx++] }
              : { done: true, value: undefined },
        }),
      },
    } as unknown as Response);

    const { container } = render(
      <ChatInterface userContext={null} onSendMessage={noop} useStreaming />
    );

    sendMessage(container, '안녕');

    await waitFor(() => {
      expect(screen.getByTestId('msg-assistant')).toHaveTextContent('정상 응답이에요.');
    });
  });
});
