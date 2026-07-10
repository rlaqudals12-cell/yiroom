/**
 * 물어보기 탭 (ADR-114) — 전속 팀에게 물어보는 코치 채팅
 *
 * 신규 화면을 만들지 않고 기존 coach ChatInterface를 탭으로 마운트.
 * 대화 기록·결과 화면 진입은 (coach) 스택이 계속 담당.
 */

import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { ChatInterface } from '../../components/coach/ChatInterface';
import { ScreenContainer } from '../../components/ui';

export default function AskScreen(): React.JSX.Element {
  // 홈 브리핑 물어보기 인풋에서 넘어온 질문(있으면 입력창에 미리 채움) — ADR-118
  const { q } = useLocalSearchParams<{ q?: string }>();
  const initialInput = typeof q === 'string' ? q : undefined;

  return (
    <ScreenContainer
      testID="ask-screen"
      scrollable={false}
      edges={['top', 'bottom']}
      contentPadding={0}
      backgroundGradient="home"
    >
      <ChatInterface initialInput={initialInput} />
    </ScreenContainer>
  );
}
