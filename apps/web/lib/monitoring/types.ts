/**
 * 모니터링 시스템 타입 정의
 */

/** 서비스 상태 */
export type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

/** 서비스 헬스체크 결과 */
export interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  responseTimeMs: number;
  lastChecked: string;
  details?: string;
}

/** 시스템 헬스 스냅샷 */
export interface SystemHealthSnapshot {
  services: ServiceHealth[];
  overallStatus: ServiceStatus;
  timestamp: string;
}

/** API 타이밍 항목 */
export interface ApiTimingEntry {
  route: string;
  method: string;
  statusCode: number;
  durationMs: number;
  timestamp: number;
}

/** API 타이밍 통계 */
export interface ApiTimingStats {
  route: string;
  count: number;
  p50: number;
  p95: number;
  p99: number;
  avgMs: number;
  errorRate: number;
}

/** Web Vitals 리포트 */
export interface VitalsReport {
  lcp: VitalMetric;
  cls: VitalMetric;
  inp: VitalMetric;
  ttfb: VitalMetric;
}

/** 개별 Vital 메트릭 */
export interface VitalMetric {
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}
