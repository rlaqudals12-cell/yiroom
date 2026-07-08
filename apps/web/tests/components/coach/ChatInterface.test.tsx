/**
 * ChatInterface 기본(미지정) 화면 — ADR-114 상황형 퀵질문 + 스캔 분기
 * "이 제품 나한테 맞을까요?"는 채팅 전송이 아니라 /scan 링크 칩(사진 판정 정본=스캔).
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';

// jsdom 미구현 API 스텁 (자동 스크롤)
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

// 히스토리 패널(Sheet/portal)은 이 테스트 관심사가 아니므로 스텁
vi.mock('@/components/coach/ChatHistoryPanel', () => ({
  ChatHistoryPanel: () => null,
}));

import { ChatInterface } from '@/components/coach/ChatInterface';

describe('ChatInterface 기본 화면 (ADR-114)', () => {
  const noop = async () => ({ message: '' });

  it('상황형 기본 퀵질문 3종을 표시한다', () => {
    render(<ChatInterface userContext={null} onSendMessage={noop} />);

    expect(screen.getByText('오늘 뭐 입을까요?')).toBeInTheDocument();
    expect(screen.getByText('머리 어떻게 자를까요?')).toBeInTheDocument();
    expect(screen.getByText('오늘 화장 어떻게 할까요?')).toBeInTheDocument();
  });

  it('"이 제품 나한테 맞을까요?"는 스캔(/scan) 링크 칩으로 분기한다', () => {
    render(<ChatInterface userContext={null} onSendMessage={noop} />);

    const chip = screen.getByTestId('coach-scan-chip');
    expect(chip).toHaveAttribute('href', '/scan');
    expect(chip).toHaveTextContent('이 제품 나한테 맞을까요?');
  });
});
