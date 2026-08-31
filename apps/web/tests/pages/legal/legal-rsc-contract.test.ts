import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readAppFile(...segments: string[]) {
  return readFileSync(path.join(process.cwd(), 'app', ...segments), 'utf8');
}

describe('법무 페이지 RSC 계약', () => {
  it('약관과 개인정보 본문이 클라이언트 훅 없이 서버에서 렌더링된다', () => {
    const termsPage = readAppFile('(main)', 'terms', 'page.tsx');
    const privacyContent = readAppFile('privacy', 'PrivacyContent.tsx');

    for (const [name, source] of [
      ['terms/page.tsx', termsPage],
      ['privacy/PrivacyContent.tsx', privacyContent],
    ] as const) {
      expect(source, name).not.toMatch(/^['"]use client['"];?/m);
      expect(source, name).not.toContain('useState');
      expect(source, name).not.toContain('useSearchParams');
      expect(source, name).not.toContain('onClick=');
    }
  });

  it('언어 전환은 클라이언트 상태 대신 URL 링크를 사용한다', () => {
    const termsPage = readAppFile('(main)', 'terms', 'page.tsx');
    const privacyContent = readAppFile('privacy', 'PrivacyContent.tsx');

    expect(termsPage).toContain('href="?lang=ko"');
    expect(termsPage).toContain('href="?lang=en"');
    expect(privacyContent).toContain('href="?lang=ko"');
    expect(privacyContent).toContain('href="?lang=en"');
    expect(termsPage.match(/prefetch=\{false\}/g)).toHaveLength(2);
    expect(privacyContent.match(/prefetch=\{false\}/g)).toHaveLength(2);
  });

  it('Google 처리는 유료 서비스의 위탁으로, 모바일 위치·소셜은 미수집으로 고지한다', () => {
    const privacyContent = readAppFile('privacy', 'PrivacyContent.tsx');

    expect(privacyContent).toContain('활성 Cloud');
    expect(privacyContent).toContain('데이터 처리 부속약관(DPA)');
    expect(privacyContent).toContain('서비스 제공자(수탁자)');
    expect(privacyContent).not.toContain('AI 분석 서비스 관련 제3자 제공');
    expect(privacyContent).toMatch(/모바일\s+앱은 기기 위치 권한을 요청하지 않으며/);
    expect(privacyContent).toMatch(/모바일 앱은 소셜 기능을 제공하지 않으며/);
    expect(privacyContent).toMatch(/service\s+provider \(processor\)/);
  });

  it('성별을 필수가 아닌 추천 개인화용 선택 항목으로 고지한다', () => {
    const privacyContent = readAppFile('privacy', 'PrivacyContent.tsx');

    expect(privacyContent).toContain(
      '<strong>선택 항목:</strong> 성별(추천 개인화 목적), 프로필 사진, 키, 체중'
    );
    expect(privacyContent).toContain('Gender (for personalized recommendations)');
    expect(privacyContent).not.toContain('성별(맞춤 분석 목적)');
    expect(privacyContent).not.toContain('gender (for personalized analysis)');
  });
});
