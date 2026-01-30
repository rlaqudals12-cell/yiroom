/**
 * Web Vitals 초기화 Provider
 *
 * Core Web Vitals (LCP, FID, CLS, INP, TTFB) 수집을 시작하는 클라이언트 컴포넌트
 * RootLayout에서 사용되며, 마운트 시 한 번만 초기화됨
 *
 * @see SDD-MONITORING.md Section 4.5
 * @module components/providers/web-vitals-provider
 */
'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/analytics/web-vitals';

/**
 * Web Vitals 수집 초기화 컴포넌트
 *
 * @returns null - 렌더링되는 UI 없음
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { WebVitalsProvider } from '@/components/providers/web-vitals-provider';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <WebVitalsProvider />
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function WebVitalsProvider(): null {
  useEffect(() => {
    initWebVitals();
  }, []);

  return null;
}
