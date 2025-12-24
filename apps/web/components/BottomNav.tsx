'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Utensils, Dumbbell, BarChart3, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tutorialId?: string; // 온보딩 튜토리얼용 ID
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: Home, label: '홈' },
  { href: '/nutrition', icon: Utensils, label: '영양', tutorialId: 'nutrition' },
  { href: '/workout', icon: Dumbbell, label: '운동', tutorialId: 'workout' },
  { href: '/reports', icon: BarChart3, label: '리포트' },
  { href: '/products', icon: ShoppingBag, label: '제품', tutorialId: 'products' },
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
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden"
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
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn(
                  'h-6 w-6 mb-1',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
                aria-hidden="true"
              />
              <span className={cn('text-xs', active && 'font-medium')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Safe area padding for iOS */}
      <div className="pb-safe" />
    </nav>
  );
}

export default BottomNav;
