import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface StoreMetadata {
  app: { version: string };
  ios: {
    ageRating: string;
    minimumUserAge: number;
    privacyPolicyUrl: string;
    supportUrl: string;
    marketingUrl: string;
  };
  android: { contentRating: string; minimumUserAge: number; privacyPolicyUrl: string };
  localization: {
    ko: { description: string; keywords: string; whatsNew: string };
    en: { description: string; keywords: string; whatsNew: string };
  };
  screenshots: { required: { iphone6_5: { scenes: string[] } } };
  privacyNutritionLabels: {
    dataCollected: {
      type: string;
      linkedToUser: boolean;
      note?: string;
    }[];
  };
  reviewNotes: { notes: string };
}

interface AppConfig {
  expo: {
    ios: {
      infoPlist: {
        NSCameraUsageDescription: string;
        NSPhotoLibraryUsageDescription: string;
        NSPhotoLibraryAddUsageDescription: string;
      };
    };
    plugins: (string | [string, Record<string, string>])[];
  };
}

interface SubmissionMetadata {
  app_name: { ko: string; en: string };
  subtitle: { ko: string; en: string };
  description: { ko: string; en: string };
  keywords: { ko: string[]; en: string[] };
  privacy_url: string;
  support_url: string;
  marketing_url: string;
  screenshots: Record<string, string[]>;
  age_rating: string;
  release_notes: { ko: string; en: string };
}

function readStoreMetadata(): StoreMetadata {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'store-metadata.json'), 'utf8')
  ) as StoreMetadata;
}

function readAppConfig(): AppConfig {
  return JSON.parse(readFileSync(join(process.cwd(), 'app.json'), 'utf8')) as AppConfig;
}

function readSubmissionMetadata(): SubmissionMetadata {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'store', 'metadata.json'), 'utf8')
  ) as SubmissionMetadata;
}

