/**
 * (구) 채팅 라우트 redirect 테스트 (ADR-114 coach/chat 통폐합)
 *
 * 대상: app/(chat)/index.tsx
 * 상담 표면은 물어보기(coach) 하나 — 구 라우트는 redirect만 수행.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import ChatRedirect from '../../app/(chat)/index';

describe('ChatRedirect', () => {
  it('물어보기 탭으로 redirect한다', () => {
    // jest.setup의 Redirect mock이 href를 accessibilityLabel로 노출
    const { getByTestId } = render(<ChatRedirect />);
    expect(getByTestId('redirect').props.accessibilityLabel).toBe('/(tabs)/ask');
  });
});
