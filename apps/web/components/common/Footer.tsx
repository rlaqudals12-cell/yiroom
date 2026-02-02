import Link from 'next/link';

/**
 * 푸터 컴포넌트
 * - 법적 페이지 링크 (이용약관, 개인정보처리방침, 오픈소스 라이선스)
 * - 앱 정보 및 저작권
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800 bg-[#0A0A0B]" data-testid="footer">
      <div className="mx-auto max-w-[960px] px-4 py-8">
        {/* 링크 섹션 */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-400">
          <Link href="/terms" className="hover:text-pink-400 transition-colors">
            이용약관
          </Link>
          <Link href="/privacy" className="hover:text-pink-400 transition-colors">
            개인정보처리방침
          </Link>
          <Link href="/licenses" className="hover:text-pink-400 transition-colors">
            오픈소스 라이선스
          </Link>
          <Link href="/help/faq" className="hover:text-pink-400 transition-colors">
            도움말
          </Link>
        </div>

        {/* 저작권 */}
        <div className="mt-6 text-center text-xs text-zinc-500">
          <p>© {currentYear} 이룸 (Yiroom). All rights reserved.</p>
          <p className="mt-1 text-zinc-600">온전한 나를 찾는 여정</p>
        </div>
      </div>
    </footer>
  );
}
