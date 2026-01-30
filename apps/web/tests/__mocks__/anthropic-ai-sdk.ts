/**
 * @anthropic-ai/sdk Mock
 *
 * 테스트 환경에서 선택적 의존성인 Anthropic SDK를 모킹합니다.
 */

export default class Anthropic {
  apiKey: string;

  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
  }

  messages = {
    create: async () => ({
      content: [{ type: 'text', text: '{}' }],
    }),
  };
}

export { Anthropic };
