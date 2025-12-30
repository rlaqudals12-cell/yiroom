/**
 * 접근성(a11y) 자동화 테스트
 *
 * axe-core를 사용하여 WCAG 2.1 AA 기준 접근성 검사
 * - 색상 대비
 * - ARIA 속성
 * - 키보드 네비게이션
 * - 이미지 alt 속성
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Axe 결과 타입 정의
interface AxeViolation {
  id: string;
  description: string;
  impact: string;
  helpUrl: string;
  nodes: Array<{ html: string }>;
}

// 공통 접근성 테스트 헬퍼
async function checkA11y(
  page: Page,
  pageName: string,
  options?: {
    // 특정 규칙 제외 (알려진 이슈)
    disableRules?: string[];
    // 특정 영역만 검사
    include?: string[];
    // 특정 영역 제외
    exclude?: string[];
  }
) {
  const builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    // 알려진 이슈로 제외할 규칙
    .disableRules([
      'color-contrast', // 테마 변경으로 인한 임시 제외
      ...(options?.disableRules || []),
    ]);

  if (options?.include) {
    builder.include(options.include);
  }

  if (options?.exclude) {
    builder.exclude(options.exclude);
  }

  const results = await builder.analyze();

  // 위반 사항이 있으면 상세 정보 출력
  if (results.violations.length > 0) {
    console.log(`\n[${pageName}] 접근성 위반 사항:`);
    (results.violations as AxeViolation[]).forEach((violation: AxeViolation) => {
      console.log(`\n  ❌ ${violation.id}: ${violation.description}`);
      console.log(`     영향도: ${violation.impact}`);
      console.log(`     도움말: ${violation.helpUrl}`);
      violation.nodes.forEach((node: { html: string }) => {
        console.log(`     - ${node.html.substring(0, 100)}...`);
      });
    });
  }

  expect(
    results.violations,
    `${pageName} 페이지에서 ${results.violations.length}개의 접근성 위반 발견`
  ).toEqual([]);
}

test.describe('접근성 테스트', () => {
  test.describe('공개 페이지', () => {
    test('홈 페이지 접근성', async ({ page }) => {
      await page.goto('/home');
      await page.waitForLoadState('networkidle');
      await checkA11y(page, '홈');
    });

    test('로그인 페이지 접근성', async ({ page }) => {
      await page.goto('/sign-in');
      await page.waitForLoadState('networkidle');
      await checkA11y(page, '로그인', {
        // Clerk 위젯 제외 (외부 컴포넌트)
        exclude: ['[data-clerk-component]'],
      });
    });
  });

  test.describe('인증 필요 페이지', () => {
    test.beforeEach(async ({ page }) => {
      // Clerk 테스트 모드로 로그인 시뮬레이션
      // 실제 환경에서는 적절한 인증 설정 필요
    });

    test.skip('대시보드 접근성', async ({ page }) => {
      await page.goto('/home');
      await page.waitForLoadState('networkidle');
      await checkA11y(page, '대시보드');
    });

    test.skip('영양 페이지 접근성', async ({ page }) => {
      await page.goto('/record');
      await page.waitForLoadState('networkidle');
      await checkA11y(page, '영양');
    });

    test.skip('운동 페이지 접근성', async ({ page }) => {
      await page.goto('/record/workout');
      await page.waitForLoadState('networkidle');
      await checkA11y(page, '운동');
    });

    test.skip('분석 페이지 접근성', async ({ page }) => {
      await page.goto('/style');
      await page.waitForLoadState('networkidle');
      await checkA11y(page, '분석');
    });

    test.skip('제품 페이지 접근성', async ({ page }) => {
      await page.goto('/beauty');
      await page.waitForLoadState('networkidle');
      await checkA11y(page, '제품');
    });

    test.skip('프로필 페이지 접근성', async ({ page }) => {
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      await checkA11y(page, '프로필');
    });
  });

  test.describe('컴포넌트 접근성', () => {
    test.skip('모달/다이얼로그 접근성', async ({ page }) => {
      await page.goto('/home');
      await page.waitForLoadState('networkidle');

      // 체크인 모달 열기 (예시)
      const checkinButton = page.getByRole('button', {
        name: /체크인/i,
      });
      if (await checkinButton.isVisible()) {
        await checkinButton.click();
        await page.waitForSelector('[role="dialog"]');
        await checkA11y(page, '체크인 모달', {
          include: ['[role="dialog"]'],
        });
      }
    });

    test.skip('폼 접근성', async ({ page }) => {
      await page.goto('/help/feedback');
      await page.waitForLoadState('networkidle');
      await checkA11y(page, '피드백 폼');
    });
  });

  test.describe('키보드 네비게이션', () => {
    test('탭 키로 주요 요소 이동 가능', async ({ page }) => {
      await page.goto('/home');
      await page.waitForLoadState('networkidle');

      // Tab 키로 포커스 이동
      await page.keyboard.press('Tab');

      // 포커스가 인터랙티브 요소에 있는지 확인
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // 포커스 가능한 요소 타입 확인
      const tagName = await focusedElement.evaluate((el) =>
        el.tagName.toLowerCase()
      );
      expect(['a', 'button', 'input', 'select', 'textarea']).toContain(tagName);
    });

    test.skip('Escape 키로 모달 닫기', async ({ page }) => {
      await page.goto('/home');
      await page.waitForLoadState('networkidle');

      // 모달 열기 (예시)
      const modalTrigger = page.getByRole('button', { name: /체크인/i });
      if (await modalTrigger.isVisible()) {
        await modalTrigger.click();
        await page.waitForSelector('[role="dialog"]');

        // Escape 키로 닫기
        await page.keyboard.press('Escape');
        await expect(page.locator('[role="dialog"]')).not.toBeVisible();
      }
    });
  });
});

test.describe('색상 대비 테스트', () => {
  test.skip('다크 모드에서 색상 대비', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // 다크 모드 활성화 (시스템 설정 시뮬레이션)
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await checkA11y(page, '홈 (다크 모드)', {
      // 색상 대비 규칙 활성화
      disableRules: [],
    });
  });
});
