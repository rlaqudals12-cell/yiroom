# DOC-3-R1: API 문서화

## 1. 핵심 요약

- **OpenAPI 3.1**은 JSON Schema 완전 호환으로 Zod 스키마와의 통합이 원활하며, Next.js App Router와의 조합에서 `zod-to-openapi` 또는 `@asteasolutions/zod-to-openapi`가 표준으로 자리잡음
- **Next.js API 라우트 문서화**는 JSDoc 주석 + Zod 스키마 기반 자동 생성이 최선의 접근법이며, 수동 문서화는 동기화 문제로 권장하지 않음
- **API 버저닝**은 URL Path 기반(`/api/v1/`, `/api/v2/`)이 가장 명확하며, 폐기(Deprecation) 헤더와 Sunset 헤더를 통한 점진적 마이그레이션 지원 필수
- **에러 코드 문서화**는 RFC 7807(Problem Details for HTTP APIs) 형식을 준수하며, 코드별 한국어 사용자 메시지 매핑 테이블 유지
- **Swagger UI**는 `/api-docs` 경로에 정적 배포하여 개발/QA 환경에서 인터랙티브 테스트 지원, 프로덕션에서는 인증 보호 필수

---

## 2. 상세 내용

### 2.1 OpenAPI 스펙

#### OpenAPI 3.1 vs 3.0

OpenAPI 3.1(2021년 발표)은 JSON Schema Draft 2020-12와 완전 호환되어, Zod/TypeScript 스키마와의 변환이 원활합니다.

| 기능 | OpenAPI 3.0 | OpenAPI 3.1 |
|------|-------------|-------------|
| JSON Schema 호환 | 부분 호환 | 완전 호환 |
| nullable | `nullable: true` | `type: ["string", "null"]` |
| 예제 | `example` 단수 | `examples` 복수 지원 |
| Webhooks | 미지원 | 네이티브 지원 |
| 식별자 | `$ref` 한정 | `$id`, `$anchor` 지원 |

#### 스펙 구조 예시

```yaml
# openapi.yaml
openapi: 3.1.0
info:
  title: 이룸 API
  version: 2.0.0
  description: 이룸 AI 웰니스 플랫폼 API
  contact:
    name: Yiroom Team
    url: https://yiroom.app
  license:
    name: Proprietary

servers:
  - url: https://yiroom.app/api
    description: Production
  - url: http://localhost:3000/api
    description: Development

tags:
  - name: analyze
    description: AI 분석 API
  - name: nutrition
    description: 영양 관리 API
  - name: workout
    description: 운동 관리 API

paths:
  /analyze/skin:
    post:
      operationId: analyzeSkin
      tags: [analyze]
      summary: 피부 분석
      description: AI 기반 피부 상태 분석
      security:
        - ClerkAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SkinAnalysisRequest'
      responses:
        '200':
          description: 분석 성공
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SkinAnalysisResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '429':
          $ref: '#/components/responses/RateLimitExceeded'
        '500':
          $ref: '#/components/responses/InternalError'

components:
  securitySchemes:
    ClerkAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Clerk JWT 토큰

  schemas:
    SkinAnalysisRequest:
      type: object
      required:
        - imageBase64
      properties:
        imageBase64:
          type: string
          description: Base64 인코딩된 얼굴 이미지
          minLength: 1
        frontImageBase64:
          type: string
          description: 정면 이미지 (신규 API)
        leftImageBase64:
          type: string
          description: 좌측 이미지 (선택)
        rightImageBase64:
          type: string
          description: 우측 이미지 (선택)
        useMock:
          type: boolean
          default: false
          description: Mock 모드 강제 (개발용)

    SkinAnalysisResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          $ref: '#/components/schemas/SkinAnalysisData'
        usedMock:
          type: boolean
          description: Mock 데이터 사용 여부

  responses:
    ValidationError:
      description: 입력 검증 실패
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            success: false
            error:
              code: VALIDATION_ERROR
              message: 이미지가 필요합니다.
```

### 2.2 Next.js 라우트 문서화

#### JSDoc 기반 문서화 패턴

