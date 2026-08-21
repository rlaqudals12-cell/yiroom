/**
 * 날씨 서비스 테스트
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateMockWeather,
  findNearestRegion,
  clearWeatherCache,
  getWeatherCacheStatus,
} from '@/lib/style/weatherService';

describe('weatherService', () => {
  beforeEach(() => {
    clearWeatherCache();
  });

  describe('generateMockWeather', () => {
    it('서울 지역의 Mock 날씨를 생성한다', () => {
      const weather = generateMockWeather('seoul');

      expect(weather.region).toBe('seoul');
      expect(weather.location).toBe('서울');
      expect(weather.current).toBeDefined();
      expect(weather.current.temp).toBeDefined();
      expect(weather.forecast.length).toBe(6);
      expect(weather.usedFallback).toBe(true);
    });

    it('부산 지역의 Mock 날씨를 생성한다', () => {
      const weather = generateMockWeather('busan');

      expect(weather.region).toBe('busan');
      expect(weather.location).toBe('부산');
    });

    it('제주 지역의 Mock 날씨를 생성한다', () => {
      const weather = generateMockWeather('jeju');

      expect(weather.region).toBe('jeju');
      expect(weather.location).toBe('제주');
    });

    it('현재 시간 기준으로 cachedAt을 설정한다', () => {
      const before = new Date().toISOString();
      const weather = generateMockWeather('seoul');
      const after = new Date().toISOString();

      expect(weather.cachedAt >= before).toBe(true);
      expect(weather.cachedAt <= after).toBe(true);
    });

    it('6시간 예보를 포함한다', () => {
      const weather = generateMockWeather('seoul');

      expect(weather.forecast).toHaveLength(6);
      weather.forecast.forEach((forecast) => {
        expect(forecast.time).toMatch(/^\d{2}:00$/);
        expect(typeof forecast.temp).toBe('number');
        expect(typeof forecast.precipitation).toBe('number');
      });
    });

    it('현재 날씨에 필수 필드를 포함한다', () => {
      const weather = generateMockWeather('seoul');
      const { current } = weather;

      expect(typeof current.temp).toBe('number');
      expect(typeof current.feelsLike).toBe('number');
      expect(typeof current.humidity).toBe('number');
      expect(typeof current.windSpeed).toBe('number');
      expect(typeof current.uvi).toBe('number');
      expect(typeof current.description).toBe('string');
      expect(typeof current.icon).toBe('string');
      expect(typeof current.precipitation).toBe('number');
    });

    it('같은 지역과 3시간 버킷은 같은 현재·예보 값을 만든다', () => {
      const first = generateMockWeather('seoul', new Date('2026-08-21T00:05:00.000Z'));
      const second = generateMockWeather('seoul', new Date('2026-08-21T02:55:00.000Z'));

      expect(second.current).toEqual(first.current);
      expect(second.forecast).toEqual(first.forecast);
      expect(second.usedFallback).toBe(true);
    });

    it('같은 지역과 기준 시각은 전체 응답이 동일하다', () => {
      const referenceTime = new Date('2026-08-21T00:05:00.000Z');

      expect(generateMockWeather('seoul', referenceTime)).toEqual(
        generateMockWeather('seoul', referenceTime)
      );
    });

    it('폴백 구현에 비결정적 Math.random을 다시 도입하지 않는다', () => {
      const source = fs.readFileSync(
        path.resolve(process.cwd(), 'lib/style/weatherService.ts'),
        'utf8'
      );

      expect(source).not.toContain('Math.random(');
      expect(source).toContain('createSeededRandom');
    });
  });

  describe('findNearestRegion', () => {
    it('서울 좌표에서 seoul을 반환한다', () => {
      const region = findNearestRegion(37.5665, 126.978);
      expect(region).toBe('seoul');
    });

    it('부산 좌표에서 busan을 반환한다', () => {
      const region = findNearestRegion(35.1796, 129.0756);
      expect(region).toBe('busan');
    });

    it('제주 좌표에서 jeju를 반환한다', () => {
      const region = findNearestRegion(33.4996, 126.5312);
      expect(region).toBe('jeju');
    });

    it('대전 좌표에서 daejeon을 반환한다', () => {
      const region = findNearestRegion(36.3504, 127.3845);
      expect(region).toBe('daejeon');
    });

    it('강원도 좌표에서 gangwon을 반환한다', () => {
      const region = findNearestRegion(37.8228, 128.1555);
      expect(region).toBe('gangwon');
    });
  });

  describe('clearWeatherCache', () => {
    it('캐시를 초기화한다', () => {
      // 초기 상태
      const initialStatus = getWeatherCacheStatus();
      expect(initialStatus.size).toBe(0);

      clearWeatherCache();

      const afterClear = getWeatherCacheStatus();
      expect(afterClear.size).toBe(0);
      expect(afterClear.regions).toHaveLength(0);
    });
  });

  describe('getWeatherCacheStatus', () => {
    it('캐시 상태를 반환한다', () => {
      const status = getWeatherCacheStatus();

      expect(status).toHaveProperty('size');
      expect(status).toHaveProperty('regions');
      expect(Array.isArray(status.regions)).toBe(true);
    });
  });
});
