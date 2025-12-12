/**
 * Playwright Global Setup
 * Clerk Testing Token 초기화
 */

import { clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';

setup.describe.configure({ mode: 'serial' });

setup('Clerk 테스팅 토큰 설정', async ({}) => {
  await clerkSetup();
});