```typescript
// app/api/analyze/skin/route.ts

/**
 * S-1 피부 분석 API
 *
 * @openapi
 * /api/analyze/skin:
 *   post:
 *     operationId: analyzeSkin
 *     tags: [analyze]
 *     summary: AI 기반 피부 분석
 *     description: |
 *       Gemini 3 Flash를 사용하여 피부 상태를 분석합니다.
 *       - 피부 타입 (건성/지성/복합성/민감성)
 *       - 수분/유분 지수
 *       - 모공, 주름, 색소침착 분석
 *       - 맞춤 스킨케어 추천
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SkinAnalysisRequest'
 *     responses:
 *       200:
 *         description: 분석 성공
 *       400:
 *         description: 이미지 누락 또는 형식 오류
 *       401:
 *         description: 인증 필요
 *       429:
 *         description: 일일 분석 한도 초과 (50회/24시간)
 *       500:
 *         description: 서버 오류
 */
export async function POST(req: NextRequest) {
  // 구현
}

/**
 * 피부 분석 이력 조회
 *
 * @openapi
 * /api/analyze/skin:
 *   get:
 *     operationId: getSkinAnalyses
 *     tags: [analyze]
 *     summary: 피부 분석 이력 조회
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: 조회할 분석 수
 *     responses:
 *       200:
 *         description: 조회 성공
 */
export async function GET() {
  // 구현
}
```

#### 라우트별 메타데이터 파일 패턴

```typescript
// app/api/analyze/skin/openapi.ts
import { z } from 'zod';
import { createDocument } from '@/lib/openapi/utils';

// 요청 스키마
export const skinAnalysisRequestSchema = z.object({
  imageBase64: z.string().min(1).describe('Base64 인코딩된 얼굴 이미지'),
  frontImageBase64: z.string().optional().describe('정면 이미지 (신규 API)'),
  leftImageBase64: z.string().optional().describe('좌측 이미지'),
  rightImageBase64: z.string().optional().describe('우측 이미지'),
  useMock: z.boolean().default(false).describe('Mock 모드 강제'),
});

// 응답 스키마
export const skinAnalysisResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string().uuid(),
    skinType: z.enum(['normal', 'dry', 'oily', 'combination', 'sensitive']),
    overallScore: z.number().min(0).max(100),
    metrics: z.array(z.object({
      id: z.string(),
      label: z.string(),
      value: z.number(),
    })),
    recommendations: z.object({
      insight: z.string(),
      ingredients: z.array(z.string()),
    }),
  }),
  usedMock: z.boolean(),
});

// OpenAPI 문서 조각
export const skinAnalysisDoc = createDocument({
  path: '/api/analyze/skin',
  method: 'POST',
  operationId: 'analyzeSkin',
  tags: ['analyze'],
  summary: 'AI 기반 피부 분석',
  auth: 'required',
  rateLimit: '50/24h',
  request: skinAnalysisRequestSchema,
  response: skinAnalysisResponseSchema,
});
```

### 2.3 자동 생성 도구

#### zod-to-openapi (권장)

`@asteasolutions/zod-to-openapi`는 Zod 스키마를 OpenAPI 3.x 스펙으로 변환하는 가장 성숙한 라이브러리입니다.

```typescript
// lib/openapi/registry.ts
import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// 레지스트리 생성
export const registry = new OpenAPIRegistry();

// 공통 스키마 등록
registry.register('ErrorResponse', z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    userMessage: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
}));

// 인증 스키마 등록
registry.registerComponent('securitySchemes', 'ClerkAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Clerk JWT 인증 토큰',
});
```

```typescript
// lib/openapi/routes/analyze.ts
import { registry } from '../registry';
import { z } from 'zod';

// 피부 분석 요청
const SkinAnalysisRequestSchema = registry.register(
  'SkinAnalysisRequest',
  z.object({
    imageBase64: z.string().openapi({
      description: 'Base64 인코딩된 얼굴 이미지',
      example: 'data:image/jpeg;base64,/9j/4AAQ...',
    }),
    useMock: z.boolean().default(false).openapi({
      description: 'Mock 모드 강제 (개발용)',
    }),
  })
);

// 피부 분석 응답
const SkinAnalysisResponseSchema = registry.register(
  'SkinAnalysisResponse',
  z.object({
    success: z.literal(true),
    data: z.object({
      id: z.string().uuid(),
      skinType: z.enum(['normal', 'dry', 'oily', 'combination', 'sensitive']),
      overallScore: z.number().min(0).max(100),
    }),
    usedMock: z.boolean(),
  })
);

// 라우트 등록
registry.registerPath({
  method: 'post',
  path: '/api/analyze/skin',
  operationId: 'analyzeSkin',
  tags: ['analyze'],
  summary: 'AI 기반 피부 분석',
  description: 'Gemini 3 Flash를 사용하여 피부 상태를 분석합니다.',
  security: [{ ClerkAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: SkinAnalysisRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: '분석 성공',
      content: {
        'application/json': {
          schema: SkinAnalysisResponseSchema,
        },
      },
    },
    400: {
      description: '입력 검증 실패',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
      },
    },
    401: {
      description: '인증 필요',
    },
    429: {
      description: '요청 제한 초과',
      headers: {
        'X-RateLimit-Limit': {
          schema: { type: 'string' },
          description: '총 허용 요청 수',
        },
        'X-RateLimit-Remaining': {
          schema: { type: 'string' },
          description: '남은 요청 수',
        },
        'X-RateLimit-Reset': {
          schema: { type: 'string' },
          description: '제한 리셋 시간 (Unix timestamp)',
        },
      },
    },
  },
});
```

