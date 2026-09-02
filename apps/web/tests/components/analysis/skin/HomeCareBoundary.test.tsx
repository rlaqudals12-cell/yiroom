import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HomeCareBoundary } from '@/components/analysis/skin/HomeCareBoundary';

describe('HomeCareBoundary', () => {
  it('서버가 보존한 일반 한계만 보여주고 구체 시술을 만들지 않는다', () => {
    render(
      <HomeCareBoundary
        boundary={{
          concernIds: ['dryness', 'pigmentation'],
          disclaimer:
            '사진만으로 홈케어가 충분한지 또는 시술이 필요한지 판정할 수 없어요. 불편이 지속되면 피부과 전문의와 상담해 주세요.',
        }}
      />
    );

    expect(screen.getByTestId('skin-home-care-boundary')).toHaveTextContent(
      '사진만으로 홈케어가 충분한지 또는 시술이 필요한지 판정할 수 없어요'
    );
    expect(screen.getByText(/불편이 지속되면 피부과 전문의와 상담/)).toBeInTheDocument();
    expect(screen.queryByText(/IPL|필링|보톡스|매칭 점수|효과적/)).not.toBeInTheDocument();
  });

  it('서버 값이 없는 레거시·폴백 결과에서는 빈 카드도 지어내지 않는다', () => {
    const { container } = render(<HomeCareBoundary boundary={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
