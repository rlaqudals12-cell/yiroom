/**
 * 자세 분석 이력
 * → 제네릭 이력 화면에 모듈 필터를 전달하는 thin 래퍼
 */
import { FEATURE_FLAGS } from '@yiroom/shared';
import { Redirect } from 'expo-router';

export default function PostureHistoryScreen(): React.JSX.Element {
  if (!FEATURE_FLAGS.WELLNESS_PHASE2) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(analysis)/history?module=posture" />;
}
