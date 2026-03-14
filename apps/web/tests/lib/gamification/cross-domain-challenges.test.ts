import { describe, it, expect } from 'vitest';
import {
  CROSS_DOMAIN_CHALLENGES,
  calculateCrossDomainProgress,
  calculateOverallProgress,
  buildCrossDomainView,
  getCrossDomainChallengeById,
  getAvailableCrossDomainChallenges,
  getIncompleteDomainMessages,
} from '@/lib/gamification/cross-domain-challenges';

describe('CROSS_DOMAIN_CHALLENGES', () => {
  it('5개 이상의 크로스도메인 챌린지가 정의되어야 한다', () => {
    expect(CROSS_DOMAIN_CHALLENGES.length).toBeGreaterThanOrEqual(5);
  });

  it('모든 챌린지의 domain이 cross여야 한다', () => {
    CROSS_DOMAIN_CHALLENGES.forEach((c) => {
      expect(c.domain).toBe('cross');
    });
  });

  it('모든 챌린지에 requirements가 있어야 한다', () => {
    CROSS_DOMAIN_CHALLENGES.forEach((c) => {
      expect(c.requirements.length).toBeGreaterThan(0);
    });
  });

  it('targetCount가 requirements의 count 합과 일치해야 한다', () => {
    CROSS_DOMAIN_CHALLENGES.forEach((c) => {
      const totalCount = c.requirements.reduce((sum, r) => sum + r.count, 0);
      expect(c.targetCount).toBe(totalCount);
    });
  });

  it('모든 챌린지 ID가 고유해야 한다', () => {
    const ids = CROSS_DOMAIN_CHALLENGES.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('xpReward가 0보다 커야 한다', () => {
    CROSS_DOMAIN_CHALLENGES.forEach((c) => {
      expect(c.xpReward).toBeGreaterThan(0);
    });
  });
});

describe('calculateCrossDomainProgress', () => {
  const tripleStart = CROSS_DOMAIN_CHALLENGES.find((c) => c.id === 'cross-triple-start')!;

  it('활동이 없으면 모든 도메인이 current=0이어야 한다', () => {
    const progress = calculateCrossDomainProgress(tripleStart, {});
    progress.forEach((dp) => {
      expect(dp.current).toBe(0);
      expect(dp.completed).toBe(false);
    });
  });

  it('활동이 충분하면 completed=true여야 한다', () => {
    const progress = calculateCrossDomainProgress(tripleStart, {
      beauty: 1,
      workout: 1,
      nutrition: 1,
    });
    progress.forEach((dp) => {
      expect(dp.completed).toBe(true);
    });
  });

  it('일부만 달성하면 해당 도메인만 completed여야 한다', () => {
    const progress = calculateCrossDomainProgress(tripleStart, {
      beauty: 1,
      workout: 0,
      nutrition: 1,
    });
    const beautyDp = progress.find((dp) => dp.domain === 'beauty');
    const workoutDp = progress.find((dp) => dp.domain === 'workout');
    expect(beautyDp?.completed).toBe(true);
    expect(workoutDp?.completed).toBe(false);
  });

  it('current가 target을 초과하지 않아야 한다', () => {
    const progress = calculateCrossDomainProgress(tripleStart, {
      beauty: 100,
      workout: 100,
      nutrition: 100,
    });
    progress.forEach((dp) => {
      expect(dp.current).toBeLessThanOrEqual(dp.target);
    });
  });
});

describe('calculateOverallProgress', () => {
  it('빈 배열이면 0을 반환해야 한다', () => {
    expect(calculateOverallProgress([])).toBe(0);
  });

  it('모든 도메인 완료 시 100을 반환해야 한다', () => {
    const progress = [
      { domain: 'beauty' as const, current: 1, target: 1, completed: true },
      { domain: 'workout' as const, current: 1, target: 1, completed: true },
    ];
    expect(calculateOverallProgress(progress)).toBe(100);
  });

  it('절반 달성 시 약 50%를 반환해야 한다', () => {
    const progress = [
      { domain: 'beauty' as const, current: 1, target: 2, completed: false },
      { domain: 'workout' as const, current: 1, target: 2, completed: false },
    ];
    expect(calculateOverallProgress(progress)).toBe(50);
  });

  it('0-100 범위여야 한다', () => {
    const progress = [{ domain: 'beauty' as const, current: 100, target: 1, completed: true }];
    const result = calculateOverallProgress(progress);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('buildCrossDomainView', () => {
  const challenge = CROSS_DOMAIN_CHALLENGES[0];

  it('유효한 뷰 객체를 반환해야 한다', () => {
    const view = buildCrossDomainView(challenge, {});
    expect(view.challengeId).toBe(challenge.id);
    expect(view.name).toBe(challenge.name);
    expect(view.domainProgress.length).toBeGreaterThan(0);
    expect(view.overallPercent).toBeGreaterThanOrEqual(0);
    expect(view.xpReward).toBeGreaterThan(0);
  });

  it('활동이 없으면 allCompleted=false여야 한다', () => {
    const view = buildCrossDomainView(challenge, {});
    expect(view.allCompleted).toBe(false);
  });

  it('모든 조건 충족 시 allCompleted=true여야 한다', () => {
    const counts: Record<string, number> = {};
    challenge.requirements.forEach((r) => {
      counts[r.domain] = r.count;
    });
    const view = buildCrossDomainView(challenge, counts);
    expect(view.allCompleted).toBe(true);
    expect(view.overallPercent).toBe(100);
  });
});

describe('getCrossDomainChallengeById', () => {
  it('존재하는 ID로 챌린지를 찾아야 한다', () => {
    const challenge = getCrossDomainChallengeById('cross-triple-start');
    expect(challenge).toBeDefined();
    expect(challenge!.id).toBe('cross-triple-start');
  });

  it('존재하지 않는 ID는 undefined를 반환해야 한다', () => {
    const challenge = getCrossDomainChallengeById('nonexistent');
    expect(challenge).toBeUndefined();
  });
});

describe('getAvailableCrossDomainChallenges', () => {
  it('레벨 1에서 easy 챌린지가 포함되어야 한다', () => {
    const available = getAvailableCrossDomainChallenges(1);
    expect(available.length).toBeGreaterThan(0);
    expect(available.some((c) => c.difficulty === 'easy')).toBe(true);
  });

  it('레벨이 부족하면 hard 챌린지가 제외되어야 한다', () => {
    const available = getAvailableCrossDomainChallenges(1);
    const hardChallenges = available.filter((c) => c.minLevel > 1);
    expect(hardChallenges).toHaveLength(0);
  });

  it('완료된 챌린지는 제외되어야 한다', () => {
    const available = getAvailableCrossDomainChallenges(10, ['cross-triple-start']);
    expect(available.some((c) => c.id === 'cross-triple-start')).toBe(false);
  });

  it('높은 레벨에서 모든 챌린지가 포함되어야 한다', () => {
    const available = getAvailableCrossDomainChallenges(99);
    expect(available.length).toBe(CROSS_DOMAIN_CHALLENGES.length);
  });
});

describe('getIncompleteDomainMessages', () => {
  it('모든 도메인 완료 시 빈 배열을 반환해야 한다', () => {
    const progress = [
      { domain: 'beauty' as const, current: 1, target: 1, completed: true },
      { domain: 'workout' as const, current: 1, target: 1, completed: true },
    ];
    const messages = getIncompleteDomainMessages(progress);
    expect(messages).toHaveLength(0);
  });

  it('미완료 도메인에 대한 메시지를 생성해야 한다', () => {
    const progress = [
      { domain: 'beauty' as const, current: 0, target: 1, completed: false },
      { domain: 'workout' as const, current: 2, target: 3, completed: false },
      { domain: 'nutrition' as const, current: 5, target: 5, completed: true },
    ];
    const messages = getIncompleteDomainMessages(progress);
    expect(messages).toHaveLength(2);
    expect(messages[0]).toContain('뷰티');
    expect(messages[0]).toContain('1회');
    expect(messages[1]).toContain('운동');
    expect(messages[1]).toContain('1회');
  });
});
