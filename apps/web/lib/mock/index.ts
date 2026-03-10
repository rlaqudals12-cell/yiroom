/**
 * Mock 모듈 공개 API (P8 Barrel Export)
 *
 * @module lib/mock
 * @description 분석 모듈 Mock 생성기 중앙 레지스트리
 *
 * @example
 * import { getMock, hasMock, getRegisteredTypes } from '@/lib/mock';
 *
 * if (hasMock('skin')) {
 *   const result = getMock<SkinResult>('skin');
 * }
 */

// Factory API
export { registerMock, getMock, hasMock, getRegisteredTypes, clearRegistry } from './factory';

// 레지스트리 로딩 (import 시 자동 등록)
import './registry';
