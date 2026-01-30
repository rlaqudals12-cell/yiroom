/**
 * Cross-Module Integration Events
 * CMP-A2: 이벤트 발행 시스템
 *
 * @module lib/shared/integration-events
 * @see docs/specs/SDD-CROSS-MODULE-PROTOCOL.md
 *
 * Push 방식 업데이트를 위한 이벤트 발행/구독 시스템
 * - 이벤트 발행
 * - 캐시 무효화
 * - 웹훅 전송
 */

import type {
  SourceModule,
  IntegrationMetadata,
} from './integration-types';

// ============================================
// 이벤트 타입 정의
// ============================================

export const INTEGRATION_EVENT_TYPES = {
  PC2_RESULT_SAVED: 'PC2_RESULT_SAVED',
  S2_RESULT_SAVED: 'S2_RESULT_SAVED',
  C2_RESULT_SAVED: 'C2_RESULT_SAVED',
  OH1_RESULT_SAVED: 'OH1_RESULT_SAVED',
  M1_RESULT_SAVED: 'M1_RESULT_SAVED',
  H1_RESULT_SAVED: 'H1_RESULT_SAVED',
  SK1_RESULT_SAVED: 'SK1_RESULT_SAVED',
  W2_RESULT_SAVED: 'W2_RESULT_SAVED',
  N1_RESULT_SAVED: 'N1_RESULT_SAVED',
} as const;

export type IntegrationEventType =
  (typeof INTEGRATION_EVENT_TYPES)[keyof typeof INTEGRATION_EVENT_TYPES];

// ============================================
// 이벤트 인터페이스
// ============================================

export interface IntegrationEvent<T = unknown> {
  id: string;
  type: IntegrationEventType;
  userId: string;
  timestamp: string;
  data: T;
  metadata: IntegrationMetadata;
}

export interface EventPublishResult {
  success: boolean;
  eventId: string;
  invalidatedCaches: string[];
  notifiedTargets: string[];
  error?: string;
}

// ============================================
// 캐시 무효화 규칙
// ============================================

/**
 * 소스 이벤트 → 무효화 대상 캐시 매핑
 */
export const CACHE_INVALIDATION_RULES: Record<IntegrationEventType, string[]> = {
  [INTEGRATION_EVENT_TYPES.PC2_RESULT_SAVED]: [
    'makeup:recommendations',
    'hair:recommendations',
    'style:recommendations',
  ],
  [INTEGRATION_EVENT_TYPES.S2_RESULT_SAVED]: [
    'procedures:recommendations',
    'makeup:foundation',
    'skincare:recommendations',
  ],
  [INTEGRATION_EVENT_TYPES.C2_RESULT_SAVED]: [
    'stretching:plan',
    'exercise:recommendations',
    'posture:corrections',
  ],
  [INTEGRATION_EVENT_TYPES.OH1_RESULT_SAVED]: [
    'nutrition:oral',
    'supplement:recommendations',
  ],
  [INTEGRATION_EVENT_TYPES.M1_RESULT_SAVED]: [
    'makeup:products',
  ],
  [INTEGRATION_EVENT_TYPES.H1_RESULT_SAVED]: [
    'hair:products',
  ],
  [INTEGRATION_EVENT_TYPES.SK1_RESULT_SAVED]: [
    'procedures:clinics',
  ],
  [INTEGRATION_EVENT_TYPES.W2_RESULT_SAVED]: [
    'stretching:history',
  ],
  [INTEGRATION_EVENT_TYPES.N1_RESULT_SAVED]: [
    'nutrition:plans',
    'recipes:recommendations',
  ],
};

/**
 * Push 알림이 필요한 이벤트 타입
 */
export const PUSH_NOTIFICATION_EVENTS: IntegrationEventType[] = [
  INTEGRATION_EVENT_TYPES.PC2_RESULT_SAVED,
  INTEGRATION_EVENT_TYPES.S2_RESULT_SAVED,
];

// ============================================
// 이벤트 핸들러 저장소
// ============================================

type EventHandler<T = unknown> = (event: IntegrationEvent<T>) => Promise<void>;

const eventHandlers: Map<IntegrationEventType, EventHandler[]> = new Map();

// ============================================
// 이벤트 발행 함수
// ============================================

/**
 * 고유 이벤트 ID 생성
 */
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 캐시 무효화 실행
 * @param eventType - 이벤트 타입
 * @param userId - 사용자 ID
 * @returns 무효화된 캐시 키 목록
 */
