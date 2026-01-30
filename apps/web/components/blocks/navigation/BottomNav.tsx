'use client';

import * as React from 'react';
import { Home, Scan, Shirt, Heart, User } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * BottomNav - 하단 네비게이션 바
 *
 * 5탭 구조: 홈, 분석, 옷장, 웰니스, 마이
 * 선택된 탭은 위로 올라오며 강조
 */

const bottomNavVariants = cva(
  'fixed bottom-0 left-0 right-0 px-8 pb-12 pt-8 bg-gradient-to-t from-background via-background/95 to-transparent z-[400]',
  {
    variants: {
      variant: {
        default: '',
        compact: 'pb-8 pt-4',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const navItemVariants = cva(
  'relative flex flex-col items-center justify-center min-w-[56px] min-h-[56px] rounded-3xl transition-all duration-500',
  {
    variants: {
      isSelected: {
        true: 'bg-foreground text-background -translate-y-4 shadow-2xl scale-110',
        false: 'text-muted-foreground hover:text-muted-foreground/80',
      },
    },
    defaultVariants: {
      isSelected: false,
    },
  }
);

export type NavTabId = 'home' | 'analysis' | 'wardrobe' | 'wellness' | 'profile';

export interface BottomNavProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof bottomNavVariants> {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
}

const NAV_ITEMS: Array<{ id: NavTabId; icon: typeof Home; label: string }> = [
  { id: 'home', icon: Home, label: '홈' },
  { id: 'analysis', icon: Scan, label: '분석' },
  { id: 'wardrobe', icon: Shirt, label: '옷장' },
  { id: 'wellness', icon: Heart, label: '웰니스' },
  { id: 'profile', icon: User, label: '마이' },
];

/**
 * BottomNav 컴포넌트
 *
 * @example
 * <BottomNav activeTab="analysis" onTabChange={(tab) => setTab(tab)} />
 */
function BottomNav({
  className,
  variant,
  activeTab,
  onTabChange,
  ...props
}: BottomNavProps): React.JSX.Element {
  return (
    <footer
      data-slot="bottom-nav"
      data-testid="bottom-nav"
      className={cn(bottomNavVariants({ variant, className }))}
      {...props}
    >
      <nav className="max-w-md mx-auto h-20 bg-card/95 backdrop-blur-3xl rounded-[2.5rem] border border-border p-2 flex justify-around items-center shadow-2xl">
        {NAV_ITEMS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(navItemVariants({ isSelected }))}
              aria-label={tab.label}
              aria-current={isSelected ? 'page' : undefined}
            >
              <Icon
                className="w-6 h-6"
                strokeWidth={isSelected ? 3 : 2}
              />
              {isSelected && (
                <div className="absolute -bottom-1.5 w-1.5 h-1.5 bg-background rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </footer>
  );
}

export { BottomNav, bottomNavVariants, navItemVariants, NAV_ITEMS };
