import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('페이지 지면·폭 계약', () => {
  it('루트 main은 세로 내비 여백만 맡고 가로 액자를 강제하지 않는다', () => {
    const css = source('app/globals.css');
    const mainRule = css.match(/main\s*\{([\s\S]*?)\}/u)?.[1] ?? '';

    expect(mainRule).toContain('pt-16');
    expect(mainRule).not.toMatch(/max-w-7xl|mx-auto|px-4/u);
  });

  it('대표 활성 페이지가 각자의 읽기 폭을 소유한다', () => {
    const paths = [
      'app/(main)/home/page.tsx',
      'app/(main)/beauty/page.tsx',
      'app/(main)/profile/page.tsx',
      'app/(main)/profile/settings/page.tsx',
      'app/(main)/wishlist/WishlistPageClient.tsx',
      'app/(main)/announcements/AnnouncementsClient.tsx',
      'app/(main)/help/faq/FAQClient.tsx',
      'app/(main)/help/feedback/page.tsx',
      'app/(main)/inventory/page.tsx',
      'app/(main)/inventory/[category]/client.tsx',
      'app/(main)/closet/layout.tsx',
      'app/(main)/style/layout.tsx',
      'app/(main)/notifications/page.tsx',
      'app/(main)/search/page.tsx',
    ];

    for (const path of paths) expect(source(path), path).toMatch(/max-w-|\bcontainer\b/u);
  });

  it('목록형 활성 화면이 가운데 정렬과 자체 좌우 여백을 함께 소유한다', () => {
    const paths = [
      'app/(main)/friends/page.tsx',
      'app/(main)/friends/requests/page.tsx',
      'app/(main)/friends/search/page.tsx',
      'app/(main)/help/feedback/page.tsx',
      'app/(main)/inventory/page.tsx',
      'app/(main)/leaderboard/page.tsx',
      'app/(main)/leaderboard/nutrition/page.tsx',
      'app/(main)/leaderboard/workout/page.tsx',
      'app/(main)/wellness/page.tsx',
      'app/(main)/style/weather/page.tsx',
    ];

    for (const path of paths) {
      const page = source(path);
      expect(page, path).toContain('mx-auto');
      expect(page, path).toContain('px-4');
    }
  });

  it('통합 결과는 퍼스널컬러와 같은 크림 지면·880px 읽기 폭을 쓴다', () => {
    const integrated = source('app/(main)/analysis/integrated/result/[sessionId]/page.tsx');

    expect(integrated).toContain('bg-surface-ground');
    expect(integrated).toContain('max-w-lg space-y-6 px-4 py-8 md:max-w-[880px]');
  });

  it('4축 결과 하단 액션바에 반투명 블러가 남지 않는다', () => {
    const paths = [
      'app/(main)/analysis/personal-color/result/[id]/page.tsx',
      'app/(main)/analysis/body/result/[id]/page.tsx',
      'app/(main)/analysis/hair/result/[id]/page.tsx',
      'app/(main)/analysis/makeup/result/[id]/page.tsx',
    ];

    for (const path of paths) {
      const page = source(path);
      expect(page, path).toContain('border-t border-border bg-card p-4');
      expect(page, path).not.toContain('bg-card/80 dark:bg-card/90 backdrop-blur-sm');
    }
  });
});
