/**
 * 에러 컨텍스트 테스트
 *
 * @module tests/lib/error/context
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Sentry from '@sentry/nextjs';

// Sentry mock
vi.mock('@sentry/nextjs', () => ({
  withScope: vi.fn((callback) => {
    const mockScope = {
      setTag: vi.fn(),
      setContext: vi.fn(),
    };
    callback(mockScope);
    return mockScope;
  }),
  captureException: vi.fn(),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

import {
  recordUserAction,
  captureErrorWithContext,
  captureApiError,
  captureAiError,
  captureDatabaseError,
  captureValidationError,
  captureNetworkError,
  captureUiError,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
  type ErrorContext,
} from '@/lib/error/context';

describe('lib/error/context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // recordUserAction 테스트
  // ---------------------------------------------------------------------------

  describe('recordUserAction', () => {
    it('액션을 기록한다', () => {
      // 에러 없이 실행되는지 확인
      expect(() => recordUserAction('click_button')).not.toThrow();
    });

    it('여러 액션을 기록할 수 있다', () => {
      expect(() => {
        recordUserAction('page_view');
        recordUserAction('click_submit');
        recordUserAction('form_input');
      }).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // captureErrorWithContext 테스트
  // ---------------------------------------------------------------------------

  describe('captureErrorWithContext', () => {
    it('에러를 Sentry에 전송한다', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        category: 'api',
      };

      captureErrorWithContext(error, context);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('카테고리 태그를 설정한다', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        category: 'database',
      };

      let capturedScope: any;
      (Sentry.withScope as any).mockImplementationOnce((callback: any) => {
        capturedScope = {
          setTag: vi.fn(),
          setContext: vi.fn(),
        };
        callback(capturedScope);
      });

      captureErrorWithContext(error, context);

      expect(capturedScope.setTag).toHaveBeenCalledWith('error_category', 'database');
    });

    it('feature 태그를 설정한다', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        category: 'ui',
        feature: 'workout-onboarding',
      };

      let capturedScope: any;
      (Sentry.withScope as any).mockImplementationOnce((callback: any) => {
        capturedScope = {
          setTag: vi.fn(),
          setContext: vi.fn(),
        };
        callback(capturedScope);
      });

      captureErrorWithContext(error, context);

      expect(capturedScope.setTag).toHaveBeenCalledWith('feature', 'workout-onboarding');
    });

    it('action 태그를 설정한다', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        category: 'validation',
        action: 'submit_form',
      };

      let capturedScope: any;
      (Sentry.withScope as any).mockImplementationOnce((callback: any) => {
        capturedScope = {
          setTag: vi.fn(),
          setContext: vi.fn(),
        };
        callback(capturedScope);
      });

      captureErrorWithContext(error, context);

      expect(capturedScope.setTag).toHaveBeenCalledWith('action', 'submit_form');
    });

    it('metadata 컨텍스트를 설정한다', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        category: 'api',
        metadata: { endpoint: '/api/test', method: 'POST' },
      };

      let capturedScope: any;
      (Sentry.withScope as any).mockImplementationOnce((callback: any) => {
        capturedScope = {
          setTag: vi.fn(),
          setContext: vi.fn(),
        };
        callback(capturedScope);
      });

      captureErrorWithContext(error, context);

      expect(capturedScope.setContext).toHaveBeenCalledWith('metadata', {
        endpoint: '/api/test',
        method: 'POST',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // captureApiError 테스트
  // ---------------------------------------------------------------------------

  describe('captureApiError', () => {
    it('API 에러를 캡처한다', () => {
      const error = new Error('API Error');

      captureApiError(error, '/api/users', 'GET', 404);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('API 에러 메타데이터를 포함한다', () => {
      const error = new Error('API Error');

      let capturedScope: any;
      (Sentry.withScope as any).mockImplementationOnce((callback: any) => {
        capturedScope = {
          setTag: vi.fn(),
          setContext: vi.fn(),
        };
        callback(capturedScope);
      });

      captureApiError(error, '/api/users', 'POST', 500);

      expect(capturedScope.setTag).toHaveBeenCalledWith('error_category', 'api');
      expect(capturedScope.setContext).toHaveBeenCalledWith('metadata', {
        endpoint: '/api/users',
        method: 'POST',
        statusCode: 500,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // captureAiError 테스트
  // ---------------------------------------------------------------------------

  describe('captureAiError', () => {
    it('AI 분석 에러를 캡처한다', () => {
      const error = new Error('AI timeout');

      captureAiError(error, 'skin-analysis', 'image');

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('AI 에러 메타데이터를 포함한다', () => {
      const error = new Error('AI error');

      let capturedScope: any;
      (Sentry.withScope as any).mockImplementationOnce((callback: any) => {
        capturedScope = {
          setTag: vi.fn(),
          setContext: vi.fn(),
        };
        callback(capturedScope);
      });

      captureAiError(error, 'personal-color', 'image');

      expect(capturedScope.setTag).toHaveBeenCalledWith('error_category', 'ai');
      expect(capturedScope.setTag).toHaveBeenCalledWith('feature', 'personal-color');
    });
  });

  // ---------------------------------------------------------------------------
  // captureDatabaseError 테스트
  // ---------------------------------------------------------------------------

  describe('captureDatabaseError', () => {
    it('DB 에러를 캡처한다', () => {
      const error = new Error('DB connection failed');

      captureDatabaseError(error, 'insert', 'users');

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('DB 에러 메타데이터를 포함한다', () => {
      const error = new Error('DB error');

      let capturedScope: any;
      (Sentry.withScope as any).mockImplementationOnce((callback: any) => {
        capturedScope = {
          setTag: vi.fn(),
          setContext: vi.fn(),
        };
        callback(capturedScope);
      });

      captureDatabaseError(error, 'select', 'workout_logs');

      expect(capturedScope.setTag).toHaveBeenCalledWith('error_category', 'database');
      expect(capturedScope.setContext).toHaveBeenCalledWith('metadata', {
        operation: 'select',
        table: 'workout_logs',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // captureValidationError 테스트
  // ---------------------------------------------------------------------------

  describe('captureValidationError', () => {
    it('유효성 검증 에러를 캡처한다', () => {
      const error = new Error('Invalid email');

      captureValidationError(error, 'email', 'invalid@');

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('값의 타입을 메타데이터에 포함한다', () => {
      const error = new Error('Invalid value');

      let capturedScope: any;
      (Sentry.withScope as any).mockImplementationOnce((callback: any) => {
        capturedScope = {
          setTag: vi.fn(),
          setContext: vi.fn(),
        };
        callback(capturedScope);
      });

      captureValidationError(error, 'age', 123);

      expect(capturedScope.setContext).toHaveBeenCalledWith('metadata', {
        field: 'age',
        valueType: 'number',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // captureNetworkError 테스트
  // ---------------------------------------------------------------------------

  describe('captureNetworkError', () => {
    it('네트워크 에러를 캡처한다', () => {
      const error = new Error('Network timeout');

      captureNetworkError(error, 'https://api.example.com', true);

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('타임아웃 정보를 메타데이터에 포함한다', () => {
      const error = new Error('Timeout');

      let capturedScope: any;
      (Sentry.withScope as any).mockImplementationOnce((callback: any) => {
        capturedScope = {
          setTag: vi.fn(),
          setContext: vi.fn(),
        };
        callback(capturedScope);
      });

      captureNetworkError(error, 'https://api.example.com', true);

      expect(capturedScope.setTag).toHaveBeenCalledWith('error_category', 'network');
      expect(capturedScope.setContext).toHaveBeenCalledWith(
        'metadata',
        expect.objectContaining({
          url: 'https://api.example.com',
          timeout: true,
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // captureUiError 테스트
  // ---------------------------------------------------------------------------

  describe('captureUiError', () => {
    it('UI 렌더링 에러를 캡처한다', () => {
      const error = new Error('Render error');

      captureUiError(error, 'WorkoutCard');

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('민감한 props를 필터링한다', () => {
      const error = new Error('UI error');

      let capturedScope: any;
      (Sentry.withScope as any).mockImplementationOnce((callback: any) => {
        capturedScope = {
          setTag: vi.fn(),
          setContext: vi.fn(),
        };
        callback(capturedScope);
      });

      captureUiError(error, 'LoginForm', {
        email: 'test@example.com',
        password: 'testpass', // eslint-disable-line sonarjs/no-hardcoded-passwords -- 테스트용
        token: 'abc123',
        visible: true,
      });

      expect(capturedScope.setContext).toHaveBeenCalledWith('metadata', {
        componentName: 'LoginForm',
        props: {
          email: 'test@example.com',
          visible: true,
          // password와 token은 필터링됨
        },
      });
    });

    it('props 없이도 동작한다', () => {
      const error = new Error('UI error');

      expect(() => captureUiError(error, 'EmptyComponent')).not.toThrow();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });
  });

  // ---------------------------------------------------------------------------
  // setUserContext / clearUserContext 테스트
  // ---------------------------------------------------------------------------

  describe('setUserContext', () => {
    it('사용자 컨텍스트를 설정한다', () => {
      setUserContext('user_123');

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user_123',
      });
    });

    it('추가 메타데이터와 함께 설정한다', () => {
      setUserContext('user_456', { email: 'test@example.com', plan: 'premium' });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user_456',
        email: 'test@example.com',
        plan: 'premium',
      });
    });
  });

  describe('clearUserContext', () => {
    it('사용자 컨텍스트를 초기화한다', () => {
      clearUserContext();

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  // ---------------------------------------------------------------------------
  // addBreadcrumb 테스트
  // ---------------------------------------------------------------------------

  describe('addBreadcrumb', () => {
    it('브레드크럼을 추가한다', () => {
      addBreadcrumb('User clicked button', 'ui');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User clicked button',
          category: 'ui',
          level: 'info',
        })
      );
    });

    it('커스텀 레벨로 브레드크럼을 추가한다', () => {
      addBreadcrumb('Critical action', 'system', 'error');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Critical action',
          category: 'system',
          level: 'error',
        })
      );
    });

    it('데이터와 함께 브레드크럼을 추가한다', () => {
      addBreadcrumb('API call', 'http', 'debug', { url: '/api/test' });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'API call',
          category: 'http',
          level: 'debug',
          data: { url: '/api/test' },
        })
      );
    });
  });
});
