/**
 * AI 웰니스 코치 페이지
 */

import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { ChatInterface } from '../../components/coach/ChatInterface';
import { ScreenContainer } from '../../components/ui';

export default function CoachScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const selectedSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;

  return (
    <ScreenContainer
      testID="coach-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
      backgroundGradient="home"
    >
      <ChatInterface surface="beauty-team" initialSessionId={selectedSessionId} />
    </ScreenContainer>
  );
}
