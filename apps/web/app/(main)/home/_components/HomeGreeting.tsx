/**
 * 홈 인사말 - Server Component
 * LCP 최적화: Server에서 시간 기반 인사말 계산하여 즉시 렌더링
 */

import { getTranslations } from 'next-intl/server';

interface HomeGreetingProps {
  userName: string;
}

// 시간 기반 인사말 키 (Server에서 계산)
function getTimeGreetingKey(): string {
  // 서버 타임존을 고려한 현재 시간 (KST)
  const now = new Date();
  // UTC+9 (한국 시간)
  const kstHour = (now.getUTCHours() + 9) % 24;

  if (kstHour >= 5 && kstHour < 12) return 'morningGreeting';
  if (kstHour >= 12 && kstHour < 18) return 'afternoonGreeting';
  if (kstHour >= 18 && kstHour < 22) return 'eveningGreeting';
  return 'nightGreeting';
}

export async function HomeGreeting({ userName }: HomeGreetingProps) {
  const t = await getTranslations('home');
  const greetingKey = getTimeGreetingKey();

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