```typescript
// lib/openapi/generate.ts
import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';

// 라우트 파일들 임포트 (부수 효과로 등록)
import './routes/analyze';
import './routes/nutrition';
import './routes/workout';

export function generateOpenAPISpec() {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: '이룸 API',
      version: '2.0.0',
      description: '이룸 AI 웰니스 플랫폼 REST API',
      contact: {
        name: 'Yiroom Team',
        url: 'https://yiroom.app',
      },
    },
    servers: [
      { url: 'https://yiroom.app/api', description: 'Production' },
      { url: 'http://localhost:3000/api', description: 'Development' },
    ],
    tags: [
      { name: 'analyze', description: 'AI 분석 API' },
      { name: 'nutrition', description: '영양 관리 API' },
      { name: 'workout', description: '운동 관리 API' },
    ],
  });
}
```

#### tsoa (대안)

tsoa는 데코레이터 기반 접근법으로, Express/Koa와 더 잘 맞습니다. Next.js App Router와는 zod-to-openapi가 더 적합합니다.

```typescript
// tsoa 예시 (참고용)
import { Controller, Get, Post, Body, Route, Tags, Security } from 'tsoa';

@Route('api/analyze')
@Tags('analyze')
export class AnalyzeController extends Controller {
  @Post('/skin')
  @Security('bearer')
  public async analyzeSkin(
    @Body() body: SkinAnalysisRequest
  ): Promise<SkinAnalysisResponse> {
    // 구현
  }
}
```

### 2.4 API 버저닝

#### URL Path 기반 버저닝 (권장)

```
/api/v1/analyze/skin  → 레거시
/api/v2/analyze/skin  → 현재
/api/analyze/skin     → v2로 리다이렉트
```

#### 버전 폐기 헤더

RFC 8594(The Sunset HTTP Header Field)를 따릅니다.

```typescript
// lib/api/versioning.ts
export interface VersionInfo {
  current: string;
  deprecated?: boolean;
  deprecatedAt?: string;  // ISO 날짜
  sunsetAt?: string;      // ISO 날짜
  upgradeUrl?: string;
}

const API_VERSIONS: Record<string, VersionInfo> = {
  'v1': {
    current: '1.0',
    deprecated: true,
    deprecatedAt: '2026-06-01',
    sunsetAt: '2026-09-01',
    upgradeUrl: '/api/v2/analyze/skin',
  },
  'v2': {
    current: '2.0',
    deprecated: false,
  },
};

export function getVersionHeaders(version: string): Record<string, string> {
  const info = API_VERSIONS[version];
  if (!info) return {};

  const headers: Record<string, string> = {
    'X-API-Version': info.current,
  };

  if (info.deprecated) {
    headers['X-Deprecated-At'] = info.deprecatedAt!;
    headers['Sunset'] = info.sunsetAt!;
    headers['X-Upgrade-To'] = info.upgradeUrl!;
    // RFC 8594 Sunset 헤더
    headers['Sunset'] = new Date(info.sunsetAt!).toUTCString();
    // Link 헤더로 대체 API 안내
    headers['Link'] = `<${info.upgradeUrl}>; rel="successor-version"`;
  }

  return headers;
}
```

```typescript
// app/api/v1/analyze/skin/route.ts
import { NextResponse } from 'next/server';
import { getVersionHeaders } from '@/lib/api/versioning';

export async function POST(req: Request) {
  // v1 로직 (레거시)
  const result = await analyzeSkinV1(req);

  return NextResponse.json(result, {
    headers: getVersionHeaders('v1'),
  });
}
```

#### 버전 문서화

