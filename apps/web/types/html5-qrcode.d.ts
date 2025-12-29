/**
 * html5-qrcode 라이브러리 타입 선언
 * 바코드 스캐너에서 사용하는 최소한의 타입만 선언
 */

declare module 'html5-qrcode' {
  export interface Html5QrcodeConfig {
    fps?: number;
    qrbox?: { width: number; height: number } | number;
    aspectRatio?: number;
    disableFlip?: boolean;
    formatsToSupport?: number[];
  }

  export interface CameraDevice {
    id: string;
    label: string;
  }

  export interface TorchFeature {
    isSupported(): boolean;
    apply(enabled: boolean): Promise<void>;
  }

  export interface CameraCapabilities {
    torchFeature(): TorchFeature;
  }

  export class Html5Qrcode {
    constructor(elementId: string);

    start(
      cameraIdOrConfig: string | { facingMode: string },
      config: Html5QrcodeConfig,
      qrCodeSuccessCallback: (decodedText: string, decodedResult: unknown) => void,
      qrCodeErrorCallback?: (errorMessage: string, error: unknown) => void
    ): Promise<void>;

    stop(): Promise<void>;

    clear(): void;

    getRunningTrackCameraCapabilities(): CameraCapabilities;

    applyVideoConstraints(constraints: {
      advanced: Array<{ torch?: boolean; [key: string]: unknown }>;
    }): Promise<void>;

    static getCameras(): Promise<CameraDevice[]>;
  }

  export class Html5QrcodeScanner {
    constructor(
      elementId: string,
      config: Html5QrcodeConfig,
      verbose?: boolean
    );

    render(
      qrCodeSuccessCallback: (decodedText: string, decodedResult: unknown) => void,
      qrCodeErrorCallback?: (errorMessage: string, error: unknown) => void
    ): void;

    clear(): Promise<void>;
  }
}
