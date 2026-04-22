/**
 * ClosetPromptCard 테스트 — ADR-098 C-1 3섹션 구조 ③
 *
 * FEATURE_FLAGS.CLOSET_INTEGRATION 상태에 따라 '준비 중' 안내 또는
 * 실제 옷장 링크를 노출하는지 플래그 기반으로 검증.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FEATURE_FLAGS } from '@yiroom/shared';
import { ClosetPromptCard } from '@/components/analysis/body/ClosetPromptCard';

describe('ClosetPromptCard', () => {
  it('항상 헤더와 옷장 연결 섹션이 렌더링된다', () => {
    render(<ClosetPromptCard />);

    expect(screen.getByTestId('closet-prompt-card')).toBeInTheDocument();
    expect(screen.getByText('내 옷장과 연결')).toBeInTheDocument();
    expect(screen.getByText(/오늘 뭐 입지/)).toBeInTheDocument();
  });

  it('CLOSET_INTEGRATION 플래그에 따라 링크/준비 중 안내를 분기한다', () => {
    render(<ClosetPromptCard />);

    if (FEATURE_FLAGS.CLOSET_INTEGRATION) {
      expect(screen.getByTestId('closet-prompt-link')).toBeInTheDocument();
      expect(screen.queryByTestId('closet-prompt-coming-soon')).not.toBeInTheDocument();
    } else {
      expect(screen.getByTestId('closet-prompt-coming-soon')).toBeInTheDocument();
      expect(screen.queryByTestId('closet-prompt-link')).not.toBeInTheDocument();
      expect(screen.getByText('준비 중')).toBeInTheDocument();
    }
  });
});
