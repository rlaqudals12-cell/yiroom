import { cn } from '@/lib/utils';

export interface ReportEyebrowProps {
  /** 아이브로우 텍스트 (예: "PERSONAL COLOR REPORT") — 영문 대문자 관례 */
  children: React.ReactNode;
  className?: string;
}

/**
 * 진단지 아이브로우 — 소형 대문자 리포트 라벨 (ADR-120 허용 예외).
 * 히어로 진단명 위에 놓여 "리포트 한 장" 문법을 연다.
 */
export function ReportEyebrow({ children, className }: ReportEyebrowProps): React.JSX.Element {
  return (
    <p className={cn('text-xs uppercase tracking-widest text-muted-foreground', className)}>
      {children}
    </p>
  );
}
