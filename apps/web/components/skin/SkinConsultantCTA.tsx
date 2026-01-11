'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface SkinConsultantCTAProps {
  /** 피부 타입 (코치에게 컨텍스트 전달용) */
  skinType?: string;
  /** 피부 고민 목록 */
  concerns?: string[];
  /** 버튼 변형 */
  variant?: 'default' | 'outline' | 'ghost';
  /** 전체 너비 여부 */
  fullWidth?: boolean;
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
  className = '',
}: SkinConsultantCTAProps) {
  const router = useRouter();

  const handleClick = () => {
    // 피부 상담 페이지로 이동
    router.push('/analysis/skin/consultation');
  };

  return (
    <Button
      variant={variant}
      className={`${fullWidth ? 'w-full' : ''} ${className}`}
      onClick={handleClick}
      data-testid="skin-consultant-cta"
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      AI 피부 상담
    </Button>
  );
}

export default SkinConsultantCTA;
