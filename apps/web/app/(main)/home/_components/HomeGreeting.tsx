/**
 * 홈 인사말 - Server Component
 * LCP 최적화: Server에서 시간 기반 인사말 계산하여 즉시 렌더링
 */

import { getTranslations } from 'next-intl/server';
import { getUserTimezone, getCurrentHourInTimezone } from '@/lib/utils/timezone';

interface HomeGreetingProps {
  userName: string;
}

// 시간 기반 인사말 키 (사용자 타임존 기반)
function getTimeGreetingKey(hour: number): string {
  if (hour >= 5 && hour < 12) return 'morningGreeting';
  if (hour >= 12 && hour < 18) return 'afternoonGreeting';
  if (hour >= 18 && hour < 22) return 'eveningGreeting';
  return 'nightGreeting';
}

export async function HomeGreeting({ userName }: HomeGreetingProps) {
  const t = await getTranslations('home');
  const timezone = await getUserTimezone();
  const currentHour = getCurrentHourInTimezone(timezone);
  const greetingKey = getTimeGreetingKey(currentHour);

  return (
    <section className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        {t(greetingKey)}, {t('greetingSuffix', { name: userName })}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mt-1">{t('dailyMotivation')}</p>
    </section>
  );
}

export default HomeGreeting;