describe('store metadata privacy contract', () => {
  it('분석이 서버와 Google AI에서 처리되고 선택 저장됨을 한국어·영어로 고지한다', () => {
    const metadata = readStoreMetadata();

    expect(metadata.localization.ko.description).toContain('이룸 서버와 Google AI에 전송');
    expect(metadata.localization.ko.description).toContain('저장에 동의한 경우에만 최대 1년');
    expect(metadata.localization.en.description).toContain('Yiroom servers and Google AI');
    expect(metadata.localization.en.description).toContain('only when you consent');
  });

  it('온디바이스 전용·서버 미저장 과장과 즉시 삭제 허위 라벨을 금지한다', () => {
    const metadata = readStoreMetadata();
    const publicCopy = [
      metadata.localization.ko.description,
      metadata.localization.en.description,
      metadata.reviewNotes.notes,
    ].join('\n');
    const photoEntry = metadata.privacyNutritionLabels.dataCollected.find(
      (entry) => entry.type === 'User Content'
    );

    expect(publicCopy).not.toMatch(/모든 분석은.*기기|All analysis is processed.*device/i);
    expect(publicCopy).not.toMatch(/서버에 저장되지|not stored on (?:the )?server/i);
    expect(photoEntry).toMatchObject({ linkedToUser: true });
    expect(photoEntry?.note).toContain('별도 저장 동의 시에만 최대 1년');
    expect(photoEntry?.note).not.toContain('즉시 삭제');
  });

  it('만 14세 가입 계약과 생년월일 수집을 스토어 메타데이터에 명시한다', () => {
    const metadata = readStoreMetadata();
    const birthdateEntry = metadata.privacyNutritionLabels.dataCollected.find(
      (entry) => entry.type === 'Other Data'
    );

    expect(metadata.ios.minimumUserAge).toBe(14);
    expect(metadata.android.minimumUserAge).toBe(14);
    expect(metadata.localization.ko.description).toContain('만 14세 이상');
    expect(birthdateEntry).toMatchObject({ linkedToUser: true });
  });

  it('출시 빌드에서 숨긴 운동·영양·구강·리더보드 기능을 약속하지 않는다', () => {
    const metadata = readStoreMetadata();
    const publicCopy = [
      metadata.localization.ko.description,
      metadata.localization.ko.keywords,
      metadata.localization.ko.whatsNew,
      ...metadata.screenshots.required.iphone6_5.scenes,
    ].join('\n');

    expect(publicCopy).not.toMatch(/운동|영양|음식 분석|구강|리더보드|주간 리포트/);
    expect(publicCopy).toMatch(/퍼스널컬러|퍼스널 컬러/);
    expect(publicCopy).toContain('헤어');
    expect(publicCopy).toContain('메이크업');
  });

  it('실제 1.0.0 빌드와 현행 웹의 법적·지원 경로를 사용한다', () => {
    const metadata = readStoreMetadata();

    expect(metadata.app.version).toBe('1.0.0');
    expect(metadata.ios.privacyPolicyUrl).toBe('https://yiroom.vercel.app/privacy');
    expect(metadata.android.privacyPolicyUrl).toBe('https://yiroom.vercel.app/privacy');
    expect(metadata.ios.supportUrl).toBe('https://yiroom.vercel.app/help');
    expect(metadata.ios.marketingUrl).toBe('https://yiroom.vercel.app');
  });

  it('카메라·사진 권한 고지는 공개 뷰티 기능만 설명한다', () => {
    const config = readAppConfig();
    const { infoPlist } = config.expo.ios;
    const expoCamera = config.expo.plugins.find(
      (plugin): plugin is [string, Record<string, string>] =>
        Array.isArray(plugin) && plugin[0] === 'expo-camera'
    );
    const expoImagePicker = config.expo.plugins.find(
      (plugin): plugin is [string, Record<string, string>] =>
        Array.isArray(plugin) && plugin[0] === 'expo-image-picker'
    );
    const permissionCopy = [
      infoPlist.NSCameraUsageDescription,
      infoPlist.NSPhotoLibraryUsageDescription,
      infoPlist.NSPhotoLibraryAddUsageDescription,
      expoCamera?.[1].cameraPermission ?? '',
      expoImagePicker?.[1].photosPermission ?? '',
    ].join('\n');

    expect(permissionCopy).not.toMatch(/음식|식단|영양|운동|웰니스/);
    expect(infoPlist.NSCameraUsageDescription).toMatch(/퍼스널컬러.*피부.*체형.*헤어.*메이크업/);
    expect(infoPlist.NSPhotoLibraryUsageDescription).toMatch(
      /퍼스널컬러.*피부.*체형.*헤어.*메이크업.*AI 아바타/
    );
    expect(expoCamera?.[1].cameraPermission).toBe(infoPlist.NSCameraUsageDescription);
    expect(expoImagePicker?.[1].photosPermission).toBe(infoPlist.NSPhotoLibraryUsageDescription);
  });

  it('별도 제출 산출물도 5축·만 14세·현행 URL 계약과 일치한다', () => {
    const metadata = readSubmissionMetadata();
    const publicCopy = [
      metadata.app_name.ko,
      metadata.app_name.en,
      metadata.subtitle.ko,
      metadata.subtitle.en,
      metadata.description.ko,
      metadata.description.en,
      ...metadata.keywords.ko,
      ...metadata.keywords.en,
      ...Object.values(metadata.screenshots).flat(),
      metadata.release_notes.ko,
      metadata.release_notes.en,
    ].join('\n');

    expect(metadata.age_rating).toBe('14+');
    expect(metadata.privacy_url).toBe('https://yiroom.vercel.app/privacy');
    expect(metadata.support_url).toBe('https://yiroom.vercel.app/help');
    expect(metadata.marketing_url).toBe('https://yiroom.vercel.app');
    expect(metadata.description.ko).toMatch(/퍼스널컬러.*피부.*체형.*헤어.*메이크업/s);
    expect(metadata.description.en).toMatch(/Personal color.*Skin.*Body.*Hair.*Makeup/s);
    expect(publicCopy).not.toMatch(
      /운동|영양|음식|칼로리|물\s*섭취|웰니스|workout|nutrition|calorie|hydration|wellness/i
    );
  });
});
