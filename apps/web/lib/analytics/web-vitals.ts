/**
 * Core Web Vitals 추적
 *
 * LCP, CLS, INP, TTFB 메트릭 수집
 * Sentry로 전송하여 성능 모니터링
 *
 * Note: FID는 web-vitals v4+에서 제거됨 (Chrome이 INP로 대체)
 *
 * @see SDD-MONITORING.md Section 4.5
 * @module lib/analytics/web-vitals
 */
'use client';

import { onCLS, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';
import * as Sentry from '@sentry/nextjs';

/**
 * Core Web Vitals 임계값 정의
 * performance-guidelines.md 기준
 *
 * Note: FID는 deprecated되어 INP로 대체됨 (2024년 3월부터)
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  TTFB: { good: 800, poor: 1800 },
} as const;

type MetricName = keyof typeof THRESHOLDS;
type Rating = 'good' | 'needs-improvement' | 'poor';

/**
 * 메트릭 값에 따른 등급 계산
 *
 * @param name - 메트릭 이름 (LCP, FID, CLS, INP, TTFB)
 * @param value - 측정된 값
 * @returns 등급 (good, needs-improvement, poor)
 */
function getRating(name: string, value: number): Rating {
  const threshold = THRESHOLDS[name as MetricName];
  if (!threshold) return 'needs-improvement';
  if (value <= threshold.good) return 'good';
  if (value >= threshold.poor) return 'poor';
  return 'needs-improvement';
}

/**
 * 개별 Web Vital 메트릭 리포트
 * Sentry에 측정값 기록 및 성능 저하 시 이벤트 전송
 *
 * @param metric - web-vitals 라이브러리에서 전달되는 메트릭 객체
 */
function reportVital(metric: Metric): void {
  const { name, value, id } = metric;
  const rating = getRating(name, value);

  // CLS는 밀리초가 아닌 무차원 값이므로 단위 구분
  const unit = name === 'CLS' ? 'none' : 'millisecond';

  // Sentry 측정값 기록
  Sentry.setMeasurement(name, value, unit);
  Sentry.setTag(`web_vital_${name.toLowerCase()}_rating`, rating);

  // 콘솔 로그 (개발 환경)
  if (process.env.NODE_ENV === 'development') {
    const formattedValue = name === 'CLS' ? value.toFixed(3) : `${value.toFixed(0)}ms`;
    console.log(`[Web Vitals] ${name}: ${formattedValue} (${rating})`);
  }

  // 성능 저하 시 Sentry에 이벤트 전송
  if (rating === 'poor') {
    Sentry.captureMessage(`Poor Web Vital: ${name}`, {
      level: 'warning',
      tags: {
        metric: name,
        rating: rating,
      },
      extra: {
        value,
        threshold: THRESHOLDS[name as MetricName],
        id,
        delta: metric.delta,
        navigationType: metric.navigationType,
      },
    });
  }
}

/**
 * Core Web Vitals 수집 초기화
 * 클라이언트 컴포넌트에서 호출
 *
 * @example
 * ```tsx
 * 'use client';
 * import { useEffect } from 'react';
 * import { initWebVitals } from '@/lib/analytics/web-vitals';
 *
 * export function WebVitalsInit() {
 *   useEffect(() => {
 *     initWebVitals();
 *   }, []);
 *   return null;
 * }
 * ```
 */
export function initWebVitals(): void {
  try {
    onCLS(reportVital);
    onLCP(reportVital);
    onTTFB(reportVital);
    onINP(reportVital);
  } catch (error) {
    console.error('[Web Vitals] Failed to initialize:', error);
  }
}

export { type Metric };
