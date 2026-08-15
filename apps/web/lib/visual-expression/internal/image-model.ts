/**
 * 이미지 생성·편집 모델 ID — 표현 레이어 단일 정본 (P4)
 *
 * 보정(beautify)과 트윈(twin)이 같은 모델 ID 리터럴을 각자 하드코딩하고 있어
 * 모델 종료(deprecation) 때마다 두 곳을 따로 고쳐야 했다. 종료 대응은 시한부
 * 작업이라 한 곳을 빠뜨리면 그대로 장애가 되므로 상수를 여기로 모은다.
 *
 * 왜 이 모델인가 (2026-08-15 공식 문서 재확인):
 * - `gemini-2.5-flash-image`(나노바나나 1)는 **2026-10-02 종료** 확정 → 사용 금지.
 *   공식 권장 승계는 3.1 flash image 계열이다.
 * - `gemini-3.1-flash-lite-image`(나노바나나2 Lite)는 GA이며 **종료 일정 없음**.
 *   원가 $0.0336/1K장으로 종료 예정 모델($0.039)보다 오히려 14% 저렴하다.
 * - 품질 이슈 시 `GEMINI_IMAGE_MODEL` env로 상위 모델 즉시 폴백 가능.
 *   단 `gemini-3.1-flash-image`는 $0.067/1K장 = **약 2배 원가**이므로
 *   DAILY_LIMIT(=5) 예산 캡을 함께 재검토해야 한다.
 *
 * @module lib/visual-expression/internal/image-model
 * @see ADR-113(보정), ADR-115(트윈)
 * @see https://ai.google.dev/gemini-api/docs/deprecations
 */

/** 기본 이미지 모델 — 나노바나나2 Lite (GA, 종료 일정 없음) */
export const DEFAULT_IMAGE_MODEL = 'gemini-3.1-flash-lite-image';

/**
 * 실제 사용 모델 ID.
 *
 * env 오버라이드를 유지하는 이유: 모델 품질 회귀나 갑작스러운 종료 공지가 떴을 때
 * 재배포 없이 상위 모델(`gemini-3.1-flash-image` 등)로 즉시 전환하기 위함.
 */
export const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
