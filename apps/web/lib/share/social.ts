/**
 * 소셜 미디어 공유 유틸리티
 * - X (Twitter), 카카오톡, 링크 복사, Instagram 이미지 저장
 */

export interface ShareContent {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  hashtags?: string[];
}

/**
 * X (Twitter)에 공유
 * 새 창에서 트윗 작성 화면 열기
 */
export function shareToX(content: ShareContent): void {
  const { title, url, hashtags = [] } = content;
  const hashtagString = hashtags.map((h) => h.replace('#', '')).join(',');

  const shareUrl = new URL('https://twitter.com/intent/tweet');
  shareUrl.searchParams.set('text', title);
  shareUrl.searchParams.set('url', url);
  if (hashtagString) {
    shareUrl.searchParams.set('hashtags', hashtagString);
  }

  window.open(shareUrl.toString(), '_blank', 'width=550,height=420');
}

/**
 * 카카오톡 공유
 * Kakao SDK 필요 (window.Kakao)
 */
export async function shareToKakao(content: ShareContent): Promise<boolean> {
  const { Kakao } = window as unknown as { Kakao: KakaoSDK };

  if (!Kakao) {
    console.warn('[Share] Kakao SDK not loaded');
    return false;
  }

  // SDK 초기화 (이미 초기화된 경우 스킵)
  if (!Kakao.isInitialized()) {
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!kakaoKey) {
      console.warn('[Share] Kakao JS Key not configured');
      return false;
    }
    Kakao.init(kakaoKey);
  }

  try {
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: content.title,
        description: content.description,
        imageUrl: content.imageUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/og-image.png`,
        link: {
          mobileWebUrl: content.url,
          webUrl: content.url,
        },
      },
      buttons: [
        {
          title: '자세히 보기',
          link: {
            mobileWebUrl: content.url,
            webUrl: content.url,
          },
        },
      ],
    });
    return true;
  } catch (error) {
    console.error('[Share] Kakao share failed:', error);
    return false;
  }
}

/**
 * 카카오 SDK 초기화 여부 확인
 */
export function isKakaoReady(): boolean {
  const { Kakao } = window as unknown as { Kakao: KakaoSDK };
  return !!Kakao?.isInitialized?.();
}

/**
 * 이미지 다운로드 (Instagram 등 이미지 필수 플랫폼용)
 * @param imageUrl 이미지 URL
 * @param filename 파일명
 */
export async function downloadShareImage(imageUrl: string, filename: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.png`;
    link.click();

    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('[Share] Image download failed:', error);
    return false;
  }
}

/**
 * 기본 공유 해시태그
 */
export const DEFAULT_HASHTAGS = ['이룸', 'Yiroom', '뷰티', '스킨케어'];

/**
 * 분석 결과 타입별 해시태그
 */
export function getHashtagsForResult(
  resultType: 'personal-color' | 'skin' | 'body' | 'workout' | 'nutrition'
): string[] {
  const typeHashtags: Record<string, string[]> = {
    'personal-color': ['퍼스널컬러', '컬러진단', '웜톤쿨톤'],
    skin: ['피부분석', '스킨케어', '피부타입'],
    body: ['체형분석', '바디타입', '스타일링'],
    workout: ['운동', '홈트', '피트니스'],
    nutrition: ['영양', '식단', '다이어트'],
  };

  return [...DEFAULT_HASHTAGS, ...(typeHashtags[resultType] || [])];
}

// Kakao SDK 타입 정의
interface KakaoSDK {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share: {
    sendDefault: (options: KakaoShareOptions) => void;
  };
}

interface KakaoShareOptions {
  objectType: 'feed';
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
