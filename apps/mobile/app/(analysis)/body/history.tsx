/**
 * 체형 분석 이력
 * → 제네릭 이력 화면에 모듈 필터를 전달하는 thin 래퍼
 */
import { Redirect } from 'expo-router';

export default function BodyHistoryScreen(): React.JSX.Element {
  return <Redirect href="/(analysis)/history?module=body" />;
}
