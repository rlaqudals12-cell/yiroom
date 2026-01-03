/**
 * MediaPipe Face Mesh 동적 로더
 * @description CDN에서 MediaPipe를 동적으로 로드 (3MB 최적화)
 */

// MediaPipe CDN URL
const MEDIAPIPE_CDN_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh';
const MEDIAPIPE_VERSION = '0.4.1633559619';

// MediaPipe 타입 정의 (런타임 로드)
interface MediaPipeFaceMesh {
  setOptions: (options: MediaPipeFaceMeshOptions) => void;
  onResults: (callback: (results: MediaPipeFaceMeshResults) => void) => void;
  send: (input: {
    image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;
  }) => Promise<void>;
  close: () => void;
}

interface MediaPipeFaceMeshOptions {
  maxNumFaces: number;
  refineLandmarks: boolean;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
}

interface MediaPipeFaceMeshResults {
  multiFaceLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
  image: HTMLCanvasElement;
}

// 전역 캐시
let faceMeshInstance: MediaPipeFaceMesh | null = null;
let loadPromise: Promise<MediaPipeFaceMesh> | null = null;

/**
 * MediaPipe Face Mesh 스크립트 로드
 */
async function loadMediaPipeScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우
    if (typeof window !== 'undefined' && (window as Window & { FaceMesh?: unknown }).FaceMesh) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `${MEDIAPIPE_CDN_BASE}@${MEDIAPIPE_VERSION}/face_mesh.js`;
    script.crossOrigin = 'anonymous';

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('[MediaPipe] CDN 로드 실패'));

    document.head.appendChild(script);
  });
}

/**
 * MediaPipe Face Mesh 초기화
 * - 최초 로드 시 ~3MB 다운로드
 * - 캐싱으로 재방문 시 빠른 로드
 */
export async function initFaceMesh(
  options?: Partial<MediaPipeFaceMeshOptions>
): Promise<MediaPipeFaceMesh> {
  // SSR 환경 체크
  if (typeof window === 'undefined') {
    throw new Error('[MediaPipe] 브라우저 환경에서만 사용 가능');
  }

  // 이미 인스턴스가 있으면 반환
  if (faceMeshInstance) {
    return faceMeshInstance;
  }

  // 로드 중이면 기존 Promise 반환
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      // 스크립트 로드
      await loadMediaPipeScript();

      // FaceMesh 클래스 접근
      const FaceMeshClass = (
        window as unknown as {
          FaceMesh?: new (config: { locateFile: (file: string) => string }) => MediaPipeFaceMesh;
        }
      ).FaceMesh;

      if (!FaceMeshClass) {
        throw new Error('[MediaPipe] FaceMesh 클래스를 찾을 수 없음');
      }

      // 인스턴스 생성
      const faceMesh = new FaceMeshClass({
        locateFile: (file: string) => `${MEDIAPIPE_CDN_BASE}@${MEDIAPIPE_VERSION}/${file}`,
      });

      // 옵션 설정
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        ...options,
      });

      faceMeshInstance = faceMesh;
      console.log('[MediaPipe] Face Mesh 초기화 완료');

      return faceMesh;
    } catch (error) {
      loadPromise = null;
      console.error('[MediaPipe] 초기화 실패:', error);
      throw error;
    }
  })();

  return loadPromise;
}

/**
 * MediaPipe 인스턴스 해제
 */
export function closeFaceMesh(): void {
  if (faceMeshInstance) {
    try {
      faceMeshInstance.close();
    } catch {
      // 이미 닫힌 경우 무시
    }
    faceMeshInstance = null;
    loadPromise = null;
    console.log('[MediaPipe] Face Mesh 해제 완료');
  }
}

/**
 * MediaPipe 로드 상태 확인
 */
export function isFaceMeshLoaded(): boolean {
  return faceMeshInstance !== null;
}

/**
 * MediaPipe 프리로드 (백그라운드 로드)
 * - 사용자 상호작용 전에 미리 로드
 */
export function preloadFaceMesh(): void {
  if (typeof window === 'undefined') return;

  // requestIdleCallback으로 백그라운드 로드
  const load = () => {
    initFaceMesh().catch((error) => {
      console.warn('[MediaPipe] 프리로드 실패 (무시 가능):', error);
    });
  };

  if ('requestIdleCallback' in window) {
    (
      window as Window & { requestIdleCallback: (callback: () => void) => void }
    ).requestIdleCallback(load);
  } else {
    setTimeout(load, 1000);
  }
}

/**
 * MediaPipe CDN 상태 확인
 * - 네트워크 연결 테스트
 */
export async function checkMediaPipeCDN(): Promise<boolean> {
  try {
    const response = await fetch(`${MEDIAPIPE_CDN_BASE}@${MEDIAPIPE_VERSION}/face_mesh.js`, {
      method: 'HEAD',
      cache: 'no-cache',
    });
    return response.ok;
  } catch {
    return false;
  }
}

// 타입 Export
export type { MediaPipeFaceMesh, MediaPipeFaceMeshOptions, MediaPipeFaceMeshResults };
