/**
 * AI 트윈(Twin) 공개 API (ADR-115 — ADR-113 표현 레이어 하위 확장)
 *
 * "나를 닮은 모델"에 스타일을 입히는 시각 종착점. 승인 게이트(pending→approved)가
 * 핵심 — 승인 전 트윈은 어떤 표면에도 노출하지 않는다(호출 측 책임).
 *
 * 분석 진실값(lib/analysis, app/api/analyze/**)에 쓰지 않고 역참조도 하지 않는다
 * (단방향 — 표현→진실 읽기만, ADR-113 상속). 일 생성 상한은 표현 레이어 budget과 공유.
 *
 * @module lib/visual-expression/twin
 * @see ADR-115, SDD-AI-TWIN
 */

export { generateTwin, composeOnTwin } from './internal/service';
export {
  getApprovedTwin,
  getMyTwin,
  approveTwin,
  rejectTwin,
  deleteTwin,
  TWIN_BUCKET,
} from './internal/store';
export {
  TWIN_MODEL,
  TWIN_PROMPT,
  TWIN_COMPOSE_PROMPT,
  TWIN_PROMPT_VERSION,
  buildTwinPrompt,
} from './internal/gemini';
export { TwinNotFoundError, TwinNotApprovedError, TwinGenerationError } from './internal/errors';

export type {
  TwinStatus,
  TwinBodyConstraint,
  TwinGenerateInput,
  TwinRecord,
  TwinLayer,
  TwinComposeOutput,
} from './types';
