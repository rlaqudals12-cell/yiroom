'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 도메인별 빠른 질문
 */
const QUICK_QUESTIONS: Record<ConsultantCategory, string[]> = {
  skin: [
    '제 피부에 맞는 루틴 알려줘요',
    '피부가 건조할 때 어떻게 해요?',
    '모공 관리는 어떻게 해야 해요?',
  ],
  personalColor: [
    '내 시즌에 맞는 립 색상 추천해줘',
    '어울리는 옷 색상 조합 알려줘',
    '피해야 할 색상은 뭐야?',
  ],
  fashion: ['오늘 뭐 입을까?', '면접 볼 때 코디 추천해줘', '데이트룩 추천해줘'],
  nutrition: ['냉장고 재료로 뭐 해먹지?', '다이어트 식단 추천해줘', '단백질 보충 방법 알려줘'],
  workout: ['오늘 운동 뭐하면 좋을까?', '집에서 할 수 있는 운동 추천해줘', '스트레칭 방법 알려줘'],
};

/**
 * 도메인별 CTA 제목
 */
const CTA_TITLES: Record<ConsultantCategory, string> = {
  skin: 'AI 피부 상담',
  personalColor: 'AI 컬러 상담',
  fashion: 'AI 코디 상담',
  nutrition: 'AI 영양 상담',
  workout: 'AI 운동 상담',
};

type ConsultantCategory = 'skin' | 'personalColor' | 'fashion' | 'nutrition' | 'workout';

interface ConsultantCTAProps {
  /** 도메인 카테고리 */
  category: ConsultantCategory;
  /** 추가 URL 파라미터 */
  params?: Record<string, string>;
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
 * 범용 AI 상담 CTA 버튼
 * @description Phase K - 각 도메인 분석 결과에서 AI 상담으로 자연스럽게 연결
 */
export function ConsultantCTA({
  category,
  params = {},
  variant = 'outline',
  fullWidth = false,
  showQuickQuestions = false,
  className = '',
}: ConsultantCTAProps) {
  const router = useRouter();

  // 코치 페이지 URL 생성
  const buildCoachUrl = (question?: string) => {
    const urlParams = new URLSearchParams();
    urlParams.set('category', category);

    // 추가 파라미터 설정
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        urlParams.set(key, value);
      }
    });

    if (question) {
      urlParams.set('q', question);
    }

    return `/coach?${urlParams.toString()}`;
  };

  // 코치 페이지로 이동
  const handleClick = () => {
    router.push(buildCoachUrl());
  };

  // 빠른 질문 클릭 시 질문과 함께 이동
  const handleQuickQuestion = (question: string) => {
    router.push(buildCoachUrl(question));
  };

  const quickQuestions = QUICK_QUESTIONS[category];
  const title = CTA_TITLES[category];

  // 빠른 질문 표시 모드
  if (showQuickQuestions) {
    return (
      <div data-testid={`${category}-consultant-cta`} className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          <span>AI에게 물어보기</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((question, index) => (
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
      data-testid={`${category}-consultant-cta`}
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      {title}
    </Button>
  );
}

export default ConsultantCTA;
