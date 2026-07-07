/**
 * CrossDomainChallengeList 컴포넌트 테스트
 *
 * @description 크로스도메인 챌린지 목록 렌더링 테스트
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CrossDomainChallengeList } from '@/components/gamification/CrossDomainChallengeList';
import type { CrossDomainProgressView } from '@/lib/gamification/cross-domain-challenges';

const mockViews: CrossDomainProgressView[] = [
  {
    challengeId: 'cross-triple-start',
    name: '트리플 스타트',
    description: '뷰티 분석, 운동, 식단 기록을 각 1회 완료하세요.',
    domainProgress: [
      { domain: 'beauty', current: 0, target: 1, completed: false },
      { domain: 'workout', current: 0, target: 1, completed: false },
      { domain: 'nutrition', current: 0, target: 1, completed: false },
    ],
    overallPercent: 0,
    allCompleted: false,
    xpReward: 150,
  },
  {
    challengeId: 'cross-weekly-balance',
    name: '주간 균형 케어',
    description: '일주일간 운동 3회 + 식단 5회 + 스킨케어 기록 3회.',
    domainProgress: [
      { domain: 'workout', current: 1, target: 3, completed: false },
      { domain: 'nutrition', current: 2, target: 5, completed: false },
      { domain: 'beauty', current: 0, target: 3, completed: false },
    ],
    overallPercent: 27,
    allCompleted: false,
    xpReward: 300,
  },
];

describe('CrossDomainChallengeList', () => {
  it('목록이 정상 렌더링된다', () => {
    render(<CrossDomainChallengeList views={mockViews} />);
    expect(screen.getByTestId('cross-domain-challenge-list')).toBeInTheDocument();
  });

  it('모든 챌린지 카드가 표시된다', () => {
    render(<CrossDomainChallengeList views={mockViews} />);
    expect(screen.getAllByTestId('cross-domain-challenge-card')).toHaveLength(2);
  });

  it('챌린지 이름이 표시된다', () => {
    render(<CrossDomainChallengeList views={mockViews} />);
    expect(screen.getByText('트리플 스타트')).toBeInTheDocument();
    expect(screen.getByText('주간 균형 케어')).toBeInTheDocument();
  });

  it('빈 목록일 때 안내 메시지가 표시된다', () => {
    render(<CrossDomainChallengeList views={[]} />);
    expect(screen.getByTestId('cross-domain-challenge-list-empty')).toBeInTheDocument();
    // i18n 전환: 안내 문구가 t('crossDomainChallengeList0')(ko: "참여 가능한 크로스도메인 챌린지가 없어요.") 키로 렌더된다 (테스트 목은 키 반환).
    expect(screen.getByText('crossDomainChallengeList0')).toBeInTheDocument();
  });

  it('className prop이 적용된다', () => {
    render(<CrossDomainChallengeList views={mockViews} className="custom-class" />);
    expect(screen.getByTestId('cross-domain-challenge-list')).toHaveClass('custom-class');
  });
});
