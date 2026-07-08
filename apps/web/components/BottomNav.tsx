'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Sparkles, Shirt, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tutorialId?: string; // 온보딩 튜토리얼용 ID
}

/**
 * 5탭 단일 IA (ADR-114) — 데스크톱 Navbar와 동일 5항목(오늘·물어보기·뷰티·스타일·나)
 * - 오늘: 전속 팀의 아침 브리핑 (/home)
 * - 뷰티: 제품 피드 (피부·PC 기반, /beauty)
 * - 물어보기: 전속 팀 코치 채팅 (/coach) — 컨설팅의 심장, 가운데(3번째) 승격
 * - 스타일: 코디 피드 (체형 기반, /style)
 * - 나: 5축 정체성 프로필 + 소셜 (/profile)
 *
 * 물어보기를 물리적 가운데에 두어 1급 동작을 강조(데스크톱은 좌→우 나열, 항목은 동일).
 * "기록"(WELLNESS_PHASE2) 탭 제거 — 라우트(/record)는 유지, 네비 진입점만 폐기.
 */
const navItems: NavItem[] = [
  { href: '/home', icon: Home, label: '오늘' },
  { href: '/beauty', icon: Sparkles, label: '뷰티', tutorialId: 'beauty' },
  { href: '/coach', icon: MessageCircle, label: '물어보기', tutorialId: 'coach' },
  { href: '/style', icon: Shirt, label: '스타일', tutorialId: 'style' },
  { href: '/profile', icon: User, label: '나', tutorialId: 'profile' },
];

/**
 * 모바일 하단 네비게이션
 * - md 미만에서만 표시
 * - 현재 경로에 따라 활성 상태 표시
 */
export function BottomNav() {
  const pathname = usePathname();

  // 현재 경로가 navItem의 href로 시작하는지 확인
  const isActive = (href: string) => {
    if (href === '/home') {
      return pathname === '/home' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden"
      style={{
        // iOS Safe Area를 포함한 전체 높이 계산
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      data-testid="bottom-nav"
      aria-label="메인 네비게이션"
      role="navigation"
    >
      <div className="flex justify-around items-center h-16 px-2" role="menubar">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              data-tutorial={item.tutorialId}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-2 transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn('h-6 w-6 mb-1', active ? 'text-primary' : 'text-muted-foreground')}
                aria-hidden="true"
              />
              <span className={cn('text-xs', active && 'font-medium')}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
