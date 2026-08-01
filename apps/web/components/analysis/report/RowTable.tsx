import type { LucideIcon } from 'lucide-react';

export interface AttrRowProps {
  /** 라인아트 아이콘 앵커 — 없으면 라벨부터 시작 */
  icon?: LucideIcon;
  label: string;
  value: string;
  /**
   * 값의 표준 영문 병기 (enum 값 표기 번역용 — 예: "웜" + "Warm").
   * 있을 때만 muted 급수로 괄호 병기한다. 새 데이터 생성이 아니라 기존 값의 표기 번역.
   */
  enHint?: string;
}

/**
 * 진단 속성표 한 행 — 아이콘 앵커 + 고정폭 라벨 + 좌정렬 값 (목업형 2열 정의 리스트).
 * 왜 좌정렬: ml-auto 우측 밀림은 라벨-값 시선 거리가 행마다 널뛰어 표로 읽히지 않는다.
 */
export function AttrRow({ icon: Icon, label, value, enHint }: AttrRowProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {Icon && (
        // 크림 틴트 원형 컨테이너(24px) — 핑크 틴트 금지(뮤트 규율), 잉크 라인아트만 담는다
        <span
          aria-hidden="true"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-ground"
        >
          <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
        </span>
      )}
      <dt className="w-[88px] shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm font-medium text-foreground">
        {value}
        {enHint && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">({enHint})</span>
        )}
      </dd>
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
