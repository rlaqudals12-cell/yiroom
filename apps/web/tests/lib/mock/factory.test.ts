/**
 * Mock Factory 단위 테스트
 *
 * @see lib/mock/factory.ts
 * @see ADR-007 Mock Fallback 전략
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerMock,
  getMock,
  hasMock,
  getRegisteredTypes,
  clearRegistry,
} from '@/lib/mock/factory';

describe('Mock Factory', () => {
  beforeEach(() => {
    clearRegistry();
  });

  describe('registerMock', () => {
    it('새 타입을 등록할 수 있다', () => {
      const generator = () => ({ score: 100 });
      registerMock('test-type', generator);
      expect(hasMock('test-type')).toBe(true);
    });

    it('이미 등록된 타입은 경고 후 덮어쓴다', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const gen1 = () => ({ v: 1 });
      const gen2 = () => ({ v: 2 });

      registerMock('dup', gen1);
      registerMock('dup', gen2);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("'dup' 이미 등록됨"));
      expect(getMock('dup')).toEqual({ v: 2 });
      warnSpy.mockRestore();
    });
  });

  describe('getMock', () => {
    it('등록된 타입의 mock 데이터를 생성한다', () => {
      registerMock('skin', () => ({ skinType: 'combination' }));
      const result = getMock<{ skinType: string }>('skin');
      expect(result.skinType).toBe('combination');
    });

    it('인자를 생성기에 전달한다', () => {
      registerMock('with-args', (name: unknown) => ({ greeting: `hello ${name}` }));
      const result = getMock<{ greeting: string }>('with-args', 'world');
      expect(result.greeting).toBe('hello world');
    });

    it('미등록 타입은 에러를 던진다', () => {
      expect(() => getMock('nonexistent')).toThrow(
        "'nonexistent' Mock 생성기가 등록되지 않았습니다"
      );
    });
  });

  describe('hasMock', () => {
    it('등록된 타입은 true를 반환한다', () => {
      registerMock('exists', () => ({}));
      expect(hasMock('exists')).toBe(true);
    });

    it('미등록 타입은 false를 반환한다', () => {
      expect(hasMock('nope')).toBe(false);
    });
  });

  describe('getRegisteredTypes', () => {
    it('등록된 모든 타입 목록을 반환한다', () => {
      registerMock('a', () => ({}));
      registerMock('b', () => ({}));
      registerMock('c', () => ({}));

      const types = getRegisteredTypes();
      expect(types).toEqual(['a', 'b', 'c']);
    });

    it('빈 레지스트리는 빈 배열을 반환한다', () => {
      expect(getRegisteredTypes()).toEqual([]);
    });
  });

  describe('clearRegistry', () => {
    it('모든 등록을 초기화한다', () => {
      registerMock('x', () => ({}));
      registerMock('y', () => ({}));

      clearRegistry();

      expect(getRegisteredTypes()).toEqual([]);
      expect(hasMock('x')).toBe(false);
    });
  });
});

describe('Mock Registry 통합', () => {
  it('registry import 시 13개 mock 생성기가 자동 등록된다', async () => {
    // registry를 import하면 자동으로 factory에 등록됨
    // 기존 clearRegistry 영향을 피하기 위해 fresh import
    const { getRegisteredTypes } = await import('@/lib/mock');

    const types = getRegisteredTypes();
    expect(types.length).toBeGreaterThanOrEqual(13);
    // v1 타입
    expect(types).toContain('skin');
    expect(types).toContain('skin-v2');
    expect(types).toContain('personal-color');
    expect(types).toContain('body');
    expect(types).toContain('hair');
    expect(types).toContain('makeup');
    expect(types).toContain('oral-health');
    expect(types).toContain('workout');
    expect(types).toContain('posture');
    expect(types).toContain('food');
    // v2 타입
    expect(types).toContain('body-v2');
    expect(types).toContain('personal-color-v2');
    expect(types).toContain('hair-v2');
  });

  it('hasMock으로 모든 등록된 타입을 확인할 수 있다', async () => {
    const { hasMock } = await import('@/lib/mock');

    const expectedTypes = [
      'skin',
      'skin-v2',
      'personal-color',
      'body',
      'hair',
      'makeup',
      'oral-health',
      'workout',
      'posture',
      'food',
      'body-v2',
      'personal-color-v2',
      'hair-v2',
    ];

    for (const type of expectedTypes) {
      expect(hasMock(type)).toBe(true);
    }
  });
});
