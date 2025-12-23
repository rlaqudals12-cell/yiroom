'use client';

import Link from 'next/link';

interface QuickActionCardProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  className?: string;
}

/**
 * 빠른 액션 카드 컴포넌트
 * - 아이콘 + 라벨로 구성된 네비게이션 카드
 * - 운동 페이지의 바로가기 섹션에서 사용
 */
export default function QuickActionCard({
  icon,
  label,
  href,
  className = '',
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-muted transition-colors ${className}`}
      aria-label={`${label} 페이지로 이동`}
    >
      <div className="text-indigo-500" aria-hidden="true">
        {icon}
      </div>
      <span className="font-medium text-foreground">{label}</span>
    </Link>
  );
}
