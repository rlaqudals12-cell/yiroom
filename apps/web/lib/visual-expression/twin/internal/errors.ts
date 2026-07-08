/**
 * AI 트윈 도메인 에러 (ADR-115)
 *
 * API 계층이 상태코드(404/403/500)로 매핑하기 위한 구분자.
 *
 * @module lib/visual-expression/twin/internal/errors
 */

/** 트윈 행을 찾지 못함 (또는 소유자 불일치) → 404 */
export class TwinNotFoundError extends Error {
  constructor(message = '트윈을 찾을 수 없어요') {
    super(message);
    this.name = 'TwinNotFoundError';
  }
}

/** 승인되지 않은 트윈에 착장 시도 → 403 */
export class TwinNotApprovedError extends Error {
  constructor(message = '승인된 트윈만 사용할 수 있어요') {
    super(message);
    this.name = 'TwinNotApprovedError';
  }
}

/** 이미지 생성 실패(키 없음·모델 무응답) → 500 (가짜 트윈 금지) */
export class TwinGenerationError extends Error {
  constructor(message = '지금은 트윈을 만들 수 없어요') {
    super(message);
    this.name = 'TwinGenerationError';
  }
}
