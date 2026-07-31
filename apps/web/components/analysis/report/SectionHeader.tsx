export interface SectionHeaderProps {
  /** 러닝 넘버 (1부터) — 렌더 시 01·02 형태로 패딩 */
  no: number;
  title: string;
}

/**
 * 번호 섹션 헤더 — 세리프 이탤릭 러닝넘버 + 제목 + 헤어라인.
 * 진단지의 목차 리듬을 만든다 (PersonaReportCard 문법 이식, ADR-120).
 * 급수는 text-base — 본문(text-sm)과 같은 급수였던 초기판이 위계를 못 만들어 1급수 상향(2026-07-31).
 */
export function SectionHeader({ no, title }: SectionHeaderProps): React.JSX.Element {
  return (
    <div className="flex items-baseline gap-2 border-b border-border pb-2">
      <span className="font-serif text-base italic tabular-nums text-primary" aria-hidden="true">
        {String(no).padStart(2, '0')}
      </span>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </div>
  );
}
