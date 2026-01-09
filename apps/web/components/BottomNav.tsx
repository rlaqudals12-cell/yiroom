'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Shirt, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tutorialId?: string; // 온보딩 튜토리얼용 ID
}

/**
 * UX 리스트럭처링 5탭 구성
 * - 홈: 대시보드 + 오늘의 추천 + 미션
 * - 뷰티: 화해 스타일 제품 피드 (피부 분석 기반)
 * - 스타일: 룩핀 스타일 코디 피드 (체형 분석 기반)
 * - 기록: 운동 + 영양 통합 (세그먼트 토글)
 * - 나: 프로필 + 소셜 (친구, 리더보드, 챌린지, 배지)
 */
const navItems: NavItem[] = [
  { href: '/home', icon: Home, label: '홈' },
  { href: '/beauty', icon: Sparkles, label: '뷰티', tutorialId: 'beauty' },
  { href: '/style', icon: Shirt, label: '스타일', tutorialId: 'style' },
  { href: '/record', icon: ClipboardList, label: '기록', tutorialId: 'record' },
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
