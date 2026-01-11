'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 피부 상담 빠른 질문
 */
const SKIN_QUICK_QUESTIONS = [
  '제 피부에 맞는 루틴 알려줘요',
  '피부가 건조할 때 어떻게 해요?',
  '모공 관리는 어떻게 해야 해요?',
  '피부 타입에 맞는 세럼 추천해줘',
];

interface SkinConsultantCTAProps {
  /** 피부 타입 (코치에게 컨텍스트 전달용) */
  skinType?: string;
  /** 피부 고민 목록 */
  concerns?: string[];
  /** 버튼 변형 */
  variant?: 'default' | 'outline' | 'ghost';
  /** 전체 너비 여부 */
  fullWidth?: boolean;
  /** 빠른 질문 표시 여부 */
  showQuickQuestions?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * AI 피부 상담 CTA 버튼
 * @description Phase D - 피부 분석 결과에서 AI 상담으로 자연스럽게 연결
 */
export function SkinConsultantCTA({
  skinType,
  concerns,
  variant = 'outline',
  fullWidth = false,
  showQuickQuestions = false,
  className = '',
}: SkinConsultantCTAProps) {
  const router = useRouter();

  // 코치 페이지 URL 생성
  const buildCoachUrl = (question?: string) => {
    const params = new URLSearchParams();
    params.set('category', 'skin');

    if (skinType) {
      params.set('skinType', skinType);
    }
    if (concerns && concerns.length > 0) {
      params.set('concerns', concerns.join(','));
    }
    if (question) {
      params.set('q', question);
    }

    return `/coach?${params.toString()}`;
  };

  // 코치 페이지로 이동 (피부 카테고리)
  const handleClick = () => {
    router.push(buildCoachUrl());
  };

  // 빠른 질문 클릭 시 질문과 함께 이동
  const handleQuickQuestion = (question: string) => {
    router.push(buildCoachUrl(question));
  };

  // 빠른 질문 표시 모드
  if (showQuickQuestions) {
    return (
      <div data-testid="skin-consultant-cta" className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          <span>AI에게 물어보기</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SKIN_QUICK_QUESTIONS.slice(0, 3).map((question, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(question)}
              className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs text-primary hover:bg-primary/10 transition-colors"
            >
              {question}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClick}
          className="text-xs text-muted-foreground"
        >
          더 많은 질문하기 →
        </Button>
      </div>
    );
  }

  // 기본 버튼 모드
  return (
    <Button
      variant={variant}
      className={cn(fullWidth && 'w-full', className)}
      onClick={handleClick}
      data-testid="skin-consultant-cta"
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      AI 피부 상담
    </Button>
  );
}

export default SkinConsultantCTA;
