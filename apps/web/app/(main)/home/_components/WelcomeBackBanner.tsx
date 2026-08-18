'use client';

/**
 * 복귀자 환영 배너
 *
 * 3일+ 미접속 사용자에게 환영 메시지 + 부재 중 변화 요약 표시
 * 닫기 시 24시간 재표시 방지 (localStorage)
 * 자체적으로 activity_logs에서 lastActiveAt을 조회
 */

import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useAuth } from '@clerk/nextjs';
import {
  generateWelcomeBackMessage,
  isDismissed,
  dismissWelcomeBack,
  dismissWelcomeBackPermanently,
  type WelcomeBackMessage,
} from '@/lib/engagement';

export default function WelcomeBackBanner() {
  const [message, setMessage] = useState<WelcomeBackMessage | null>(null);
  const [visible, setVisible] = useState(false);
  const supabase = useClerkSupabaseClient();
  const { userId } = useAuth();

  useEffect(() => {
    if (!userId || isDismissed()) return;

    // activity_logs에서 마지막 활동 시간 조회
    async function checkLastActive(): Promise<void> {
      const { data } = await supabase
        .from('activity_logs')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const lastActiveAt = data?.created_at ?? null;
      const msg = generateWelcomeBackMessage(lastActiveAt);
      if (msg) {
        setMessage(msg);
        setVisible(true);
      }
    }

    checkLastActive();
  }, [userId, supabase]);

  const handleDismiss = (): void => {
    setVisible(false);
    dismissWelcomeBack();
  };

  const handleDismissPermanently = (): void => {
    setVisible(false);
    dismissWelcomeBackPermanently();
  };

  if (!visible || !message) return null;

  return (
    <div
      className="relative border-b border-border px-1 pb-3 pr-12"
      data-testid="welcome-back-banner"
      role="status"
      aria-live="polite"
    >
      {/* 닫기 버튼 */}
      <button
        onClick={handleDismiss}
        className="absolute right-0 top-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="환영 메시지 닫기"
      >
        <X className="w-4 h-4" />
      </button>

      <div>
        <p className="text-sm font-semibold text-foreground">{message.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{message.description}</p>

        <div className="mt-2 flex items-center gap-3">
          {message.ctaText && message.ctaHref && (
            <Link
              href={message.ctaHref}
              className="inline-flex items-center gap-1 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              {message.ctaText}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          )}
          <button
            onClick={handleDismissPermanently}
            className="text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            다시 보지 않기
          </button>
        </div>
      </div>
    </div>
  );
}
