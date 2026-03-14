/**
 * 헬스체크 집계 모듈 테스트
 * 네트워크 호출을 모킹하여 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSystemHealth } from '@/lib/monitoring/health-aggregator';

// fetch 모킹
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// performance.now 모킹
let perfNowValue = 0;
vi.stubGlobal('performance', {
  now: () => {
    perfNowValue += 50;
    return perfNowValue;
  },
});

beforeEach(() => {
  mockFetch.mockReset();
  perfNowValue = 0;
});

describe('health-aggregator', () => {
  describe('fetchSystemHealth', () => {
    it('정상 응답 → healthy 상태', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });

      const result = await fetchSystemHealth('http://localhost:3000');
      expect(result.overallStatus).toBe('healthy');
      expect(result.services.length).toBeGreaterThanOrEqual(1);
      expect(result.timestamp).toBeTruthy();
    });

    it('API 서버 다운 → down 상태', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      const result = await fetchSystemHealth('http://localhost:3000');
      expect(result.overallStatus).toBe('down');
      expect(result.services[0].status).toBe('down');
      expect(result.services[0].details).toContain('Connection refused');
    });

    it('API 서버 비정상 응답 → degraded', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      const result = await fetchSystemHealth('http://localhost:3000');
      expect(result.overallStatus).toBe('degraded');
    });

    it('서비스별 상태 파싱', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          services: {
            database: 'ok',
            cache: 'ok',
            ai: 'error',
          },
        }),
      });

      const result = await fetchSystemHealth('http://localhost:3000');
      // API 서버 + 3개 서비스 = 4개
      expect(result.services.length).toBeGreaterThanOrEqual(3);

      const aiService = result.services.find((s) => s.name === 'ai');
      expect(aiService?.status).toBe('degraded');

      const dbService = result.services.find((s) => s.name === 'database');
      expect(dbService?.status).toBe('healthy');
    });

    it('응답 시간 측정', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });

      const result = await fetchSystemHealth('http://localhost:3000');
      // performance.now 모킹으로 50ms 증가
      expect(result.services[0].responseTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('빈 baseUrl 허용', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });

      const result = await fetchSystemHealth();
      expect(result).toBeDefined();
    });

    it('일부 서비스 장애 → degraded (down 아님)', async () => {
      // 첫 번째 호출: API 정상
      // 두 번째 호출: 서비스 상태 파싱
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          services: { database: 'ok', cache: 'error' },
        }),
      });

      const result = await fetchSystemHealth('http://localhost:3000');
      expect(result.overallStatus).toBe('degraded');
    });
  });
});
