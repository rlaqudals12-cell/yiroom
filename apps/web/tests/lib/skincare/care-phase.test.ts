/**
 * 단계 계획 (care-phase) 테스트
 * @see lib/skincare/care-phase.ts
 */
import { describe, it, expect } from 'vitest';
import { deriveCarePhase } from '@/lib/skincare/care-phase';

describe('deriveCarePhase', () => {
  it('should 수분<40 → 장벽 회복 단계', () => {
    const phase = deriveCarePhase({ hydration: 35, sensitivity: 80 }, []);
    expect(phase.phase).toBe('barrier');
  });

  it('should 민감<40 → 장벽 회복 단계', () => {
    const phase = deriveCarePhase({ hydration: 70, sensitivity: 30 }, []);
    expect(phase.phase).toBe('barrier');
  });

  it('should 경계값 (지표 40) → 목표 단계 (미만 아님)', () => {
    const phase = deriveCarePhase({ hydration: 40, sensitivity: 40 }, ['brightening']);
    expect(phase.phase).toBe('goal');
  });

  it('should 지표 양호 → 목표 단계', () => {
    const phase = deriveCarePhase({ hydration: 70, sensitivity: 80 }, ['wrinkle']);
    expect(phase.phase).toBe('goal');
    expect(phase.message).toContain('주름·탄력');
  });

  it('should 목표 단계 메시지에 사용자 목표 라벨 반영', () => {
    const phase = deriveCarePhase({ hydration: 70 }, ['acne']);
    expect(phase.message).toContain('트러블');
  });

  it('should 장벽 단계 메시지에 다음 목표 안내 + 기간 단정 아님(보통/안팎)', () => {
    const phase = deriveCarePhase({ hydration: 20 }, ['brightening']);
    expect(phase.message).toContain('기미·잡티');
    expect(phase.message).toMatch(/보통|안팎/);
  });

  it('should 목표 없으면 파생 고민에서 라벨 유추', () => {
    // pigmentation 지표 낮음 → brightening 라벨 유추
    const phase = deriveCarePhase({ hydration: 70, pigmentation: 30 }, []);
    expect(phase.message).toContain('기미·잡티');
  });

  it('should 지표·목표 전무 → 일반 문구 (크래시 없음)', () => {
    const phase = deriveCarePhase({}, []);
    expect(phase.phase).toBe('goal');
    expect(phase.message).toContain('피부 목표');
  });

  it("should '치료·처방' 표현 부재", () => {
    const barrier = deriveCarePhase({ hydration: 20 }, ['brightening']);
    const goal = deriveCarePhase({ hydration: 80 }, ['acne']);
    for (const p of [barrier, goal]) {
      expect(p.message).not.toMatch(/치료|처방/);
      expect(p.label).not.toMatch(/치료|처방/);
    }
  });

  it('should 순수·결정론적', () => {
    const a = deriveCarePhase({ hydration: 35 }, ['hydration']);
    const b = deriveCarePhase({ hydration: 35 }, ['hydration']);
    expect(a).toEqual(b);
  });
});