```yaml
# openapi-v1.yaml (레거시 버전)
info:
  title: 이룸 API (Deprecated)
  version: 1.0.0
  x-deprecation-notice: |
    이 API 버전은 2026년 6월 1일부터 폐기 예정이며,
    2026년 9월 1일에 완전히 종료됩니다.
    /api/v2/로 마이그레이션하세요.
```

### 2.5 에러 코드 문서화

#### RFC 7807 Problem Details 형식

```typescript
// types/api/errors.ts
import { z } from 'zod';

/**
 * RFC 7807 Problem Details for HTTP APIs
 * https://datatracker.ietf.org/doc/html/rfc7807
 */
export const problemDetailsSchema = z.object({
  type: z.string().url().describe('에러 타입 URI'),
  title: z.string().describe('에러 제목'),
  status: z.number().int().describe('HTTP 상태 코드'),
  detail: z.string().describe('상세 설명'),
  instance: z.string().optional().describe('에러 발생 경로'),
  // 확장 필드
  code: z.string().describe('애플리케이션 에러 코드'),
  userMessage: z.string().describe('사용자 표시 메시지 (한국어)'),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional().describe('필드별 검증 에러'),
  traceId: z.string().optional().describe('추적 ID'),
});

export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
```

#### 에러 코드 카탈로그

```typescript
// lib/api/error-catalog.ts
export interface ErrorDefinition {
  code: string;
  httpStatus: number;
  title: string;
  description: string;
  userMessage: string;
  resolution?: string;
}

export const ERROR_CATALOG: Record<string, ErrorDefinition> = {
  // 인증/인가 에러 (AUTH_xxx)
  AUTH_001: {
    code: 'AUTH_001',
    httpStatus: 401,
    title: 'Authentication Required',
    description: 'JWT 토큰이 없거나 만료되었습니다.',
    userMessage: '로그인이 필요합니다.',
    resolution: 'Clerk 대시보드에서 새 토큰을 발급받으세요.',
  },
  AUTH_002: {
    code: 'AUTH_002',
    httpStatus: 403,
    title: 'Access Denied',
    description: '리소스에 대한 접근 권한이 없습니다.',
    userMessage: '접근 권한이 없습니다.',
    resolution: '관리자에게 권한 요청하세요.',
  },

  // 검증 에러 (VAL_xxx)
  VAL_001: {
    code: 'VAL_001',
    httpStatus: 400,
    title: 'Missing Required Field',
    description: '필수 필드가 누락되었습니다.',
    userMessage: '필수 정보를 입력해주세요.',
  },
  VAL_002: {
    code: 'VAL_002',
    httpStatus: 400,
    title: 'Invalid Image Format',
    description: '지원하지 않는 이미지 형식입니다.',
    userMessage: 'JPG, PNG 형식의 이미지만 지원합니다.',
  },
  VAL_003: {
    code: 'VAL_003',
    httpStatus: 400,
    title: 'Image Too Large',
    description: '이미지 크기가 10MB를 초과했습니다.',
    userMessage: '10MB 이하의 이미지를 업로드해주세요.',
  },

  // 리소스 에러 (RES_xxx)
  RES_001: {
    code: 'RES_001',
    httpStatus: 404,
    title: 'Resource Not Found',
    description: '요청한 리소스를 찾을 수 없습니다.',
    userMessage: '요청하신 정보를 찾을 수 없습니다.',
  },
  RES_002: {
    code: 'RES_002',
    httpStatus: 409,
    title: 'Resource Already Exists',
    description: '동일한 리소스가 이미 존재합니다.',
    userMessage: '이미 존재하는 데이터입니다.',
  },

  // Rate Limit 에러 (RATE_xxx)
  RATE_001: {
    code: 'RATE_001',
    httpStatus: 429,
    title: 'Rate Limit Exceeded',
    description: '일일 분석 한도(50회)를 초과했습니다.',
    userMessage: '오늘 분석 한도를 초과했습니다. 내일 다시 시도해주세요.',
    resolution: 'X-RateLimit-Reset 헤더의 시간 후 재시도하세요.',
  },

  // AI 서비스 에러 (AI_xxx)
  AI_001: {
    code: 'AI_001',
    httpStatus: 504,
    title: 'AI Analysis Timeout',
    description: 'Gemini API 응답 시간이 초과되었습니다.',
    userMessage: '분석 시간이 초과되었습니다. 다시 시도해주세요.',
  },
  AI_002: {
    code: 'AI_002',
    httpStatus: 503,
    title: 'AI Service Unavailable',
    description: 'Gemini API가 일시적으로 사용 불가합니다.',
    userMessage: '분석 서비스에 일시적인 문제가 있습니다.',
  },
  AI_003: {
    code: 'AI_003',
    httpStatus: 200,  // 성공이지만 Fallback 사용
    title: 'AI Fallback Used',
    description: 'AI 분석 실패로 Mock 데이터를 반환했습니다.',
    userMessage: '일시적인 문제로 예시 결과를 표시합니다.',
  },

  // 서버 에러 (SRV_xxx)
  SRV_001: {
    code: 'SRV_001',
    httpStatus: 500,
    title: 'Internal Server Error',
    description: '예상치 못한 서버 오류가 발생했습니다.',
    userMessage: '알 수 없는 오류가 발생했습니다.',
  },
  SRV_002: {
    code: 'SRV_002',
    httpStatus: 500,
    title: 'Database Error',
    description: 'Supabase 데이터베이스 오류가 발생했습니다.',
    userMessage: '데이터 처리 중 오류가 발생했습니다.',
  },
};
```

