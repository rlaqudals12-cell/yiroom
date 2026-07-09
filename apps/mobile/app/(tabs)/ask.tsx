/**
 * 물어보기 탭 (ADR-114) — 전속 팀에게 물어보는 코치 채팅
 *
 * 신규 화면을 만들지 않고 기존 coach ChatInterface를 탭으로 마운트.
 * 대화 기록·결과 화면 진입은 (coach) 스택이 계속 담당.
 */

import React from 'react';

import { ChatInterface } from '../../components/coach/ChatInterface';
import { ScreenContainer } from '../../components/ui';

export default function AskScreen(): React.JSX.Element {
  return (
    <ScreenContainer
      testID="ask-screen"
      scrollable={false}
      edges={['top', 'bottom']}
      contentPadding={0}
      backgroundGradient="home"
    >
      <ChatInterface />
    </ScreenContainer>
  );
}