async function invalidateTargetCache(
  eventType: IntegrationEventType,
  userId: string
): Promise<string[]> {
  const cachePatterns = CACHE_INVALIDATION_RULES[eventType] ?? [];
  const invalidatedKeys: string[] = [];

  for (const pattern of cachePatterns) {
    const cacheKey = `${pattern}:${userId}`;
    // 실제 캐시 무효화 로직 (Redis 또는 메모리 캐시)
    // await cacheClient.del(cacheKey);
    invalidatedKeys.push(cacheKey);
  }

  return invalidatedKeys;
}

/**
 * 타겟 모듈 알림이 필요한지 확인
 */
function shouldNotifyTarget(eventType: IntegrationEventType): boolean {
  return PUSH_NOTIFICATION_EVENTS.includes(eventType);
}

/**
 * 타겟 모듈 알림 전송
 */
async function notifyTargetModule<T>(
  event: IntegrationEvent<T>
): Promise<string[]> {
  if (!shouldNotifyTarget(event.type)) {
    return [];
  }

  const notifiedTargets: string[] = [];

  // 실제 구현에서는 웹훅 또는 내부 이벤트 버스 사용
  // await sendWebhook(targetUrl, event);

  // 현재는 로깅만
  console.log('[Integration] Notifying targets for event:', event.type);

  // 타겟 모듈 목록 반환
  const targetModules = getTargetModules(event.type);
  notifiedTargets.push(...targetModules);

  return notifiedTargets;
}

/**
 * 이벤트 타입에 따른 타겟 모듈 반환
 */
function getTargetModules(eventType: IntegrationEventType): string[] {
  const targets: Record<IntegrationEventType, string[]> = {
    [INTEGRATION_EVENT_TYPES.PC2_RESULT_SAVED]: ['M-1', 'H-1'],
    [INTEGRATION_EVENT_TYPES.S2_RESULT_SAVED]: ['SK-1', 'M-1'],
    [INTEGRATION_EVENT_TYPES.C2_RESULT_SAVED]: ['W-2'],
    [INTEGRATION_EVENT_TYPES.OH1_RESULT_SAVED]: ['N-1'],
    [INTEGRATION_EVENT_TYPES.M1_RESULT_SAVED]: [],
    [INTEGRATION_EVENT_TYPES.H1_RESULT_SAVED]: [],
    [INTEGRATION_EVENT_TYPES.SK1_RESULT_SAVED]: [],
    [INTEGRATION_EVENT_TYPES.W2_RESULT_SAVED]: [],
    [INTEGRATION_EVENT_TYPES.N1_RESULT_SAVED]: [],
  };
  return targets[eventType] ?? [];
}

/**
 * 이벤트 로깅
 */
async function logIntegrationEvent<T>(event: IntegrationEvent<T>): Promise<void> {
  // 감사 로그 기록 (실제 구현에서는 audit logger 사용)
  console.log('[Integration] Event published:', {
    id: event.id,
    type: event.type,
    userId: event.userId,
    timestamp: event.timestamp,
  });
}

/**
 * 연동 이벤트 발행
 *
 * @example
 * await publishIntegrationEvent({
 *   type: 'PC2_RESULT_SAVED',
 *   userId: user.id,
 *   timestamp: new Date().toISOString(),
 *   data: pc2Result,
 *   metadata: {
 *     schemaVersion: '1.0.0',
 *     sourceModuleVersion: 'PC-2@1.1',
 *     generatedAt: new Date().toISOString(),
 *   },
 * });
 */
