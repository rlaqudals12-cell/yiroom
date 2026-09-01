import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PersonalColorEvidenceSummary } from '@/components/analysis/EvidenceSummary';

describe('PersonalColorEvidenceSummary', () => {
  it('관찰 근거가 없으면 결론에서 혈관색을 역산하지 않고 근거 부재를 알린다', () => {
    render(<PersonalColorEvidenceSummary tone="cool" veinColor="unknown" />);

    expect(screen.getByText('사진에서 확인된 세부 판정 근거가 없어요')).toBeInTheDocument();
    expect(screen.queryByText('쿨톤 계열이에요')).not.toBeInTheDocument();
  });
});
