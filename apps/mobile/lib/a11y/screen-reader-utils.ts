/**
 * 스크린리더 도메인 래퍼
 *
 * VoiceOver/TalkBack 도메인별 알림 유틸
 */
import { AccessibilityInfo } from 'react-native';

/**
 * 분석 완료 알림 (분석 결과 화면에서 사용)
 */
export function announceAnalysisComplete(
  moduleName: string,
  confidence?: number
): void {
  const confidenceText =
    confidence != null ? `, 신뢰도 ${Math.round(confidence)}%` : '';
  AccessibilityInfo.announceForAccessibility(
    `${moduleName} 분석이 완료되었습니다${confidenceText}. 결과를 확인해주세요.`
  );
}

/**
 * 분석 진행 알림
 */
export function announceAnalysisProgress(percentage: number): void {
  AccessibilityInfo.announceForAccessibility(
    `분석 진행 중, ${Math.round(percentage)}% 완료`
  );
}

/**
 * 에러 알림
 */
export function announceError(message: string): void {
  AccessibilityInfo.announceForAccessibility(
    `오류가 발생했습니다. ${message}`
  );
}

/**
 * 뱃지/업적 해금 알림
 */
export function announceAchievement(title: string): void {
  AccessibilityInfo.announceForAccessibility(
    `새 업적을 달성했습니다: ${title}`
  );
}

/**
 * 목표 달성 알림
 */
export function announceGoalComplete(goalName: string): void {
  AccessibilityInfo.announceForAccessibility(
    `${goalName} 목표를 달성했습니다!`
  );
}

/**
 * 데이터 로딩 완료 알림
 */
export function announceDataLoaded(itemCount: number, itemType: string): void {
  AccessibilityInfo.announceForAccessibility(
    `${itemType} ${itemCount}개를 불러왔습니다.`
  );
}
