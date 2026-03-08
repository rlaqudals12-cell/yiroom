'use client';

import { AlertTriangle, CheckCircle } from 'lucide-react';
import {
  type PostureType,
  type PostureMeasurement,
  POSTURE_TYPES,
  getPostureTypeColor,
  getScoreColor,
} from '@/lib/mock/posture-analysis';

interface PostureResultCardProps {
  postureType: PostureType;
  overallScore: number;
  confidence: number;
  frontAnalysis: {
    shoulderSymmetry: PostureMeasurement;
    pelvisSymmetry: PostureMeasurement;
    kneeAlignment: PostureMeasurement;
    footAngle: PostureMeasurement;
  };
  sideAnalysis: {
    headForwardAngle: PostureMeasurement;
    thoracicKyphosis: PostureMeasurement;
    lumbarLordosis: PostureMeasurement;
    pelvicTilt: PostureMeasurement;
  };
  className?: string;
}

// 상태에 따른 아이콘
function StatusBadge({ status }: { status: 'good' | 'warning' | 'alert' }) {
  if (status === 'good') {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3" />
        양호
      </span>
    );
  }
  if (status === 'warning') {
    return (
      <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
        <AlertTriangle className="w-3 h-3" />
        주의
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full">
      <AlertTriangle className="w-3 h-3" />
      개선 권장
    </span>
  );
}

// 측정값 미니 카드
function MeasurementMiniCard({ measurement }: { measurement: PostureMeasurement }) {
  return (
    <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
      <span className="text-xs text-foreground/80">{measurement.name}</span>
      <StatusBadge status={measurement.status} />
    </div>
  );
}

export default function PostureResultCard({
  postureType,
  overallScore,
  confidence,
  frontAnalysis,
  sideAnalysis,
  className = '',
}: PostureResultCardProps) {
  const typeInfo = POSTURE_TYPES[postureType];
  const isIdeal = postureType === 'ideal';

  // 문제가 있는 측정값 수 계산
  const allMeasurements = [
    frontAnalysis.shoulderSymmetry,
    frontAnalysis.pelvisSymmetry,
    frontAnalysis.kneeAlignment,
    frontAnalysis.footAngle,
    sideAnalysis.headForwardAngle,
    sideAnalysis.thoracicKyphosis,
    sideAnalysis.lumbarLordosis,
    sideAnalysis.pelvicTilt,
  ];
  const issueCount = allMeasurements.filter((m) => m.status !== 'good').length;

  return (
    <div
      className={`bg-card rounded-xl border overflow-hidden ${className}`}
      data-testid="posture-result-card"
    >
      {/* 헤더 */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <span className="text-2xl">{typeInfo.emoji}</span>
            </div>
            <div>
              <h3 className={`text-lg font-bold ${getPostureTypeColor(postureType)}`}>
                {typeInfo.label}
              </h3>
              <p className="text-xs text-muted-foreground">{typeInfo.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
              <span className="text-sm font-normal">/100</span>
            </p>
            <p className="text-xs text-muted-foreground">신뢰도 {confidence}%</p>
          </div>
        </div>
      </div>

      {/* 요약 */}
      <div className="p-4">
        {!isIdeal && issueCount > 0 && (
          <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              {issueCount}개 항목에서 개선 기회가 있어요
            </p>
          </div>
        )}

        {isIdeal && (
          <div className="mb-3 p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-xs text-green-700 dark:text-green-300">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              전반적으로 좋은 자세를 유지하고 있어요!
            </p>
          </div>
        )}

        {/* 주요 측정값 */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">주요 분석 항목</p>
          <div className="grid grid-cols-2 gap-2">
            <MeasurementMiniCard measurement={sideAnalysis.headForwardAngle} />
            <MeasurementMiniCard measurement={frontAnalysis.shoulderSymmetry} />
            <MeasurementMiniCard measurement={sideAnalysis.lumbarLordosis} />
            <MeasurementMiniCard measurement={frontAnalysis.pelvisSymmetry} />
          </div>
        </div>
      </div>
    </div>
  );
}
