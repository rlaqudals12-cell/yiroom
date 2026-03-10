/**
 * AI 채팅 메인 화면
 */

import React from 'react';
import { ScreenContainer } from '../../components/ui';
import { ChatInterface } from '../../components/chat/ChatInterface';

export default function ChatScreen() {
  return (
    <ScreenContainer
      testID="chat-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
    >
      <ChatInterface />
    </ScreenContainer>
  );
}
