'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, Search, ThumbsUp, ThumbsDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { FAQ, FAQCategory } from '@/types/announcements';
import {
  FAQ_CATEGORY_NAMES,
  FAQ_CATEGORY_ICONS,
  groupFAQsByCategory,
  searchFAQs,
} from '@/lib/announcements';

interface FAQAccordionProps {
  /** FAQ 목록 */
  faqs: FAQ[];
  /** 초기 카테고리 필터 */
  initialCategory?: FAQCategory | 'all';
  /** 검색 표시 여부 */
  showSearch?: boolean;
  /** 도움됨/안됨 피드백 핸들러 */
  onFeedback?: (faqId: string, helpful: boolean) => void;
  'data-testid'?: string;
}

/**
 * FAQ 아코디언 컴포넌트
 * - 카테고리별 그룹화
 * - 검색 기능
 * - 도움됨/안됨 피드백
 */
export function FAQAccordion({
  faqs,
  initialCategory = 'all',
  showSearch = true,
  onFeedback,
  'data-testid': testId,
}: FAQAccordionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | 'all'>(
    initialCategory
  );
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  // 필터링된 FAQ
  const filteredFAQs = useMemo(() => {
    let result = faqs;

    // 카테고리 필터
    if (selectedCategory !== 'all') {
      result = result.filter((faq) => faq.category === selectedCategory);
    }

    // 검색 필터
    if (searchQuery) {
      result = searchFAQs(result, searchQuery);
    }

    return result;
  }, [faqs, selectedCategory, searchQuery]);

  // 카테고리별 그룹화
  const groupedFAQs = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredFAQs } as Record<FAQCategory, FAQ[]>;
    }
    return groupFAQsByCategory(filteredFAQs);
  }, [filteredFAQs, selectedCategory]);

  // 카테고리 목록 (FAQ가 있는 것만)
  const categories = useMemo(() => {
    const cats = new Set(faqs.map((faq) => faq.category));
    return ['all', ...Array.from(cats)] as (FAQCategory | 'all')[];
  }, [faqs]);

  // 피드백 처리
  const handleFeedback = (faqId: string, helpful: boolean) => {
    if (feedbackGiven.has(faqId)) return;

    setFeedbackGiven((prev) => new Set([...prev, faqId]));
    onFeedback?.(faqId, helpful);
  };

  return (
    <div className="space-y-4" data-testid={testId || 'faq-accordion'}>
      {/* 검색 */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="질문 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="faq-search-input"
          />
        </div>
      )}

      {/* 카테고리 탭 */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            data-testid={`faq-category-${cat}`}
          >
            {cat === 'all' ? '전체' : `${FAQ_CATEGORY_ICONS[cat]} ${FAQ_CATEGORY_NAMES[cat]}`}
          </Button>
        ))}
      </div>

      {/* FAQ 목록 */}
      {filteredFAQs.length === 0 ? (
        <p
          className="text-center text-muted-foreground py-8"
          data-testid="faq-empty"
        >
          {searchQuery ? '검색 결과가 없습니다' : 'FAQ가 없습니다'}
        </p>
      ) : (
        Object.entries(groupedFAQs).map(([category, categoryFAQs]) => {
          if (categoryFAQs.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              {selectedCategory === 'all' && (
                <h3
                  className="font-semibold text-lg flex items-center gap-2"
                  data-testid={`faq-section-${category}`}
                >
                  <span>{FAQ_CATEGORY_ICONS[category as FAQCategory]}</span>
                  {FAQ_CATEGORY_NAMES[category as FAQCategory]}
                </h3>
              )}

              <Accordion type="single" collapsible className="space-y-2">
                {categoryFAQs.map((faq) => (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id}
                    className="border rounded-lg px-4"
                    data-testid={`faq-item-${faq.id}`}
                  >
                    <AccordionTrigger className="text-left hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <div className="space-y-4">
                        <p className="whitespace-pre-wrap">{faq.answer}</p>

                        {/* 피드백 버튼 */}
                        {onFeedback && (
                          <div className="flex items-center gap-4 pt-2 border-t">
                            <span className="text-sm">이 답변이 도움이 되었나요?</span>
                            {feedbackGiven.has(faq.id) ? (
                              <span className="text-sm text-green-600">
                                피드백을 주셔서 감사합니다!
                              </span>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleFeedback(faq.id, true)}
                                  data-testid={`faq-helpful-${faq.id}`}
                                >
                                  <ThumbsUp className="h-4 w-4 mr-1" />
                                  도움됨
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleFeedback(faq.id, false)}
                                  data-testid={`faq-not-helpful-${faq.id}`}
                                >
                                  <ThumbsDown className="h-4 w-4 mr-1" />
                                  아니요
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          );
        })
      )}
    </div>
  );
}

export default FAQAccordion;
