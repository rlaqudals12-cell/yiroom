/**
 * 직전 통합분석 제출 이미지의 인메모리 캐시 (모바일)
 *
 * @module lib/integrated/last-submission
 * @description
 *   왜 필요한가 (근본 원인 — 에뮬 반복 실측):
 *     결과 화면의 "다시 시도" → 온보딩(index) 재진입은 **새 컴포넌트 마운트**라
 *     faceImage 상태가 비어, 사용자가 사진을 처음부터 다시 골라야 했다. 서버
 *     POST /api/analyze/integrated는 mode:'update'에서도 faceImageBase64가 필수이고
 *     매 요청 이미지를 새로 업로드해 새 세션을 만든다(기존 세션 이미지 재사용 미지원).
 *     따라서 재선택을 없애려면 **클라이언트가 직전 제출 이미지를 복원**해야 한다.
 *
 *   왜 인메모리만인가 (BIPA/PIPA):
 *     얼굴·전신 이미지는 생체정보다. 디스크 영속화(AsyncStorage 등)는 금지한다.
 *     앱 프로세스 수명 동안 메모리에만 두고, 프로세스 종료 시 자연 소멸한다.
 */

/** 직전 제출에 쓰인 이미지(base64 data URL). 얼굴은 필수, 전신은 선택. */
export interface LastSubmission {
  faceImageBase64: string;
  bodyImageBase64: string | null;
}

// 모듈 레벨 인메모리 캐시 — 디스크에 절대 쓰지 않는다.
let cached: LastSubmission | null = null;

/**
 * 직전 제출 이미지를 인메모리에 기억한다. 제출 직전에 호출한다.
 */
export function rememberSubmission(faceImageBase64: string, bodyImageBase64: string | null): void {
  cached = { faceImageBase64, bodyImageBase64 };
}

/**
 * 직전 제출 이미지를 반환한다. 없으면 null.
 */
export function getLastSubmission(): LastSubmission | null {
  return cached;
}

/**
 * 캐시를 비운다(테스트 격리·명시적 폐기용).
 */
export function clearLastSubmission(): void {
  cached = null;
}
