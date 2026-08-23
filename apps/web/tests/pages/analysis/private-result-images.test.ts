import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const RESULT_PAGES = [
  {
    axis: 'hair',
    path: 'app/(main)/analysis/hair/result/[id]/page.tsx',
  },
  {
    axis: 'makeup',
    path: 'app/(main)/analysis/makeup/result/[id]/page.tsx',
  },
] as const;

describe('헤어·메이크업 결과 원본 이미지 경계', () => {
  it.each(RESULT_PAGES)('$axis 결과는 활성 동의를 확인한 뒤 서명한다', ({ axis, path }) => {
    const source = readFileSync(join(process.cwd(), path), 'utf8');

    expect(source).toContain('resolveConsentedAnalysisImageUrl');
    expect(source).toContain(
      `resolveConsentedAnalysisImageUrl(supabase, '${axis}', dbData.image_url)`
    );
    expect(source).toContain('src={imageUrl}');
    expect(source).not.toContain('/storage/v1/object/public/');
    expect(source).not.toContain('src={dbData.image_url}');
  });
});
