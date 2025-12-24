'use client';

import { ArrowLeft, HelpCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { FAQAccordion } from '@/components/help';
import type { FAQ } from '@/types/announcements';

// Mock 데이터 (실제로는 서버에서 가져옴)
const mockFAQs: FAQ[] = [
  // 일반
  {
    id: 'faq-1',
    category: 'general',
    question: '이룸은 어떤 앱인가요?',
    answer:
      '이룸은 운동, 영양, 피부, 체형 분석을 통합적으로 관리할 수 있는 웰니스 플랫폼입니다. AI 기반 분석과 맞춤형 추천을 제공합니다.',
    sortOrder: 1,
    isPublished: true,
    helpfulCount: 45,
    notHelpfulCount: 2,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'faq-2',
    category: 'general',
    question: '이룸 사용에 비용이 드나요?',
    answer:
      '이룸의 모든 기능은 무료로 제공됩니다. 앱 사용 중 광고가 표시될 수 있으며, 추천 제품 구매 시 제휴 링크를 통해 앱 운영을 지원해주실 수 있습니다.',
    sortOrder: 2,
    isPublished: true,
    helpfulCount: 38,
    notHelpfulCount: 5,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'faq-3',
    category: 'general',
    question: '데이터는 어디에 저장되나요?',
    answer:
      '모든 데이터는 안전하게 암호화되어 클라우드 서버에 저장됩니다. 개인정보는 철저히 보호됩니다.',
    sortOrder: 3,
    isPublished: true,
    helpfulCount: 22,
    notHelpfulCount: 1,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },

  // 계정
  {
    id: 'faq-4',
    category: 'account',
    question: '회원가입은 어떻게 하나요?',
    answer:
      '앱 첫 화면에서 이메일, Google, 또는 Apple 계정으로 간편하게 가입할 수 있습니다.',
    sortOrder: 1,
    isPublished: true,
    helpfulCount: 56,
    notHelpfulCount: 3,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'faq-5',
    category: 'account',
    question: '비밀번호를 잊어버렸어요.',
    answer:
      '로그인 화면에서 "비밀번호 찾기"를 눌러 이메일로 재설정 링크를 받으세요.',
    sortOrder: 2,
    isPublished: true,
    helpfulCount: 34,
    notHelpfulCount: 2,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },

  // 운동
  {
    id: 'faq-6',
    category: 'workout',
    question: '운동 분석은 어떻게 받나요?',
    answer:
      '운동 온보딩 질문에 답변하면 AI가 당신에게 맞는 운동 타입을 분석해드립니다.',
    sortOrder: 1,
    isPublished: true,
    helpfulCount: 67,
    notHelpfulCount: 4,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'faq-7',
    category: 'workout',
    question: '운동 기록은 어떻게 하나요?',
    answer:
      '대시보드에서 운동 기록 버튼을 누르고, 오늘 한 운동을 선택하세요.',
    sortOrder: 2,
    isPublished: true,
    helpfulCount: 43,
    notHelpfulCount: 1,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },

  // 영양
  {
    id: 'faq-8',
    category: 'nutrition',
    question: '음식 기록은 어떻게 하나요?',
    answer:
      '영양 탭에서 "식사 기록" 버튼을 누르고, 음식을 검색하거나 사진으로 인식할 수 있습니다.',
    sortOrder: 1,
    isPublished: true,
    helpfulCount: 52,
    notHelpfulCount: 3,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'faq-9',
    category: 'nutrition',
    question: '칼로리 목표는 어떻게 설정하나요?',
    answer:
      '설정 > 영양 설정에서 목표 칼로리, 단백질, 탄수화물, 지방 목표를 설정할 수 있습니다.',
    sortOrder: 2,
    isPublished: true,
    helpfulCount: 29,
    notHelpfulCount: 2,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },

  // 기술
  {
    id: 'faq-10',
    category: 'technical',
    question: '앱이 제대로 작동하지 않아요.',
    answer:
      '앱을 완전히 종료하고 다시 시작해보세요. 문제가 지속되면 피드백을 보내주세요.',
    sortOrder: 1,
    isPublished: true,
    helpfulCount: 18,
    notHelpfulCount: 5,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
];

export default function FAQPage() {
  const handleFeedback = (faqId: string, helpful: boolean) => {
    // TODO: 피드백 저장 API 호출
    console.log(`FAQ ${faqId}: ${helpful ? 'helpful' : 'not helpful'}`);
  };

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-6 w-6" />
          <h1 className="text-2xl font-bold">자주 묻는 질문</h1>
        </div>
      </div>

      {/* 설명 */}
      <p className="text-muted-foreground">
        이룸 사용 중 궁금한 점이 있으신가요? 아래에서 답변을 찾아보세요.
      </p>

      {/* FAQ 아코디언 */}
      <FAQAccordion
        faqs={mockFAQs}
        showSearch={true}
        onFeedback={handleFeedback}
      />

      {/* 추가 문의 */}
      <div className="text-center text-sm text-muted-foreground pt-4 border-t">
        원하는 답변을 찾지 못하셨나요?{' '}
        <Link href="/help/feedback" className="text-primary hover:underline">
          문의하기
        </Link>
      </div>
    </div>
  );
}
