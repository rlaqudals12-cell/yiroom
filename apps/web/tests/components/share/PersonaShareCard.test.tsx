import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PersonaShareCard } from '@/components/share/PersonaShareCard';

// 서명 뱃지 = 퍼컬 외 축(퍼컬은 toneName 히어로가 담당 — 중복 금지 계약)
const BADGES = [
  { label: '피부', value: '복합성' },
  { label: '체형', value: 'W (웨이브)' },
];

const PALETTE = [
  { hex: '#C79AA0', name: '더스티 로즈' },
  { hex: '#9A86A6', name: '소프트 라일락' },
  { hex: '#A7BACF', name: '파우더 블루' },
];

describe('PersonaShareCard — V2 정체성 포토카드', () => {
  it('진단명이 히어로, 은유는 서브카피로 렌더한다 (자랑 위계 = 라벨 > 문장)', () => {
    render(
      <PersonaShareCard oneLine="차분한 빛을 품은 사람" toneName="뮤티드 서머" badges={BADGES} />
    );
    expect(screen.getByTestId('persona-share-hero')).toHaveTextContent('뮤티드 서머');
    expect(screen.getByTestId('persona-share-oneline')).toHaveTextContent('차분한 빛을 품은 사람');
  });

  it('진단명이 없으면(퍼컬 실패) 은유가 히어로 자리를 유지한다', () => {
    render(<PersonaShareCard oneLine="차분한 빛을 품은 사람" badges={BADGES} />);
    expect(screen.getByTestId('persona-share-hero')).toHaveTextContent('차분한 빛을 품은 사람');
    // 서브카피는 렌더하지 않는다(같은 문장 중복 금지)
    expect(screen.queryByTestId('persona-share-oneline')).toBeNull();
  });

  it('생체정보 보호 — 카드에 이미지(사진) 요소가 절대 없다', () => {
    const { container } = render(
      <PersonaShareCard oneLine="한 줄" toneName="뮤티드 서머" badges={BADGES} palette={PALETTE} />
    );
    expect(container.querySelector('img')).toBeNull();
  });

  it('워터마크(유입 경로)와 초대 문구를 렌더한다 (카드 = 테스트 초대장)', () => {
    render(<PersonaShareCard oneLine="한 줄" badges={[]} inviteText="너의 계절은?" />);
    expect(screen.getByText(/yiroom\.app/)).toBeInTheDocument();
    expect(screen.getByTestId('persona-share-invite')).toHaveTextContent('너의 계절은?');
  });

  it('블러시 크림 배경(브랜드 정합) — 그라데이션·슬롭을 쓰지 않는다', () => {
    render(<PersonaShareCard oneLine="한 줄" badges={[]} />);
    const cls = screen.getByTestId('persona-share-card').className;
    expect(cls).toContain('bg-[#FBF3F1]');
    // AI-slop 신호(보라 그라데) 부재 회귀 가드
    expect(cls).not.toContain('gradient');
    expect(cls).not.toContain('purple');
  });

  it('발급 번호는 실제 값이 있을 때만 6자리 패딩으로 렌더한다 (지어내기 금지)', () => {
    const { rerender } = render(<PersonaShareCard oneLine="한 줄" badges={[]} serialNo={42} />);
    expect(screen.getByTestId('persona-share-serial')).toHaveTextContent('No.000042');
    rerender(<PersonaShareCard oneLine="한 줄" badges={[]} serialNo={null} />);
    expect(screen.queryByTestId('persona-share-serial')).toBeNull();
    rerender(<PersonaShareCard oneLine="한 줄" badges={[]} serialNo={0} />);
    expect(screen.queryByTestId('persona-share-serial')).toBeNull();
  });

  it('성공 축이 없으면 서명 값 텍스트를 지어내지 않는다', () => {
    render(<PersonaShareCard oneLine="한 줄" badges={[]} />);
    expect(screen.queryByText(/·/)).toBeNull();
  });

  it('베스트 팔레트를 색이름과 함께 렌더한다 (진단 색 = 주인공)', () => {
    render(<PersonaShareCard oneLine="한 줄" badges={[]} palette={PALETTE} />);
    expect(screen.getByTestId('persona-share-swatches').children).toHaveLength(3);
    expect(screen.getByText('더스티 로즈')).toBeInTheDocument();
    expect(screen.getByText('Best colors')).toBeInTheDocument();
  });

  it('색이름이 일부만 있으면 이름을 아예 렌더하지 않는다 (컬럼 정렬 유지·지어내기 금지)', () => {
    render(
      <PersonaShareCard
        oneLine="한 줄"
        badges={[]}
        palette={[{ hex: '#C79AA0', name: '더스티 로즈' }, { hex: '#9A86A6' }]}
      />
    );
    expect(screen.queryByText('더스티 로즈')).toBeNull();
  });

  it('피해야 할 색이 있으면 Avoid 소밴드를 렌더한다 (재미·전문성 신호)', () => {
    render(
      <PersonaShareCard
        oneLine="한 줄"
        badges={[]}
        worstPalette={[{ hex: '#FF5A4E' }, { hex: '#FFD23F' }]}
      />
    );
    const worst = screen.getByTestId('persona-share-worst');
    expect(worst).toBeInTheDocument();
    expect(screen.getByText('Avoid')).toBeInTheDocument();
    // 취소선 오버레이 — 진단지 리포트와 동일한 부정 표기(축소 썸네일에서 추천색 오독 방지)
    const chips = worst.querySelectorAll<HTMLElement>(':scope > span:last-child > span');
    expect(chips).toHaveLength(2);
    expect(chips[0].style.backgroundImage).toContain('linear-gradient(135deg');
  });

  it('팔레트·워스트가 없으면 해당 영역을 렌더하지 않는다 (지어내기 금지)', () => {
    render(<PersonaShareCard oneLine="한 줄" badges={[]} />);
    expect(screen.queryByTestId('persona-share-swatches')).toBeNull();
    expect(screen.queryByTestId('persona-share-worst')).toBeNull();
  });

  it('story 포맷은 9:16 세로(360px), square는 400px으로 렌더한다', () => {
    const { rerender } = render(<PersonaShareCard oneLine="한 줄" badges={[]} format="story" />);
    const card = screen.getByTestId('persona-share-card');
    expect(card.dataset.format).toBe('story');
    expect(card.className).toContain('w-[360px]');
    rerender(<PersonaShareCard oneLine="한 줄" badges={[]} format="square" />);
    expect(screen.getByTestId('persona-share-card').className).toContain('w-[400px]');
  });

  it('포일 마감은 data-finish로 구분되고 기본은 매트다', () => {
    const { rerender } = render(<PersonaShareCard oneLine="한 줄" badges={[]} />);
    expect(screen.getByTestId('persona-share-card').dataset.finish).toBe('matte');
    rerender(<PersonaShareCard oneLine="한 줄" badges={[]} finish="foil" />);
    expect(screen.getByTestId('persona-share-card').dataset.finish).toBe('foil');
  });
});
