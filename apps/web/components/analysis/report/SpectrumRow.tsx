import type { LucideIcon } from 'lucide-react';

export interface SpectrumRowProps {
  /** 라인아트 아이콘 앵커 — 없으면 라벨부터 시작 */
  icon?: LucideIcon;
  label: string;
  /**
   * 스펙트럼 위 위치(0~1) — 저장된 값에서 파생만 한다(새 수치 생성 금지).
   * 숫자 눈금을 그리지 않아 가짜 정밀도를 만들지 않는다 (PersonaReportCard 문법).
   */
  pos: number;
  /** 상태 텍스트 (예: "양호", "컨디션 82점 · 양호") — 신호등 색 대신 텍스트로 말한다 */
  status: string;
  testId?: string;
}

/**
 * 스펙트럼 행 — 라벨 + 뮤트 단색 트랙 + 위치 마커 + 상태 텍스트.
 * 헤어/메이크업의 신호등(red/green/amber) 게이지를 대체하는 절제된 표현 (ADR-120).
 * RowTable(dl) 안에서 아이콘 앵커(24px 원형)만 AttrRow와 공유한다 —
 * 수평 기하는 다르다(고정폭 라벨 없음, 트랙 w-16 + 상태 min-w-[72px]가 폭을 지배).
 */
export function SpectrumRow({
  icon: Icon,
  label,
  pos,
  status,
  testId,
}: SpectrumRowProps): React.JSX.Element {
  // 파생값 방어 — 트랙 밖으로 마커가 나가지 않게만 보정(값 자체는 왜곡하지 않음)
  const clamped = Math.min(1, Math.max(0, pos));
  return (
    <div className="flex items-center gap-2.5 py-1.5" data-testid={testId}>
      {Icon && (
        // 크림 틴트 원형 컨테이너(24px) — AttrRow와 동일 앵커 규격(두 아이콘 문법 혼재 해소)
        <span
          aria-hidden="true"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-ground"
        >
          <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
        </span>
      )}
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <span
        className="relative ml-auto h-[3px] w-16 shrink-0 self-center rounded-full bg-muted"
        aria-hidden="true"
        data-testid={testId ? `${testId}-track` : undefined}
      >
        <span
          className="absolute top-1/2 h-[9px] w-[9px] -translate-y-1/2 rounded-full border-2 border-card bg-muted-foreground"
          style={{ left: `calc(${clamped * 100}% - 4.5px)` }}
        />
      </span>
      {/* min-w: 상태 글자폭이 트랙 위치를 끌고 다니지 않게 컬럼 고정 (공유카드와 동일 이유) */}
      <dd className="min-w-[72px] shrink-0 text-right text-sm font-medium text-foreground">
        {status}
      </dd>
    </div>
  );
}
