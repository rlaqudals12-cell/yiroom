/**
 * Rate Limit 모듈 테스트
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { checkRateLimit, incrementRateLimit, getRateLimitInfo } from '../../lib/api/rate-limit';

describe('Rate Limit', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('checkRateLimit', () => {
    it('처음에는 호출 가능해야 한다', async () => {
      const allowed = await checkRateLimit();
      expect(allowed).toBe(true);
    });

    it('50회 초과하면 호출 불가해야 한다', async () => {
      // 50회 호출 기록
      for (let i = 0; i < 50; i++) {
        await incrementRateLimit();
      }

      const allowed = await checkRateLimit();
      expect(allowed).toBe(false);
    });

    it('49회까지는 호출 가능해야 한다', async () => {
      for (let i = 0; i < 49; i++) {
        await incrementRateLimit();
      }

      const allowed = await checkRateLimit();
      expect(allowed).toBe(true);
    });
  });

  describe('incrementRateLimit', () => {
    it('카운터를 증가시켜야 한다', async () => {
      await incrementRateLimit();
      await incrementRateLimit();
      await incrementRateLimit();

      const info = await getRateLimitInfo();
      expect(info.used).toBe(3);
      expect(info.remaining).toBe(47);
    });
  });

  describe('getRateLimitInfo', () => {
    it('초기 상태를 반환해야 한다', async () => {
      const info = await getRateLimitInfo();
      expect(info.used).toBe(0);
      expect(info.remaining).toBe(50);
      expect(info.limit).toBe(50);
    });

    it('날짜가 바뀌면 리셋되어야 한다', async () => {
      // 5회 호출
      for (let i = 0; i < 5; i++) {
        await incrementRateLimit();
      }

      // 어제 날짜로 강제 설정
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const key = yesterday.toISOString().split('T')[0];
      await AsyncStorage.setItem(
        '@yiroom/rate-limit',
        JSON.stringify({ count: 45, date: key })
      );

      // 날짜가 바뀌었으므로 리셋
      const info = await getRateLimitInfo();
      expect(info.used).toBe(0);
      expect(info.remaining).toBe(50);
    });
  });
});
