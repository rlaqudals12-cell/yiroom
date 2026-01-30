/**
 * 딥링크 핸들러
 * 위젯 및 외부 앱에서 딥링크 처리
 */

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Linking } from 'react-native';

import {
  DEEP_LINK_SCHEME,
  PATH_MAPPING,
  ParsedDeepLink,
  DeepLinkParams,
} from './types';
import { deepLinkLogger } from '../utils/logger';

/**
 * 딥링크 URL 파싱
 */
export function parseDeepLink(url: string): ParsedDeepLink {
  try {
    // yiroom://path?param=value 형태 파싱
    const schemePrefix = `${DEEP_LINK_SCHEME}://`;

    if (!url.startsWith(schemePrefix)) {
      return { path: '', params: {}, isValid: false };
    }

    const withoutScheme = url.substring(schemePrefix.length);
    const [pathPart, queryPart] = withoutScheme.split('?');

    // 경로 정규화
    const path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;

    // 쿼리 파라미터 파싱
    const params: DeepLinkParams = {};
    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart);
      searchParams.forEach((value, key) => {
        params[key as keyof DeepLinkParams] = value;
      });
    }

    return { path, params, isValid: true };
  } catch (error) {
    deepLinkLogger.error('Failed to parse URL:', url, error);
    return { path: '', params: {}, isValid: false };
  }
}

/**
 * 딥링크로 화면 이동
 */
export function navigateToDeepLink(parsed: ParsedDeepLink): boolean {
  if (!parsed.isValid) {
    deepLinkLogger.info('Invalid deep link');
    return false;
  }

  // 경로 매핑
  let targetPath = PATH_MAPPING[parsed.path];

  // 동적 경로 처리 (예: /products/:id)
  if (
    !targetPath &&
    parsed.path.startsWith('/products/') &&
    parsed.path !== '/products/search'
  ) {
    const id = parsed.path.split('/').pop();
    targetPath = `/products/${id}`;
  }

  if (!targetPath) {
    deepLinkLogger.info('Unknown path:', parsed.path);
    return false;
  }

  // 햅틱 피드백
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  // 네비게이션
  deepLinkLogger.info('Navigating to:', targetPath, parsed.params);

  // 파라미터가 있는 경우 쿼리스트링으로 전달
  if (Object.keys(parsed.params).length > 0) {
    const queryString = new URLSearchParams(
      parsed.params as Record<string, string>
    ).toString();
    router.push(`${targetPath}?${queryString}` as never);
  } else {
    router.push(targetPath as never);
  }

  return true;
}

/**
 * 딥링크 URL 직접 처리
 */
export function handleDeepLinkUrl(url: string): boolean {
  const parsed = parseDeepLink(url);
  return navigateToDeepLink(parsed);
}

/**
 * 초기 딥링크 확인 (앱 콜드 스타트)
 */
export async function getInitialDeepLink(): Promise<ParsedDeepLink | null> {
  try {
    const url = await Linking.getInitialURL();
    if (url) {
      deepLinkLogger.info('Initial URL:', url);
      return parseDeepLink(url);
    }
    return null;
  } catch (error) {
    deepLinkLogger.error('Failed to get initial URL:', error);
    return null;
  }
}

/**
 * 딥링크 URL 생성
 */
export function createDeepLinkUrl(
  path: string,
  params?: DeepLinkParams
): string {
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  let url = `${DEEP_LINK_SCHEME}://${normalizedPath}`;

  if (params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    url += `?${queryString}`;
  }

  return url;
}
