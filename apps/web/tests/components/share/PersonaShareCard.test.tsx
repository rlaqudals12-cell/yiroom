import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PersonaShareCard } from '@/components/share/PersonaShareCard';

const BADGES = [
  { label: '퍼스널컬러', value: '트루 스프링' },
  { label: '피부', value: '복합성' },
  { label: '체형', value: 'W (웨이브)' },
];

describe('PersonaShareCard — 뽐내기 정체성 카드', () => {
  it('페르소나 한 줄과 축 뱃지를 렌더한다', () => {
    render(<PersonaShareCard oneLine="차분한 빛을 품은 사람" badges={BADGES} season="spring" />);
    expect(screen.getByTestId('persona-share-oneline')).toHaveTextContent('차분한 빛을 품은 사람');
    expect(screen.getByText('트루 스프링')).toBeInTheDocument();
    expect(screen.getByText('복합성')).toBeInTheDocument();
  });

  it('생체정보 보호 — 카드에 이미지(사진) 요소가 절대 없다', () => {
    const { container } = render(
      <PersonaShareCard oneLine="차분한 빛을 품은 사람" badges={BADGES} season="spring" />
    );
    expect(container.querySelector('img')).toBeNull();
  });

  it('워터마크(유입 경로)가 포함된다', () => {
    render(<PersonaShareCard oneLine="한 줄" badges={[]} />);
    expect(screen.getByText(/yiroom\.vercel\.app/)).toBeInTheDocument();
  });

  it('시즌별 그라데이션을 적용하고, 시즌 미상은 브랜드 그라데이션으로 폴백한다', () => {
    const { rerender } = render(<PersonaShareCard oneLine="한 줄" badges={[]} season="spring" />);
    expect(screen.getByTestId('persona-share-card').className).toContain('from-orange-400');
    rerender(<PersonaShareCard oneLine="한 줄" badges={[]} season={null} />);
    expect(screen.getByTestId('persona-share-card').className).toContain('from-pink-500');
  });

  it('뱃지가 없으면 뱃지 영역을 렌더하지 않는다 (빈 칩 지어내기 금지)', () => {
    render(<PersonaShareCard oneLine="한 줄" badges={[]} />);
    expect(screen.queryByTestId('persona-share-badges')).toBeNull();
  });
});
