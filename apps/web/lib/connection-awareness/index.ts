/**
 * ConnectionAwareness 공개 API
 *
 * @module lib/connection-awareness
 * @description "A라서 B" 연결의 내재화 추적 시스템
 * @see docs/principles/connection-awareness-spec.md
 */

export type {
  ConnectionStatus,
  ConnectionModule,
  ConnectionAwareness,
  ExposeRequest,
  ExposeResponse,
  ConfirmResponse,
  ConnectionStats,
  ExplanationDepth,
} from './types';

export {
  exposeConnection,
  confirmConnection,
  getUserConnections,
  getConnectionStats,
  getConnectionStatsLive,
  getExplanationDepth,
} from './repository';

export {
  insightToExposeRequest,
  getModuleLabel,
  analysisToConnectionModule,
} from './insight-bridge';

export { capsuleItemToExposeRequest, capsuleModulesToExposeRequests } from './capsule-bridge';
