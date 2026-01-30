/**
 * Claude AI Provider Adapter
 *
 * Secondary AI 프로바이더 - Claude 3.5 Haiku
 * Gemini 실패 시 백업으로 사용
 *
 * @module lib/ai/providers/claude
 * @see docs/adr/ADR-055-multi-ai-backup-strategy.md
 *
 * Note: @anthropic-ai/sdk는 선택적 의존성입니다.
 * SDK가 설치되지 않은 경우 이 프로바이더는 비활성화됩니다.
 * 설치: npm install @anthropic-ai/sdk
 */

import type { AIProvider, ImageAnalysisInput } from '../types';

// =============================================================================
// 설정
// =============================================================================

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL_NAME = process.env.CLAUDE_MODEL ?? 'claude-3-5-haiku-latest';

// Anthropic 클라이언트 타입 (SDK 없이도 타입 정의 가능)
interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: Array<{
    type: 'text' | 'image';
    text?: string;
    source?: {
      type: 'base64';
      media_type: string;
      data: string;
    };
  }>;
}

interface AnthropicResponse {
  content: Array<{ type: string; text?: string }>;
}

interface AnthropicClient {
  messages: {
    create: (params: {
      model: string;
      max_tokens: number;
      messages: AnthropicMessage[];
    }) => Promise<AnthropicResponse>;
  };
}

// Anthropic 클라이언트 초기화 (lazy, dynamic import)
let anthropicClient: AnthropicClient | null = null;
let sdkAvailable: boolean | null = null;

/**
 * Anthropic 클라이언트 가져오기 (SDK 동적 로딩)
 */
async function getAnthropicClient(): Promise<AnthropicClient | null> {
  if (!API_KEY) return null;

  // SDK 사용 가능 여부 캐싱
  if (sdkAvailable === false) return null;

  if (!anthropicClient) {
    try {
      // Dynamic import to handle missing SDK gracefully
      // @ts-expect-error - SDK가 설치되지 않은 경우 런타임에 처리
      const AnthropicModule = await import('@anthropic-ai/sdk');
      const Anthropic = AnthropicModule.default;
      anthropicClient = new Anthropic({ apiKey: API_KEY }) as unknown as AnthropicClient;
      sdkAvailable = true;
      console.log('[Claude] Anthropic SDK loaded successfully');
    } catch {
      console.warn(
        '[Claude] @anthropic-ai/sdk not installed, Claude provider disabled.',
        'Install with: npm install @anthropic-ai/sdk'
      );
      sdkAvailable = false;
      return null;
    }
  }
  return anthropicClient;
}

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * Base64 이미지를 Claude 형식으로 변환
 */
export function formatImageForClaude(imageBase64: string): {
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    data: string;
  };
} {
  const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 image format');
  }

  const mimeType = matches[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  const data = matches[2];

  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: mimeType,
      data,
    },
  };
}

/**
 * JSON 응답 파싱 (마크다운 코드블록 제거)
 */
export function parseClaudeJsonResponse<T>(text: string): T {
  const jsonText = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  // Claude가 추가 텍스트를 포함할 수 있으므로 첫 번째 JSON 객체만 추출
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON object found in Claude response');
  }

  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch (error) {
    console.error('[Claude] JSON parse error:', error);
    console.error('[Claude] Raw text:', text.substring(0, 500));
    throw new Error('Failed to parse Claude response as JSON');
  }
}

// =============================================================================
// Claude Provider
// =============================================================================

/**
 * Claude 분석 실행
 *
 * @param input 이미지 분석 입력
 * @param prompt 분석 프롬프트
 * @returns 파싱된 JSON 응답
 */
export async function analyzeWithClaude<T>(
  input: ImageAnalysisInput,
  prompt: string
): Promise<T> {
  const client = await getAnthropicClient();
  if (!client) {
    throw new Error('Anthropic SDK not available or API key not configured');
  }

  const imagePart = formatImageForClaude(input.imageBase64);

  const response = await client.messages.create({
    model: MODEL_NAME,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          imagePart,
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  });

  // 응답에서 텍스트 추출
  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text' || !textContent.text) {
    throw new Error('No text response from Claude');
  }

  console.log(`[Claude] ${input.analysisType} analysis completed`);

  return parseClaudeJsonResponse<T>(textContent.text);
}

/**
 * Claude Provider 팩토리
 *
 * @param prompt 분석에 사용할 프롬프트
 * @returns AIProvider 구현
 */
export function createClaudeProvider<T>(
  prompt: string
): AIProvider<ImageAnalysisInput, T> {
  return {
    name: 'claude',
    analyze: (input: ImageAnalysisInput) => analyzeWithClaude<T>(input, prompt),
    timeout: 4000, // ADR-055: Secondary 타임아웃 4초
    maxRetries: 1, // ADR-055: Secondary 재시도 1회
    priority: 2, // 두 번째 우선순위
    isEnabled: () => {
      const forceMock = process.env.FORCE_MOCK_AI === 'true';
      const hasApiKey = !!API_KEY;
      const flagEnabled = process.env.ENABLE_CLAUDE !== 'false';
      const useSecondary = process.env.USE_SECONDARY_ON_PRIMARY_FAILURE !== 'false';
      // SDK 가용성 체크 (캐시된 경우에만)
      const sdkCheck = sdkAvailable !== false;
      return !forceMock && hasApiKey && flagEnabled && useSecondary && sdkCheck;
    },
  };
}

/**
 * Claude 사용 가능 여부 확인
 */
export function isClaudeAvailable(): boolean {
  const forceMock = process.env.FORCE_MOCK_AI === 'true';
  const hasApiKey = !!API_KEY;
  const sdkCheck = sdkAvailable !== false;
  return !forceMock && hasApiKey && sdkCheck;
}

/**
 * Claude 모델 정보 조회
 */
export function getClaudeModelInfo(): {
  model: string;
  available: boolean;
  sdkInstalled: boolean | null;
} {
  return {
    model: MODEL_NAME,
    available: isClaudeAvailable(),
    sdkInstalled: sdkAvailable,
  };
}

/**
 * Claude SDK 초기화 (선택적)
 * 앱 시작 시 호출하여 SDK 가용성을 미리 확인
 */
export async function initializeClaudeSDK(): Promise<boolean> {
  const client = await getAnthropicClient();
  return client !== null;
}
