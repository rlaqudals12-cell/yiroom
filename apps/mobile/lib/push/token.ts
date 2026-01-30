/**
 * 푸시 토큰 관리
 * Expo Push Token 획득 및 서버 등록
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { PushTokenInfo } from './types';
import { pushLogger } from '../utils/logger';

// 저장 키
const PUSH_TOKEN_KEY = '@yiroom/push_token';
const DEVICE_ID_KEY = '@yiroom/device_id';

/**
 * 디바이스 ID 생성/조회
 */
async function getDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    // UUID 생성
    deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

/**
 * Expo 푸시 토큰 획득
 */
export async function getExpoPushToken(): Promise<string | null> {
  // 시뮬레이터/에뮬레이터 체크
  const isDevice = Constants.isDevice ?? true;
  if (!isDevice) {
    pushLogger.warn('푸시 알림은 물리적 디바이스에서만 동작합니다.');
    return null;
  }

  try {
    // 권한 확인
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      pushLogger.warn('알림 권한이 거부되었습니다.');
      return null;
    }

    // 프로젝트 ID 가져오기
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    // Expo 푸시 토큰 획득
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    pushLogger.info('Expo 푸시 토큰:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    pushLogger.error('토큰 획득 실패:', error);
    return null;
  }
}

/**
 * 푸시 토큰 정보 저장
 */
export async function savePushToken(token: string): Promise<PushTokenInfo> {
  const deviceId = await getDeviceId();
  const now = new Date().toISOString();

  const tokenInfo: PushTokenInfo = {
    token,
    platform: Platform.OS as 'ios' | 'android',
    deviceId,
    createdAt: now,
    updatedAt: now,
  };

  await AsyncStorage.setItem(PUSH_TOKEN_KEY, JSON.stringify(tokenInfo));
  return tokenInfo;
}

/**
 * 저장된 푸시 토큰 조회
 */
export async function getSavedPushToken(): Promise<PushTokenInfo | null> {
  try {
    const data = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * 푸시 토큰 삭제
 */
export async function removePushToken(): Promise<void> {
  await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
}

/**
 * 서버에 푸시 토큰 등록
 */
export async function registerPushTokenWithServer(
  token: string,
  userId: string
): Promise<boolean> {
  const deviceId = await getDeviceId();

  try {
    // API 엔드포인트로 토큰 전송
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/push/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          userId,
          deviceId,
          platform: Platform.OS,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`서버 응답 오류: ${response.status}`);
    }

    pushLogger.info('서버에 토큰 등록 완료');
    return true;
  } catch (error) {
    pushLogger.error('서버 등록 실패:', error);
    return false;
  }
}

/**
 * 서버에서 푸시 토큰 제거
 */
export async function unregisterPushTokenFromServer(
  userId: string
): Promise<boolean> {
  const deviceId = await getDeviceId();

  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/push/unregister`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          deviceId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`서버 응답 오류: ${response.status}`);
    }

    pushLogger.info('서버에서 토큰 제거 완료');
    return true;
  } catch (error) {
    pushLogger.error('서버 제거 실패:', error);
    return false;
  }
}

/**
 * 푸시 알림 초기화
 * 앱 시작 시 호출
 */
export async function initializePushNotifications(
  userId?: string
): Promise<string | null> {
  // Android 채널 설정
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '기본 알림',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8b5cf6',
    });

    await Notifications.setNotificationChannelAsync('workout', {
      name: '운동 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ef4444',
    });

    await Notifications.setNotificationChannelAsync('nutrition', {
      name: '영양 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10b981',
    });

    await Notifications.setNotificationChannelAsync('social', {
      name: '소셜 알림',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#3b82f6',
    });
  }

  // 푸시 토큰 획득
  const token = await getExpoPushToken();

  if (token) {
    // 로컬 저장
    await savePushToken(token);

    // 서버 등록 (userId가 있는 경우)
    if (userId) {
      await registerPushTokenWithServer(token, userId);
    }
  }

  return token;
}
