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
    // 도메인은 코드베이스 정본(yiroom.app — OG·카카오·메타데이터와 통일)
    expect(screen.getByText(/yiroom\.app/)).toBeInTheDocument();
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

  it('퍼스널컬러 팔레트가 있으면 색상 스와치를 렌더한다 (시각적 바이럴 훅)', () => {
    render(
      <PersonaShareCard
        oneLine="한 줄"
        badges={[]}
        season="spring"
        palette={['#FFB6C1', '#E6E6FA', '#87CEEB']}
      />
    );
    expect(screen.getByTestId('persona-share-swatches').children).toHaveLength(3);
  });

  it('팔레트가 없으면 스와치 영역을 렌더하지 않는다 (지어내기 금지)', () => {
    render(<PersonaShareCard oneLine="한 줄" badges={[]} />);
    expect(screen.queryByTestId('persona-share-swatches')).toBeNull();
  });

  it('story 포맷은 9:16 세로(360px), square는 400px으로 렌더한다', () => {
    const { rerender } = render(<PersonaShareCard oneLine="한 줄" badges={[]} format="story" />);
    const card = screen.getByTestId('persona-share-card');
    expect(card.dataset.format).toBe('story');
    expect(card.className).toContain('w-[360px]');
    rerender(<PersonaShareCard oneLine="한 줄" badges={[]} format="square" />);
    expect(screen.getByTestId('persona-share-card').className).toContain('w-[400px]');
  });

  it('유입 CTA 문구를 렌더한다 (카드가 돌면 신규 유입 경로)', () => {
    render(<PersonaShareCard oneLine="한 줄" badges={[]} ctaText="나도 무료로 분석받기 →" />);
    expect(screen.getByText('나도 무료로 분석받기 →')).toBeInTheDocument();
  });
});
