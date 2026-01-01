/**
 * 딥링크 타입 정의
 */

// 딥링크 경로 타입
export type DeepLinkPath =
  | '/'
  | '/dashboard'
  | '/workout/session'
  | '/workout/log'
  | '/workout/history'
  | '/nutrition/dashboard'
  | '/nutrition/camera'
  | '/nutrition/water'
  | '/products'
  | '/products/:id'
  | '/products/search'
  | '/settings'
  | '/settings/notifications'
  | '/settings/goals'
  | '/settings/widgets'
  | '/analysis/personal-color'
  | '/analysis/skin'
  | '/analysis/body';

// 딥링크 파라미터
export interface DeepLinkParams {
  action?: string;
  id?: string;
  amount?: string;
  type?: string;
}

// 파싱된 딥링크
export interface ParsedDeepLink {
  path: string;
  params: DeepLinkParams;
  isValid: boolean;
}

// 딥링크 스키마
export const DEEP_LINK_SCHEME = 'yiroom';

// 경로 매핑
export const PATH_MAPPING: Record<string, string> = {
  '/': '/(tabs)',
  '/dashboard': '/(tabs)',
  '/workout/session': '/(workout)/session',
  '/workout/log': '/(workout)/log',
  '/workout/history': '/(workout)/history',
  '/nutrition/dashboard': '/(nutrition)/dashboard',
  '/nutrition/camera': '/(nutrition)/camera',
  '/nutrition/water': '/(nutrition)/water',
  '/products': '/products',
  '/products/search': '/products/search',
  '/settings': '/settings',
  '/settings/notifications': '/settings/notifications',
  '/settings/goals': '/settings/goals',
  '/settings/widgets': '/settings/widgets',
  '/analysis/personal-color': '/(analysis)/personal-color',
  '/analysis/skin': '/(analysis)/skin',
  '/analysis/body': '/(analysis)/body',
};
