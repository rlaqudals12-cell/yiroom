/**
 * 앱 스토어 리뷰 프롬프트
 * 적절한 시점에 리뷰 요청
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import { Platform, Linking } from 'react-native';

// 저장 키
const REVIEW_DATA_KEY = '@yiroom/review_data';

// 리뷰 데이터
interface ReviewData {
  // 앱 실행 횟수
  launchCount: number;
  // 마지막 리뷰 요청일
  lastPromptDate: string | null;
  // 리뷰 완료 여부
  hasReviewed: boolean;
  // 긍정적 액션 횟수 (운동 완료, 목표 달성 등)
  positiveActionCount: number;
  // 앱 첫 설치일
  installDate: string;
}

// 기본값
const DEFAULT_REVIEW_DATA: ReviewData = {
  launchCount: 0,
  lastPromptDate: null,
  hasReviewed: false,
  positiveActionCount: 0,
  installDate: new Date().toISOString(),
};

// 리뷰 요청 조건
const REVIEW_CONDITIONS = {
  // 최소 앱 실행 횟수
  minLaunchCount: 5,
  // 최소 긍정적 액션 횟수
  minPositiveActions: 3,
  // 리뷰 요청 간격 (일)
  promptIntervalDays: 60,
  // 설치 후 최소 일수
  minDaysAfterInstall: 3,
};

/**
 * 리뷰 데이터 로드
 */
async function loadReviewData(): Promise<ReviewData> {
  try {
    const data = await AsyncStorage.getItem(REVIEW_DATA_KEY);
    return data
      ? { ...DEFAULT_REVIEW_DATA, ...JSON.parse(data) }
      : DEFAULT_REVIEW_DATA;
  } catch {
    return DEFAULT_REVIEW_DATA;
  }
}

/**
 * 리뷰 데이터 저장
 */
async function saveReviewData(data: ReviewData): Promise<void> {
  await AsyncStorage.setItem(REVIEW_DATA_KEY, JSON.stringify(data));
}

/**
 * 앱 실행 기록 (앱 시작 시 호출)
 */
export async function trackAppLaunch(): Promise<void> {
  const data = await loadReviewData();
  data.launchCount += 1;
  await saveReviewData(data);
}

/**
 * 긍정적 액션 기록
 * 운동 완료, 목표 달성, 스트릭 갱신 등
 */
export async function trackPositiveAction(): Promise<void> {
  const data = await loadReviewData();
  data.positiveActionCount += 1;
  await saveReviewData(data);
}

/**
 * 리뷰 요청 조건 확인
 */
async function shouldRequestReview(): Promise<boolean> {
  const data = await loadReviewData();

  // 이미 리뷰함
  if (data.hasReviewed) return false;

  // 최소 실행 횟수
  if (data.launchCount < REVIEW_CONDITIONS.minLaunchCount) return false;

  // 최소 긍정적 액션
  if (data.positiveActionCount < REVIEW_CONDITIONS.minPositiveActions)
    return false;

  // 설치 후 최소 일수
  const installDate = new Date(data.installDate);
  const daysSinceInstall = Math.floor(
    (Date.now() - installDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceInstall < REVIEW_CONDITIONS.minDaysAfterInstall) return false;

  // 마지막 요청 후 간격
  if (data.lastPromptDate) {
    const lastPrompt = new Date(data.lastPromptDate);
    const daysSinceLastPrompt = Math.floor(
      (Date.now() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastPrompt < REVIEW_CONDITIONS.promptIntervalDays)
      return false;
  }

  return true;
}

/**
 * 리뷰 요청 시도
 * 조건 충족 시 네이티브 리뷰 다이얼로그 표시
 */
export async function requestReviewIfEligible(): Promise<boolean> {
  const shouldRequest = await shouldRequestReview();
  if (!shouldRequest) return false;

  const isAvailable = await StoreReview.isAvailableAsync();
  if (!isAvailable) return false;

  try {
    // 햅틱 피드백
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // 네이티브 리뷰 다이얼로그 표시
    await StoreReview.requestReview();

    // 요청 기록
    const data = await loadReviewData();
    data.lastPromptDate = new Date().toISOString();
    await saveReviewData(data);

    return true;
  } catch (error) {
    console.error('[Review] 리뷰 요청 실패:', error);
    return false;
  }
}

/**
 * 리뷰 완료 표시
 */
export async function markAsReviewed(): Promise<void> {
  const data = await loadReviewData();
  data.hasReviewed = true;
  await saveReviewData(data);
}

/**
 * 앱 스토어 페이지 열기
 * 리뷰 다이얼로그가 불가능할 때 사용
 */
export async function openStorePage(): Promise<void> {
  const storeUrl = Platform.select({
    ios: 'https://apps.apple.com/app/idXXXXXXXXXX', // TODO: 실제 앱 ID로 교체
    android: 'https://play.google.com/store/apps/details?id=com.yiroom.app',
  });

  if (storeUrl) {
    await Linking.openURL(storeUrl);
  }
}

/**
 * 피드백/문의 이메일 열기
 */
export async function openFeedbackEmail(): Promise<void> {
  const email = 'support@yiroom.com';
  const subject = encodeURIComponent('이룸 앱 피드백');
  const body = encodeURIComponent(`
앱 버전:
기기: ${Platform.OS} ${Platform.Version}
---
피드백 내용:

  `);

  const mailUrl = `mailto:${email}?subject=${subject}&body=${body}`;
  await Linking.openURL(mailUrl);
}