#### OpenAPI 에러 스키마 문서화

```yaml
# openapi.yaml 에러 응답 섹션
components:
  responses:
    ValidationError:
      description: 입력 검증 실패
      content:
        application/problem+json:
          schema:
            $ref: '#/components/schemas/ProblemDetails'
          examples:
            missingImage:
              summary: 이미지 누락
              value:
                type: 'https://yiroom.app/errors/VAL_001'
                title: 'Missing Required Field'
                status: 400
                detail: 'imageBase64 필드가 누락되었습니다.'
                code: 'VAL_001'
                userMessage: '이미지를 업로드해주세요.'
                instance: '/api/analyze/skin'
            invalidFormat:
              summary: 형식 오류
              value:
                type: 'https://yiroom.app/errors/VAL_002'
                title: 'Invalid Image Format'
                status: 400
                detail: '지원하지 않는 이미지 형식입니다.'
                code: 'VAL_002'
                userMessage: 'JPG, PNG 형식의 이미지만 지원합니다.'

    RateLimitExceeded:
      description: 요청 제한 초과
      headers:
        X-RateLimit-Limit:
          schema:
            type: string
          description: 총 허용 요청 수
          example: '50'
        X-RateLimit-Remaining:
          schema:
            type: string
          description: 남은 요청 수
          example: '0'
        X-RateLimit-Reset:
          schema:
            type: string
          description: 제한 리셋 시간 (Unix timestamp)
          example: '1737072000'
        Retry-After:
          schema:
            type: integer
          description: 재시도까지 대기 시간 (초)
          example: 3600
      content:
        application/problem+json:
          schema:
            $ref: '#/components/schemas/ProblemDetails'
          example:
            type: 'https://yiroom.app/errors/RATE_001'
            title: 'Rate Limit Exceeded'
            status: 429
            detail: '일일 분석 한도(50회)를 초과했습니다.'
            code: 'RATE_001'
            userMessage: '오늘 분석 한도를 초과했습니다. 내일 다시 시도해주세요.'
```

### 2.6 인터랙티브 문서

#### Swagger UI 통합

```typescript
// app/api-docs/page.tsx
'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  return (
    <div className="swagger-container">
      <SwaggerUI
        url="/api/openapi.json"
        docExpansion="list"
        defaultModelsExpandDepth={2}
        filter={true}
        tryItOutEnabled={true}
        requestInterceptor={(req) => {
          // 인증 토큰 자동 주입 (개발 환경)
          if (process.env.NODE_ENV === 'development') {
            req.headers['Authorization'] = `Bearer ${getDevToken()}`;
          }
          return req;
        }}
      />
    </div>
  );
}
```

```typescript
// app/api/openapi.json/route.ts
import { NextResponse } from 'next/server';
import { generateOpenAPISpec } from '@/lib/openapi/generate';

// 빌드 시 생성, 런타임에 캐시
let cachedSpec: object | null = null;

export async function GET() {
  if (!cachedSpec) {
    cachedSpec = generateOpenAPISpec();
  }

  return NextResponse.json(cachedSpec, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/json',
    },
  });
}
```

