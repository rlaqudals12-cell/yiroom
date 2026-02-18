/**
 * 루트 인덱스 — 앱 시작 시 (tabs) 홈 화면으로 리다이렉트
 *
 * Expo Router에서 라우트 그룹 (parenthesized dirs)은 URL에 영향 없음.
 * (tabs)/index.tsx, (challenges)/index.tsx 등이 모두 '/'에 매핑되어 충돌.
 * 이 파일이 '/' URL을 명시적으로 잡아 (tabs) 그룹으로 보냄.
 */
import { Redirect } from 'expo-router';

export default function AppIndex() {
  return <Redirect href="/(tabs)" />;
}
