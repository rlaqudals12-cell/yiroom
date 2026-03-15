'use client';

/**
 * 복귀자 환영 배너
 *
 * 3일+ 미접속 사용자에게 환영 메시지 + 부재 중 변화 요약 표시
 * 닫기 시 24시간 재표시 방지 (localStorage)
 * 자체적으로 activity_logs에서 lastActiveAt을 조회
 */

import { useState, useEffect } from 'react';
import { X, ArrowRight, Heart } from 'lucide-react';
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
      className="relative bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 rounded-2xl p-5 border border-rose-200/50 dark:border-rose-800/30"
      data-testid="welcome-back-banner"
      role="status"
      aria-live="polite"
    >
      {/* 닫기 버튼 */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-rose-100/50 dark:hover:bg-rose-900/30 transition-colors"
        aria-label="환영 메시지 닫기"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-rose-100 dark:bg-rose-900/30 rounded-xl">
          <Heart className="w-5 h-5 text-rose-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{message.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{message.description}</p>

          <div className="flex items-center gap-3 mt-2">
            {message.ctaText && message.ctaHref && (
              <Link
                href={message.ctaHref}
                className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300"
              >
                {message.ctaText}
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
            <button
              onClick={handleDismissPermanently}
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              다시 보지 않기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
