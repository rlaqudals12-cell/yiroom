/**
 * 표현 레이어(Visual Expression) 공개 타입 (ADR-113)
 *
 * 이 레이어의 산출물은 "표현"이며 분석 진실값이 아니다.
 * 모든 산출 이미지에는 AI 생성/보정 라벨을 강제하기 위한 상수 플래그를 동반한다.
 *
 * @module lib/visual-expression/types
 * @see ADR-113 표현 레이어 분리, SDD-VISUAL-EXPRESSION
 */

// --- 자연 보정 (beautify) ---

export interface BeautifyInput {
  /** 사용자 원본 이미지 (data URL, 공유 흐름 전용) */
  imageBase64: string;
}

export interface BeautifyOutput {
  /** 보정본 이미지 (data URL) */
  imageBase64: string;
  /** 상수 true — UI 라벨("AI 보정됨") 강제 */
  aiEdited: true;
  /** 사용된 이미지 편집 모델 */
  model: string;
}

// --- 가상 착장 (tryon) ---

export type TryonCategory = 'tops' | 'bottoms' | 'one-pieces';

export interface TryonInput {
  /** 사용자 전신/상반신 이미지 (data URL) */
  modelImageBase64: string;
  /** 의류 이미지 URL (옷장/추천 코디) */
  garmentImageUrl: string;
  /** 의류 카테고리 */
  category: TryonCategory;
}

export interface TryonOutput {
  /** 생성된 착장 이미지 URL */
  imageUrl: string;
  /** 상수 true — UI 라벨("AI 생성 이미지") 강제 */
  aiGenerated: true;
}

// --- 비용 가드 (budget) ---

export interface BudgetResult {
  /** 상한 내 허용 여부 */
  allowed: boolean;
  /** 남은 오늘의 생성 횟수 */
  remaining: number;
  /** 하루 상한 (보정+착장 합산) */
  limit: number;
}
