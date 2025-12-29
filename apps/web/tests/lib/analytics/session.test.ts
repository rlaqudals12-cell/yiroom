/**
 * Analytics 세션 관리 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getSessionId,
  getOrCreateSession,
  refreshSession,
  endSession,
  getSessionDuration,
  detectDeviceType,
  detectBrowser,
  detectOS,
} from '@/lib/analytics/session';

// sessionStorage Mock
const mockSessionStorage: Record<string, string> = {};

beforeEach(() => {
  // sessionStorage Mock 설정
  vi.stubGlobal('sessionStorage', {
    getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      mockSessionStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockSessionStorage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
    }),
  });

  // navigator Mock
  vi.stubGlobal('navigator', {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  // window Mock
  vi.stubGlobal('window', {
    innerWidth: 1920,
    innerHeight: 1080,
  });

  // 이전 테스트 데이터 초기화
  Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Analytics Session', () => {
  describe('getSessionId', () => {
    it('세션이 없으면 null을 반환한다', () => {
      const sessionId = getSessionId();
      expect(sessionId).toBeNull();
    });

    it('세션이 있으면 세션 ID를 반환한다', () => {
      mockSessionStorage['yiroom_session_id'] = 'sess_test123';
      mockSessionStorage['yiroom_session_start'] = Date.now().toString();

      const sessionId = getSessionId();
      expect(sessionId).toBe('sess_test123');
    });

    it('세션이 만료되면 null을 반환한다', () => {
      mockSessionStorage['yiroom_session_id'] = 'sess_expired';
      // 31분 전
      mockSessionStorage['yiroom_session_start'] = (Date.now() - 31 * 60 * 1000).toString();

      const sessionId = getSessionId();
      expect(sessionId).toBeNull();
    });
  });

  describe('getOrCreateSession', () => {
    it('새 세션을 생성한다', () => {
      const sessionId = getOrCreateSession();

      expect(sessionId).toMatch(/^sess_/);
      expect(mockSessionStorage['yiroom_session_id']).toBe(sessionId);
      expect(mockSessionStorage['yiroom_session_start']).toBeDefined();
    });

    it('기존 세션이 있으면 반환한다', () => {
      mockSessionStorage['yiroom_session_id'] = 'sess_existing';
      mockSessionStorage['yiroom_session_start'] = Date.now().toString();

      const sessionId = getOrCreateSession();
      expect(sessionId).toBe('sess_existing');
    });
  });

  describe('refreshSession', () => {
    it('세션 시작 시간을 갱신한다', () => {
      mockSessionStorage['yiroom_session_id'] = 'sess_refresh';
      const oldTime = Date.now() - 10000;
      mockSessionStorage['yiroom_session_start'] = oldTime.toString();

      refreshSession();

      const newTime = parseInt(mockSessionStorage['yiroom_session_start'], 10);
      expect(newTime).toBeGreaterThan(oldTime);
    });
  });

  describe('endSession', () => {
    it('세션을 종료한다', () => {
      mockSessionStorage['yiroom_session_id'] = 'sess_end';
      mockSessionStorage['yiroom_session_start'] = Date.now().toString();

      endSession();

      expect(mockSessionStorage['yiroom_session_id']).toBeUndefined();
      expect(mockSessionStorage['yiroom_session_start']).toBeUndefined();
    });
  });

  describe('getSessionDuration', () => {
    it('세션 지속 시간을 계산한다', () => {
      // 10초 전에 시작된 세션
      mockSessionStorage['yiroom_session_id'] = 'sess_duration';
      mockSessionStorage['yiroom_session_start'] = (Date.now() - 10000).toString();

      const duration = getSessionDuration();
      expect(duration).toBeGreaterThanOrEqual(9);
      expect(duration).toBeLessThanOrEqual(12);
    });

    it('세션이 없으면 0을 반환한다', () => {
      const duration = getSessionDuration();
      expect(duration).toBe(0);
    });
  });

  describe('detectDeviceType', () => {
    it('데스크톱을 감지한다', () => {
      const deviceType = detectDeviceType();
      expect(deviceType).toBe('desktop');
    });

    it('모바일을 감지한다', () => {
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1',
      });
      vi.stubGlobal('window', { innerWidth: 375, innerHeight: 812 });

      const deviceType = detectDeviceType();
      expect(deviceType).toBe('mobile');
    });
  });

  describe('detectBrowser', () => {
    it('Chrome을 감지한다', () => {
      const browser = detectBrowser();
      expect(browser).toBe('Chrome');
    });

    it('Safari를 감지한다', () => {
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15',
      });

      const browser = detectBrowser();
      expect(browser).toBe('Safari');
    });

    it('Firefox를 감지한다', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0',
      });

      const browser = detectBrowser();
      expect(browser).toBe('Firefox');
    });
  });

  describe('detectOS', () => {
    it('Windows를 감지한다', () => {
      const os = detectOS();
      expect(os).toBe('Windows');
    });

    it('macOS를 감지한다', () => {
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      const os = detectOS();
      expect(os).toBe('macOS');
    });

    it('Android를 감지한다', () => {
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      });

      const os = detectOS();
      expect(os).toBe('Android');
    });
  });
});
