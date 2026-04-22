/**
 * 옷장 연결 CTA — C-1 결과 3섹션 구조 ③ (ADR-098)
 *
 * 장기 목표: 내 옷장에 있는 아이템을 퍼스널컬러/체형 원칙과 매칭해
 *   "오늘 뭐 입지?"를 해결. 무료 경로(쇼핑 없이 가치 제공).
 *
 * 현재: FEATURE_FLAGS.CLOSET_INTEGRATION=false — 웹 인벤토리 UI가
 *   Phase 1.5로 준비 중. 따라서 "준비 중" 안내 + 이메일 알림 가입 또는
 *   모바일 옷장 기능 안내로 대체한다.
 *
 * CLOSET_INTEGRATION=true 상태에서는 실제 옷장 링크(`/closet`)를 노출.
 */

'use client';

import { FolderHeart, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { FEATURE_FLAGS } from '@yiroom/shared';

interface ClosetPromptCardProps {
  className?: string;
}

export function ClosetPromptCard({ className }: ClosetPromptCardProps) {
  const isClosetActive = FEATURE_FLAGS.CLOSET_INTEGRATION;

  return (
    <section
      data-testid="closet-prompt-card"
      className={`relative overflow-hidden rounded-2xl border border-pink-200/60 bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50 p-5 dark:border-pink-900/40 dark:from-pink-950/20 dark:via-rose-950/20 dark:to-amber-950/20 ${className ?? ''}`}
      aria-label="내 옷장과 연결"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300">
          <FolderHeart className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h3 className="text-base font-bold text-foreground">내 옷장과 연결</h3>
          <p className="text-xs text-muted-foreground">
            오늘 뭐 입지? 체형·컬러 원칙으로 지금 있는 옷을 조합해봐요
          </p>
        </div>
      </div>

      {isClosetActive ? (
        <Link
          href="/closet"
          data-testid="closet-prompt-link"
          className="flex items-center justify-between gap-2 rounded-xl bg-white/80 p-3 text-sm font-medium text-foreground transition-colors hover:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-900/60"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-pink-500" aria-hidden />내 옷장으로 이동해서 조합 보기
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
        </Link>
      ) : (
        <div
          data-testid="closet-prompt-coming-soon"
          className="rounded-xl bg-white/80 p-3 dark:bg-slate-900/40"
        >
          <div className="mb-2 flex items-center gap-1.5">
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              준비 중
            </span>
            <span className="text-xs text-muted-foreground">Phase 1.5 —</span>
          </div>
          <p className="text-xs leading-relaxed text-foreground">
            옷장에 있는 아이템을 찍어두면 <br />
            체형·퍼스널컬러 원칙에 맞춰 오늘의 코디를 자동으로 제안해드릴 예정이에요.
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            모바일 앱에서는 일부 기능이 먼저 열릴 수 있어요.
          </p>
        </div>
      )}
    </section>
  );
}
