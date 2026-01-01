/**
 * 네트워크 상태 모니터링 훅
 * 온라인/오프라인 상태 감지 및 자동 재연결
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { NetworkStatus } from './types';

interface UseNetworkStatusReturn {
  // 현재 네트워크 상태
  status: NetworkStatus;
  // 인터넷 연결 여부
  isConnected: boolean;
  // 연결 타입 (wifi, cellular 등)
  connectionType: string | null;
  // 수동 새로고침
  refresh: () => Promise<void>;
}

/**
 * 네트워크 상태 모니터링 훅
 */
export function useNetworkStatus(): UseNetworkStatusReturn {
  const [status, setStatus] = useState<NetworkStatus>('unknown');
  const [connectionType, setConnectionType] = useState<string | null>(null);

  // 네트워크 상태 업데이트
  const updateNetworkStatus = useCallback((state: NetInfoState) => {
    const newStatus: NetworkStatus = state.isConnected
      ? state.isInternetReachable === false
        ? 'offline'
        : 'online'
      : 'offline';

    setStatus(newStatus);
    setConnectionType(state.type);

    console.log('[Network] Status updated:', {
      status: newStatus,
      type: state.type,
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
    });
  }, []);

  // 수동 새로고침
  const refresh = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      updateNetworkStatus(state);
    } catch (error) {
      console.error('[Network] Failed to refresh status:', error);
      setStatus('unknown');
    }
  }, [updateNetworkStatus]);

  // 네트워크 상태 구독
  useEffect(() => {
    let subscription: NetInfoSubscription | null = null;

    const setup = async () => {
      // 초기 상태 조회
      const state = await NetInfo.fetch();
      updateNetworkStatus(state);

      // 변경 사항 구독
      subscription = NetInfo.addEventListener(updateNetworkStatus);
    };

    setup();

    return () => {
      subscription?.();
    };
  }, [updateNetworkStatus]);

  return {
    status,
    isConnected: status === 'online',
    connectionType,
    refresh,
  };
}
