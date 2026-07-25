export interface SectionHeaderProps {
  /** 러닝 넘버 (1부터) — 렌더 시 01·02 형태로 패딩 */
  no: number;
  title: string;
}

/**
 * 번호 섹션 헤더 — 세리프 이탤릭 러닝넘버 + 제목 + 헤어라인.
 * 진단지의 목차 리듬을 만든다 (PersonaReportCard 문법 이식, ADR-120).
 */
export function SectionHeader({ no, title }: SectionHeaderProps): React.JSX.Element {
  return (
    <div className="flex items-baseline gap-2 border-b border-border pb-2">
      <span className="font-serif text-sm italic tabular-nums text-primary" aria-hidden="true">
        {String(no).padStart(2, '0')}
      </span>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
  );
}
