import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * "그래서, 이렇게 하세요" 결론 카드 (ADR-111 표현 원칙 1: 결론 먼저, 근거는 접기)
 *
 * @description
 *   분석 결과 페이지 최상단에서 사용자가 취할 행동 1~3개를 먼저 보여준다.
 *   내용은 반드시 이미 존재하는 결과 데이터에서 규칙 기반으로 조립한다
 *   (새 AI 호출·새 fetch 금지 — 정직성 원칙).
 */
export interface TopAction {
  /** 행동 제목 (한 줄, 명령형: "코랄 립부터 발라보세요") */
  title: string;
  /** 왜/어떻게 보조 설명 (한 줄, 선택) */
  detail?: string;
  /** 관련 색 견본 (선택, 최대 3개 렌더) */
  swatches?: Array<{ hex: string; name: string }>;
  /** 더 보러 갈 곳 (선택) */
  href?: string;
  /** 링크 라벨 (href 있을 때, 기본 "보러가기") */
  hrefLabel?: string;
}

export interface TopActionsCardProps {
  /** 행동 1~3개 (3개 초과분은 렌더하지 않음) */
  actions: TopAction[];
  /** 카드 제목 (기본 "그래서, 이렇게 하세요") */
  heading?: string;
  className?: string;
}

export function TopActionsCard({
  actions,
  heading = '그래서, 이렇게 하세요',
  className,
}: TopActionsCardProps) {
  const visible = actions.filter((a) => a.title.trim().length > 0).slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <section
      data-testid="top-actions-card"
      className={cn('rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5', className)}
      aria-label={heading}
    >
      <h2 className="mb-3 text-base font-bold text-foreground">{heading}</h2>
      <ol className="space-y-3">
        {visible.map((action, i) => (
          <li key={`${action.title}-${i}`} className="flex items-start gap-3">
            <span
              aria-hidden
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{action.title}</p>
                {action.swatches && action.swatches.length > 0 && (
                  <span className="flex items-center gap-1">
                    {action.swatches.slice(0, 3).map((s) => (
                      <span
                        key={s.hex + s.name}
                        title={`${s.name} (${s.hex})`}
                        className="h-4 w-4 rounded-full border border-black/10"
                        style={{ backgroundColor: s.hex }}
                      />
                    ))}
                  </span>
                )}
              </div>
              {action.detail && (
                <p className="mt-0.5 text-xs text-muted-foreground">{action.detail}</p>
              )}
              {action.href && (
                <Link
                  href={action.href}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {action.hrefLabel ?? '보러가기'}
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
