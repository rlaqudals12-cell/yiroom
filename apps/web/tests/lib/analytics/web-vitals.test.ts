/**
 * Core Web Vitals 추적 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Metric } from 'web-vitals';

// web-vitals 라이브러리 mock
const mockOnCLS = vi.fn();
const mockOnLCP = vi.fn();
const mockOnTTFB = vi.fn();
const mockOnINP = vi.fn();

vi.mock('web-vitals', () => ({
  onCLS: mockOnCLS,
  onLCP: mockOnLCP,
  onTTFB: mockOnTTFB,
  onINP: mockOnINP,
}));

// Sentry mock
const mockSetMeasurement = vi.fn();
const mockSetTag = vi.fn();
const mockCaptureMessage = vi.fn();

vi.mock('@sentry/nextjs', () => ({
  setMeasurement: mockSetMeasurement,
  setTag: mockSetTag,
  captureMessage: mockCaptureMessage,
}));

describe('Web Vitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initWebVitals', () => {
    it('4개의 Web Vital 수집기를 등록한다', async () => {
      const { initWebVitals } = await import('@/lib/analytics/web-vitals');

      initWebVitals();

      expect(mockOnCLS).toHaveBeenCalledTimes(1);
      expect(mockOnLCP).toHaveBeenCalledTimes(1);
      expect(mockOnTTFB).toHaveBeenCalledTimes(1);
      expect(mockOnINP).toHaveBeenCalledTimes(1);
    });

    it('web-vitals 초기화 실패 시 에러를 잡는다', async () => {
      mockOnCLS.mockImplementationOnce(() => {
        throw new Error('web-vitals not supported');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { initWebVitals } = await import('@/lib/analytics/web-vitals');

      // 에러를 던지지 않아야 함
      expect(() => initWebVitals()).not.toThrow();
      consoleSpy.mockRestore();
    });
  });

  describe('reportVital (콜백)', () => {
    let reportVital: (metric: Metric) => void;

    beforeEach(async () => {
      vi.resetModules();
      vi.clearAllMocks();

      // mockOnLCP의 콜백을 캡처
      mockOnLCP.mockImplementation((cb: (m: Metric) => void) => {
        reportVital = cb;
      });

      const { initWebVitals } = await import('@/lib/analytics/web-vitals');
      initWebVitals();
    });

    function createMetric(overrides: Partial<Metric> = {}): Metric {
      return {
        name: 'LCP',
        value: 2000,
        id: 'v4-1234',
        delta: 2000,
        rating: 'good',
        navigationType: 'navigate',
        entries: [],
        ...overrides,
      } as Metric;
    }

    describe('등급 판정', () => {
      it('LCP 2500ms 이하를 good으로 판정한다', () => {
        reportVital(createMetric({ name: 'LCP', value: 2000 }));

        expect(mockSetTag).toHaveBeenCalledWith('web_vital_lcp_rating', 'good');
        expect(mockCaptureMessage).not.toHaveBeenCalled();
      });

      it('LCP 4000ms 이상을 poor로 판정한다', () => {
        reportVital(createMetric({ name: 'LCP', value: 5000 }));

        expect(mockSetTag).toHaveBeenCalledWith('web_vital_lcp_rating', 'poor');
      });

      it('LCP 2500~4000ms를 needs-improvement로 판정한다', () => {
        reportVital(createMetric({ name: 'LCP', value: 3000 }));

        expect(mockSetTag).toHaveBeenCalledWith('web_vital_lcp_rating', 'needs-improvement');
      });

      it('CLS 0.1 이하를 good으로 판정한다', () => {
        reportVital(createMetric({ name: 'CLS', value: 0.05 }));

        expect(mockSetTag).toHaveBeenCalledWith('web_vital_cls_rating', 'good');
      });

      it('CLS 0.25 이상을 poor로 판정한다', () => {
        reportVital(createMetric({ name: 'CLS', value: 0.3 }));

        expect(mockSetTag).toHaveBeenCalledWith('web_vital_cls_rating', 'poor');
      });

      it('INP 200ms 이하를 good으로 판정한다', () => {
        reportVital(createMetric({ name: 'INP', value: 150 }));

        expect(mockSetTag).toHaveBeenCalledWith('web_vital_inp_rating', 'good');
      });

      it('INP 500ms 이상을 poor로 판정한다', () => {
        reportVital(createMetric({ name: 'INP', value: 600 }));

        expect(mockSetTag).toHaveBeenCalledWith('web_vital_inp_rating', 'poor');
      });

      it('TTFB 800ms 이하를 good으로 판정한다', () => {
        reportVital(createMetric({ name: 'TTFB', value: 500 }));

        expect(mockSetTag).toHaveBeenCalledWith('web_vital_ttfb_rating', 'good');
      });

      it('TTFB 1800ms 이상을 poor로 판정한다', () => {
        reportVital(createMetric({ name: 'TTFB', value: 2000 }));

        expect(mockSetTag).toHaveBeenCalledWith('web_vital_ttfb_rating', 'poor');
      });

      it('알 수 없는 메트릭 이름은 needs-improvement로 판정한다', () => {
        reportVital(createMetric({ name: 'UNKNOWN' as never, value: 100 }));

        expect(mockSetTag).toHaveBeenCalledWith('web_vital_unknown_rating', 'needs-improvement');
      });
    });

    describe('Sentry 측정값 기록', () => {
      it('CLS는 단위를 none으로 기록한다', () => {
        reportVital(createMetric({ name: 'CLS', value: 0.05 }));

        expect(mockSetMeasurement).toHaveBeenCalledWith('CLS', 0.05, 'none');
      });

      it('LCP는 단위를 millisecond로 기록한다', () => {
        reportVital(createMetric({ name: 'LCP', value: 2000 }));

        expect(mockSetMeasurement).toHaveBeenCalledWith('LCP', 2000, 'millisecond');
      });

      it('INP는 단위를 millisecond로 기록한다', () => {
        reportVital(createMetric({ name: 'INP', value: 150 }));

        expect(mockSetMeasurement).toHaveBeenCalledWith('INP', 150, 'millisecond');
      });

      it('TTFB는 단위를 millisecond로 기록한다', () => {
        reportVital(createMetric({ name: 'TTFB', value: 500 }));

        expect(mockSetMeasurement).toHaveBeenCalledWith('TTFB', 500, 'millisecond');
      });
    });

    describe('성능 저하 알림', () => {
      it('poor 등급 시 Sentry에 경고 메시지를 전송한다', () => {
        reportVital(createMetric({ name: 'LCP', value: 5000, id: 'v4-abc' }));

        expect(mockCaptureMessage).toHaveBeenCalledWith('Poor Web Vital: LCP', {
          level: 'warning',
          tags: {
            metric: 'LCP',
            rating: 'poor',
          },
          extra: expect.objectContaining({
            value: 5000,
            id: 'v4-abc',
          }),
        });
      });

      it('good 등급 시 Sentry 경고를 전송하지 않는다', () => {
        reportVital(createMetric({ name: 'LCP', value: 1000 }));

        expect(mockCaptureMessage).not.toHaveBeenCalled();
      });

      it('needs-improvement 등급 시 Sentry 경고를 전송하지 않는다', () => {
        reportVital(createMetric({ name: 'LCP', value: 3000 }));

        expect(mockCaptureMessage).not.toHaveBeenCalled();
      });

      it('poor 경고에 threshold 정보를 포함한다', () => {
        reportVital(createMetric({ name: 'CLS', value: 0.5 }));

        expect(mockCaptureMessage).toHaveBeenCalledWith(
          'Poor Web Vital: CLS',
          expect.objectContaining({
            extra: expect.objectContaining({
              threshold: { good: 0.1, poor: 0.25 },
            }),
          })
        );
      });
    });

    describe('개발 환경 로그', () => {
      it('개발 환경에서 콘솔 디버그 로그를 출력한다', () => {
        vi.stubEnv('NODE_ENV', 'development');
        const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

        reportVital(createMetric({ name: 'LCP', value: 2000 }));

        expect(consoleSpy).toHaveBeenCalledTimes(1);
        const logMsg = consoleSpy.mock.calls[0][0] as string;
        expect(logMsg).toContain('[Web Vitals]');
        expect(logMsg).toContain('LCP');
        expect(logMsg).toContain('2000ms');
        expect(logMsg).toContain('good');

        consoleSpy.mockRestore();
        vi.unstubAllEnvs();
      });

      it('CLS 값은 소수점 3자리로 포맷한다', () => {
        vi.stubEnv('NODE_ENV', 'development');
        const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

        reportVital(createMetric({ name: 'CLS', value: 0.05123 }));

        expect(consoleSpy).toHaveBeenCalledTimes(1);
        const logMsg = consoleSpy.mock.calls[0][0] as string;
        expect(logMsg).toContain('CLS');
        expect(logMsg).toContain('0.051');

        consoleSpy.mockRestore();
        vi.unstubAllEnvs();
      });
    });
  });
});
