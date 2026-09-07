/**
 * i18n 메시지 파일 테스트
 */

import { describe, it, expect, beforeAll } from 'vitest';

// 메시지 파일 로드
let koMessages: Record<string, unknown>;
let enMessages: Record<string, unknown>;
let jaMessages: Record<string, unknown>;
let zhMessages: Record<string, unknown>;

function flattenLeaves(value: Record<string, unknown>, prefix = ''): Record<string, string> {
  return Object.entries(value).reduce<Record<string, string>>((leaves, [key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof child === 'string') {
      leaves[path] = child;
    } else if (child && typeof child === 'object' && !Array.isArray(child)) {
      Object.assign(leaves, flattenLeaves(child as Record<string, unknown>, path));
    }
    return leaves;
  }, {});
}

function interpolationVariables(message: string): string[] {
  return [...message.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)(?:,|\})/g)]
    .map((match) => match[1])
    .sort();
}

beforeAll(async () => {
  koMessages = (await import('@/messages/ko.json')).default;
  enMessages = (await import('@/messages/en.json')).default;
  jaMessages = (await import('@/messages/ja.json')).default;
  zhMessages = (await import('@/messages/zh.json')).default;
});

describe('i18n messages', () => {
  describe('메시지 파일 구조', () => {
    it('한국어 메시지 파일이 존재해야 함', () => {
      expect(koMessages).toBeDefined();
      expect(typeof koMessages).toBe('object');
    });

    it('영어 메시지 파일이 존재해야 함', () => {
      expect(enMessages).toBeDefined();
      expect(typeof enMessages).toBe('object');
    });

    it('일본어 메시지 파일이 존재해야 함', () => {
      expect(jaMessages).toBeDefined();
      expect(typeof jaMessages).toBe('object');
    });

    it('중국어 메시지 파일이 존재해야 함', () => {
      expect(zhMessages).toBeDefined();
      expect(typeof zhMessages).toBe('object');
    });
  });

  describe('필수 네임스페이스 존재', () => {
    const requiredNamespaces = [
      'common',
      'nav',
      'auth',
      'home',
      'beauty',
      'style',
      'record',
      'workout',
      'nutrition',
      'profile',
      'social',
      'analysis',
      'errors',
      'time',
    ];

    it.each(requiredNamespaces)('한국어 메시지에 "%s" 네임스페이스가 존재해야 함', (namespace) => {
      expect(koMessages[namespace]).toBeDefined();
      expect(typeof koMessages[namespace]).toBe('object');
    });

    it.each(requiredNamespaces)('영어 메시지에 "%s" 네임스페이스가 존재해야 함', (namespace) => {
      expect(enMessages[namespace]).toBeDefined();
      expect(typeof enMessages[namespace]).toBe('object');
    });

    it.each(requiredNamespaces)('일본어 메시지에 "%s" 네임스페이스가 존재해야 함', (namespace) => {
      expect(jaMessages[namespace]).toBeDefined();
      expect(typeof jaMessages[namespace]).toBe('object');
    });

    it.each(requiredNamespaces)('중국어 메시지에 "%s" 네임스페이스가 존재해야 함', (namespace) => {
      expect(zhMessages[namespace]).toBeDefined();
      expect(typeof zhMessages[namespace]).toBe('object');
    });
  });

  describe('common 네임스페이스', () => {
    const commonKeys = [
      'loading',
      'error',
      'retry',
      'cancel',
      'confirm',
      'save',
      'delete',
      'edit',
      'close',
      'back',
      'next',
    ];

    it.each(commonKeys)('한국어 common에 "%s" 키가 존재해야 함', (key) => {
      expect((koMessages.common as Record<string, unknown>)[key]).toBeDefined();
    });

    it.each(commonKeys)('영어 common에 "%s" 키가 존재해야 함', (key) => {
      expect((enMessages.common as Record<string, unknown>)[key]).toBeDefined();
    });

    it.each(commonKeys)('일본어 common에 "%s" 키가 존재해야 함', (key) => {
      expect((jaMessages.common as Record<string, unknown>)[key]).toBeDefined();
    });

    it.each(commonKeys)('중국어 common에 "%s" 키가 존재해야 함', (key) => {
      expect((zhMessages.common as Record<string, unknown>)[key]).toBeDefined();
    });
  });

  describe('nav 네임스페이스', () => {
    const navKeys = ['home', 'beauty', 'style', 'record', 'profile'];

    it.each(navKeys)('한국어 nav에 "%s" 키가 존재해야 함', (key) => {
      expect((koMessages.nav as Record<string, unknown>)[key]).toBeDefined();
    });

    it.each(navKeys)('영어 nav에 "%s" 키가 존재해야 함', (key) => {
      expect((enMessages.nav as Record<string, unknown>)[key]).toBeDefined();
    });

    it.each(navKeys)('일본어 nav에 "%s" 키가 존재해야 함', (key) => {
      expect((jaMessages.nav as Record<string, unknown>)[key]).toBeDefined();
    });

    it.each(navKeys)('중국어 nav에 "%s" 키가 존재해야 함', (key) => {
      expect((zhMessages.nav as Record<string, unknown>)[key]).toBeDefined();
    });
  });

  describe('메시지 일관성', () => {
    it('모든 언어의 네임스페이스가 동일해야 함', () => {
      const koNamespaces = Object.keys(koMessages).sort();
      const enNamespaces = Object.keys(enMessages).sort();
      const jaNamespaces = Object.keys(jaMessages).sort();
      const zhNamespaces = Object.keys(zhMessages).sort();
      expect(koNamespaces).toEqual(enNamespaces);
      expect(koNamespaces).toEqual(jaNamespaces);
      expect(koNamespaces).toEqual(zhNamespaces);
    });

    it('common 네임스페이스의 키가 동일해야 함', () => {
      const koKeys = Object.keys(koMessages.common as object).sort();
      const enKeys = Object.keys(enMessages.common as object).sort();
      const jaKeys = Object.keys(jaMessages.common as object).sort();
      const zhKeys = Object.keys(zhMessages.common as object).sort();
      expect(koKeys).toEqual(enKeys);
      expect(koKeys).toEqual(jaKeys);
      expect(koKeys).toEqual(zhKeys);
    });

    it('nav 네임스페이스의 키가 동일해야 함', () => {
      const koKeys = Object.keys(koMessages.nav as object).sort();
      const enKeys = Object.keys(enMessages.nav as object).sort();
      const jaKeys = Object.keys(jaMessages.nav as object).sort();
      const zhKeys = Object.keys(zhMessages.nav as object).sort();
      expect(koKeys).toEqual(enKeys);
      expect(koKeys).toEqual(jaKeys);
      expect(koKeys).toEqual(zhKeys);
    });

    it('모든 locale의 중첩 leaf key와 interpolation 변수가 한국어 정본과 일치한다', () => {
      const koLeaves = flattenLeaves(koMessages);
      const localizedLeaves = [enMessages, jaMessages, zhMessages].map((messages) =>
        flattenLeaves(messages)
      );

      for (const leaves of localizedLeaves) {
        expect(Object.keys(leaves).sort()).toEqual(Object.keys(koLeaves).sort());
        for (const key of Object.keys(koLeaves)) {
          expect(interpolationVariables(leaves[key]), key).toEqual(
            interpolationVariables(koLeaves[key])
          );
        }
      }
    });

    it('영문 카탈로그에는 의도된 한국어 언어명 외 한글과 대체 문자가 없다', () => {
      const enLeaves = flattenLeaves(enMessages);
      const hangulPaths = Object.entries(enLeaves)
        .filter(([, value]) => /[가-힣]/.test(value))
        .map(([path]) => path)
        .sort();

      expect(hangulPaths).toEqual(['landing.langKo', 'landing.langKoLabel']);
      expect(JSON.stringify(enMessages)).not.toContain('\uFFFD');
    });

    it('모든 locale 카탈로그에 유니코드 대체 문자가 없다', () => {
      for (const messages of [koMessages, enMessages, jaMessages, zhMessages]) {
        expect(JSON.stringify(messages)).not.toContain('\uFFFD');
      }
    });
  });

  describe('메시지 값 형식', () => {
    it('모든 메시지 값은 문자열이어야 함', () => {
      const checkStringValues = (obj: Record<string, unknown>, path = '') => {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          if (typeof value === 'object' && value !== null) {
            checkStringValues(value as Record<string, unknown>, currentPath);
          } else {
            expect(typeof value).toBe('string');
          }
        }
      };

      checkStringValues(koMessages);
      checkStringValues(enMessages);
      checkStringValues(jaMessages);
      checkStringValues(zhMessages);
    });

    it('메시지에 빈 문자열이 없어야 함', () => {
      const checkNonEmptyStrings = (obj: Record<string, unknown>, path = '') => {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          if (typeof value === 'object' && value !== null) {
            checkNonEmptyStrings(value as Record<string, unknown>, currentPath);
          } else if (typeof value === 'string') {
            expect(value.trim().length, `${currentPath} should not be empty`).toBeGreaterThan(0);
          }
        }
      };

      checkNonEmptyStrings(koMessages);
      checkNonEmptyStrings(enMessages);
      checkNonEmptyStrings(jaMessages);
      checkNonEmptyStrings(zhMessages);
    });

    it('간체 중국어 메시지에 유니코드 대체 문자가 없어야 함', () => {
      expect(JSON.stringify(zhMessages)).not.toContain('\uFFFD');
      expect((zhMessages.common as Record<string, string>).close).toBe('关闭');
      expect((zhMessages.settings as Record<string, string>).dataManagement).toBe('数据管理');
      const auth = zhMessages.auth as {
        mobileSignUp: { birthdateHelp: string };
        mobileForgotPassword: { title: string };
        mobileAgeVerification: { ageRestrictedMessage: string };
      };
      expect(auth.mobileSignUp.birthdateHelp).toBe('用于确认您已满14周岁并具备服务使用资格。');
      expect(auth.mobileForgotPassword.title).toBe('重置密码');
      expect(auth.mobileAgeVerification.ageRestrictedMessage).toBe(
        'Yiroom 仅限年满14周岁的用户使用。未满14周岁的用户需要法定代理人同意，因此我们不向其提供生物特征信息分析。'
      );
    });
  });

  describe('통합 분석 폴백 카피 계약', () => {
    const fallbackExpectations = [
      ['ko', '낮은 신뢰도', '샘플(예시)'],
      ['en', 'low-confidence', 'sample (example)'],
      ['ja', '信頼度の低い', 'サンプル（例）'],
      ['zh', '低可信度', '示例（样例）'],
    ] as const;

    it.each(fallbackExpectations)(
      '%s usedFallback 고지가 낮은 신뢰도의 예시 결과임을 함께 밝힌다',
      (locale, lowConfidenceTerm, sampleTerm) => {
        const messages = { ko: koMessages, en: enMessages, ja: jaMessages, zh: zhMessages }[locale];
        const analysis = messages.analysis as {
          integratedResult: { fallback: { bodyAfterLabels: string } };
        };
        const message = analysis.integratedResult.fallback.bodyAfterLabels;

        expect(message).toContain(lowConfidenceTerm);
        expect(message).toContain(sampleTerm);
      }
    );
  });

  describe('재현성 실측 전 정직 카피 계약', () => {
    const expectations = {
      ko: {
        sentence: '같은 사진이면 같은 판정을 목표로 합니다',
        footerSentence: '같은 사진이면 같은 판정을 목표로 합니다.',
        badge: '같은 판정 목표',
      },
      en: {
        sentence: 'We aim for the same verdict from the same photo',
        footerSentence: 'We aim for the same verdict from the same photo.',
        badge: 'Consistent verdict goal',
      },
      ja: {
        sentence: '同じ写真なら同じ判定になることを目指しています',
        footerSentence: '同じ写真なら同じ判定になることを目指しています。',
        badge: '同じ判定を目指す設計',
      },
      zh: {
        sentence: '我们以同一张照片得到一致判定为目标',
        footerSentence: '我们以同一张照片得到一致判定为目标。',
        badge: '一致判定目标',
      },
    } as const;

    it.each(['ko', 'en', 'ja', 'zh'] as const)(
      '%s 결과·리포트·랜딩이 검증 완료가 아닌 설계 목표로 고지한다',
      (locale) => {
        const messages = { ko: koMessages, en: enMessages, ja: jaMessages, zh: zhMessages }[
          locale
        ] as {
          analysis: {
            integratedResult: {
              footer: { reproducibility: string };
              reportCard: { reproBadge: string; repro: string };
            };
          };
          landing: { trust1: string };
        };
        const { sentence, footerSentence, badge } = expectations[locale];

        expect(messages.analysis.integratedResult.footer.reproducibility).toBe(footerSentence);
        expect(messages.analysis.integratedResult.reportCard.reproBadge).toBe(badge);
        expect(messages.analysis.integratedResult.reportCard.repro).toBe(sentence);
        expect(messages.landing.trust1).toBe(sentence);
      }
    );
  });

  // 2026-08 랜딩 리뷰 확정 수리 — 히어로 과약속 제거 + 같은 목적지 CTA 문구 통일
  describe('랜딩 카피 계약', () => {
    const locales = () =>
      [
        ['ko', koMessages],
        ['en', enMessages],
        ['ja', jaMessages],
        ['zh', zhMessages],
      ] as const;

    /** 체형은 전신 사진이 필요하다(landing.step0Desc가 근거) — 셀카 한 장 약속에서 제외 */
    const BODY_TERMS = ['체형', 'body', '体型', '体形'];
    const FIRST_ANALYSIS_TERMS: Record<string, string> = {
      ko: '퍼스널컬러',
      en: 'personal color',
      ja: 'パーソナルカラー',
      zh: '个人色彩',
    };
    const EXPANSION_TERMS: Record<string, string> = {
      ko: '확장',
      en: 'expand',
      ja: '広げ',
      zh: '扩展',
    };
    const MULTI_AXIS_FIRST_STEP_TERMS: Record<string, string> = {
      ko: '네 가지',
      en: '4 axes',
      ja: '4軸',
      zh: '4个维度',
    };
    const PRIVACY_TRUST_COPY: Record<string, string> = {
      ko: '원본 사진 저장은 선택 — 기본은 꺼져 있어요',
      en: 'Saving original photos is optional — off by default',
      ja: '元の写真の保存は任意 — 初期設定はオフです',
      zh: '原始照片存储可选 — 默认关闭',
    };
    const MALE_RECOMMENDATION_COPY: Record<string, string> = {
      ko: '남성은 립·베이스 대신 그루밍 추천으로 바뀌어요',
      en: 'For men, lip and base recommendations switch to grooming',
      ja: '男性向けには、リップ・ベースの代わりにグルーミングを提案します',
      zh: '男性会收到男士护理建议，而非唇妆、底妆推荐',
    };

    it.each(['ko', 'en', 'ja', 'zh'])(
      '%s 신뢰 밴드는 원본 저장이 선택·기본 OFF임을 정확히 밝힌다',
      (locale) => {
        const messages = Object.fromEntries(locales()) as Record<
          string,
          Record<string, Record<string, string>>
        >;
        expect(messages[locale].landing.trust2).toBe(PRIVACY_TRUST_COPY[locale]);
      }
    );

    it.each(['ko', 'en', 'ja', 'zh'])(
      '%s 랜딩은 남성 추천이 그루밍으로 바뀐다는 기능 사실을 고지한다',
      (locale) => {
        const messages = Object.fromEntries(locales()) as Record<
          string,
          Record<string, Record<string, string>>
        >;
        expect(messages[locale].landing.maleRecommendationNote).toBe(
          MALE_RECOMMENDATION_COPY[locale]
        );
      }
    );

    it.each(['ko', 'en', 'ja', 'zh'])(
      '%s 히어로 제목이 셀카 한 장으로 체형까지 약속하지 않는다',
      (locale) => {
        const messages = Object.fromEntries(locales()) as Record<
          string,
          Record<string, Record<string, string>>
        >;
        const heroTitle = messages[locale].landing.heroTitle;
        expect(heroTitle).toBeDefined();
        BODY_TERMS.forEach((term) => {
          expect(heroTitle.toLowerCase()).not.toContain(term.toLowerCase());
        });
      }
    );

    it.each(['ko', 'en', 'ja', 'zh'])(
      '%s 히어로가 퍼스널컬러로 시작해 나머지 축으로 확장되는 순서를 밝힌다',
      (locale) => {
        const messages = Object.fromEntries(locales()) as Record<
          string,
          Record<string, Record<string, string>>
        >;
        const { heroTitle, heroDesc } = messages[locale].landing;
        const firstAnalysisTerm = FIRST_ANALYSIS_TERMS[locale];
        const expansionTerm = EXPANSION_TERMS[locale];

        expect(heroTitle.toLowerCase()).toContain(firstAnalysisTerm.toLowerCase());
        expect(heroDesc.toLowerCase()).toContain(firstAnalysisTerm.toLowerCase());
        expect(heroDesc.toLowerCase()).toContain(expansionTerm.toLowerCase());
      }
    );

    it.each(['ko', 'en', 'ja', 'zh'])(
      '%s 첫 단계도 퍼스널컬러만 약속하고 여러 축 동시 분석을 약속하지 않는다',
      (locale) => {
        const messages = Object.fromEntries(locales()) as Record<
          string,
          Record<string, Record<string, string>>
        >;
        const { step0Title, step0Desc } = messages[locale].landing;

        expect(step0Title.toLowerCase()).toContain(FIRST_ANALYSIS_TERMS[locale].toLowerCase());
        expect(step0Desc.toLowerCase()).not.toContain(
          MULTI_AXIS_FIRST_STEP_TERMS[locale].toLowerCase()
        );
      }
    );

    it.each(['ko', 'en', 'ja', 'zh'])(
      '%s 랜딩 CTA는 위치에 맞는 재현성 문구를 제공한다',
      (locale) => {
        const messages = Object.fromEntries(locales()) as Record<
          string,
          Record<string, Record<string, string>>
        >;
        const { startFree, paletteCta, bottomCtaSignUp } = messages[locale].landing;
        expect(paletteCta).not.toBe(startFree);
        expect(bottomCtaSignUp).not.toBe(startFree);
        expect(startFree.length).toBeGreaterThan(bottomCtaSignUp.length);
      }
    );
  });
});
