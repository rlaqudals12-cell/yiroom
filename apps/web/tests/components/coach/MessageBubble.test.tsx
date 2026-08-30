import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '@/components/coach/MessageBubble';
import type { CoachMessage } from '@/lib/coach/client';

const baseMessage: CoachMessage = {
  id: 'message-1',
  role: 'assistant',
  content: '오늘은 수분 크림을 얇게 발라보세요.',
  timestamp: new Date('2026-08-30T09:00:00+09:00'),
};

describe('MessageBubble AI 생성물 신고', () => {
  it('코치 답변마다 메시지 단위 신고 액션을 제공한다', () => {
    render(<MessageBubble message={baseMessage} />);

    expect(screen.getByTestId('coach-message-report-trigger')).toHaveTextContent('신고');
  });

  it('사용자 메시지에는 신고 액션을 표시하지 않는다', () => {
    render(<MessageBubble message={{ ...baseMessage, role: 'user' }} />);

    expect(screen.queryByTestId('coach-message-report-trigger')).not.toBeInTheDocument();
  });
});
