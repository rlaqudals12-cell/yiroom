import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PersonalColorLightingGuide from '@/app/(main)/analysis/personal-color/_components/LightingGuide';
import SkinLightingGuide from '@/app/(main)/analysis/skin/_components/LightingGuide';

vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: { gender: null },
    updateGender: vi.fn().mockResolvedValue(undefined),
    isLoading: false,
  }),
}));

describe('LightingGuide 이미지 저장 동의', () => {
  it('퍼스널컬러는 원본 저장이 기본 OFF이고 1년 보유를 고지한다', () => {
    render(<PersonalColorLightingGuide onContinue={vi.fn()} />);

    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByText(/1년간 저장/)).toBeInTheDocument();
    expect(screen.queryByText(/30일간 저장/)).not.toBeInTheDocument();
  });

  it('피부 가이드에는 실제 게이트와 중복된 죽은 저장 동의 UI가 없다', () => {
    render(<SkinLightingGuide onContinue={vi.fn()} />);

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByText('피부 변화 추적 사용')).not.toBeInTheDocument();
    expect(screen.queryByText(/30일간 저장/)).not.toBeInTheDocument();
  });
});
