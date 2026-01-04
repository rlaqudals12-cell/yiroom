/**
 * 테스트 렌더링 유틸리티
 * @description Provider 래핑된 커스텀 렌더 함수
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';

/**
 * 모든 Provider를 래핑하는 컴포넌트
 */
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * Provider가 래핑된 커스텀 렌더 함수
 */
function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// re-export everything
export * from '@testing-library/react-native';

// override render method
export { customRender as render };
