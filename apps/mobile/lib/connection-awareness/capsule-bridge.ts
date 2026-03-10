/**
 * Daily Capsule ↔ ConnectionAwareness 브릿지
 *
 * 캡슐 아이템의 추천 이유를 ConnectionAwareness로 추적하여
 * 사용자의 내재화 수준에 따라 reason 표시 깊이를 조절
 */

import type { ModuleCode } from '@/types/capsule';
import type { ExposeRequest, ConnectionModule } from '@/lib/connection-awareness';

// ModuleCode → ConnectionModule 매핑
const MODULE_CODE_TO_CONNECTION: Record<ModuleCode, ConnectionModule> = {
  PC: 'personal-color',
  S: 'skin',
  C: 'body',
  W: 'workout',
  N: 'nutrition',
  H: 'hair',
  M: 'makeup',
  OH: 'oral-health',
  Fashion: 'fashion',
};

// ModuleCode → 한글 라벨
const MODULE_CODE_LABELS: Record<ModuleCode, string> = {
  PC: '퍼스널컬러',
  S: '피부 분석',
  C: '체형 분석',
  W: '운동',
  N: '영양',
  H: '헤어 분석',
  M: '메이크업',
  OH: '구강건강',
  Fashion: '패션',
};

/**
 * 캡슐 아이템의 모듈코드를 ConnectionAwareness ExposeRequest로 변환
 *
 * connectionId: `daily_routine::{connectionModule}`
 * → 각 도메인별 하나의 연결로 추적 (아이템 단위가 아닌 도메인 단위)
 */
export function capsuleItemToExposeRequest(moduleCode: ModuleCode): ExposeRequest {
  const connectionModule = MODULE_CODE_TO_CONNECTION[moduleCode] ?? 'skin';
  const label = MODULE_CODE_LABELS[moduleCode] ?? '루틴';

  return {
    connectionId: `daily_routine::${connectionModule}`,
    sourceModule: connectionModule,
    targetDomain: 'daily-routine',
    connectionRule: `${label} 기반 — 데일리 루틴 추천`,
  };
}

/**
 * 캡슐 내 고유 모듈코드 목록에서 ExposeRequest 배열 생성
 */
export function capsuleModulesToExposeRequests(moduleCodes: ModuleCode[]): ExposeRequest[] {
  const unique = [...new Set(moduleCodes)];
  return unique.map(capsuleItemToExposeRequest);
}
