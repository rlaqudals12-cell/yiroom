import Link from 'next/link';
import { Home, Sparkles, Dumbbell, Utensils, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 bg-background"
      role="main"
      aria-labelledby="not-found-title"
    >
      {/* 404 표시 */}
      <div className="text-center mb-8">
        <p className="text-8xl font-bold text-primary/30 mb-4" aria-hidden="true">404</p>
        <h1 id="not-found-title" className="text-2xl font-semibold text-foreground mb-2">
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-muted-foreground">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있어요.
        </p>
      </div>

      {/* 홈으로 버튼 */}
      <Link href="/">
        <Button size="lg" className="mb-8 gap-2">
          <Home className="h-5 w-5" aria-hidden="true" />
          홈으로 돌아가기
        </Button>
      </Link>

      {/* 인기 기능 링크 */}
      <nav className="w-full max-w-md" aria-label="추천 기능">
        <p className="text-sm text-muted-foreground text-center mb-4">
          이런 기능은 어떠세요?
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/analysis/personal-color"
            className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-module-personal-color-dark/50 hover:bg-module-personal-color-light/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div
              className="w-10 h-10 bg-module-personal-color-light rounded-full flex items-center justify-center"
              aria-hidden="true"
            >
              <Sparkles className="h-5 w-5 text-module-personal-color-dark" />
            </div>
            <div>
              <p className="font-medium text-foreground">퍼스널 컬러</p>
              <p className="text-xs text-muted-foreground">나만의 색상 찾기</p>
            </div>
          </Link>

          <Link
            href="/workout"
            className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-module-workout-dark/50 hover:bg-module-workout-light/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div
              className="w-10 h-10 bg-module-workout-light rounded-full flex items-center justify-center"
              aria-hidden="true"
            >
              <Dumbbell className="h-5 w-5 text-module-workout-dark" />
            </div>
            <div>
              <p className="font-medium text-foreground">운동</p>
              <p className="text-xs text-muted-foreground">맞춤 운동 플랜</p>
            </div>
          </Link>

          <Link
            href="/nutrition"
            className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-module-nutrition-dark/50 hover:bg-module-nutrition-light/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div
              className="w-10 h-10 bg-module-nutrition-light rounded-full flex items-center justify-center"
              aria-hidden="true"
            >
              <Utensils className="h-5 w-5 text-module-nutrition-dark" />
            </div>
            <div>
              <p className="font-medium text-foreground">영양</p>
              <p className="text-xs text-muted-foreground">식단 관리</p>
            </div>
          </Link>

          <Link
            href="/products"
            className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div
              className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"
              aria-hidden="true"
            >
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">제품</p>
              <p className="text-xs text-muted-foreground">맞춤 추천</p>
            </div>
          </Link>
        </div>
      </nav>
    </div>
  );
}
