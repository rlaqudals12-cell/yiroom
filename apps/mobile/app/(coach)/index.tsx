/**
 * AI 웰니스 코치 페이지
 */

import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

import { ChatInterface } from '../../components/coach/ChatInterface';

export default function CoachScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      testID="coach-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['bottom']}
    >
      <ChatInterface />
    </SafeAreaView>
  );
}
