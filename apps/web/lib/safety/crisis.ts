/**
 * 위기 상황 감지 모듈
 * 자해/자살 관련 키워드 감지 시 즉시 전문 상담 안내
 *
 * Coach, Chat 등 모든 대화형 AI에서 공유
 */

// 위기 감지 키워드 (공백 무시 매칭)
const CRISIS_KEYWORDS = [
  '자살',
  '죽고싶',
  '죽고 싶',
  '자해',
  '손목',
  '끝내고',
  '살고싶지않',
  '살고 싶지 않',
  '목숨',
  '극단적',
  '세상에서 사라지',
  '더이상 못살',
  '더 이상 못 살',
];

// 위기 상황 응답 메시지
export const CRISIS_RESPONSE_MESSAGE =
  '지금 많이 힘드시군요. 당신의 이야기를 들어줄 전문가가 있어요.\n\n' +
  '자살예방상담전화 1393 (24시간)\n' +
  '정신건강위기상담전화 1577-0199\n' +
  '생명의전화 1588-9191\n\n' +
  '전문 상담사가 24시간 기다리고 있어요. 꼭 연락해주세요.';

/**
 * 위기 상황 키워드 감지
 * 공백을 제거한 후 매칭하여 "죽 고 싶" 같은 변형도 감지
 */
export function detectCrisis(message: string): boolean {
  const normalized = message.replace(/\s/g, '');
  return CRISIS_KEYWORDS.some((kw) => normalized.includes(kw.replace(/\s/g, '')));
}
