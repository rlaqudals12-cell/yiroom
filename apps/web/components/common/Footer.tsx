import Link from 'next/link';
import { SHORT_DISCLOSURE, INTERMEDIARY_DISCLOSURE } from '@/components/affiliate/disclosure-text';

/**
 * 푸터 컴포넌트
 * - 법적 페이지 링크 (이용약관, 개인정보처리방침, 오픈소스 라이선스)
 * - 제휴 마케팅·통신판매중개자 지위 상시 고지 (백스톱)
 * - 앱 정보 및 저작권
 * - 색은 전부 디자인 토큰 사용 — 다크 하드코딩(zinc) 아일랜드를 지면과 정합시키기 위함
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t border-border bg-background"
      data-testid="footer"
      role="contentinfo"
      aria-label="사이트 푸터"
    >
      <div className="mx-auto max-w-[960px] px-4 py-8">
        {/* 링크 섹션 */}
        <nav
          className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
          aria-label="법적 안내 및 도움말"
        >
          <Link href="/terms" className="hover:text-primary transition-colors">
            이용약관
          </Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">
            개인정보처리방침
          </Link>
          <Link href="/licenses" className="hover:text-primary transition-colors">
            오픈소스 라이선스
          </Link>
          <Link href="/help/faq" className="hover:text-primary transition-colors">
            도움말
          </Link>
        </nav>

        {/* 제휴·통신판매중개자 법적 고지 (백스톱)
            개별 구매 표면에서 인라인 고지가 누락돼도 사이트 전역에서 항상 노출되도록 보장.
            표시광고법·공정위 추천보증 심사지침·FTC §255.5 + 전자상거래법 §20 준수 */}
        <div
          className="mt-6 space-y-1 border-t border-border pt-4 text-center text-[11px] leading-relaxed text-muted-foreground"
          data-testid="footer-affiliate-disclosure"
        >
          <p>{SHORT_DISCLOSURE}</p>
          <p className="text-muted-foreground/70">{INTERMEDIARY_DISCLOSURE}</p>
        </div>

        {/* 운영자(사업자) 정보 — 전자상거래법·개인정보보호법상 신원 표시.
            직접 판매·결제가 없는 무료 서비스라 통신판매업 신고 대상이 아니며,
            1인 사업자 자택 주소 보호를 위해 소재지는 표기하지 않는다(법적 필수 아님). */}
        <div
          className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/70"
          data-testid="footer-business-info"
        >
          <p>상호: 이룸 | 대표: 김병민 | 사업자등록번호: 489-31-01981 | 문의: contact@yiroom.app</p>
        </div>

        {/* 저작권 */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>© {currentYear} 이룸 (Yiroom). All rights reserved.</p>
          <p className="mt-1 text-muted-foreground/70">온전한 나를 찾는 여정</p>
        </div>
      </div>
    </footer>
  );
}
