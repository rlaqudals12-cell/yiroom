/**
 * CoachHeader — 전속 팀 프레이밍 (ADR-114)
 * [물어보기] 승격: 헤더 화법이 "전속 뷰티팀"으로 바뀌었는지 검증.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoachHeader } from '@/components/coach/CoachHeader';

describe('CoachHeader (ADR-114)', () => {
  it('제목은 사용자 말("무엇이든 물어보세요"), 부제가 전속 팀 설명 역할을 한다', () => {
    render(<CoachHeader />);

    expect(screen.getByText('무엇이든 물어보세요')).toBeInTheDocument();
    // 부제(팀 설명)는 유지 — 전속 팀 프레이밍은 부제가 담당
    expect(
      screen.getByText('당신을 아는 스타일리스트·컨설턴트·피부 관리사가 답해요')
    ).toBeInTheDocument();
  });
});
