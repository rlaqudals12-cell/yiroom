import type { HomeCareBoundaryInfo } from '@/lib/skincare/treatment-recommender';

interface HomeCareBoundaryProps {
  boundary?: HomeCareBoundaryInfo | null;
}

/**
 * 서버가 실측 결과에 저장한 일반 한계 신호만 보여준다.
 * 레거시 행이나 폴백 결과에서 화면이 시술 필요성을 역산하지 않는다.
 */
export function HomeCareBoundary({ boundary }: HomeCareBoundaryProps): React.JSX.Element | null {
  if (!boundary) return null;

  return (
    <section
      className="rounded-xl border border-border bg-card p-5"
      data-testid="skin-home-care-boundary"
    >
      <p className="font-serif text-lg font-semibold text-foreground">홈케어의 한계선</p>
      <p className="mt-2 break-keep text-sm leading-relaxed text-foreground/80">
        {boundary.disclaimer}
      </p>
    </section>
  );
}
