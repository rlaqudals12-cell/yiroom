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

  it('빈 대화 첫 화면에 인사 카드와 퀵질문 카드 그리드를 표시한다', () => {
    render(<ChatInterface userContext={null} onSendMessage={noop} />);

    expect(screen.getByTestId('coach-empty-state')).toBeInTheDocument();
    // 상황형 질문은 아이콘 카드 2×2 그리드로 렌더
    expect(screen.getByTestId('coach-quick-cards')).toBeInTheDocument();
  });

  it('사진 첨부 기능을 안내하는 문구를 표시한다', () => {
    render(<ChatInterface userContext={null} onSendMessage={noop} />);

    expect(screen.getByTestId('coach-photo-hint')).toHaveTextContent('사진을 보내면');
  });
});
