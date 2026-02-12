'use client';

/**
 * 메이크업 분석 촬영 가이드
 *
 * 첫 방문 환영 배너 + 촬영 가이드 + 시작 버튼
 */

import { Button } from '@/components/ui/button';
import type { ExistingAnalysis } from '../page';

interface MakeupGuideProps {
  existingAnalysis: ExistingAnalysis | null;
  checkingExisting: boolean;
  onStartUpload: () => void;
  onSkipToKnownInput: () => void;
}

export function MakeupGuide({
  existingAnalysis,
  checkingExisting,
  onStartUpload,
  onSkipToKnownInput,
}: MakeupGuideProps) {
  return (
    <div className="space-y-6">
      {/* 첫 방문 환영 메시지 (기존 분석 없을 때만) */}
      {!existingAnalysis && !checkingExisting && (
        <div
          className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 text-center border border-pink-100"
          data-testid="makeup-welcome-banner"
        >
          <span className="text-4xl mb-3 block">💄</span>
          <h2 className="text-lg font-bold text-foreground mb-1">첫 메이크업 분석</h2>
          <p className="text-sm text-muted-foreground">
            AI가 얼굴을 분석하여 나에게 맞는 컬러와 스타일을 추천해드려요
          </p>
        </div>
      )}

      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-lg mb-4">📸 촬영 가이드</h2>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-pink-500">✓</span>
            밝은 자연광 아래에서 촬영해주세요
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pink-500">✓</span>
            정면에서 얼굴 전체가 보이도록 촬영해주세요
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pink-500">✓</span>
            민낯 상태에서 촬영하면 더 정확해요
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400">✗</span>
            필터나 보정된 사진은 피해주세요
          </li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onStartUpload}
          className="flex-1 bg-pink-500 hover:bg-pink-600"
          data-testid="makeup-upload-button"
          aria-label="사진으로 메이크업 분석 시작"
        >
          사진 선택하기
        </Button>
        <Button
          variant="outline"
          onClick={onSkipToKnownInput}
          data-testid="makeup-known-input-button"
          aria-label="내 피부 타입을 이미 알고 있어요"
        >
          알고 있어요
        </Button>
      </div>
    </div>
  );
}