#### 프로덕션 보호

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// 개발 환경에서만 API 문서 공개
const isApiDocsRoute = createRouteMatcher(['/api-docs(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isApiDocsRoute(req)) {
    // 프로덕션에서는 관리자만 접근
    if (process.env.NODE_ENV === 'production') {
      const { userId } = await auth();
      const isAdmin = await checkIsAdmin(userId);
      if (!isAdmin) {
        return new Response('Not Found', { status: 404 });
      }
    }
  }
});
```

#### Scalar 대안 (모던 UI)

Scalar는 Swagger UI의 현대적 대안으로, 더 깔끔한 UI와 향상된 UX를 제공합니다.

```typescript
// app/api-docs/page.tsx (Scalar 버전)
import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';

export default function ApiDocsPage() {
  return (
    <ApiReferenceReact
      configuration={{
        spec: {
          url: '/api/openapi.json',
        },
        theme: 'purple',
        hideModels: false,
        hideDarkModeToggle: false,
        defaultHttpClient: {
          targetKey: 'javascript',
          clientKey: 'fetch',
        },
        authentication: {
          preferredSecurityScheme: 'ClerkAuth',
        },
      }}
    />
  );
}
```

---

## 3. 구현 시 필수 사항

### 초기 설정 체크리스트

- [ ] `@asteasolutions/zod-to-openapi` 패키지 설치
- [ ] `lib/openapi/registry.ts` 레지스트리 생성
- [ ] 공통 에러 스키마 등록 (`ErrorResponse`, `ProblemDetails`)
- [ ] 인증 스키마 등록 (`ClerkAuth`)
- [ ] `swagger-ui-react` 또는 `@scalar/api-reference-react` 설치

### API 라우트 문서화 체크리스트

- [ ] 각 라우트에 Zod 스키마 정의 (요청/응답)
- [ ] `registry.registerPath()` 호출로 라우트 등록
- [ ] JSDoc 주석에 `@openapi` 블록 추가 (선택)
- [ ] 모든 가능한 응답 코드 문서화 (200, 400, 401, 429, 500)
- [ ] Rate Limit 헤더 문서화

### 에러 코드 체크리스트

- [ ] 모든 에러 코드에 대한 카탈로그 항목 생성
- [ ] `userMessage` 한국어 메시지 정의
- [ ] RFC 7807 Problem Details 형식 준수
- [ ] OpenAPI examples에 에러 응답 예시 추가

### 버저닝 체크리스트

- [ ] v1, v2 경로 분리
- [ ] 폐기 예정 헤더 구현 (`X-Deprecated-At`, `Sunset`)
- [ ] 마이그레이션 가이드 문서 작성
- [ ] 버전별 OpenAPI 스펙 파일 분리

### 배포 체크리스트

- [ ] `/api/openapi.json` 엔드포인트 구현
- [ ] `/api-docs` 페이지 구현
- [ ] 프로덕션 환경 접근 제어 (관리자만)
- [ ] CORS 설정 검토

---

## 4. 코드 예시

### 4.1 완전한 Zod-to-OpenAPI 설정

```typescript
// lib/openapi/registry.ts
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Zod에 OpenAPI 확장 추가
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// 공통 스키마
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string().openapi({ example: 'VALIDATION_ERROR' }),
    message: z.string().openapi({ example: 'Invalid input' }),
    userMessage: z.string().openapi({ example: '입력 정보를 확인해주세요.' }),
    details: z.record(z.unknown()).optional(),
  }),
}).openapi('ErrorResponse');

export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
}).openapi('Pagination');

// 레지스트리에 등록
registry.register('ErrorResponse', ErrorResponseSchema);
registry.register('Pagination', PaginationSchema);

// 인증 스키마
registry.registerComponent('securitySchemes', 'ClerkAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Clerk에서 발급된 JWT 토큰',
});

// 공통 헤더
registry.registerComponent('headers', 'X-RateLimit-Limit', {
  schema: { type: 'string' },
  description: '24시간 내 총 허용 요청 수',
  example: '50',
});

registry.registerComponent('headers', 'X-RateLimit-Remaining', {
  schema: { type: 'string' },
  description: '남은 요청 수',
  example: '45',
});
```

### 4.2 분석 API 전체 문서화

```typescript
// lib/openapi/routes/analyze-skin.ts
import { registry } from '../registry';
import { z } from 'zod';

// 피부 타입 Enum
const SkinTypeEnum = z.enum([
  'normal',
  'dry',
  'oily',
  'combination',
  'sensitive',
]).openapi('SkinType');

// 메트릭 스키마
const MetricSchema = z.object({
  id: z.string().openapi({ example: 'hydration' }),
  label: z.string().openapi({ example: '수분' }),
  value: z.number().min(0).max(100).openapi({ example: 65 }),
  description: z.string().optional().openapi({ example: '피부 수분 지수' }),
}).openapi('SkinMetric');

