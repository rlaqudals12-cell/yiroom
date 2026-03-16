/**
 * 크로스도메인 챌린지 시스템 테스트
 *
 * 5종 챌린지 정의 검증 + 진행률 계산 함수 테스트
 */

import {
  CROSS_DOMAIN_CHALLENGES,
  DOMAIN_LABELS,
  DOMAIN_COLORS,
  DOMAIN_BG_COLORS,
  DIFFICULTY_CONFIG,
  calculateCrossDomainProgress,
  calculateOverallProgress,
  buildCrossDomainView,
  getCrossDomainChallengeById,
  getAvailableCrossDomainChallenges,
  getIncompleteDomainMessages,
  type CrossDomainChallengeDefinition,
  type DomainProgress,
} from '../../../lib/gamification/cross-domain-challenges';

// ============================================
// 챌린지 정의 검증
// ============================================

describe('CROSS_DOMAIN_CHALLENGES', () => {
  it('5종 챌린지가 정의되어 있어야 한다', () => {
    expect(CROSS_DOMAIN_CHALLENGES).toHaveLength(5);
  });

  it('모든 챌린지에 필수 필드가 있어야 한다', () => {
    for (const challenge of CROSS_DOMAIN_CHALLENGES) {
      expect(challenge.id).toBeTruthy();
      expect(challenge.name).toBeTruthy();
      expect(challenge.description).toBeTruthy();
      expect(['easy', 'medium', 'hard']).toContain(challenge.difficulty);
      expect(challenge.targetCount).toBeGreaterThan(0);
      expect(challenge.xpReward).toBeGreaterThan(0);
      expect(challenge.minLevel).toBeGreaterThanOrEqual(1);
      expect(challenge.durationDays).toBeGreaterThan(0);
      expect(challenge.requirements.length).toBeGreaterThan(0);
    }
  });

  it('각 챌린지의 targetCount는 requirements의 count 합계와 일치해야 한다', () => {
    for (const challenge of CROSS_DOMAIN_CHALLENGES) {
      const sum = challenge.requirements.reduce((acc, r) => acc + r.count, 0);
      expect(challenge.targetCount).toBe(sum);
    }
  });

  it('챌린지 ID가 고유해야 한다', () => {
    const ids = CROSS_DOMAIN_CHALLENGES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cross-triple-start는 easy 난이도, 레벨 1이어야 한다', () => {
    const tripleStart = CROSS_DOMAIN_CHALLENGES.find((c) => c.id === 'cross-triple-start');
    expect(tripleStart).toBeDefined();
    expect(tripleStart!.difficulty).toBe('easy');
    expect(tripleStart!.minLevel).toBe(1);
    expect(tripleStart!.requirements).toHaveLength(3);
  });

  it('cross-total-care-master는 hard 난이도, 레벨 5이어야 한다', () => {
    const master = CROSS_DOMAIN_CHALLENGES.find((c) => c.id === 'cross-total-care-master');
    expect(master).toBeDefined();
    expect(master!.difficulty).toBe('hard');
    expect(master!.minLevel).toBe(5);
    expect(master!.requirements).toHaveLength(4);
  });
});

// ============================================
// 상수 검증
// ============================================

