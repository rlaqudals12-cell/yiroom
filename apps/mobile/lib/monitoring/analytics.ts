/**
 * 앱 분석 (Analytics)
 * 사용자 행동 추적 및 이벤트 로깅
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AnalyticsEventType,
  AnalyticsEventProperties,
  UserProperties,
} from './types';

// 개발 모드 여부
const IS_DEV = __DEV__;

// 이벤트 큐 저장 키
const ANALYTICS_QUEUE_KEY = '@yiroom/analytics_queue';

// 이벤트 큐 (오프라인 지원)
interface QueuedEvent {
  type: AnalyticsEventType;
  properties?: AnalyticsEventProperties;
  timestamp: string;
}

/**
 * Analytics 초기화
 */
export async function initAnalytics(): Promise<void> {
  if (IS_DEV) {
    console.log('[Analytics] 개발 모드 - 콘솔 로깅만 활성화');
    return;
  }

  try {
    // 저장된 이벤트 전송 시도
    await flushEventQueue();
    console.log('[Analytics] 초기화 완료');
  } catch (error) {
    console.error('[Analytics] 초기화 실패:', error);
  }
}

/**
 * 이벤트 로깅
 */
export async function logEvent(
  eventType: AnalyticsEventType,
  properties?: AnalyticsEventProperties
): Promise<void> {
  const timestamp = new Date().toISOString();

  // 개발 모드: 콘솔 로깅
  if (IS_DEV) {
    console.log(`[Analytics] ${eventType}`, properties);
    return;
  }

  try {
    // 이벤트 큐에 추가
    await addToQueue({ type: eventType, properties, timestamp });

    // 바로 전송 시도
    await sendEvent(eventType, properties, timestamp);
  } catch (error) {
    console.error('[Analytics] 이벤트 로깅 실패:', error);
  }
}

/**
 * 화면 조회 로깅
 */
export async function logScreenView(screenName: string): Promise<void> {
  await logEvent('screen_view', { screen_name: screenName });
}

/**
 * 운동 시작 로깅
 */
export async function logWorkoutStarted(workoutId: string): Promise<void> {
  await logEvent('workout_started', { workout_id: workoutId });
}

/**
 * 운동 완료 로깅
 */
export async function logWorkoutCompleted(
  workoutId: string,
  duration: number,
  caloriesBurned: number
): Promise<void> {
  await logEvent('workout_completed', {
    workout_id: workoutId,
    workout_duration: duration,
    calories_burned: caloriesBurned,
  });
}

/**
 * 식사 기록 로깅
 */
export async function logMealRecorded(
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  calories: number
): Promise<void> {
  await logEvent('meal_recorded', {
    meal_type: mealType,
    calories_burned: calories,
  });
}

/**
 * 물 섭취 로깅
 */
export async function logWaterAdded(amount: number): Promise<void> {
  await logEvent('water_added', { water_amount: amount });
}

/**
 * 제품 조회 로깅
 */
export async function logProductViewed(
  productId: string,
  category: string
): Promise<void> {
  await logEvent('product_viewed', {
    product_id: productId,
    product_category: category,
  });
}

/**
 * 분석 완료 로깅
 */
export async function logAnalysisCompleted(
  analysisType: 'personal_color' | 'skin' | 'body'
): Promise<void> {
  await logEvent('analysis_completed', { analysis_type: analysisType });
}

/**
 * 사용자 속성 설정
 */
export async function setUserProperties(
  properties: UserProperties
): Promise<void> {
  if (IS_DEV) {
    console.log('[Analytics] 사용자 속성:', properties);
    return;
  }

  try {
    // 서버에 사용자 속성 전송
    await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/analytics/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(properties),
    });
  } catch (error) {
    console.error('[Analytics] 사용자 속성 설정 실패:', error);
  }
}

/**
 * 사용자 ID 설정
 */
export async function setUserId(userId: string | null): Promise<void> {
  if (IS_DEV) {
    console.log('[Analytics] 사용자 ID:', userId);
    return;
  }

  // 서버/외부 Analytics에 사용자 ID 연결
  if (userId) {
    await setUserProperties({ user_id: userId });
  }
}

// ---- 내부 유틸리티 ----

/**
 * 이벤트 큐에 추가
 */
async function addToQueue(event: QueuedEvent): Promise<void> {
  try {
    const queueData = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
    const queue: QueuedEvent[] = queueData ? JSON.parse(queueData) : [];

    // 최대 100개 이벤트 유지
    if (queue.length >= 100) {
      queue.shift();
    }

    queue.push(event);
    await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[Analytics] 큐 추가 실패:', error);
  }
}

/**
 * 큐에서 이벤트 제거
 */
async function removeFromQueue(timestamp: string): Promise<void> {
  try {
    const queueData = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
    if (!queueData) return;

    const queue: QueuedEvent[] = JSON.parse(queueData);
    const filtered = queue.filter((e) => e.timestamp !== timestamp);
    await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[Analytics] 큐 제거 실패:', error);
  }
}

/**
 * 이벤트 전송
 */
async function sendEvent(
  eventType: AnalyticsEventType,
  properties?: AnalyticsEventProperties,
  timestamp?: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/analytics/event`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          properties,
          timestamp: timestamp || new Date().toISOString(),
        }),
      }
    );

    if (response.ok && timestamp) {
      await removeFromQueue(timestamp);
    }

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 이벤트 큐 플러시
 */
async function flushEventQueue(): Promise<void> {
  try {
    const queueData = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
    if (!queueData) return;

    const queue: QueuedEvent[] = JSON.parse(queueData);

    for (const event of queue) {
      await sendEvent(event.type, event.properties, event.timestamp);
    }
  } catch (error) {
    console.error('[Analytics] 큐 플러시 실패:', error);
  }
}
