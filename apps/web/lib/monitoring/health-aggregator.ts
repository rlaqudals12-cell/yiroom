/**
 * 헬스체크 집계 모듈
 * - /api/health 엔드포인트 데이터 집계
 * - 서비스별 상태 판정
 */

import type { ServiceHealth, SystemHealthSnapshot, ServiceStatus } from './types';

/**
 * 시스템 헬스 스냅샷 가져오기
 * /api/health 엔드포인트 호출 + 응답 시간 측정
 */
export async function fetchSystemHealth(baseUrl: string = ''): Promise<SystemHealthSnapshot> {
  const services: ServiceHealth[] = [];
  const timestamp = new Date().toISOString();

  // 1. API 서버 헬스
  const apiHealth = await checkEndpoint(`${baseUrl}/api/health`, 'API 서버');
  services.push(apiHealth);

  // 2. /api/health의 세부 서비스 상태 파싱
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    if (response.ok) {
      const data = await response.json();
      // /api/health가 서비스별 상태를 반환하는 경우 파싱
      if (data.services) {
        for (const [name, status] of Object.entries(data.services)) {
          services.push({
            name,
            status: (status as string) === 'ok' ? 'healthy' : 'degraded',
            responseTimeMs: 0,
            lastChecked: timestamp,
          });
        }
      }
    }
  } catch {
    // /api/health 호출 실패 시 무시 (apiHealth에서 이미 처리)
  }

  const overallStatus = determineOverallStatus(services);

  return { services, overallStatus, timestamp };
}

/**
 * 단일 엔드포인트 헬스체크
 */
async function checkEndpoint(
  url: string,
  name: string,
  timeoutMs: number = 5000
): Promise<ServiceHealth> {
  const startTime = performance.now();
  const timestamp = new Date().toISOString();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const responseTimeMs = Math.round(performance.now() - startTime);

    return {
      name,
      status: response.ok ? 'healthy' : 'degraded',
      responseTimeMs,
      lastChecked: timestamp,
      details: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    const responseTimeMs = Math.round(performance.now() - startTime);

    return {
      name,
      status: 'down',
      responseTimeMs,
      lastChecked: timestamp,
      details: error instanceof Error ? error.message : '연결 실패',
    };
  }
}

/**
 * 전체 시스템 상태 판정
 */
function determineOverallStatus(services: ServiceHealth[]): ServiceStatus {
  if (services.length === 0) return 'unknown';

  const hasDown = services.some((s) => s.status === 'down');
  if (hasDown) return 'down';

  const hasDegraded = services.some((s) => s.status === 'degraded');
  if (hasDegraded) return 'degraded';

  return 'healthy';
}
