/**
 * AI 트윈(Twin) 공개 타입 (ADR-115)
 *
 * 트윈은 "표현" 산출물이며 분석 진실값이 아니다(ADR-113 상속).
 * 모든 산출 이미지는 `aiGenerated: true` 상수로 "AI 생성" 라벨을 강제한다.
 * 승인 게이트(pending→approved)가 핵심 — 안 닮은 트윈을 시스템이 강요하지 않는다.
 *
 * @module lib/visual-expression/twin/types
 * @see ADR-115, SDD-AI-TWIN §2
 */

export type TwinStatus = 'pending' | 'approved' | 'rejected';

/** body_analyses 실측 체형 데이터(선택) — 프롬프트 제약으로 주입 */
export interface TwinBodyConstraint {
  /** 체형 타입 라벨 (예: "스트레이트", "웨이브") */
  bodyTypeLabel: string;
  /** 비율 등 부가 측정치(선택) */
  ratios?: Record<string, number>;
}

/** 트윈 생성 입력 (원본 사진은 저장하지 않음) */
export interface TwinGenerateInput {
  /** 셀카 (data URL, 필수) */
  faceImageBase64: string;
  /** 전신 (data URL, 선택 — 있으면 체형 정합↑) */
  bodyImageBase64?: string;
  /** 실측 체형 제약(선택) */
  bodyConstraint?: TwinBodyConstraint;
}

/** 트윈 레코드 (imageUrl = 비공개 버킷 서명 URL) */
export interface TwinRecord {
  id: string;
  imageUrl: string;
  status: TwinStatus;
  /** 상수 true — UI 라벨("AI 생성") 강제 */
  aiGenerated: true;
}

/** 결합(착장) 레이어 — v1은 outfit 1종 */
export interface TwinLayer {
  kind: 'outfit';
  /** 의류 이미지 URL (옷장/추천 코디) */
  garmentImageUrl: string;
}

/** 결합 결과 — 저장하지 않음(다운로드/공유용 data URL) */
export interface TwinComposeOutput {
  imageUrl: string;
  /** 상수 true — UI 라벨("AI 생성 이미지") 강제 */
  aiGenerated: true;
}
