'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Progressive Profiling — 분석 결과 후 추가 정보 수집 프롬프트
 *
 * ⚠️ 정직성 계약 (2026-08 수리): 수집한 답변은 `progressive_data`에 저장만 되고
 * **어떤 분석 경로도 이 값을 읽지 않는다**(실주입 미구현). 그래서 이 컴포넌트는
 * "+10-15% 정확도"·"다음 분석부터 더 정확한 결과" 같은 지키지 못할 약속을 하지 않는다.
 * 실제 프롬프트/알고리즘 주입(L안)이 붙기 전까지 문구를 되돌리지 말 것.
 *
 * @see docs/TODO.md 섹션 6 갭 #5: Progressive Profiling
 */

export type ProfileField = {
  id: string;
  label: string;
  description: string;
  /** 입력 타입 */
  inputType: 'select' | 'text' | 'number' | 'multiselect';
  /** select/multiselect 옵션 */
  options?: { value: string; label: string }[];
  /** number 범위 */
  min?: number;
  max?: number;
  /** placeholder */
  placeholder?: string;
};

// 모듈별 추가 정보 필드 정의
const MODULE_FIELDS: Record<string, ProfileField[]> = {
  'personal-color': [
    {
      id: 'veinColor',
      label: '손목 혈관 색상',
      description: '손목 안쪽 혈관이 파란색인지 녹색인지 확인해주세요',
      inputType: 'select',
      options: [
        { value: 'blue', label: '파란색/보라색' },
        { value: 'green', label: '녹색/올리브색' },
        { value: 'mixed', label: '잘 모르겠어요' },
      ],
    },
    {
      id: 'jewelryPreference',
      label: '어울리는 액세서리',
      description: '골드와 실버 중 어느 것이 더 어울리나요?',
      inputType: 'select',
      options: [
        { value: 'gold', label: '골드가 더 어울려요' },
        { value: 'silver', label: '실버가 더 어울려요' },
        { value: 'both', label: '둘 다 어울려요' },
      ],
    },
  ],
  skin: [
    {
      id: 'skinConcerns',
      label: '주요 피부 고민',
      description: '현재 가장 신경 쓰이는 피부 고민을 선택해주세요',
      inputType: 'multiselect',
      options: [
        { value: 'acne', label: '여드름/트러블' },
        { value: 'dryness', label: '건조함/당김' },
        { value: 'oiliness', label: '번들거림' },
        { value: 'pigmentation', label: '기미/잡티' },
        { value: 'wrinkles', label: '주름/탄력' },
        { value: 'sensitivity', label: '민감/홍조' },
        { value: 'pores', label: '모공' },
      ],
    },
    {
      id: 'menstrualCycle',
      label: '생리 주기 (선택)',
      description: '호르몬 변화와 피부 상태의 관계를 살펴보는 데 참고해요',
      inputType: 'select',
      options: [
        { value: 'regular', label: '규칙적 (28일 전후)' },
        { value: 'irregular', label: '불규칙' },
        { value: 'skip', label: '알려주고 싶지 않아요' },
      ],
    },
  ],
  body: [
    {
      id: 'healthConditions',
      label: '건강 상태 (선택)',
      description: '체형·스타일 제안을 다듬는 데 참고해요',
      inputType: 'multiselect',
      options: [
        { value: 'knee', label: '무릎 통증/부상' },
        { value: 'back', label: '허리 통증/디스크' },
        { value: 'shoulder', label: '어깨 통증' },
        { value: 'pregnancy', label: '임신 중' },
        { value: 'none', label: '특이사항 없음' },
      ],
    },
  ],
  nutrition: [
    {
      id: 'healthStatus',
      label: '건강 상태 (선택)',
      description: '영양 추천을 다듬는 데 참고해요',
      inputType: 'multiselect',
      options: [
        { value: 'diabetes', label: '당뇨 (관리 중)' },
        { value: 'hypertension', label: '고혈압' },
        { value: 'anemia', label: '빈혈' },
        { value: 'thyroid', label: '갑상선 질환' },
        { value: 'none', label: '특이사항 없음' },
      ],
    },
    {
      id: 'supplements',
      label: '복용 중인 영양제',
      description: '영양소 상호작용을 살펴보는 데 참고해요',
      inputType: 'text',
      placeholder: '예: 비타민D, 오메가3, 철분제',
    },
  ],
  hair: [
    {
      id: 'hairHistory',
      label: '최근 시술 이력',
      description: '모발 상태를 이해하는 데 참고해요',
      inputType: 'multiselect',
      options: [
        { value: 'perm', label: '펌 (6개월 이내)' },
        { value: 'color', label: '염색 (3개월 이내)' },
        { value: 'straightening', label: '매직/셋팅' },
        { value: 'none', label: '시술 없음' },
      ],
    },
  ],
};

