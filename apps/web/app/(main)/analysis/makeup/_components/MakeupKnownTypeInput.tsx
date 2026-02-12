'use client';

/**
 * 메이크업 분석 - 알고있는 타입 입력 컴포넌트
 *
 * 사용자가 언더톤과 피부 고민을 직접 선택하여 결과를 생성
 */

import { useState } from 'react';
import {
  type UndertoneId,
  type MakeupConcernId,
  UNDERTONES,
  MAKEUP_CONCERNS,
} from '@/lib/mock/makeup-analysis';
import { Button } from '@/components/ui/button';

interface MakeupKnownTypeInputProps {
  onSubmit: (undertone: UndertoneId, concerns: MakeupConcernId[]) => void;
  onBack: () => void;
}

export function MakeupKnownTypeInput({ onSubmit, onBack }: MakeupKnownTypeInputProps) {
  const [selectedUndertone, setSelectedUndertone] = useState<UndertoneId | null>(null);
  const [selectedConcerns, setSelectedConcerns] = useState<MakeupConcernId[]>([]);

  const toggleConcern = (id: MakeupConcernId) => {
    setSelectedConcerns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6" data-testid="makeup-known-input">
      {/* 언더톤 선택 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4" id="undertone-selection-label">
          피부 톤을 선택해주세요
        </h3>
        <div
          className="grid grid-cols-3 gap-3"
          role="radiogroup"
          aria-labelledby="undertone-selection-label"
        >
          {UNDERTONES.map((tone) => (
            <button
              key={tone.id}
              onClick={() => setSelectedUndertone(tone.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedUndertone === tone.id
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-muted hover:border-pink-200'
              }`}
              role="radio"
              aria-checked={selectedUndertone === tone.id}
              aria-label={tone.label}
            >
              <span className="text-2xl mb-2 block" aria-hidden="true">
                {tone.emoji}
              </span>
              <span className="font-medium text-sm">{tone.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 고민 선택 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4" id="concern-selection-label">
          피부 고민을 선택해주세요 (복수 선택)
        </h3>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-labelledby="concern-selection-label"
        >
          {MAKEUP_CONCERNS.map((concern) => (
            <button
              key={concern.id}
              onClick={() => toggleConcern(concern.id)}
              className={`px-3 py-2 rounded-full text-sm transition-all ${
                selectedConcerns.includes(concern.id)
                  ? 'bg-pink-500 text-white'
                  : 'bg-muted hover:bg-muted/80'
              }`}
              role="checkbox"
              aria-checked={selectedConcerns.includes(concern.id)}
              aria-label={concern.label}
            >
              <span aria-hidden="true">{concern.emoji}</span> {concern.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} aria-label="촬영 가이드로 돌아가기">
          ← 뒤로
        </Button>
        <Button
          onClick={() => selectedUndertone && onSubmit(selectedUndertone, selectedConcerns)}
          disabled={!selectedUndertone}
          className="flex-1 bg-pink-500 hover:bg-pink-600"
          data-testid="makeup-submit-known-type"
          aria-label="선택한 피부 타입으로 결과 보기"
        >
          결과 보기
        </Button>
      </div>
    </div>
  );
}
