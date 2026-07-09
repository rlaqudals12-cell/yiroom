import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkincareRoutineCard } from '@/components/beauty/SkincareRoutineCard';
import type { RoutineItem } from '@/types/hybrid';

describe('SkincareRoutineCard', () => {
  const morningRoutine: RoutineItem[] = [
    { order: 1, category: 'cleanser', productName: '젠틀 클렌저', timing: 'morning' },
    { order: 2, category: 'toner', productName: '히알루론 토너', timing: 'morning' },
    { order: 3, category: 'serum', productName: '비타민C 세럼', timing: 'morning' },
    { order: 4, category: 'moisturizer', productName: '수분 크림', timing: 'morning' },
    { order: 5, category: 'sunscreen', productName: 'SPF50 선크림', timing: 'morning' },
  ];

  const eveningRoutine: RoutineItem[] = [
    { order: 1, category: 'cleanser', productName: '클렌징 오일', timing: 'evening' },
    { order: 2, category: 'cleanser', productName: '폼 클렌저', timing: 'evening' },
    { order: 3, category: 'toner', productName: '각질 토너', timing: 'evening' },
    { order: 4, category: 'serum', productName: '레티놀', timing: 'evening' },
  ];

  it('renders the card with test id', () => {
    render(<SkincareRoutineCard morningRoutine={morningRoutine} eveningRoutine={eveningRoutine} />);

    expect(screen.getByTestId('skincare-routine-card')).toBeInTheDocument();
  });

  it('displays morning and evening tabs', () => {
    render(<SkincareRoutineCard morningRoutine={morningRoutine} eveningRoutine={eveningRoutine} />);

    expect(screen.getByText('아침')).toBeInTheDocument();
    expect(screen.getByText('저녁')).toBeInTheDocument();
  });

  it('shows morning routine items by default', () => {
    render(<SkincareRoutineCard morningRoutine={morningRoutine} eveningRoutine={eveningRoutine} />);

    expect(screen.getByText('비타민C 세럼')).toBeInTheDocument();
    expect(screen.getByText('젠틀 클렌저')).toBeInTheDocument();
  });

  it('switches to evening routine when tab clicked', () => {
    render(<SkincareRoutineCard morningRoutine={morningRoutine} eveningRoutine={eveningRoutine} />);

    fireEvent.click(screen.getByText('저녁'));

    expect(screen.getByText('클렌징 오일')).toBeInTheDocument();
    expect(screen.getByText('레티놀')).toBeInTheDocument();
  });

  it('displays category labels for each item', () => {
    render(<SkincareRoutineCard morningRoutine={morningRoutine} eveningRoutine={eveningRoutine} />);

    // 카테고리 라벨이 표시됨 (중복 가능)
    expect(screen.getAllByText('클렌저').length).toBeGreaterThan(0);
    expect(screen.getAllByText('토너').length).toBeGreaterThan(0);
    expect(screen.getAllByText('세럼').length).toBeGreaterThan(0);
  });

  it('specName이 있으면 카테고리 라벨 대신 스펙명을 제목으로 표시한다 (U2)', () => {
    const withSpec: RoutineItem[] = [
      {
        order: 1,
        category: 'cleanser',
        specName: '약산성 클렌저',
        note: '장벽 자극이 적어요',
        timing: 'morning',
      },
      {
        order: 2,
        category: 'cream',
        specName: '세라마이드 크림',
        note: '장벽을 채워요',
        timing: 'morning',
      },
    ];
    render(<SkincareRoutineCard morningRoutine={withSpec} eveningRoutine={[]} />);

    // 스펙명이 제목으로 노출
    expect(screen.getByText('약산성 클렌저')).toBeInTheDocument();
    expect(screen.getByText('세라마이드 크림')).toBeInTheDocument();
    // 일반 카테고리 라벨("크림")은 스펙명으로 대체됨 → 노출 안 됨
    expect(screen.queryByText('크림')).not.toBeInTheDocument();
  });

  it('shows empty state when no items', () => {
    render(<SkincareRoutineCard morningRoutine={[]} eveningRoutine={[]} />);

    expect(screen.getByText(/루틴이 없습니다/)).toBeInTheDocument();
  });

  it('shows total steps count', () => {
    render(<SkincareRoutineCard morningRoutine={morningRoutine} eveningRoutine={eveningRoutine} />);

    // 아침 루틴은 5단계 - "총 5단계" 형식으로 표시됨
    expect(screen.getByText(/총/)).toBeInTheDocument();
    expect(screen.getByText(/단계/)).toBeInTheDocument();
  });
});
