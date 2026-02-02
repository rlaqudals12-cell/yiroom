/**
 * 홈 인사말 - Server Component
 * LCP 최적화: Server에서 시간 기반 인사말 계산하여 즉시 렌더링
 */

interface HomeGreetingProps {
  userName: string;
}

// 시간 기반 인사말 (Server에서 계산)
function getTimeGreeting(): string {
  // 서버 타임존을 고려한 현재 시간 (KST)
  const now = new Date();
  // UTC+9 (한국 시간)
  const kstHour = (now.getUTCHours() + 9) % 24;

  if (kstHour >= 5 && kstHour < 12) return '좋은 아침이에요';
  if (kstHour >= 12 && kstHour < 18) return '좋은 오후예요';
  if (kstHour >= 18 && kstHour < 22) return '좋은 저녁이에요';
  return '좋은 밤이에요';
}

export function HomeGreeting({ userName }: HomeGreetingProps) {
  const greeting = getTimeGreeting();

  return (
    <section className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        {greeting}, {userName}님
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mt-1">
        오늘도 나다운 하루를 시작해볼까요?
      </p>
    </section>
  );
}

export default HomeGreeting;
