/**
 * Kakao SDK 지연 로딩 유틸리티
 *
 * @description Lighthouse LCP 최적화를 위해 Kakao SDK를 사용 시점에 동적 로드
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md
 *
 * 기존 방식: layout.tsx에서 script 태그로 즉시 로드 → LCP +500ms
 * 개선 방식: 공유 버튼 클릭 시 동적 로드 → 초기 로딩 영향 없음
 */

// Kakao SDK 전역 타입
declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: KakaoShareOptions) => void;
        createDefaultButton: (options: KakaoButtonOptions) => void;
      };
      Link: {
        sendDefault: (options: KakaoShareOptions) => void;
      };
    };
  }
}

// 공유 옵션 타입
export interface KakaoShareOptions {
  objectType: 'feed' | 'list' | 'location' | 'commerce' | 'text';
  content: {
    title: string;
    description: string;
    imageUrl: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons?: Array<{
    title: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  }>;
}

export interface KakaoButtonOptions {
  container: string;
  objectType: 'feed';
  content: KakaoShareOptions['content'];
  buttons?: KakaoShareOptions['buttons'];
}

// SDK 로드 상태
let sdkLoadPromise: Promise<void> | null = null;
let isInitialized = false;

/**
 * Kakao SDK 스크립트 동적 로드
 */
async function loadKakaoScript(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Kakao SDK는 브라우저에서만 사용 가능합니다.');
  }

  // 이미 로드된 경우 스킵
  if (window.Kakao) {
    return;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://developers.kakao.com/sdk/js/kakao.min.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Kakao SDK 로드 실패'));
    document.head.appendChild(script);
  });
}

/**
 * Kakao SDK 초기화
 * - 싱글톤 패턴으로 중복 초기화 방지
 * - 환경변수에서 App Key 로드
 */
export async function initKakaoSDK(): Promise<void> {
  // 이미 초기화된 경우 스킵
  if (isInitialized && window.Kakao?.isInitialized()) {
    return;
  }

  // 로드 중인 경우 기존 Promise 재사용
  if (sdkLoadPromise) {
    await sdkLoadPromise;
    return;
  }

  // 새로운 로드 시작
  sdkLoadPromise = (async () => {
    await loadKakaoScript();

    const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
    if (!kakaoAppKey) {
      console.warn('[Kakao] NEXT_PUBLIC_KAKAO_APP_KEY not found');
      return;
    }

    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(kakaoAppKey);
      isInitialized = true;
      console.log('[Kakao] SDK initialized');
    }
  })();

  await sdkLoadPromise;
}

/**
 * 카카오톡 공유하기
 *
 * @param options 공유 옵션
 * @example
 * await shareToKakao({
 *   objectType: 'feed',
 *   content: {
 *     title: '이룸 피부 분석 결과',
 *     description: '나의 피부 타입은 복합성 피부입니다.',
 *     imageUrl: 'https://yiroom.app/og-skin.png',
 *     link: { mobileWebUrl: 'https://yiroom.app', webUrl: 'https://yiroom.app' },
 *   },
 * });
 */
export async function shareToKakao(options: KakaoShareOptions): Promise<void> {
  await initKakaoSDK();

  if (!window.Kakao?.Share?.sendDefault) {
    throw new Error('Kakao Share API를 사용할 수 없습니다.');
  }

  window.Kakao.Share.sendDefault(options);
}

/**
 * 분석 결과 공유하기 (간편 API)
 *
 * @param title 제목
 * @param description 설명
 * @param imageUrl 이미지 URL
 * @param shareUrl 공유 URL (기본: 현재 페이지)
 */
export async function shareAnalysisResult(
  title: string,
  description: string,
  imageUrl: string,
  shareUrl?: string
): Promise<void> {
  const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yiroom.app';

  await shareToKakao({
    objectType: 'feed',
    content: {
      title,
      description,
      imageUrl: imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`,
      link: {
        mobileWebUrl: url,
        webUrl: url,
      },
    },
    buttons: [
      {
        title: '분석 결과 보기',
        link: {
          mobileWebUrl: url,
          webUrl: url,
        },
      },
    ],
  });
}

/**
 * 이룸 앱 공유하기 (간편 API)
 */
export async function shareApp(): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yiroom.app';

  await shareToKakao({
    objectType: 'feed',
    content: {
      title: '이룸 - 온전한 나는?',
      description: 'AI 퍼스널 컬러, 피부, 체형 분석으로 나만의 맞춤 뷰티 솔루션',
      imageUrl: `${baseUrl}/og-image.png`,
      link: {
        mobileWebUrl: baseUrl,
        webUrl: baseUrl,
      },
    },
    buttons: [
      {
        title: '무료로 분석하기',
        link: {
          mobileWebUrl: baseUrl,
          webUrl: baseUrl,
        },
      },
    ],
  });
}

/**
 * SDK 로드 상태 확인
 */
export function isKakaoSDKReady(): boolean {
  return isInitialized && !!window.Kakao?.isInitialized();
}