describe('상수', () => {
  it('DOMAIN_LABELS에 4개 도메인이 정의되어 있어야 한다', () => {
    expect(Object.keys(DOMAIN_LABELS)).toHaveLength(4);
    expect(DOMAIN_LABELS.beauty).toBe('뷰티');
    expect(DOMAIN_LABELS.workout).toBe('운동');
    expect(DOMAIN_LABELS.nutrition).toBe('식단');
    expect(DOMAIN_LABELS.wellness).toBe('웰니스');
  });

  it('DOMAIN_COLORS에 4개 도메인 색상이 정의되어 있어야 한다', () => {
    expect(Object.keys(DOMAIN_COLORS)).toHaveLength(4);
    for (const color of Object.values(DOMAIN_COLORS)) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('DOMAIN_BG_COLORS에 4개 도메인 배경 색상이 정의되어 있어야 한다', () => {
    expect(Object.keys(DOMAIN_BG_COLORS)).toHaveLength(4);
  });

  it('DIFFICULTY_CONFIG에 3개 난이도가 정의되어 있어야 한다', () => {
    expect(Object.keys(DIFFICULTY_CONFIG)).toHaveLength(3);
    expect(DIFFICULTY_CONFIG.easy.label).toBe('입문');
    expect(DIFFICULTY_CONFIG.medium.label).toBe('보통');
    expect(DIFFICULTY_CONFIG.hard.label).toBe('고급');
  });
});

// ============================================
// calculateCrossDomainProgress
// ============================================

describe('calculateCrossDomainProgress', () => {
  const tripleStart = CROSS_DOMAIN_CHALLENGES[0]; // cross-triple-start

  it('활동이 없으면 모든 도메인 current=0', () => {
    const progress = calculateCrossDomainProgress(tripleStart, {});
    expect(progress).toHaveLength(3);
    for (const dp of progress) {
      expect(dp.current).toBe(0);
      expect(dp.completed).toBe(false);
    }
  });

  it('부분 활동 시 해당 도메인만 진행', () => {
    const progress = calculateCrossDomainProgress(tripleStart, { beauty: 1 });
    const beautyProgress = progress.find((dp) => dp.domain === 'beauty');
    expect(beautyProgress!.current).toBe(1);
    expect(beautyProgress!.completed).toBe(true);

    const workoutProgress = progress.find((dp) => dp.domain === 'workout');
    expect(workoutProgress!.current).toBe(0);
    expect(workoutProgress!.completed).toBe(false);
  });

  it('모든 도메인 완료 시 전부 completed=true', () => {
    const progress = calculateCrossDomainProgress(tripleStart, {
      beauty: 1,
      workout: 1,
      nutrition: 1,
    });
    for (const dp of progress) {
      expect(dp.completed).toBe(true);
    }
  });

  it('초과 활동은 target 이하로 클램핑', () => {
    const progress = calculateCrossDomainProgress(tripleStart, {
      beauty: 10,
      workout: 5,
      nutrition: 3,
    });
    for (const dp of progress) {
      expect(dp.current).toBe(dp.target);
    }
  });
});

// ============================================
// calculateOverallProgress
// ============================================

describe('calculateOverallProgress', () => {
  it('빈 배열이면 0 반환', () => {
    expect(calculateOverallProgress([])).toBe(0);
  });

  it('전부 미완료면 0', () => {
    const progress: DomainProgress[] = [
      { domain: 'beauty', current: 0, target: 1, completed: false },
      { domain: 'workout', current: 0, target: 1, completed: false },
    ];
    expect(calculateOverallProgress(progress)).toBe(0);
  });

  it('전부 완료면 100', () => {
    const progress: DomainProgress[] = [
      { domain: 'beauty', current: 1, target: 1, completed: true },
      { domain: 'workout', current: 1, target: 1, completed: true },
    ];
    expect(calculateOverallProgress(progress)).toBe(100);
  });

  it('부분 진행률 정확히 계산', () => {
    const progress: DomainProgress[] = [
      { domain: 'beauty', current: 1, target: 2, completed: false },
      { domain: 'workout', current: 2, target: 2, completed: true },
    ];
    // (1+2) / (2+2) = 75
    expect(calculateOverallProgress(progress)).toBe(75);
  });

  it('100을 초과하지 않는다', () => {
    const progress: DomainProgress[] = [
      { domain: 'beauty', current: 5, target: 1, completed: true },
    ];
    expect(calculateOverallProgress(progress)).toBeLessThanOrEqual(100);
  });
});

// ============================================
// buildCrossDomainView
// ============================================

describe('buildCrossDomainView', () => {
  const tripleStart = CROSS_DOMAIN_CHALLENGES[0];

  it('올바른 뷰 객체를 생성해야 한다', () => {
    const view = buildCrossDomainView(tripleStart, { beauty: 1, workout: 0, nutrition: 0 });
    expect(view.challengeId).toBe('cross-triple-start');
    expect(view.name).toBe('트리플 스타트');
    expect(view.domainProgress).toHaveLength(3);
    expect(view.overallPercent).toBe(33);
    expect(view.allCompleted).toBe(false);
    expect(view.xpReward).toBeGreaterThan(0);
  });

  it('모든 도메인 완료 시 allCompleted=true', () => {
    const view = buildCrossDomainView(tripleStart, { beauty: 1, workout: 1, nutrition: 1 });
    expect(view.allCompleted).toBe(true);
    expect(view.overallPercent).toBe(100);
  });

  it('활동 없으면 0%', () => {
    const view = buildCrossDomainView(tripleStart, {});
    expect(view.overallPercent).toBe(0);
    expect(view.allCompleted).toBe(false);
  });
});

// ============================================
// getCrossDomainChallengeById
// ============================================

describe('getCrossDomainChallengeById', () => {
  it('존재하는 ID로 챌린지를 조회할 수 있다', () => {
    const challenge = getCrossDomainChallengeById('cross-triple-start');
    expect(challenge).toBeDefined();
    expect(challenge!.name).toBe('트리플 스타트');
  });

  it('존재하지 않는 ID는 undefined 반환', () => {
    expect(getCrossDomainChallengeById('nonexistent')).toBeUndefined();
  });
});

// ============================================
// getAvailableCrossDomainChallenges
// ============================================

describe('getAvailableCrossDomainChallenges', () => {
  it('레벨 1이면 입문(easy) 챌린지만 반환', () => {
    const available = getAvailableCrossDomainChallenges(1);
    expect(available.length).toBeGreaterThan(0);
    for (const c of available) {
      expect(c.minLevel).toBeLessThanOrEqual(1);
    }
  });

  it('레벨 10이면 모든 챌린지 반환', () => {
    const available = getAvailableCrossDomainChallenges(10);
    expect(available).toHaveLength(5);
  });

  it('완료된 챌린지는 제외', () => {
    const available = getAvailableCrossDomainChallenges(10, ['cross-triple-start']);
    expect(available).toHaveLength(4);
    expect(available.find((c) => c.id === 'cross-triple-start')).toBeUndefined();
  });

  it('레벨 0이면 빈 배열', () => {
    const available = getAvailableCrossDomainChallenges(0);
    expect(available).toHaveLength(0);
  });
});

// ============================================
// getIncompleteDomainMessages
// ============================================

describe('getIncompleteDomainMessages', () => {
  it('미완료 도메인에 대한 안내 메시지 생성', () => {
    const progress: DomainProgress[] = [
      { domain: 'beauty', current: 0, target: 1, completed: false },
      { domain: 'workout', current: 1, target: 1, completed: true },
    ];
    const messages = getIncompleteDomainMessages(progress);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('뷰티');
    expect(messages[0]).toContain('1회 더 필요해요');
  });

  it('모든 도메인 완료 시 빈 배열', () => {
    const progress: DomainProgress[] = [
      { domain: 'beauty', current: 1, target: 1, completed: true },
    ];
    expect(getIncompleteDomainMessages(progress)).toHaveLength(0);
  });

  it('여러 미완료 도메인 메시지 생성', () => {
    const progress: DomainProgress[] = [
      { domain: 'beauty', current: 0, target: 3, completed: false },
      { domain: 'workout', current: 1, target: 5, completed: false },
      { domain: 'nutrition', current: 5, target: 5, completed: true },
    ];
    const messages = getIncompleteDomainMessages(progress);
    expect(messages).toHaveLength(2);
    expect(messages[0]).toContain('뷰티');
    expect(messages[0]).toContain('3회');
    expect(messages[1]).toContain('운동');
    expect(messages[1]).toContain('4회');
  });
});
