'use client';

import { useEffect } from 'react';
import { X, ChevronRight, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PostureIssue } from '@/types/workout-posture';
import {
  POSTURE_TYPE_LABELS,
  POSTURE_SEVERITY_LABELS,
  POSTURE_SEVERITY_STYLES,
} from '@/types/workout-posture';

interface PostureFeedbackPanelProps {
  issue: PostureIssue | null;
  onClose: () => void;
  onExerciseClick?: (exerciseId: string) => void;
}

/**
 * 자세 피드백 패널
 * - 선택된 문제 영역의 상세 정보 표시
 * - 교정 방법 안내
 * - 관련 운동 링크
 */
export function PostureFeedbackPanel({
  issue,
  onClose,
  onExerciseClick,
}: PostureFeedbackPanelProps) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!issue) return null;

  const label = POSTURE_TYPE_LABELS[issue.type];
  const severityLabel = POSTURE_SEVERITY_LABELS[issue.severity];
  const severityStyle = POSTURE_SEVERITY_STYLES[issue.severity];

  return (
    <>
      {/* 오버레이 */}
      <div
        data-testid="posture-feedback-overlay"
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 패널 */}
      <div
        data-testid="posture-feedback-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="posture-panel-title"
        className={cn(
          'fixed inset-x-0 bottom-0 z-50',
          'bg-white rounded-t-2xl shadow-2xl',
          'animate-in slide-in-from-bottom duration-300',
          'max-h-[70vh] overflow-y-auto'
        )}
      >
        {/* 핸들 바 */}
        <div className="sticky top-0 bg-white pt-3 pb-2 px-6">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />

          {/* 헤더 */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <h2 id="posture-panel-title" className="text-lg font-semibold">
                {label}
              </h2>
              <span className={cn('px-2 py-0.5 rounded-full text-sm font-medium', severityStyle)}>
                {severityLabel}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="패널 닫기"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="px-6 pb-8 space-y-4">
          {/* 현재 상태 설명 */}
          <p className="text-gray-700">{issue.description}</p>

          {/* 각도 정보 (있는 경우) */}
          {issue.currentAngle !== undefined && issue.idealAngle !== undefined && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">각도 분석</span>
              </div>
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-gray-500">현재 각도</span>
                  <p className="text-lg font-semibold text-gray-900">{issue.currentAngle}°</p>
                </div>
                <div className="text-right">
                  <span className="text-gray-500">이상 각도</span>
                  <p className="text-lg font-semibold text-emerald-600">{issue.idealAngle}°</p>
                </div>
              </div>
            </div>
          )}

          {/* 교정 가이드 */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="font-medium text-blue-900 mb-2">교정 방법</h3>
            <p className="text-blue-700">{issue.correction}</p>
          </div>

          {/* 관련 운동 링크 */}
          {issue.relatedExerciseId && onExerciseClick && (
            <button
              onClick={() => onExerciseClick(issue.relatedExerciseId!)}
              className={cn(
                'w-full flex items-center justify-between',
                'p-4 bg-gradient-to-r from-primary/10 to-primary/5',
                'rounded-xl border border-primary/20',
                'hover:from-primary/20 hover:to-primary/10 transition-colors'
              )}
            >
              <span className="font-medium text-primary">교정 운동 보기</span>
              <ChevronRight className="w-5 h-5 text-primary" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
