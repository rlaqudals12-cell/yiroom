'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Progressive Profiling — 분석 결과 후 추가 정보 수집 프롬프트
 *
 * "더 정확한 결과를 원하시면 추가 정보를 알려주세요"
 * 각 모듈별로 정확도를 높일 수 있는 추가 정보 항목을 표시
 *
 * @see docs/TODO.md 섹션 6 갭 #5: Progressive Profiling
 */

export type ProfileField = {
  id: string;
  label: string;
  description: string;
  /** 이 정보가 있으면 정확도가 얼마나 올라가는지 */
  accuracyBoost: string;
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
      accuracyBoost: '+10-15% 정확도',
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
      accuracyBoost: '+5% 정확도',
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
      accuracyBoost: '+10% 맞춤 추천',
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
      description: '호르몬 변화에 따른 피부 변화를 추적할 수 있어요',
      accuracyBoost: '+15% 시기별 맞춤',
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
      description: '운동 추천의 안전성을 높일 수 있어요',
      accuracyBoost: '안전한 운동 추천',
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
      description: '영양 추천을 더 정확하게 조정할 수 있어요',
      accuracyBoost: '+20% 맞춤 영양',
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
      description: '영양소 상호작용을 확인할 수 있어요',
      accuracyBoost: '상호작용 경고',
      inputType: 'text',
      placeholder: '예: 비타민D, 오메가3, 철분제',
    },
  ],
  hair: [
    {
      id: 'hairHistory',
      label: '최근 시술 이력',
      description: '모발 상태를 더 정확하게 판단할 수 있어요',
      accuracyBoost: '+10% 케어 추천',
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

  const handleSubmit = (): void => {
    setSubmitted(true);
    onSubmit?.(answers);
  };

  if (submitted) {
    return (
      <div
        className="rounded-2xl border border-pink-500/20 bg-pink-500/5 p-4 text-center"
        data-testid="progressive-profile-thanks"
      >
        <Sparkles className="mx-auto mb-2 h-5 w-5 text-pink-400" />
        <p className="text-sm text-zinc-300">
          추가 정보가 반영되었어요. 다음 분석부터 더 정확한 결과를 받을 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-zinc-800 bg-neutral-900/50 p-4"
      data-testid="progressive-profile-prompt"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <p className="text-sm font-medium text-zinc-200">더 정확한 결과를 원하시나요?</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            추가 정보를 알려주시면 분석 정확도가 올라갑니다
            {currentConfidence ? ` (현재 ${currentConfidence}%)` : ''}
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-zinc-500" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {fields.map((field) => (
            <div key={field.id}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label className="text-sm font-medium text-zinc-300">{field.label}</label>
                <span className="text-[10px] text-pink-400">{field.accuracyBoost}</span>
              </div>
              <p className="mb-2 text-xs text-zinc-500">{field.description}</p>

              {field.inputType === 'select' && field.options && (
                <div className="flex flex-wrap gap-2">
                  {field.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(field.id, opt.value)}
                      className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                        answers[field.id] === opt.value
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
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
                            ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
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
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-pink-500/30 focus:outline-none"
                />
              )}
            </div>
          ))}

          <Button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length === 0}
            className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-sm font-medium text-white hover:from-pink-400 hover:to-purple-400 disabled:opacity-40"
          >
            정보 저장하기
          </Button>
        </div>
      )}
    </div>
  );
}
