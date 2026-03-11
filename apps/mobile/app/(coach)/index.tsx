/**
 * AI 웰니스 코치 페이지
 */

import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { useTheme } from '@/lib/theme';

import { ChatInterface } from '../../components/coach/ChatInterface';
import { ScreenContainer } from '../../components/ui';

export default function CoachScreen() {
  const { colors } = useTheme();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  return (
    <ScreenContainer
      testID="coach-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
      backgroundGradient="home"
    >
      <ChatInterface initialSessionId={sessionId} />
    </ScreenContainer>
  );
}