// 요청 스키마
const SkinAnalysisRequestSchema = z.object({
  imageBase64: z.string().min(1).openapi({
    description: 'Base64 인코딩된 얼굴 이미지 (data:image/jpeg;base64,...)',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...',
  }),
  frontImageBase64: z.string().optional().openapi({
    description: '정면 이미지 (신규 멀티앵글 API)',
  }),
  leftImageBase64: z.string().optional().openapi({
    description: '좌측 이미지 (선택, 정확도 향상)',
  }),
  rightImageBase64: z.string().optional().openapi({
    description: '우측 이미지 (선택, 정확도 향상)',
  }),
  useMock: z.boolean().default(false).openapi({
    description: 'Mock 모드 강제 (개발/테스트용)',
  }),
}).openapi('SkinAnalysisRequest');

// 응답 스키마
const SkinAnalysisResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    clerk_user_id: z.string().openapi({ example: 'user_2abc123' }),
    skin_type: SkinTypeEnum,
    overall_score: z.number().min(0).max(100).openapi({ example: 72 }),
    hydration: z.number().nullable().openapi({ example: 65 }),
    oil_level: z.number().nullable().openapi({ example: 45 }),
    pores: z.number().nullable().openapi({ example: 38 }),
    pigmentation: z.number().nullable().openapi({ example: 25 }),
    wrinkles: z.number().nullable().openapi({ example: 15 }),
    sensitivity: z.number().nullable().openapi({ example: 30 }),
    created_at: z.string().datetime().openapi({ example: '2026-01-16T09:00:00Z' }),
  }),
  result: z.object({
    overallScore: z.number(),
    metrics: z.array(MetricSchema),
    skinType: SkinTypeEnum,
    skinTypeLabel: z.string().openapi({ example: '복합성' }),
    sensitivityLevel: z.enum(['low', 'medium', 'high']),
    concernAreas: z.array(z.string()).openapi({ example: ['T존', '눈가'] }),
    insight: z.string().openapi({
      example: '전체적으로 건강한 피부 상태입니다. T존의 유분 관리에 신경 쓰면 더 좋은 피부 상태를 유지할 수 있습니다.',
    }),
    recommendedIngredients: z.array(z.string()).openapi({
      example: ['히알루론산', '나이아신아마이드', '세라마이드'],
    }),
  }),
  personalColorSeason: z.string().nullable().openapi({
    description: '연동된 퍼스널컬러 시즌',
    example: 'Spring',
  }),
  usedMock: z.boolean().openapi({
    description: 'Mock 데이터 사용 여부 (AI 장애 시 true)',
  }),
  gamification: z.object({
    xpAwarded: z.number().openapi({ example: 10 }),
    badgeResults: z.array(z.object({
      badgeId: z.string(),
      awarded: z.boolean(),
    })),
  }).optional(),
}).openapi('SkinAnalysisResponse');

// 등록
registry.register('SkinType', SkinTypeEnum);
registry.register('SkinMetric', MetricSchema);
registry.register('SkinAnalysisRequest', SkinAnalysisRequestSchema);
registry.register('SkinAnalysisResponse', SkinAnalysisResponseSchema);

// 라우트 등록
registry.registerPath({
  method: 'post',
  path: '/api/analyze/skin',
  operationId: 'analyzeSkin',
  tags: ['analyze'],
  summary: 'AI 기반 피부 분석',
  description: `
Gemini 3 Flash를 사용하여 피부 상태를 종합 분석합니다.

### 분석 항목
- **피부 타입**: 건성/지성/복합성/민감성/중성
- **수분/유분 지수**: 0-100 스케일
- **모공, 주름, 색소침착**: 상태 수치화
- **맞춤 추천**: 성분, 루틴, 제품

### 멀티앵글 촬영
- 정면 이미지만으로도 분석 가능
- 좌/우 이미지 추가 시 정확도 향상 (신뢰도 high)

### Rate Limit
- 50회/24시간/사용자
- 초과 시 429 응답
  `,
  externalDocs: {
    description: 'S-1 피부 분석 스펙 문서',
    url: 'https://yiroom.app/docs/analysis/skin',
  },
  security: [{ ClerkAuth: [] }],
  request: {
    body: {
      required: true,
      description: '분석할 이미지 데이터',
      content: {
        'application/json': {
          schema: SkinAnalysisRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: '분석 성공',
      content: {
        'application/json': {
          schema: SkinAnalysisResponseSchema,
        },
      },
    },
    400: {
      description: '입력 검증 실패 (이미지 누락, 형식 오류)',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
          examples: {
            missingImage: {
              summary: '이미지 누락',
              value: {
                success: false,
                error: {
                  code: 'VAL_001',
                  message: 'Image is required',
                  userMessage: '이미지를 업로드해주세요.',
                },
              },
            },
          },
        },
      },
    },
    401: {
      description: '인증 필요',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
      },
    },
    429: {
      description: '요청 제한 초과',
      headers: {
        'X-RateLimit-Limit': { $ref: '#/components/headers/X-RateLimit-Limit' },
        'X-RateLimit-Remaining': { $ref: '#/components/headers/X-RateLimit-Remaining' },
        'Retry-After': {
          schema: { type: 'integer' },
          description: '재시도까지 대기 시간 (초)',
        },
      },
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
      },
    },
    500: {
      description: '서버 오류',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
      },
    },
  },
});

