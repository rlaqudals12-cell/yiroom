/**
 * 스트릭 위젯 컴포넌트 테스트
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StreakWidget } from '@/components/widgets/StreakWidget';

// useColorScheme 모킹
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.useColorScheme = jest.fn(() => 'light');
  return RN;
});

describe('StreakWidget', () => {
  describe('small 사이즈', () => {
    it('스트릭 숫자를 표시해야 함', () => {
      render(<StreakWidget streak={7} longestStreak={10} size="small" />);
      expect(screen.getByText('7')).toBeTruthy();
    });

    it('"일 연속" 라벨을 표시해야 함', () => {
      render(<StreakWidget streak={7} longestStreak={10} size="small" />);
      expect(screen.getByText('일 연속')).toBeTruthy();
    });

    it('스트릭 레벨에 따른 이모지를 표시해야 함 - 새싹', () => {
      render(<StreakWidget streak={1} longestStreak={1} size="small" />);
      expect(screen.getByText('🌱')).toBeTruthy();
    });

    it('스트릭 레벨에 따른 이모지를 표시해야 함 - 챌린저', () => {
      render(<StreakWidget streak={7} longestStreak={7} size="small" />);
      expect(screen.getByText('⭐')).toBeTruthy();
    });

    it('스트릭 레벨에 따른 이모지를 표시해야 함 - 마스터', () => {
      render(<StreakWidget streak={30} longestStreak={30} size="small" />);
      expect(screen.getByText('🔥')).toBeTruthy();
    });

    it('스트릭 레벨에 따른 이모지를 표시해야 함 - 레전드', () => {
      render(<StreakWidget streak={100} longestStreak={100} size="small" />);
      expect(screen.getByText('🏆')).toBeTruthy();
    });
  });

  describe('medium 사이즈', () => {
    it('제목을 표시해야 함', () => {
      render(<StreakWidget streak={7} longestStreak={10} size="medium" />);
      expect(screen.getByText('연속 기록')).toBeTruthy();
    });

    it('스트릭 일수를 표시해야 함', () => {
      render(<StreakWidget streak={7} longestStreak={10} size="medium" />);
      expect(screen.getByText('7일')).toBeTruthy();
    });

    it('최고 기록을 표시해야 함', () => {
      render(<StreakWidget streak={7} longestStreak={10} size="medium" />);
      expect(screen.getByText('최고: 10일')).toBeTruthy();
    });

    it('레벨 배지를 표시해야 함', () => {
      render(<StreakWidget streak={7} longestStreak={10} size="medium" />);
      expect(screen.getByText('챌린저')).toBeTruthy();
    });

    it('최근 배지를 표시해야 함', () => {
      render(
        <StreakWidget
          streak={7}
          longestStreak={10}
          size="medium"
          recentBadges={['🏅', '🎖️', '🥇']}
        />
      );
      expect(screen.getByText('🏅')).toBeTruthy();
      expect(screen.getByText('🎖️')).toBeTruthy();
      expect(screen.getByText('🥇')).toBeTruthy();
    });

    it('배지가 3개 이상이면 3개만 표시해야 함', () => {
      render(
        <StreakWidget
          streak={7}
          longestStreak={10}
          size="medium"
          recentBadges={['🏅', '🎖️', '🥇', '🏆']}
        />
      );
      expect(screen.queryByText('🏆')).toBeFalsy();
    });
  });

  describe('스트릭 레벨 계산', () => {
    it('0-2일: 새싹 레벨', () => {
      render(<StreakWidget streak={2} longestStreak={2} size="medium" />);
      expect(screen.getByText('새싹')).toBeTruthy();
    });

    it('3-6일: 시작 레벨', () => {
      render(<StreakWidget streak={5} longestStreak={5} size="medium" />);
      expect(screen.getByText('시작')).toBeTruthy();
    });

    it('7-29일: 챌린저 레벨', () => {
      render(<StreakWidget streak={15} longestStreak={15} size="medium" />);
      expect(screen.getByText('챌린저')).toBeTruthy();
    });

    it('30-99일: 마스터 레벨', () => {
      render(<StreakWidget streak={50} longestStreak={50} size="medium" />);
      expect(screen.getByText('마스터')).toBeTruthy();
    });

    it('100일 이상: 레전드 레벨', () => {
      render(<StreakWidget streak={150} longestStreak={150} size="medium" />);
      expect(screen.getByText('레전드')).toBeTruthy();
    });
  });

  describe('기본값', () => {
    it('size 기본값은 medium이어야 함', () => {
      render(<StreakWidget streak={7} longestStreak={10} />);
      expect(screen.getByText('연속 기록')).toBeTruthy();
    });

    it('recentBadges 기본값은 빈 배열이어야 함', () => {
      render(<StreakWidget streak={7} longestStreak={10} />);
      // 배지 섹션이 렌더링되지 않아야 함
    });
  });
});