export async function publishIntegrationEvent<T>(
  eventInput: Omit<IntegrationEvent<T>, 'id'>
): Promise<EventPublishResult> {
  const event: IntegrationEvent<T> = {
    ...eventInput,
    id: generateEventId(),
  };

  try {
    // 1. 이벤트 로깅
    await logIntegrationEvent(event);

    // 2. 캐시 무효화
    const invalidatedCaches = await invalidateTargetCache(
      event.type,
      event.userId
    );

    // 3. 타겟 모듈 알림
    const notifiedTargets = await notifyTargetModule(event);

    // 4. 등록된 핸들러 실행
    const handlers = eventHandlers.get(event.type) ?? [];
    await Promise.all(handlers.map((handler) => handler(event)));

    return {
      success: true,
      eventId: event.id,
      invalidatedCaches,
      notifiedTargets,
    };
  } catch (error) {
    console.error('[Integration] Event publish failed:', error);
    return {
      success: false,
      eventId: event.id,
      invalidatedCaches: [],
      notifiedTargets: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// 이벤트 구독 함수
// ============================================

/**
 * 이벤트 핸들러 등록
 */
export function subscribeToEvent<T = unknown>(
  eventType: IntegrationEventType,
  handler: EventHandler<T>
): () => void {
  const handlers = eventHandlers.get(eventType) ?? [];
  handlers.push(handler as EventHandler);
  eventHandlers.set(eventType, handlers);

  // Unsubscribe 함수 반환
  return () => {
    const currentHandlers = eventHandlers.get(eventType) ?? [];
    const index = currentHandlers.indexOf(handler as EventHandler);
    if (index !== -1) {
      currentHandlers.splice(index, 1);
    }
  };
}

/**
 * 모든 핸들러 제거 (테스트용)
 */
export function clearAllHandlers(): void {
  eventHandlers.clear();
}

// ============================================
// 소스 모듈별 이벤트 발행 헬퍼
// ============================================

/**
 * 소스 모듈에서 이벤트 타입으로 변환
 */
export function getEventTypeForModule(
  sourceModule: SourceModule
): IntegrationEventType | null {
  const mapping: Partial<Record<SourceModule, IntegrationEventType>> = {
    'PC-1': INTEGRATION_EVENT_TYPES.PC2_RESULT_SAVED,
    'PC-2': INTEGRATION_EVENT_TYPES.PC2_RESULT_SAVED,
    'S-1': INTEGRATION_EVENT_TYPES.S2_RESULT_SAVED,
    'S-2': INTEGRATION_EVENT_TYPES.S2_RESULT_SAVED,
    'C-1': INTEGRATION_EVENT_TYPES.C2_RESULT_SAVED,
    'C-2': INTEGRATION_EVENT_TYPES.C2_RESULT_SAVED,
    'OH-1': INTEGRATION_EVENT_TYPES.OH1_RESULT_SAVED,
    // CIE 모듈은 이벤트 발행하지 않음 (파이프라인 내부 처리)
  };
  return mapping[sourceModule] ?? null;
}

/**
 * 분석 결과 저장 후 이벤트 발행 헬퍼
 */
export async function publishAnalysisResultEvent<T>(
  sourceModule: SourceModule,
  userId: string,
  data: T,
  moduleVersion: string = '1.0'
): Promise<EventPublishResult> {
  const eventType = getEventTypeForModule(sourceModule);
  if (!eventType) {
    return {
      success: false,
      eventId: '',
      invalidatedCaches: [],
      notifiedTargets: [],
      error: `Unknown source module: ${sourceModule}`,
    };
  }

  return publishIntegrationEvent({
    type: eventType,
    userId,
    timestamp: new Date().toISOString(),
    data,
    metadata: {
      schemaVersion: '1.0.0',
      sourceModuleVersion: `${sourceModule}@${moduleVersion}`,
      generatedAt: new Date().toISOString(),
    },
  });
}

// ============================================
// 이벤트 히스토리 (디버깅/감사용)
// ============================================

interface EventHistoryEntry<T = unknown> {
  event: IntegrationEvent<T>;
  result: EventPublishResult;
  processedAt: string;
}

const eventHistory: EventHistoryEntry[] = [];
const MAX_HISTORY_SIZE = 100;

/**
 * 이벤트 히스토리 기록
 */
export function recordEventHistory<T>(
  event: IntegrationEvent<T>,
  result: EventPublishResult
): void {
  eventHistory.push({
    event,
    result,
    processedAt: new Date().toISOString(),
  });

  // 최대 크기 유지
  if (eventHistory.length > MAX_HISTORY_SIZE) {
    eventHistory.shift();
  }
}

/**
 * 이벤트 히스토리 조회
 */
export function getEventHistory(
  userId?: string,
  eventType?: IntegrationEventType
): EventHistoryEntry[] {
  return eventHistory.filter((entry) => {
    if (userId && entry.event.userId !== userId) return false;
    if (eventType && entry.event.type !== eventType) return false;
    return true;
  });
}

/**
 * 이벤트 히스토리 초기화 (테스트용)
 */
export function clearEventHistory(): void {
  eventHistory.length = 0;
}
