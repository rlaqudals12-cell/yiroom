/**
 * N-1 빠른 기록 버튼 바 컴포넌트 (Task 2.7)
 *
 * 하단 고정 빠른 액션 버튼들:
 * - 📷 사진 촬영
 * - 🔍 음식 검색
 * - 📊 바코드 스캔
 * - 💧 물 섭취 추가
 */

'use client';

import { Camera, Search, ScanBarcode, Droplets } from 'lucide-react';

// 액션 타입
type QuickActionType = 'camera' | 'search' | 'barcode' | 'water';

// 액션별 정보
const QUICK_ACTIONS = [
  {
    type: 'camera' as QuickActionType,
    label: '사진',
    icon: Camera,
    color: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
    description: '사진으로 기록',
  },
  {
    type: 'search' as QuickActionType,
    label: '검색',
    icon: Search,
    color: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
    description: '음식 검색',
  },
  {
    type: 'barcode' as QuickActionType,
    label: '바코드',
    icon: ScanBarcode,
    color: 'bg-green-100 text-green-600 hover:bg-green-200',
    description: '바코드 스캔',
  },
  {
    type: 'water' as QuickActionType,
    label: '물',
    icon: Droplets,
    color: 'bg-cyan-100 text-cyan-600 hover:bg-cyan-200',
    description: '물 250ml 추가',
  },
] as const;

export interface QuickActionBarProps {
  /** 액션 클릭 핸들러 */
  onAction?: (type: QuickActionType) => void;
  /** 물 섭취량 (오늘 기준, ml) */
  waterAmount?: number;
  /** 물 목표량 (ml, 기본: 2000) */
  waterGoal?: number;
  /** 고정 스타일 사용 여부 (기본: true) */
  fixed?: boolean;
}

export default function QuickActionBar({
  onAction,
  waterAmount = 0,
  waterGoal = 2000,
  fixed = true,
}: QuickActionBarProps) {
  // 물 섭취 진행률
  const waterProgress = Math.min(100, Math.round((waterAmount / waterGoal) * 100));

  return (
    <div
      className={`${
        fixed
          ? 'fixed bottom-0 left-0 right-0 z-20'
          : ''
      } bg-white border-t border-gray-100 shadow-lg`}
      data-testid="quick-action-bar"
    >
      <div className="max-w-[480px] mx-auto px-4 py-3">
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.type}
              onClick={() => onAction?.(action.type)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${action.color}`}
              aria-label={action.description}
              data-testid={`quick-action-${action.type}`}
            >
              <action.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{action.label}</span>
              {/* 물 버튼에만 진행률 표시 */}
              {action.type === 'water' && waterAmount > 0 && (
                <span className="text-[10px] opacity-75">
                  {waterProgress}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 플로팅 카메라 버튼 (메인 CTA)
 */
export function FloatingCameraButton({
  onClick,
}: {
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 active:bg-purple-800 transition-colors flex items-center justify-center"
      aria-label="사진으로 음식 기록하기"
      data-testid="floating-camera-button"
    >
      <Camera className="w-6 h-6" />
    </button>
  );
}
