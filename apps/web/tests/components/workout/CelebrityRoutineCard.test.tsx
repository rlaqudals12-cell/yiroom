import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CelebrityRoutineCard from '@/components/workout/result/CelebrityRoutineCard';
import { CelebrityMatchResult } from '@/types/workout';
import { matchCelebrityRoutines } from '@/lib/celebrityMatching';

// 테스트용 매칭 결과 (실제 데이터 사용)
const mockMatchResults = matchCelebrityRoutines('X', 'Summer', { limit: 3 });

// 빈 결과용
const emptyMatchResults: CelebrityMatchResult[] = [];

describe('CelebrityRoutineCard', () => {
  it('renders without crashing', () => {
    render(
      <CelebrityRoutineCard
        matchResults={mockMatchResults}
        bodyType="X"
        personalColor="Summer"
      />
    );
    expect(screen.getByTestId('celebrity-routine-card')).toBeInTheDocument();
  });

  it('displays the header with 연예인 루틴', () => {
    render(
      <CelebrityRoutineCard
        matchResults={mockMatchResults}
        bodyType="X"
        personalColor="Summer"
      />
    );
    expect(screen.getByText('연예인 루틴')).toBeInTheDocument();
  });

  it('displays the matching title', () => {
    render(
      <CelebrityRoutineCard
        matchResults={mockMatchResults}
        bodyType="X"
        personalColor="Summer"
      />
    );
    expect(
      screen.getByText('X자 체형 + 여름 쿨 타입 연예인의 운동법')
    ).toBeInTheDocument();
  });

  it('displays celebrity items', () => {
    render(
      <CelebrityRoutineCard
        matchResults={mockMatchResults}
        bodyType="X"
        personalColor="Summer"
      />
    );

    // 매칭된 연예인들이 표시되는지 확인
    mockMatchResults.forEach((result) => {
      expect(
        screen.getByTestId(`celebrity-item-${result.celebrity.id}`)
      ).toBeInTheDocument();
      expect(screen.getByText(result.celebrity.name)).toBeInTheDocument();
    });
  });

  it('displays celebrity group if exists', () => {
    render(
      <CelebrityRoutineCard
        matchResults={mockMatchResults}
        bodyType="X"
        personalColor="Summer"
      />
    );

    // BLACKPINK 그룹이 있는 연예인 (제니, 지수 등)
    const hasGroup = mockMatchResults.some(
      (r) => r.celebrity.group === 'BLACKPINK'
    );
    if (hasGroup) {
      // 여러 명이 같은 그룹일 수 있으므로 getAllByText 사용
      const groupElements = screen.getAllByText('(BLACKPINK)');
      expect(groupElements.length).toBeGreaterThan(0);
    }
  });

  it('displays match type badge', () => {
    render(
      <CelebrityRoutineCard
        matchResults={mockMatchResults}
        bodyType="X"
        personalColor="Summer"
      />
    );

    // 정확 매칭이 있으면 '완벽 매칭' 배지 표시
    const hasExactMatch = mockMatchResults.some((r) => r.matchType === 'exact');
    if (hasExactMatch) {
      expect(screen.getAllByText('완벽 매칭').length).toBeGreaterThan(0);
    }
  });

  it('displays body type and PC info', () => {
    render(
      <CelebrityRoutineCard
        matchResults={mockMatchResults}
        bodyType="X"
        personalColor="Summer"
      />
    );

    // 체형과 PC 정보가 표시되는지 확인
    expect(screen.getAllByText(/체형:/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/PC:/)[0]).toBeInTheDocument();
  });

  it('displays routine types', () => {
    render(
      <CelebrityRoutineCard
        matchResults={mockMatchResults}
        bodyType="X"
        personalColor="Summer"
      />
    );

    // 루틴 타입 (필라테스, 웨이트 등)이 표시되는지 확인
    const routineTypes = ['필라테스', '웨이트', '요가', '댄스', '유산소', '홈트'];
    const foundTypes = routineTypes.filter((type) =>
      screen.queryAllByText(type).length > 0
    );
    expect(foundTypes.length).toBeGreaterThan(0);
  });

  it('displays recommended routine info', () => {
    render(
      <CelebrityRoutineCard
        matchResults={mockMatchResults}
        bodyType="X"
        personalColor="Summer"
      />
    );

    // 추천 루틴이 있으면 루틴 이름이 표시됨
    const hasRoutine = mockMatchResults.some((r) => r.recommendedRoutine);
    if (hasRoutine) {
      const firstRoutine = mockMatchResults.find(
        (r) => r.recommendedRoutine
      )?.recommendedRoutine;
      if (firstRoutine) {
        expect(screen.getByText(firstRoutine.name)).toBeInTheDocument();
      }
    }
  });

  it('displays follow button when onFollowClick is provided', () => {
    const onFollowClick = vi.fn();
    render(
      <CelebrityRoutineCard
        matchResults={mockMatchResults}
        bodyType="X"
        personalColor="Summer"
        onFollowClick={onFollowClick}
      />
    );

    const followButtons = screen.getAllByText('따라하기');
    expect(followButtons.length).toBeGreaterThan(0);
  });

  it('calls onFollowClick when follow button is clicked', () => {
    const onFollowClick = vi.fn();
    render(
      <CelebrityRoutineCard
        matchResults={mockMatchResults}
        bodyType="X"
        personalColor="Summer"
        onFollowClick={onFollowClick}
      />
    );

    const followButtons = screen.getAllByText('따라하기');
    fireEvent.click(followButtons[0]);

    expect(onFollowClick).toHaveBeenCalledTimes(1);
    expect(onFollowClick).toHaveBeenCalledWith(
      mockMatchResults[0].celebrity.id,
      mockMatchResults[0].recommendedRoutine?.name
    );
  });

  it('renders empty state when no match results', () => {
    render(
      <CelebrityRoutineCard
        matchResults={emptyMatchResults}
        bodyType="O"
        personalColor="Spring"
      />
    );

    expect(
      screen.getByText('아직 매칭된 연예인이 없습니다')
    ).toBeInTheDocument();
    expect(
      screen.getByText('더 많은 연예인 루틴이 곧 추가될 예정이에요')
    ).toBeInTheDocument();
  });

  it('displays correct count message for exact matches', () => {
    const exactMatches = mockMatchResults.filter((r) => r.matchType === 'exact');
    if (exactMatches.length > 0) {
      render(
        <CelebrityRoutineCard
          matchResults={exactMatches}
          bodyType="X"
          personalColor="Summer"
        />
      );

      expect(
        screen.getByText(
          `${exactMatches.length}명의 연예인이 같은 체형+PC 타입이에요`
        )
      ).toBeInTheDocument();
    }
  });

  it('displays similar message for partial matches', () => {
    const partialMatches = mockMatchResults.filter(
      (r) => r.matchType !== 'exact'
    );
    if (partialMatches.length > 0 && partialMatches[0].matchType !== 'exact') {
      render(
        <CelebrityRoutineCard
          matchResults={partialMatches}
          bodyType="X"
          personalColor="Winter"
        />
      );

      expect(
        screen.getByText('비슷한 체형의 연예인 루틴을 추천해드려요')
      ).toBeInTheDocument();
    }
  });

  it('does not show follow button when onFollowClick is not provided', () => {
    render(
      <CelebrityRoutineCard
        matchResults={mockMatchResults}
        bodyType="X"
        personalColor="Summer"
      />
    );

    expect(screen.queryByText('따라하기')).not.toBeInTheDocument();
  });
});
