/**
 * (구) AI 채팅 라우트 — 물어보기 탭으로 통합 (ADR-114)
 *
 * 상담 표면은 coach(물어보기) 하나가 정본.
 * 기존 딥링크·북마크 호환을 위해 라우트는 유지하고 redirect만 수행.
 */

import { Redirect } from 'expo-router';
import React from 'react';

export default function ChatRedirect(): React.JSX.Element {
  return <Redirect href="/(tabs)/ask" />;
}
