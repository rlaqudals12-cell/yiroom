import { redirect } from 'next/navigation';
import { FEATURE_FLAGS } from '@yiroom/shared';

/**
 * /style/weather — 날씨 기반 코디. 기능 과잉 정리(2026-05-16)로 WEATHER 게이팅.
 * 시각 정체성 5축 외 부가 기능. 코드/DB 유지, 비활성 시 /style로 redirect.
 * 복원: WEATHER=true.
 */
export default function WeatherLayout({ children }: { children: React.ReactNode }) {
  if (!FEATURE_FLAGS.WEATHER) {
    redirect('/style');
  }
  return children;
}
