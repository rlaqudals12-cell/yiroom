/**
 * Clerk 설정 및 토큰 캐시
 */
import { TokenCache } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

import { authLogger } from './utils/logger';

/**
 * SecureStore 기반 토큰 캐시
 * 앱 재시작 후에도 인증 상태 유지
 */
export const tokenCache: TokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      authLogger.error('SecureStore getToken error:', error);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      authLogger.error('SecureStore saveToken error:', error);
    }
  },
  async clearToken(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      authLogger.error('SecureStore clearToken error:', error);
    }
  },
};

/**
 * Clerk Publishable Key
 * 환경변수에서 가져오거나 하드코딩된 값 사용
 */
export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
