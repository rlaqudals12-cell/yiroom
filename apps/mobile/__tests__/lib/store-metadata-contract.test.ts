import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const STORE_LOCALES = ['ko', 'en', 'ja', 'zh'] as const;

type StoreLocale = (typeof STORE_LOCALES)[number];

interface StoreLocalization {
  name: string;
  subtitle: string;
  description: string;
  keywords: string;
  whatsNew: string;
  promotionalText: string;
}

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
  localization: Record<StoreLocale, StoreLocalization>;
  screenshots: { required: { iphone6_5: { scenes: string[] } } };
  privacyNutritionLabels: {
    dataCollected: {
      type: string;
      items: string[];
      linkedToUser: boolean;
      usedForTracking: boolean;
      note?: string;
      purposes?: string[];
    }[];
  };
  googlePlayDataSafety: {
    dataCollected: {
      category: string;
      items: string[];
      linkedToUser: boolean;
      required: boolean;
      purposes: string[];
    }[];
    notCollectedInAndroidRelease: { category: string; items: string[] }[];
    dataSharing: { sharedWithThirdParties: boolean };
    serviceProviderProcessing: {
      provider: string;
      role: string;
      contractBasis: string;
      data: string[];
      countsAsDataSharing: boolean;
    }[];
  };
  reviewNotes: {
    notes: string;
    reviewAccessInstructions: string;
    demoAccount?: unknown;
  };
}

interface AppConfig {
  expo: {
    ios: {
      infoPlist: {
        NSCameraUsageDescription: string;
        NSPhotoLibraryUsageDescription: string;
        NSPhotoLibraryAddUsageDescription?: string;
      };
    };
    plugins: (string | [string, Record<string, string | boolean>])[];
  };
}

