/**
 * Playwright Global Setup
 * Clerk Testing Token 초기화
 *
 * CLERK_TESTING_TOKEN이 없으면 스킵 (CI smoke 테스트 시)
 */

import { clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';

setup.describe.configure({ mode: 'serial' });

setup('Clerk 테스팅 토큰 설정', async ({}) => {
  if (!process.env.CLERK_TESTING_TOKEN) {
    // Clerk 토큰 없이 실행 — smoke 테스트는 인증 없이 동작
    console.log('[E2E Setup] CLERK_TESTING_TOKEN 미설정 — Clerk setup 스킵');
    return;
  }

  await clerkSetup();
});
