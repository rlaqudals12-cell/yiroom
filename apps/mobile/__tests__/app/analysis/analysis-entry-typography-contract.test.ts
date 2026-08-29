import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC_ANALYSIS_ENTRIES = [
  'app/(analysis)/hub.tsx',
  'app/(analysis)/personal-color/index.tsx',
  'app/(analysis)/skin/index.tsx',
  'app/(analysis)/body/index.tsx',
  'app/(analysis)/hair/index.tsx',
  'app/(analysis)/makeup/index.tsx',
  'app/(analysis)/posture/index.tsx',
  'components/home/HomeHeader.tsx',
  'components/onboarding/OnboardingHero.tsx',
  'components/ui/SectionHeader.tsx',
  'app/(tabs)/style.tsx',
  'app/(tabs)/beauty.tsx',
  'app/(tabs)/index.tsx',
] as const;

describe('공개 분석 진입 타이포그래피 계약', () => {
  it.each(PUBLIC_ANALYSIS_ENTRIES)('%s는 금지된 GradientText를 소비하지 않는다', (file) => {
    const source = readFileSync(join(process.cwd(), file), 'utf8');

    expect(source).not.toContain('GradientText');
  });
});
