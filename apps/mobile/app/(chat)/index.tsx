/**
 * AI 채팅 메인 화면
 */

import React from 'react';

import { ChatInterface } from '../../components/chat/ChatInterface';
import { ScreenContainer } from '../../components/ui';

export default function ChatScreen() {
  return (
    <ScreenContainer
      testID="chat-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
      backgroundGradient="home"
    >
      <ChatInterface />
    </ScreenContainer>
  );
}
