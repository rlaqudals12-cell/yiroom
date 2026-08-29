import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

type PluginOptions = Record<string, boolean | string>;
type ExpoPlugin = string | [string, PluginOptions];

interface AppConfig {
  expo: {
    android: {
      blockedPermissions?: string[];
    };
    plugins: ExpoPlugin[];
  };
}

interface EasConfig {
  build: {
    preview: { environment?: string; env?: Record<string, string> };
    production: { environment?: string; env?: Record<string, string> };
  };
}

const MOBILE_ROOT = process.cwd();

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function pluginOptions(config: AppConfig, name: string): PluginOptions | undefined {
  const plugin = config.expo.plugins.find(
    (candidate): candidate is [string, PluginOptions] =>
      Array.isArray(candidate) && candidate[0] === name
  );
  return plugin?.[1];
}

describe('Android 최소 권한 계약', () => {
  const config = readJson<AppConfig>(join(MOBILE_ROOT, 'app.json'));

  it('분석에 쓰지 않는 위험·구형 권한을 네이티브 매니페스트에서 차단한다', () => {
    expect(config.expo.android.blockedPermissions).toEqual(
      expect.arrayContaining([
        'android.permission.RECORD_AUDIO',
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ])
    );
  });

  it('카메라와 이미지 선택 플러그인이 마이크 권한을 추가하지 않는다', () => {
    expect(pluginOptions(config, 'expo-camera')?.recordAudioAndroid).toBe(false);
    expect(pluginOptions(config, 'expo-image-picker')?.microphonePermission).toBe(false);
  });
});

describe('Android 알림 아이콘 계약', () => {
  const config = readJson<AppConfig>(join(MOBILE_ROOT, 'app.json'));

  it('expo-notifications가 존재하는 PNG 아이콘과 브랜드 알림 색을 사용한다', () => {
    const options = pluginOptions(config, 'expo-notifications');
    const relativeIcon = options?.icon;

    expect(relativeIcon).toBe('./assets/notification-icon.png');
    expect(options?.color).toBe('#EC4899');
    expect(typeof relativeIcon).toBe('string');

    const iconPath = resolve(MOBILE_ROOT, String(relativeIcon));
    expect(existsSync(iconPath)).toBe(true);
    expect(readFileSync(iconPath).subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
  });
});

describe('EAS 공개 런타임 구성 자리 계약', () => {
  const easPath = join(MOBILE_ROOT, 'eas.json');
  const raw = readFileSync(easPath, 'utf8');
  const config = JSON.parse(raw) as EasConfig;

  it('preview와 production에 Sentry 공개 DSN 자리와 안내가 있다', () => {
    expect(config.build.preview.environment).toBe('preview');
    expect(config.build.production.environment).toBe('production');
    expect(config.build.preview.env).not.toHaveProperty('EXPO_PUBLIC_SENTRY_DSN');
    expect(config.build.production.env).not.toHaveProperty('EXPO_PUBLIC_SENTRY_DSN');
    expect(config.build.production.env).not.toHaveProperty('EXPO_PUBLIC_YIROOM_API_URL');
    expect(config.build.preview.env?._YIROOM_SENTRY_DSN_NOTE).toContain(
      'EXPO_PUBLIC_SENTRY_DSN'
    );
    expect(config.build.production.env?._YIROOM_SENTRY_DSN_NOTE).toContain(
      'EXPO_PUBLIC_SENTRY_DSN'
    );
  });

  it('production API origin 자리는 비어 있고 안전한 폴백 동작을 설명한다', () => {
    expect(config.build.production.env?._YIROOM_API_URL_NOTE).toContain(
      'EXPO_PUBLIC_YIROOM_API_URL'
    );
    expect(config.build.production.env?._YIROOM_API_URL_NOTE).toContain(
      'canonical production fallback'
    );
  });

  it('Sentry 업로드 인증 비밀은 저장소에 직접 넣지 않는다', () => {
    expect(raw).not.toMatch(/"SENTRY_AUTH_TOKEN"\s*:/);
  });
});

describe('Android 빌드 산출물 경계', () => {
  it('저장소 루트가 APK 산출물을 추적하지 않는다', () => {
    const gitignore = readFileSync(join(MOBILE_ROOT, '.gitignore'), 'utf8');
    expect(gitignore.split(/\r?\n/)).toContain('*.apk');
  });
});
