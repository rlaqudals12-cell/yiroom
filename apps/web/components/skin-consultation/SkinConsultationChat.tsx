'use client';

/**
 * Phase D: 피부 상담 채팅 메인 컴포넌트
 */

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Droplets, Sun, Sparkles } from 'lucide-react';
import ChatMessage from './ChatMessage';
import QuickQuestions from './QuickQuestions';
import {
  generateConsultationResponse,
  GREETING_MESSAGE,
  NO_ANALYSIS_MESSAGE,
  CONSULTATION_RESPONSES,
} from '@/lib/mock/skin-consultation';
import type {
  ChatMessage as ChatMessageType,
  SkinConcern,
  SkinAnalysisSummary,
} from '@/types/skin-consultation';

interface SkinConsultationChatProps {
  skinAnalysis?: SkinAnalysisSummary | null;
  onProductClick?: (productId: string) => void;
}

/** 분석 결과 요약 카드 */
function AnalysisSummaryCard({ analysis }: { analysis: SkinAnalysisSummary }) {
  return (
    <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-sm">내 피부 분석 결과</span>
          <Badge variant="secondary" className="text-[10px]">
            {analysis.analyzedAt.toLocaleDateString('ko-KR')} 분석
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/60 rounded-lg p-2">
            <Droplets className="w-4 h-4 mx-auto text-blue-500 mb-1" />
            <div className="text-lg font-bold">{analysis.hydration}</div>
            <div className="text-[10px] text-muted-foreground">수분</div>
          </div>
          <div className="bg-white/60 rounded-lg p-2">
            <Sparkles className="w-4 h-4 mx-auto text-yellow-500 mb-1" />
            <div className="text-lg font-bold">{analysis.oiliness}</div>
            <div className="text-[10px] text-muted-foreground">유분</div>
          </div>
          <div className="bg-white/60 rounded-lg p-2">
            <Sun className="w-4 h-4 mx-auto text-red-400 mb-1" />
            <div className="text-lg font-bold">{analysis.sensitivity}</div>
            <div className="text-[10px] text-muted-foreground">민감도</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          {analysis.skinType} 피부 타입
        </p>
      </CardContent>
    </Card>
  );
}

export default function SkinConsultationChat({
  skinAnalysis,
  onProductClick,
}: SkinConsultationChatProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 초기 인사 메시지
  useEffect(() => {
    const greetingMessage: ChatMessageType = {
      id: 'greeting',
      role: 'assistant',
      content: skinAnalysis ? GREETING_MESSAGE : NO_ANALYSIS_MESSAGE,
      timestamp: new Date(),
    };
    setMessages([greetingMessage]);
  }, [skinAnalysis]);

  // 스크롤 자동 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 질문 처리
  const handleSendMessage = async (text: string, concern?: SkinConcern) => {
    if (!text.trim() || isLoading) return;

    // 사용자 메시지 추가
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Mock 응답 생성 (딜레이 추가)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 고민 카테고리 추론
    const detectedConcern = concern || detectConcern(text);
    const skinType = skinAnalysis?.skinType?.toLowerCase();
    const response = generateConsultationResponse(detectedConcern, skinType);

    // AI 응답 메시지
    const aiMessage: ChatMessageType = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: formatResponse(response),
      timestamp: new Date(),
      productRecommendations: response.products.length > 0 ? response.products : undefined,
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
  };

  // 빠른 질문 클릭
  const handleQuickQuestion = (question: string, concern: SkinConcern) => {
    handleSendMessage(question, concern);
  };

  return (
    <div className="flex flex-col h-full" data-testid="skin-consultation-chat">
      {/* 분석 요약 (있을 때만) */}
      {skinAnalysis && (
        <div className="px-4 py-3 border-b">
          <AnalysisSummaryCard analysis={skinAnalysis} />
        </div>
      )}

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} onProductClick={onProductClick} />
        ))}

        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">답변을 생성하고 있어요...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 빠른 질문 */}
      {skinAnalysis && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <QuickQuestions onQuestionClick={handleQuickQuestion} disabled={isLoading} />
        </div>
      )}

      {/* 입력 영역 */}
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={skinAnalysis ? '피부 고민을 물어보세요...' : '먼저 피부 분석을 받아주세요'}
            disabled={isLoading || !skinAnalysis}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading || !skinAnalysis}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

/** 텍스트에서 고민 카테고리 감지 */
function detectConcern(text: string): SkinConcern {
  const keywords: Record<SkinConcern, string[]> = {
    dryness: ['건조', '수분', '보습', '당김', '각질'],
    oiliness: ['유분', '피지', '번들', '기름'],
    acne: ['트러블', '여드름', '뾰루지', '피부 트러블'],
    wrinkles: ['주름', '안티에이징', '탄력', '노화'],
    pigmentation: ['잡티', '색소', '톤', '밝아', '칙칙'],
    sensitivity: ['민감', '자극', '순한', '붉어'],
    pores: ['모공', '블랙헤드', '화이트헤드'],
    general: [],
  };

  for (const [concern, words] of Object.entries(keywords)) {
    if (words.some((word) => text.includes(word))) {
      return concern as SkinConcern;
    }
  }

  return 'general';
}

/** 응답 포맷팅 */
function formatResponse(response: {
  message: string;
  tips: string[];
  ingredients: string[];
}): string {
  let formatted = response.message + '\n\n';

  if (response.tips.length > 0) {
    formatted += '💡 실천 팁:\n';
    response.tips.slice(0, 3).forEach((tip, i) => {
      formatted += `${i + 1}. ${tip}\n`;
    });
    formatted += '\n';
  }

  if (response.ingredients.length > 0) {
    formatted += `✨ 추천 성분: ${response.ingredients.slice(0, 3).join(', ')}`;
  }

  return formatted.trim();
}
