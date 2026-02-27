/**
 * AI 웰니스 코치 페이지
 */

import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTheme } from '@/lib/theme';
import { ScreenContainer } from '../../components/ui';

import { ChatInterface } from '../../components/coach/ChatInterface';

export default function CoachScreen() {
  const { colors } = useTheme();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  return (
    <ScreenContainer
      testID="coach-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
    >
      <ChatInterface initialSessionId={sessionId} />
    </ScreenContainer>
  );
}
