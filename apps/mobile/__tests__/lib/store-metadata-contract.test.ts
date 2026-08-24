import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface StoreMetadata {
  ios: { ageRating: string; minimumUserAge: number };
  android: { contentRating: string; minimumUserAge: number };
  localization: {
    ko: { description: string; keywords: string; whatsNew: string };
    en: { description: string; keywords: string; whatsNew: string };
  };
  screenshots: { required: { iphone6_5: { scenes: string[] } } };
  privacyNutritionLabels: {
    dataCollected: Array<{
      type: string;
      linkedToUser: boolean;
      note?: string;
    }>;
  };
  reviewNotes: { notes: string };
}

function readStoreMetadata(): StoreMetadata {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'store-metadata.json'), 'utf8')
  ) as StoreMetadata;
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
});
