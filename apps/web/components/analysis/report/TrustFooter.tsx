import { cn } from '@/lib/utils';

/** 신뢰도 등급 라벨 — 신뢰 블록의 근거 한 줄(근거 없는 숫자는 낚시로 보임) */
export function getConfidenceGrade(confidence: number): string {
  if (confidence >= 90) return '매우 높음 — 분석 조건이 매우 좋아요';
  if (confidence >= 75) return '높음 — 신뢰할 수 있는 결과예요';
  if (confidence >= 60) return '보통 — 조명이나 각도를 개선하면 더 정확해져요';
  return '재분석 권장 — 더 밝은 조명에서 다시 촬영해보세요';
}

export interface TrustFooterProps {
  /** 저장된 신뢰도(0~100) — 0 이하·미제공이면 신뢰도 라인 미렌더(위장 수치 금지) */
  confidence?: number | null;
  /** 신뢰도 옆 힌트 — 생략 시 getConfidenceGrade 등급 문구 자동 */
  hint?: string;
  /** 재현성 배지 텍스트 (예: "동일 조건 재분석으로 검증된 결과") — 있을 때만 렌더 */
  badge?: string;
  /** 통계·분석 시간 등 추가 텍스트 라인 (<p> 단위) */
  children?: React.ReactNode;
  testId?: string;
  className?: string;
}

/**
 * 푸터 신뢰 블록 — "분석 신뢰도 N%" + 힌트 + 재현성 배지 (진단서의 직인, ADR-120).
 * 점수 게이지·등급 메달 없이 텍스트 라인으로만 신뢰를 말한다.
 * 조판은 콜로폰(발행 정보) 문법: 상단 괘선 + 표 숫자(tabular) + 소형 레터스페이스 라벨 —
 * 채점표가 아니라 인쇄물의 판권면으로 읽히게 한다.
 */
export function TrustFooter({
  confidence,
  hint,
  badge,
  children,
  testId,
  className,
}: TrustFooterProps): React.JSX.Element {
  return (
    <div
      className={cn(
        // tabular-nums는 상속 — children의 타임스탬프·통계 숫자도 표 숫자로 정렬된다
        'space-y-1 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground tabular-nums',
        className
      )}
      data-testid={testId}
    >
      {/* 저장된 신뢰도(>0)가 있을 때만 (위장 수치 금지) */}
      {typeof confidence === 'number' && confidence > 0 && (
        <p className="font-medium tracking-wide text-foreground/80">
          분석 신뢰도 {confidence}%
          <span className="ml-1.5 font-normal tracking-normal text-muted-foreground">
            {hint ?? getConfidenceGrade(confidence)}
          </span>
        </p>
      )}
      {children}
      {badge && (
        <p>
          <span className="mt-1 inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
            {badge}
          </span>
        </p>
      )}
    </div>
  );
}