// GET 엔드포인트
registry.registerPath({
  method: 'get',
  path: '/api/analyze/skin',
  operationId: 'getSkinAnalyses',
  tags: ['analyze'],
  summary: '피부 분석 이력 조회',
  description: '사용자의 최근 피부 분석 결과 목록을 조회합니다.',
  security: [{ ClerkAuth: [] }],
  request: {
    query: z.object({
      limit: z.coerce.number().int().min(1).max(50).default(10).openapi({
        description: '조회할 분석 수',
      }),
    }),
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            data: z.array(SkinAnalysisResponseSchema.shape.data),
            count: z.number(),
          }),
        },
      },
    },
  },
});
```

### 4.3 에러 응답 유틸리티

```typescript
// lib/api/error-response.ts
import { NextResponse } from 'next/server';
import { ERROR_CATALOG, type ErrorDefinition } from './error-catalog';

interface ErrorOptions {
  details?: Record<string, unknown>;
  headers?: Record<string, string>;
  traceId?: string;
}

export function createErrorResponse(
  code: string,
  options: ErrorOptions = {}
): NextResponse {
  const definition = ERROR_CATALOG[code];

  if (!definition) {
    console.error(`[API] Unknown error code: ${code}`);
    return createErrorResponse('SRV_001', options);
  }

  const body = {
    success: false,
    error: {
      code: definition.code,
      message: definition.title,
      userMessage: definition.userMessage,
      ...(options.details && { details: options.details }),
      ...(options.traceId && { traceId: options.traceId }),
    },
  };

  return NextResponse.json(body, {
    status: definition.httpStatus,
    headers: options.headers,
  });
}

// 사용 예시
export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return createErrorResponse('AUTH_001');
  }

  const body = await req.json();

  if (!body.imageBase64) {
    return createErrorResponse('VAL_001', {
      details: { field: 'imageBase64', message: 'Required field is missing' },
    });
  }

  // Rate limit 체크
  const { success, headers } = await checkRateLimit(userId);
  if (!success) {
    return createErrorResponse('RATE_001', { headers });
  }

  // ...
}
```

---

## 5. 참고 자료

### OpenAPI 스펙 및 도구
- OpenAPI 3.1 공식 스펙: https://spec.openapis.org/oas/v3.1.0
- @asteasolutions/zod-to-openapi: https://github.com/asteasolutions/zod-to-openapi
- Swagger UI React: https://github.com/swagger-api/swagger-ui
- Scalar API Reference: https://github.com/scalar/scalar

### RFC 표준
- RFC 7807 (Problem Details): https://datatracker.ietf.org/doc/html/rfc7807
- RFC 8594 (Sunset Header): https://datatracker.ietf.org/doc/html/rfc8594
- RFC 6570 (URI Template): https://datatracker.ietf.org/doc/html/rfc6570

### Next.js 및 관련 도구
- Next.js App Router API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Zod 공식 문서: https://zod.dev/
- Clerk API 인증: https://clerk.com/docs/backend-requests/handling

### API 설계 가이드
- Microsoft REST API Guidelines: https://github.com/microsoft/api-guidelines
- Google Cloud API Design Guide: https://cloud.google.com/apis/design
- JSON:API Specification: https://jsonapi.org/

---

**Version**: 1.0 | **Created**: 2026-01-16 | **Author**: Claude Code
**이룸 프로젝트 적용 우선순위**: P1 (API 문서화는 팀 협업 및 유지보수의 기초)
