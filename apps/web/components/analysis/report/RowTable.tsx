import type { LucideIcon } from 'lucide-react';

export interface AttrRowProps {
  /** 라인아트 아이콘 앵커 — 없으면 라벨부터 시작 */
  icon?: LucideIcon;
  label: string;
  value: string;
}

/** 진단 속성표 한 행 — 라인아트 아이콘 앵커 + 라벨/값. RowTable(dl) 안에서 사용한다. */
export function AttrRow({ icon: Icon, label, value }: AttrRowProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 py-1.5">
      {Icon && (
        <Icon
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      )}
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="ml-auto text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export interface RowTableProps {
  testId?: string;
  /** AttrRow / SpectrumRow 행들 — 데이터 있는 행만 조립해 넘긴다 */
  children: React.ReactNode;
}

/**
 * 진단 속성표 — 헤어라인 디바이더로만 구획하는 dl (차트·등급 연출 없음, ADR-120).
 * 행 구성은 호출부 책임 — 조건부 행(실측값 없으면 미렌더)을 자연스럽게 허용한다.
 */
export function RowTable({ testId, children }: RowTableProps): React.JSX.Element {
  return (
    <dl className="divide-y divide-border" data-testid={testId}>
      {children}
    </dl>
  );
}
