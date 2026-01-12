/**
 * PostureSimulator 사용 예시
 *
 * SPEC 참조: SPEC-PHASE-L-M.md §3.1.3
 */

import { PostureSimulator } from '@/components/analysis/visual';
import type { PostureMeasurements } from '@/components/analysis/visual/PostureSimulator';

// 예시 1: 기본 사용 (가이드 표시)
export function PostureSimulatorBasicExample() {
  const measurements: PostureMeasurements = {
    headForwardAngle: 20,
    shoulderDifference: 2.5,
    pelvicTilt: 'anterior',
    spineCurvature: 'lordosis',
  };

  return (
    <PostureSimulator
      imageUrl="/posture-images/user-side-view.jpg"
      measurements={measurements}
      showGuides={true}
    />
  );
}

// 예시 2: 가이드 없이 이미지만 표시
export function PostureSimulatorNoGuidesExample() {
  const measurements: PostureMeasurements = {
    headForwardAngle: 5,
    shoulderDifference: 0.5,
    pelvicTilt: 'neutral',
    spineCurvature: 'normal',
  };

  return (
    <PostureSimulator
      imageUrl="/posture-images/ideal-posture.jpg"
      measurements={measurements}
      showGuides={false}
    />
  );
}

// 예시 3: 자세 분석 결과 페이지에서 사용
export function PostureAnalysisResultPage() {
  // API에서 받은 자세 분석 결과
  const analysisResult: {
    imageUrl: string;
    measurements: PostureMeasurements;
    postureType: string;
    overallScore: number;
  } = {
    imageUrl: '/uploads/posture-123.jpg',
    measurements: {
      headForwardAngle: 18,
      shoulderDifference: 1.8,
      pelvicTilt: 'anterior',
      spineCurvature: 'normal',
    },
    postureType: 'forward_head',
    overallScore: 65,
  };

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-2xl font-bold mb-6">자세 분석 결과</h1>

      {/* 자세 시뮬레이터 */}
      <div className="mb-8">
        <PostureSimulator
          imageUrl={analysisResult.imageUrl}
          measurements={analysisResult.measurements}
          showGuides={true}
          className="mb-4"
        />
      </div>

      {/* 분석 결과 상세 정보 */}
      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">측정값</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">머리 전방 각도</dt>
              <dd className="font-medium">{analysisResult.measurements.headForwardAngle}°</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">어깨 높이 차이</dt>
              <dd className="font-medium">{analysisResult.measurements.shoulderDifference}cm</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">골반 기울기</dt>
              <dd className="font-medium">
                {analysisResult.measurements.pelvicTilt === 'anterior'
                  ? '전방 경사'
                  : analysisResult.measurements.pelvicTilt === 'posterior'
                    ? '후방 경사'
                    : '중립'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">척추 곡률</dt>
              <dd className="font-medium">
                {analysisResult.measurements.spineCurvature === 'lordosis'
                  ? '과전만'
                  : analysisResult.measurements.spineCurvature === 'flatback'
                    ? '일자 허리'
                    : '정상'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

// 예시 4: 다양한 자세 문제 유형
export function PostureTypesExamples() {
  // 거북목
  const forwardHead: PostureMeasurements = {
    headForwardAngle: 25,
    shoulderDifference: 1.5,
    pelvicTilt: 'neutral',
    spineCurvature: 'normal',
  };

  // 굽은 어깨
  const roundedShoulders: PostureMeasurements = {
    headForwardAngle: 10,
    shoulderDifference: 3.0,
    pelvicTilt: 'neutral',
    spineCurvature: 'normal',
  };

  // 스웨이백
  const swayback: PostureMeasurements = {
    headForwardAngle: 12,
    shoulderDifference: 1.0,
    pelvicTilt: 'posterior',
    spineCurvature: 'flatback',
  };

  // 과전만
  const lordosis: PostureMeasurements = {
    headForwardAngle: 8,
    shoulderDifference: 0.8,
    pelvicTilt: 'anterior',
    spineCurvature: 'lordosis',
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h3 className="font-medium mb-3">거북목 (Forward Head)</h3>
        <PostureSimulator
          imageUrl="/posture-types/forward-head.jpg"
          measurements={forwardHead}
          showGuides={true}
        />
      </div>

      <div>
        <h3 className="font-medium mb-3">굽은 어깨 (Rounded Shoulders)</h3>
        <PostureSimulator
          imageUrl="/posture-types/rounded-shoulders.jpg"
          measurements={roundedShoulders}
          showGuides={true}
        />
      </div>

      <div>
        <h3 className="font-medium mb-3">스웨이백 (Swayback)</h3>
        <PostureSimulator
          imageUrl="/posture-types/swayback.jpg"
          measurements={swayback}
          showGuides={true}
        />
      </div>

      <div>
        <h3 className="font-medium mb-3">과전만 (Lordosis)</h3>
        <PostureSimulator
          imageUrl="/posture-types/lordosis.jpg"
          measurements={lordosis}
          showGuides={true}
        />
      </div>
    </div>
  );
}
