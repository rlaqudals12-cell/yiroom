/**
 * 오픈소스 라이선스 페이지
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: '오픈소스 라이선스 | 이룸',
  description: '이룸 서비스에서 사용하는 오픈소스 라이브러리 목록입니다.',
};

// 라이선스 유형별 라이브러리 목록
const licenseGroups = [
  {
    category: '프레임워크',
    icon: '📦',
    libraries: [
      { name: 'Next.js', license: 'MIT', url: 'https://github.com/vercel/next.js' },
      { name: 'React', license: 'MIT', url: 'https://github.com/facebook/react' },
      { name: 'TypeScript', license: 'Apache 2.0', url: 'https://github.com/microsoft/TypeScript' },
    ],
  },
  {
    category: 'UI/스타일링',
    icon: '🎨',
    libraries: [
      { name: 'Tailwind CSS', license: 'MIT', url: 'https://github.com/tailwindlabs/tailwindcss' },
      { name: 'Radix UI', license: 'MIT', url: 'https://github.com/radix-ui/primitives' },
      { name: 'Lucide React', license: 'ISC', url: 'https://github.com/lucide-icons/lucide' },
      { name: 'Framer Motion', license: 'MIT', url: 'https://github.com/framer/motion' },
    ],
  },
  {
    category: '상태 관리',
    icon: '🔄',
    libraries: [
      { name: 'Zustand', license: 'MIT', url: 'https://github.com/pmndrs/zustand' },
      {
        name: 'React Hook Form',
        license: 'MIT',
        url: 'https://github.com/react-hook-form/react-hook-form',
      },
    ],
  },
  {
    category: '유틸리티',
    icon: '🔧',
    libraries: [
      { name: 'Zod', license: 'MIT', url: 'https://github.com/colinhacks/zod' },
      { name: 'date-fns', license: 'MIT', url: 'https://github.com/date-fns/date-fns' },
      { name: 'clsx', license: 'MIT', url: 'https://github.com/lukeed/clsx' },
    ],
  },
  {
    category: '백엔드/인프라',
    icon: '🗄️',
    libraries: [
      { name: 'Supabase', license: 'Apache 2.0', url: 'https://github.com/supabase/supabase' },
      { name: 'Clerk', license: 'Proprietary', url: 'https://clerk.com' },
      {
        name: '@vercel/analytics',
        license: 'MPL-2.0',
        url: 'https://www.mozilla.org/en-US/MPL/2.0/',
      },
      { name: '@vercel/og', license: 'MPL-2.0', url: 'https://www.mozilla.org/en-US/MPL/2.0/' },
    ],
  },
  {
    category: '테스트',
    icon: '🧪',
    libraries: [
      { name: 'Vitest', license: 'MIT', url: 'https://github.com/vitest-dev/vitest' },
      { name: 'Playwright', license: 'Apache 2.0', url: 'https://github.com/microsoft/playwright' },
      {
        name: 'Testing Library',
        license: 'MIT',
        url: 'https://github.com/testing-library/react-testing-library',
      },
    ],
  },
];

export default function LicensesPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="licenses-page">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/profile/settings?tab=info"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="설정으로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold">오픈소스 라이선스</h1>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-8">
            이룸은 다음 오픈소스 라이브러리를 사용하여 만들어졌습니다. 각 라이브러리의 라이선스
            조건을 준수합니다.
          </p>

          {/* 라이선스 그룹 */}
          <div className="space-y-6 not-prose">
            {licenseGroups.map((group) => (
              <div key={group.category} className="bg-card rounded-xl border p-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">
                  <span>{group.icon}</span>
                  <span>{group.category}</span>
                </h2>
                <ul className="space-y-2">
                  {group.libraries.map((lib) => (
                    <li
                      key={lib.name}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <a
                        href={lib.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:text-primary transition-colors"
                      >
                        {lib.name}
                      </a>
                      <span className="text-sm text-muted-foreground px-2 py-0.5 bg-muted rounded">
                        {lib.license}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* 추가 정보 */}
          <div className="mt-8 p-4 bg-muted/50 rounded-xl">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">라이선스 정보</h3>
            <p className="text-sm text-muted-foreground">
              MIT 라이선스는 상업적 사용, 수정, 배포를 허용합니다. Apache 2.0 라이선스는 특허권을
              명시적으로 부여합니다. ISC 라이선스는 MIT와 유사한 허용적 라이선스입니다. MPL-2.0
              라이선스는 파일 단위 카피레프트로, 해당 파일의 원본 및 변경분에 대해 동일 라이선스로
              소스를 공개하도록 요구합니다.
            </p>
          </div>

          {/* 하단 링크 */}
          <div className="mt-8 flex gap-4">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              이용약관
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              개인정보처리방침
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