interface ProgressiveProfilePromptProps {
  /** 분석 모듈 ID */
  moduleId: string;
  /** 현재 분석 신뢰도 */
  currentConfidence?: number;
  /** 추가 정보 제출 콜백 */
  onSubmit?: (data: Record<string, string | string[]>) => void;
}

export function ProgressiveProfilePrompt({
  moduleId,
  currentConfidence,
  onSubmit,
}: ProgressiveProfilePromptProps): React.JSX.Element | null {
  const [isExpanded, setIsExpanded] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);

  const fields = MODULE_FIELDS[moduleId];
  if (!fields || fields.length === 0) return null;

  const handleSelect = (fieldId: string, value: string): void => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleMultiSelect = (fieldId: string, value: string): void => {
    setAnswers((prev) => {
      const current = (prev[fieldId] as string[]) || [];
      if (value === 'none') return { ...prev, [fieldId]: ['none'] };
      const filtered = current.filter((v) => v !== 'none');
      const updated = filtered.includes(value)
        ? filtered.filter((v) => v !== value)
        : [...filtered, value];
      return { ...prev, [fieldId]: updated };
    });
  };

  const handleTextInput = (fieldId: string, value: string): void => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (): Promise<void> => {
    try {
      // DB 저장 API 호출
      await fetch('/api/user/progressive-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, data: answers }),
      });
    } catch {
      // 저장 실패해도 UX는 유지 (다음 분석에 반영 안 될 뿐)
    }
    setSubmitted(true);
    onSubmit?.(answers);
  };

  if (submitted) {
    return (
      <div
        className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center"
        data-testid="progressive-profile-thanks"
      >
        <Sparkles className="mx-auto mb-2 h-5 w-5 text-primary" />
        {/* 정직: 저장만 될 뿐 아직 분석에 주입되지 않는다 — "다음 분석부터 더 정확" 약속 금지 */}
        <p className="text-sm text-muted-foreground">
          알려주셔서 고마워요. 다음 개선에 참고할게요.
        </p>
      </div>
    );
  }

  return (
    <div
      // 접힌 상태는 배경 없이 얇은 테두리만 — 결과 본문보다 시각 무게를 낮추기 위해
      className={`rounded-2xl border p-4 ${isExpanded ? 'border-border bg-card' : 'border-border/60 bg-transparent'}`}
      data-testid="progressive-profile-prompt"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          {/* 정직: 정확도 향상을 약속하지 않는다 — 답변은 저장될 뿐 분석에 주입되지 않는다 */}
          <p className="text-sm font-medium text-foreground">나에 대해 조금 더 알려주실래요?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            알려주신 내용은 다음 개선에 참고돼요
            {currentConfidence ? ` (현재 분석 신뢰도 ${currentConfidence}%)` : ''}
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {fields.map((field) => (
            <div key={field.id}>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {field.label}
              </label>
              <p className="mb-2 text-xs text-muted-foreground">{field.description}</p>

              {field.inputType === 'select' && field.options && (
                <div className="flex flex-wrap gap-2">
                  {field.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(field.id, opt.value)}
                      className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                        answers[field.id] === opt.value
                          ? 'bg-primary/10 text-primary border border-primary/40'
                          : 'bg-background text-muted-foreground border border-border hover:border-muted-foreground/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {field.inputType === 'multiselect' && field.options && (
                <div className="flex flex-wrap gap-2">
                  {field.options.map((opt) => {
                    const selected = ((answers[field.id] as string[]) || []).includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleMultiSelect(field.id, opt.value)}
                        className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                          selected
                            ? 'bg-primary/10 text-primary border border-primary/40'
                            : 'bg-background text-muted-foreground border border-border hover:border-muted-foreground/40'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {field.inputType === 'text' && (
                <input
                  type="text"
                  placeholder={field.placeholder}
                  value={(answers[field.id] as string) || ''}
                  onChange={(e) => handleTextInput(field.id, e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
                />
              )}
            </div>
          ))}

          <Button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length === 0}
            className="w-full rounded-xl bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            정보 저장하기
          </Button>
        </div>
      )}
    </div>
  );
}
