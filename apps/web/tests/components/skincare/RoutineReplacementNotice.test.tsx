/**
 * RoutineReplacementNotice — 다 쓴 뒤 교체 제안 (G4 폐루프 v1 일부)
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoutineReplacementNotice } from '@/components/skincare/RoutineReplacementNotice';
import type { RoutineReplacement } from '@/lib/skincare';

const REPLACEMENT: RoutineReplacement = {
  shelfItemId: 'shelf-1',
  ownedName: '내 세럼',
  category: 'serum',
  compatibilityScore: 45,
  direction: '비타민C 세럼',
  message:
    '지금 쓰는 내 세럼은 내 피부와 적합도가 조금 낮아요(45점). 다 쓰신 뒤에는 비타민C 세럼 같은 제품으로 바꿔보는 건 어때요',
  alternative: { id: 'cos-1', name: '브라이트닝 세럼', brand: '테스트브랜드' },
};

describe('RoutineReplacementNotice', () => {
  it('제안이 없으면 렌더하지 않는다', () => {
    const { container } = render(<RoutineReplacementNotice replacements={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('교체 제안 메시지 + 대안 제품 링크를 렌더한다', () => {
    render(<RoutineReplacementNotice replacements={[REPLACEMENT]} />);
    expect(screen.getByTestId('routine-replacement-notice')).toBeInTheDocument();
    expect(screen.getByTestId('routine-replacement-item')).toHaveTextContent('다 쓰신 뒤');
    const alt = screen.getByTestId('routine-replacement-alt');
    expect(alt).toHaveAttribute('href', '/beauty/cos-1');
    expect(alt).toHaveTextContent('테스트브랜드 브라이트닝 세럼');
  });

  it("렌더된 문구에 '처방·치료' 없음 (강요/의료 표현 금지)", () => {
    const { container } = render(<RoutineReplacementNotice replacements={[REPLACEMENT]} />);
    expect(container.textContent).not.toMatch(/처방|치료|완치/);
  });
});