interface SubmissionMetadata {
  _source: string;
  _note: string;
  app_name: Record<StoreLocale, string>;
  subtitle: Record<StoreLocale, string>;
  description: Record<StoreLocale, string>;
  keywords: Record<StoreLocale, string[]>;
  privacy_url: string;
  support_url: string;
  marketing_url: string;
  screenshots: Record<string, string[]>;
  age_rating: string;
  release_notes: Record<StoreLocale, string>;
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

function readStoreChecklist(): string {
  return readFileSync(join(process.cwd(), 'docs', 'APP-STORE-CHECKLIST.md'), 'utf8');
}

function readListing(locale: StoreLocale): string {
  return readFileSync(join(process.cwd(), 'store-metadata', locale, 'listing.txt'), 'utf8');
}

describe('store metadata privacy contract', () => {
  it('제출 JSON은 정본의 파생물임을 밝히고 공개 URL도 정본을 따른다', () => {
    const canonical = readStoreMetadata();
    const submission = readSubmissionMetadata();

    expect(submission._source).toBe('../store-metadata.json');
    expect(submission._note).toContain('파생물');
    expect(submission.privacy_url).toBe(canonical.ios.privacyPolicyUrl);
    expect(submission.support_url).toBe(canonical.ios.supportUrl);
    expect(submission.marketing_url).toBe(canonical.ios.marketingUrl);
  });

  it('4개 로케일의 정본·제출 JSON·리스팅이 같은 공개 문구를 사용한다', () => {
    const metadata = readStoreMetadata();
    const submission = readSubmissionMetadata();

    expect(Object.keys(metadata.localization).sort()).toEqual([...STORE_LOCALES].sort());

    for (const field of [
      submission.app_name,
      submission.subtitle,
      submission.description,
      submission.keywords,
      submission.release_notes,
    ]) {
      expect(Object.keys(field).sort()).toEqual([...STORE_LOCALES].sort());
    }

    for (const locale of STORE_LOCALES) {
      const canonical = metadata.localization[locale];
      const listing = readListing(locale);

      expect(submission.app_name[locale]).toBe(canonical.name);
      expect(submission.subtitle[locale]).toBe(canonical.subtitle);
      expect(submission.description[locale]).toBe(canonical.description);
      expect(submission.keywords[locale].join(',')).toBe(canonical.keywords);
      expect(submission.release_notes[locale]).toBe(canonical.whatsNew);
      expect(listing).toContain(canonical.name);
      expect(listing).toContain(canonical.subtitle);
      expect(listing).toContain(canonical.description);
      expect(listing).toContain(canonical.keywords);
      expect(listing).not.toContain('\uFFFD');
      expect(canonical.name.length).toBeLessThanOrEqual(30);
      expect(canonical.subtitle.length).toBeLessThanOrEqual(30);
    }
  });

  it('일본어 부제는 피부 분석과 골격 진단을 구분하고 브랜드 표기를 통일한다', () => {
    const canonical = readStoreMetadata().localization.ja;
    const submission = readSubmissionMetadata();
    const webCatalog = readFileSync(
      join(process.cwd(), '..', 'web', 'messages', 'ja.json'),
      'utf8'
    );

    expect(canonical.subtitle).toBe('AIパーソナルカラー・肌分析・骨格診断');
    expect(submission.subtitle.ja).toBe(canonical.subtitle);
    expect(readListing('ja')).toContain(canonical.subtitle);
    expect(webCatalog).not.toContain('イルーム');
    expect(webCatalog).toContain('Yiroomホームへ');
    expect(webCatalog).toContain('Yiroomと一緒に始めましょう');
    expect(webCatalog).toContain('Yiroomは14歳以上の方のみご利用いただけます。');
  });

  it('모든 로케일이 14세·5축·Google AI·선택 저장 최대 1년 계약을 고지한다', () => {
    const metadata = readStoreMetadata();
    const contracts: Record<StoreLocale, { age: RegExp; axes: RegExp[]; storage: RegExp }> = {
      ko: {
        age: /만 14세 이상/,
        axes: [/퍼스널컬러/, /피부/, /체형/, /헤어/, /메이크업/],
        storage: /저장에 동의한 경우에만 최대 1년/,
      },
      en: {
        age: /age 14 and older/i,
        axes: [/personal color/i, /skin/i, /body/i, /hair/i, /makeup/i],
        storage: /up to one year only when you consent/i,
      },
      ja: {
        age: /14歳以上/,
        axes: [/パーソナルカラー/, /肌/, /骨格診断（体型分析）/, /髪/, /メイク/],
        storage: /同意した場合に限り、最長1年間/,
      },
      zh: {
        age: /14岁及以上/,
        axes: [/个人色彩/, /肌肤/, /体型/, /发质/, /妆容/],
        storage: /仅当您同意保存图片时.*最多保存一年/,
      },
    };

    for (const locale of STORE_LOCALES) {
      const publicCopy = `${metadata.localization[locale].description}\n${readListing(locale)}`;
      const contract = contracts[locale];

      expect(publicCopy).toMatch(contract.age);
      expect(publicCopy).toContain('Google AI');
      expect(publicCopy).toMatch(contract.storage);
      for (const axis of contract.axes) {
        expect(publicCopy).toMatch(axis);
      }
    }
  });

  it('시장별 문법을 지키고 모든 로케일에서 숨김 기능을 약속하지 않는다', () => {
    const metadata = readStoreMetadata();
    const publicCopy = Object.fromEntries(
      STORE_LOCALES.map((locale) => [
        locale,
        `${Object.values(metadata.localization[locale]).join('\n')}\n${readListing(locale)}`,
      ])
    ) as Record<StoreLocale, string>;

    expect(publicCopy.ko).not.toMatch(/운동|영양|음식 분석|구강|치아|리더보드|날씨|소셜|피드/);
    expect(publicCopy.en).not.toMatch(
      /exercise|workout|nutrition|oral|dental|leaderboard|weather|social feed|wellness/i
    );
    expect(publicCopy.ja).not.toMatch(
      /運動|栄養|口腔|歯|ランキング|天気|ソーシャル|フィード|ウェルネス/
    );
    expect(publicCopy.zh).not.toMatch(/运动|营养|口腔|牙齿|排行榜|天气|社交|动态|健身/);
    expect(publicCopy.ja).toContain('骨格診断');
    expect(publicCopy.zh).toMatch(/个人色彩.*肌肤.*体型.*发质.*妆容/s);
    expect(publicCopy.zh).not.toMatch(
      /個人色彩|肌膚|體型|髮質|妝容|綜合報告|服務器|僅當|儲存圖片|發送|賬號/
    );
  });

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

  it('AI 코치 대화를 Play Messages 수집 항목으로 직접 신고한다', () => {
    const metadata = readStoreMetadata();
    const messageEntry = metadata.privacyNutritionLabels.dataCollected.find(
      (entry) => entry.type === 'Messages'
    );
    const playMessageEntry = metadata.googlePlayDataSafety.dataCollected.find(
      (entry) => entry.category === 'Messages'
    );

    expect(messageEntry).toMatchObject({
      items: ['Other In-App Messages'],
      linkedToUser: true,
      usedForTracking: false,
    });
    expect(playMessageEntry).toMatchObject({
      items: ['Other In-App Messages'],
      linkedToUser: true,
      required: false,
      purposes: ['App functionality'],
    });
  });

  it('Apple 라벨에 계정 연결 생체 민감정보와 사용자 ID를 신고한다', () => {
    const metadata = readStoreMetadata();
    const sensitiveInfo = metadata.privacyNutritionLabels.dataCollected.find(
      (entry) => entry.type === 'Sensitive Info'
    );
    const userId = metadata.privacyNutritionLabels.dataCollected.find(
      (entry) => entry.type === 'Identifiers'
    );

    expect(sensitiveInfo).toMatchObject({
      items: ['Sensitive Info'],
      linkedToUser: true,
      usedForTracking: false,
      purposes: ['App Functionality'],
    });
    expect(sensitiveInfo?.note).toContain('저장 동의가 꺼져 있으면 원본을 보관하지 않습니다');
    expect(userId).toMatchObject({
      items: ['User ID'],
      linkedToUser: true,
      usedForTracking: false,
      purposes: ['App Functionality'],
    });
  });

  it('Play 선공개 앱의 위치·소셜 미수집과 Google 서비스 제공자 처리를 분리한다', () => {
    const metadata = readStoreMetadata();
    const notCollected = metadata.googlePlayDataSafety.notCollectedInAndroidRelease;
    const google = metadata.googlePlayDataSafety.serviceProviderProcessing.find((entry) =>
      entry.provider.includes('Google')
    );
    const diagnostics = metadata.googlePlayDataSafety.dataCollected.find(
      (entry) => entry.category === 'App info and performance'
    );

    expect(notCollected.find((entry) => entry.category === 'Location')?.items).toEqual([
      'Approximate location',
      'Precise location',
    ]);
    expect(notCollected.find((entry) => entry.category === 'Social')?.items).toEqual([
      'Friend lists',
      'Feed posts',
      'Comments',
      'Likes',
    ]);
    expect(metadata.googlePlayDataSafety.dataSharing.sharedWithThirdParties).toBe(false);
    expect(diagnostics).toMatchObject({
      items: ['Crash logs', 'Diagnostics'],
      linkedToUser: true,
      required: true,
    });
    expect(google).toMatchObject({
      role: 'Service provider (processor)',
      data: ['Analysis images', 'AI coach message inputs'],
      countsAsDataSharing: false,
    });
    expect(google?.contractBasis).toMatch(/Paid Services.*Cloud Billing.*Data Processing Addendum/);
  });

  it('심사 자격증명을 저장하지 않고 확정 도메인 계정의 제출 시 주입만 지시한다', () => {
    const metadata = readStoreMetadata();
    const checklist = readStoreChecklist();

    expect(metadata.reviewNotes).not.toHaveProperty('demoAccount');
    expect(JSON.stringify(metadata.reviewNotes)).not.toMatch(/"password"\s*:/i);
    expect(metadata.reviewNotes.reviewAccessInstructions).toContain(
      '+clerk_test@<confirmed-domain>'
    );
    expect(metadata.reviewNotes.reviewAccessInstructions).toContain('Play Console');
    expect(checklist).toContain('<local>+clerk_test@<confirmed-domain>');
    expect(checklist).toContain('<support-local>@<confirmed-domain>');
    expect(checklist).not.toMatch(/비밀번호\s*:/);
    expect(checklist).not.toMatch(/[\w.+-]+@yiroom\.(?:com|app)/i);
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
      (plugin): plugin is [string, Record<string, string | boolean>] =>
        Array.isArray(plugin) && plugin[0] === 'expo-camera'
    );
    const expoImagePicker = config.expo.plugins.find(
      (plugin): plugin is [string, Record<string, string | boolean>] =>
        Array.isArray(plugin) && plugin[0] === 'expo-image-picker'
    );
    const permissionCopy = [
      infoPlist.NSCameraUsageDescription,
      infoPlist.NSPhotoLibraryUsageDescription,
      expoCamera?.[1].cameraPermission ?? '',
      expoImagePicker?.[1].photosPermission ?? '',
    ].join('\n');

    expect(permissionCopy).not.toMatch(/음식|식단|영양|운동|웰니스/);
    expect(infoPlist.NSCameraUsageDescription).toMatch(/퍼스널컬러.*피부.*체형.*헤어.*메이크업/);
    expect(infoPlist.NSPhotoLibraryUsageDescription).toMatch(
      /퍼스널컬러.*피부.*체형.*헤어.*메이크업.*AI 아바타/
    );
    expect(expoCamera?.[1].cameraPermission).toBe(infoPlist.NSCameraUsageDescription);
    expect(expoCamera?.[1].microphonePermission).toBe(false);
    expect(expoImagePicker?.[1].photosPermission).toBe(infoPlist.NSPhotoLibraryUsageDescription);
    expect(infoPlist).not.toHaveProperty('NSPhotoLibraryAddUsageDescription');
  });

  it('체크리스트가 스토어 정본과 개인정보 라벨 계약을 그대로 따른다', () => {
    const checklist = readStoreChecklist();

    expect(checklist).toContain('AI 퍼스널컬러·피부·스타일 분석');
    expect(checklist).toContain('이룸 서버와 Google AI에 전송');
    expect(checklist).toContain('Sensitive Info');
    expect(checklist).toContain('Identifiers > User ID');
    expect(checklist).toContain('저장 동의 OFF');
    expect(checklist).not.toMatch(
      /기기에만 저장|서버로 전송되지|850\+?|맞춤형 운동|스마트 영양|운동 세션|영양 대시보드/
    );
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
