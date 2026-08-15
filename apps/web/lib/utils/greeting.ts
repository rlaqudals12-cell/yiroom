/**
 * 시간대별 인사말 유틸리티
 * K-5 프로필 리디자인 - 주변 개인화 트렌드 적용
 */

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * 현재 시간대를 반환
 */
export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * 시간대별 인사말
 */
export const TIME_GREETINGS: Record<TimeOfDay, string[]> = {
  morning: [
    '좋은 아침이에요',
    '상쾌한 아침이에요',
    '활기찬 하루 시작하세요',
    '오늘도 건강한 하루 되세요',
  ],
  afternoon: [
    '좋은 오후예요',
    '점심 식사는 하셨나요?',
    '오후도 파이팅이에요',
    '남은 하루도 힘내세요',
  ],
  evening: [
    '좋은 저녁이에요',
    '저녁 식사 맛있게 드세요',
    '오늘 하루 수고 많으셨어요',
    '저녁 시간 편히 보내세요',
  ],
  night: [
    '좋은 밤이에요',
    '오늘 하루 정말 수고했어요',
    '편안한 밤 되세요',
    '푹 쉬고 내일 또 만나요',
  ],
};

/**
 * 시간대별 이모지
 */
export const TIME_EMOJIS: Record<TimeOfDay, string> = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌆',
  night: '🌙',
};

/**
 * 시간대에 맞는 랜덤 인사말 반환
 */
export function getGreeting(userName?: string, date?: Date): string {
  const timeOfDay = getTimeOfDay(date);
  const greetings = TIME_GREETINGS[timeOfDay];
  const randomIndex = Math.floor(Math.random() * greetings.length);
  const greeting = greetings[randomIndex];

  return userName ? `${userName}님, ${greeting}` : greeting;
}

/**
 * 시간대에 맞는 인사말 + 이모지 반환
 */
export function getGreetingWithEmoji(
  userName?: string,
  date?: Date
): {
  greeting: string;
  emoji: string;
  timeOfDay: TimeOfDay;
} {
  const timeOfDay = getTimeOfDay(date);
  const greeting = getGreeting(userName, date);
  const emoji = TIME_EMOJIS[timeOfDay];

  return { greeting, emoji, timeOfDay };
}
