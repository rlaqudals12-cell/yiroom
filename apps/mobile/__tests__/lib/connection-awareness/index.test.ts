/**
 * ConnectionAwareness lib 단위 테스트
 *
 * capsuleItemToExposeRequest, capsuleModulesToExposeRequests,
 * insightToExposeRequest, getModuleLabel 검증
 */

// ─── capsule-bridge ───────────────────────────────────────────────────────────

import {
  capsuleItemToExposeRequest,
  capsuleModulesToExposeRequests,
} from '../../../lib/connection-awareness/capsule-bridge';

describe('capsuleItemToExposeRequest', () => {
  it('PC → personal-color connectionId를 생성해야 한다', () => {
    const result = capsuleItemToExposeRequest('PC');
    expect(result.connectionId).toBe('daily_routine::personal-color');
    expect(result.sourceModule).toBe('personal-color');
    expect(result.targetDomain).toBe('daily-routine');
    expect(result.connectionRule).toContain('퍼스널컬러');
  });

  it('S → skin connectionId를 생성해야 한다', () => {
    const result = capsuleItemToExposeRequest('S');
    expect(result.connectionId).toBe('daily_routine::skin');
    expect(result.sourceModule).toBe('skin');
  });

  it('C → body connectionId를 생성해야 한다', () => {
    const result = capsuleItemToExposeRequest('C');
    expect(result.connectionId).toBe('daily_routine::body');
    expect(result.sourceModule).toBe('body');
  });

  it('W → workout connectionId를 생성해야 한다', () => {
    const result = capsuleItemToExposeRequest('W');
    expect(result.connectionId).toBe('daily_routine::workout');
    expect(result.sourceModule).toBe('workout');
  });

  it('N → nutrition connectionId를 생성해야 한다', () => {
    const result = capsuleItemToExposeRequest('N');
    expect(result.connectionId).toBe('daily_routine::nutrition');
    expect(result.sourceModule).toBe('nutrition');
  });

  it('H → hair connectionId를 생성해야 한다', () => {
    const result = capsuleItemToExposeRequest('H');
    expect(result.connectionId).toBe('daily_routine::hair');
    expect(result.sourceModule).toBe('hair');
  });

  it('M → makeup connectionId를 생성해야 한다', () => {
    const result = capsuleItemToExposeRequest('M');
    expect(result.connectionId).toBe('daily_routine::makeup');
    expect(result.sourceModule).toBe('makeup');
  });

  it('OH → oral-health connectionId를 생성해야 한다', () => {
    const result = capsuleItemToExposeRequest('OH');
    expect(result.connectionId).toBe('daily_routine::oral-health');
    expect(result.sourceModule).toBe('oral-health');
  });

  it('Fashion → fashion connectionId를 생성해야 한다', () => {
    const result = capsuleItemToExposeRequest('Fashion');
    expect(result.connectionId).toBe('daily_routine::fashion');
    expect(result.sourceModule).toBe('fashion');
  });

  it('connectionRule에 모듈 한글 라벨이 포함되어야 한다', () => {
    const result = capsuleItemToExposeRequest('S');
    expect(result.connectionRule).toContain('피부 분석');
    expect(result.connectionRule).toContain('데일리 루틴 추천');
  });

  it('항상 targetDomain이 daily-routine이어야 한다', () => {
    const codes = ['PC', 'S', 'C', 'W', 'N', 'H', 'M', 'OH', 'Fashion'] as const;
    codes.forEach((code) => {
      expect(capsuleItemToExposeRequest(code).targetDomain).toBe('daily-routine');
    });
  });
});

describe('capsuleModulesToExposeRequests', () => {
  it('중복된 모듈 코드를 제거하고 고유 요청만 반환해야 한다', () => {
    const result = capsuleModulesToExposeRequests(['S', 'S', 'N', 'S']);
    expect(result.length).toBe(2);
    const ids = result.map((r) => r.connectionId);
    expect(ids).toContain('daily_routine::skin');
    expect(ids).toContain('daily_routine::nutrition');
  });

  it('빈 배열 입력 시 빈 배열을 반환해야 한다', () => {
    expect(capsuleModulesToExposeRequests([])).toEqual([]);
  });

  it('단일 모듈 코드를 처리해야 한다', () => {
    const result = capsuleModulesToExposeRequests(['PC']);
    expect(result.length).toBe(1);
    expect(result[0].connectionId).toBe('daily_routine::personal-color');
  });

  it('모든 9개 모듈 코드를 고유하게 처리해야 한다', () => {
    const result = capsuleModulesToExposeRequests([
      'PC', 'S', 'C', 'W', 'N', 'H', 'M', 'OH', 'Fashion',
    ]);
    expect(result.length).toBe(9);
    const ids = new Set(result.map((r) => r.connectionId));
    expect(ids.size).toBe(9);
  });
});

// ─── insight-bridge ───────────────────────────────────────────────────────────

import { getModuleLabel } from '../../../lib/connection-awareness/insight-bridge';
import type { ConnectionModule } from '../../../lib/connection-awareness';

describe('getModuleLabel', () => {
  it('personal-color → 퍼스널컬러를 반환해야 한다', () => {
    expect(getModuleLabel('personal-color')).toBe('퍼스널컬러');
  });

  it('skin → 피부 분석을 반환해야 한다', () => {
    expect(getModuleLabel('skin')).toBe('피부 분석');
  });

  it('body → 체형 분석을 반환해야 한다', () => {
    expect(getModuleLabel('body')).toBe('체형 분석');
  });

  it('hair → 헤어 분석을 반환해야 한다', () => {
    expect(getModuleLabel('hair')).toBe('헤어 분석');
  });

  it('makeup → 메이크업을 반환해야 한다', () => {
    expect(getModuleLabel('makeup')).toBe('메이크업');
  });

  it('oral-health → 구강건강을 반환해야 한다', () => {
    expect(getModuleLabel('oral-health')).toBe('구강건강');
  });

  it('workout → 운동을 반환해야 한다', () => {
    expect(getModuleLabel('workout')).toBe('운동');
  });

  it('nutrition → 영양을 반환해야 한다', () => {
    expect(getModuleLabel('nutrition')).toBe('영양');
  });

  it('fashion → 패션을 반환해야 한다', () => {
    expect(getModuleLabel('fashion')).toBe('패션');
  });

  it('알 수 없는 모듈은 그대로 반환해야 한다', () => {
    expect(getModuleLabel('unknown' as ConnectionModule)).toBe('unknown');
  });
});
