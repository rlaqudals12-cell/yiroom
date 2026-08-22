import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface StoreMetadata {
  localization: {
    ko: { description: string };
    en: { description: string };
  };
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
});
