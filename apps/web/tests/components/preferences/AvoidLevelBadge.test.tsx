/**
 * AvoidLevelBadge 컴포넌트 테스트
 */

import { render, screen } from '@testing-library/react';
import { AvoidLevelBadge, AvoidLevelBadgeGroup } from '@/components/preferences/AvoidLevelBadge';
import type { AvoidLevel } from '@/types/preferences';

describe('AvoidLevelBadge', () => {
  it('dislike 레벨 렌더링', () => {
    render(<AvoidLevelBadge level="dislike" />);

    const badge = screen.getByTestId('avoid-level-badge-dislike');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('안 좋아해요');
    expect(badge).toHaveAttribute('role', 'status');
  });

  it('avoid 레벨 렌더링', () => {
    render(<AvoidLevelBadge level="avoid" />);

    const badge = screen.getByTestId('avoid-level-badge-avoid');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('피하고 싶어요');
  });

  it('cannot 레벨 렌더링 (위험 표시)', () => {
    render(<AvoidLevelBadge level="cannot" />);

    const badge = screen.getByTestId('avoid-level-badge-cannot');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('못 먹어요');
    expect(badge).toHaveTextContent('⚠️');
  });

  it('danger 레벨 렌더링 (위험 표시)', () => {
    render(<AvoidLevelBadge level="danger" />);

    const badge = screen.getByTestId('avoid-level-badge-danger');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('절대 안 돼요');
    expect(badge).toHaveTextContent('⚠️');
  });

  it('영문 로케일 지원', () => {
    render(<AvoidLevelBadge level="dislike" locale="en" />);

    const badge = screen.getByTestId('avoid-level-badge-dislike');
    expect(badge).toHaveTextContent("I don't like it");
  });

  it('아이콘 표시 여부', () => {
    // 이모지 아이콘 글리프는 제거됨(AVOID_LEVEL_COLORS.icon = '', 이모지 정리 폴리시).
    // showIcon은 아이콘 슬롯(span[title=레이블]) 렌더 여부만 제어한다.
    const { rerender } = render(<AvoidLevelBadge level="avoid" showIcon={true} />);
    let badge = screen.getByTestId('avoid-level-badge-avoid');
    expect(badge.querySelector('span[title="피하고 싶어요"]')).toBeInTheDocument();

    rerender(<AvoidLevelBadge level="avoid" showIcon={false} />);
    badge = screen.getByTestId('avoid-level-badge-avoid');
    expect(badge.querySelector('span[title="피하고 싶어요"]')).not.toBeInTheDocument();
  });

  it('크기별 렌더링', () => {
    const { rerender } = render(<AvoidLevelBadge level="avoid" size="sm" />);
    let badge = screen.getByTestId('avoid-level-badge-avoid');
    expect(badge).toHaveClass('text-xs');

    rerender(<AvoidLevelBadge level="avoid" size="lg" />);
    badge = screen.getByTestId('avoid-level-badge-avoid');
    expect(badge).toHaveClass('text-base');
  });

  it('커스텀 className 적용', () => {
    render(<AvoidLevelBadge level="avoid" className="custom-class" />);

    const badge = screen.getByTestId('avoid-level-badge-avoid');
    expect(badge).toHaveClass('custom-class');
  });

  it('접근성 속성 확인', () => {
    render(<AvoidLevelBadge level="cannot" />);

    const badge = screen.getByTestId('avoid-level-badge-cannot');
    expect(badge).toHaveAttribute('aria-label', expect.stringContaining('기피 수준'));
    expect(badge).toHaveAttribute('role', 'status');
  });
});

describe('AvoidLevelBadgeGroup', () => {
  it('여러 레벨 렌더링', () => {
    const levels: AvoidLevel[] = ['dislike', 'avoid', 'cannot'];
    render(<AvoidLevelBadgeGroup levels={levels} />);

    expect(screen.getByTestId('avoid-level-badge-dislike')).toBeInTheDocument();
    expect(screen.getByTestId('avoid-level-badge-avoid')).toBeInTheDocument();
    expect(screen.getByTestId('avoid-level-badge-cannot')).toBeInTheDocument();
  });

  it('빈 레벨 목록 처리', () => {
    const { container } = render(<AvoidLevelBadgeGroup levels={[]} />);

    // 컨테이너가 렌더링되지 않음
    expect(container.firstChild).toBeNull();
  });

  it('최대 표시 개수 초과 시 +N 표시', () => {
    const levels: AvoidLevel[] = ['dislike', 'avoid', 'cannot', 'danger'];
    render(<AvoidLevelBadgeGroup levels={levels} maxShow={2} />);

    expect(screen.getByTestId('avoid-level-badge-dislike')).toBeInTheDocument();
    expect(screen.getByTestId('avoid-level-badge-avoid')).toBeInTheDocument();
    expect(screen.queryByTestId('avoid-level-badge-cannot')).not.toBeInTheDocument();
    expect(screen.queryByTestId('avoid-level-badge-danger')).not.toBeInTheDocument();

    // +N 배지 확인
    const group = screen.getByTestId('avoid-level-badge-group');
    expect(group).toHaveTextContent('+2');
  });

  it('접근성 역할 확인', () => {
    const levels: AvoidLevel[] = ['dislike', 'avoid'];
    render(<AvoidLevelBadgeGroup levels={levels} />);

    const group = screen.getByTestId('avoid-level-badge-group');
    expect(group).toHaveAttribute('role', 'list');

    const badges = group.querySelectorAll('[role="listitem"]');
    expect(badges).toHaveLength(2);
  });

  it('다국어 지원', () => {
    const levels: AvoidLevel[] = ['dislike', 'avoid'];
    render(<AvoidLevelBadgeGroup levels={levels} locale="en" />);

    expect(screen.getByTestId('avoid-level-badge-dislike')).toHaveTextContent("I don't like it");
    expect(screen.getByTestId('avoid-level-badge-avoid')).toHaveTextContent('I prefer to avoid');
  });
});
