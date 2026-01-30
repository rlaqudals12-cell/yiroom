# SEC-5-R1: 환경변수 보안

> Next.js 환경변수 관리 및 시크릿 보호 전략

## 1. 리서치 배경

### 1.1 현재 상황

이룸 프로젝트는 여러 외부 서비스(Clerk, Supabase, Gemini API 등)의 API 키를 환경변수로 관리합니다. 환경변수 누출은 심각한 보안 사고로 이어집니다.

### 1.2 리서치 목표

- Next.js 환경변수 보안 이해
- NEXT_PUBLIC_ 접두사 올바른 사용
- 시크릿 관리 서비스 도입

## 2. Next.js 환경변수 기본 원리

### 2.1 서버 전용 vs 클라이언트 노출

```typescript
// 환경변수 유형별 접근 범위

// 서버 전용 (안전)
// - API 라우트, 서버 컴포넌트에서만 접근 가능
// - 클라이언트 번들에 포함되지 않음
process.env.CLERK_SECRET_KEY
process.env.SUPABASE_SERVICE_ROLE_KEY
process.env.GOOGLE_GENERATIVE_AI_API_KEY

// 클라이언트 노출 (주의)
// - NEXT_PUBLIC_ 접두사 → 브라우저에 노출
// - 빌드 시 JavaScript 번들에 인라인됨
process.env.NEXT_PUBLIC_SUPABASE_URL
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```

### 2.2 올바른 접두사 사용

```typescript
// .env.local 예시

# ============================================
# 서버 전용 시크릿 (절대 NEXT_PUBLIC_ 금지)
# ============================================
CLERK_SECRET_KEY=sk_live_***
SUPABASE_SERVICE_ROLE_KEY=eyJ***
GOOGLE_GENERATIVE_AI_API_KEY=AI***
WEBHOOK_SECRET=whsec_***
API_SIGNING_SECRET=sign_***
METADATA_ENCRYPTION_KEY=0123456789abcdef***

# ============================================
# 클라이언트 공개 가능 (public 정보만)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ***  # anon key는 RLS로 보호됨
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_***
NEXT_PUBLIC_APP_URL=https://yiroom.app

# ============================================
# 환경 설정 (민감하지 않음)
# ============================================
NODE_ENV=production
```

### 2.3 금지 패턴

```typescript
// ❌ 위험: 시크릿에 NEXT_PUBLIC_ 사용
NEXT_PUBLIC_API_SECRET=sk_live_***  // 클라이언트에 노출됨!
NEXT_PUBLIC_DB_PASSWORD=mypassword   // 절대 금지!

// ❌ 위험: 클라이언트 코드에서 서버 시크릿 참조
// components/MyComponent.tsx
const apiKey = process.env.CLERK_SECRET_KEY;  // undefined (다행히)
// 하지만 빌드 시 번들에 포함될 수 있어 위험

// ✅ 올바른 패턴: API 라우트에서만 사용
// app/api/secure/route.ts
const apiKey = process.env.CLERK_SECRET_KEY;  // 서버에서만 접근
```

## 3. 환경변수 검증

### 3.1 시작 시 검증 스크립트

```typescript
// scripts/check-env.ts
interface EnvVar {
  name: string;
  required: boolean;
  secret: boolean;  // true면 NEXT_PUBLIC_ 금지
  pattern?: RegExp;
}

const ENV_SCHEMA: EnvVar[] = [
  // 서버 시크릿
  { name: 'CLERK_SECRET_KEY', required: true, secret: true, pattern: /^sk_/ },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', required: true, secret: true, pattern: /^eyJ/ },
  { name: 'GOOGLE_GENERATIVE_AI_API_KEY', required: true, secret: true },
  { name: 'WEBHOOK_SECRET', required: true, secret: true },
  { name: 'CRON_SECRET', required: true, secret: true },

  // 클라이언트 공개
  { name: 'NEXT_PUBLIC_SUPABASE_URL', required: true, secret: false, pattern: /^https:\/\/.*supabase/ },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true, secret: false, pattern: /^eyJ/ },
  { name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', required: true, secret: false, pattern: /^pk_/ },
];

function validateEnvironment(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const envVar of ENV_SCHEMA) {
    const value = process.env[envVar.name];

    // 필수 변수 체크
    if (envVar.required && !value) {
      errors.push(`Missing required env var: ${envVar.name}`);
      continue;
    }

    if (!value) continue;

    // 시크릿이 NEXT_PUBLIC_으로 시작하는지 체크
    if (envVar.secret && envVar.name.startsWith('NEXT_PUBLIC_')) {
      errors.push(`Secret var "${envVar.name}" should not have NEXT_PUBLIC_ prefix`);
    }

    // 패턴 검증
    if (envVar.pattern && !envVar.pattern.test(value)) {
      warnings.push(`Env var "${envVar.name}" doesn't match expected pattern`);
    }

    // 시크릿 길이 체크 (너무 짧으면 의심)
    if (envVar.secret && value.length < 20) {
      warnings.push(`Secret "${envVar.name}" seems too short`);
    }
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Environment warnings:');
    warnings.forEach(w => console.warn(`  - ${w}`));
  }

  console.log('✅ Environment validation passed');
}

validateEnvironment();
```

### 3.2 런타임 검증

```typescript
// lib/env.ts
import { z } from 'zod';

// 서버 환경변수 스키마
const serverEnvSchema = z.object({
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(100),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(30),
  WEBHOOK_SECRET: z.string().min(20),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

// 클라이언트 환경변수 스키마
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().startsWith('eyJ'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

// 서버 환경변수 (서버에서만 호출)
export function getServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid server environment:', parsed.error.flatten());
    throw new Error('Invalid server environment configuration');
  }

  return parsed.data;
}

// 클라이언트 환경변수 (어디서든 안전하게 호출)
export function getClientEnv() {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!parsed.success) {
    console.error('Invalid client environment:', parsed.error.flatten());
    throw new Error('Invalid client environment configuration');
  }

  return parsed.data;
}
```

## 4. 시크릿 관리 서비스

### 4.1 Vercel 환경변수 관리

```bash
# Vercel CLI로 환경변수 관리

# 환경변수 추가 (프로덕션)
vercel env add CLERK_SECRET_KEY production

# 환경변수 목록 확인
vercel env ls

# 환경변수 가져오기 (개발용)
vercel env pull .env.local

# 환경변수 삭제
vercel env rm CLERK_SECRET_KEY production
```

### 4.2 환경별 분리

```typescript
// 환경별 환경변수 파일

// .env                - 기본값 (커밋 가능, 민감정보 없음)
// .env.local          - 로컬 개발 (gitignore)
// .env.development    - 개발 환경
// .env.production     - 프로덕션 환경 (Vercel에서 관리)
// .env.test           - 테스트 환경

// .env (커밋 가능)
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

// .env.local (gitignore, 개발용 시크릿)
CLERK_SECRET_KEY=sk_test_***
SUPABASE_SERVICE_ROLE_KEY=eyJ***
```

### 4.3 .gitignore 설정

```gitignore
# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# IDE
.vscode/settings.json
.idea/
```

## 5. Data Access Layer 패턴

### 5.1 시크릿 접근 제한

```typescript
// lib/data-access/index.ts
// 모든 시크릿 접근은 이 레이어를 통해서만

import { getServerEnv } from '@/lib/env';

// 환경변수 직접 접근 금지, DAL 함수만 사용
export const dal = {
  // Supabase Admin 클라이언트
  getSupabaseAdmin() {
    const env = getServerEnv();
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      env.SUPABASE_SERVICE_ROLE_KEY
    );
  },

  // Gemini API 키
  getGeminiApiKey() {
    return getServerEnv().GOOGLE_GENERATIVE_AI_API_KEY;
  },

  // Webhook 시크릿
  getWebhookSecret() {
    return getServerEnv().WEBHOOK_SECRET;
  },
};
```

### 5.2 server-only 보호

```typescript
// lib/data-access/server-only.ts
import 'server-only';  // 클라이언트 번들에 포함되면 빌드 에러

import { dal } from './index';

export { dal };

// 사용 예시 (app/api/route.ts에서만 import 가능)
// import { dal } from '@/lib/data-access/server-only';
```

## 6. React Taint API

### 6.1 객체 오염 방지

```typescript
// lib/taint.ts (React 19+)
import { experimental_taintObjectReference } from 'react';

// 민감한 객체가 클라이언트로 전달되는 것 방지
export function taintSecrets<T extends object>(obj: T, message: string): T {
  experimental_taintObjectReference(
    message,
    obj
  );
  return obj;
}

// 사용 예시
const sensitiveData = taintSecrets(
  { apiKey: process.env.API_KEY },
  'API key cannot be passed to client components'
);
```

### 6.2 특정 값 오염 방지

```typescript
// lib/taint-values.ts
import { experimental_taintUniqueValue } from 'react';

// 특정 민감한 값이 클라이언트로 전달되는 것 방지
export function taintValue(value: string, message: string): void {
  experimental_taintUniqueValue(
    message,
    globalThis,
    value
  );
}

// 앱 초기화 시 실행
export function taintAllSecrets(): void {
  // 모든 시크릿 값 오염 처리
  const secrets = [
    process.env.CLERK_SECRET_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  ];

  secrets.filter(Boolean).forEach(secret => {
    taintValue(secret!, 'This secret cannot be passed to client');
  });
}
```

## 7. 시크릿 로테이션

### 7.1 로테이션 전략

```typescript
// 시크릿 로테이션 주기

const ROTATION_POLICY = {
  // API 키: 90일마다
  apiKeys: {
    interval: 90 * 24 * 60 * 60 * 1000,  // 90일
    grace: 7 * 24 * 60 * 60 * 1000,       // 7일 유예
  },

  // 웹훅 시크릿: 30일마다
  webhookSecrets: {
    interval: 30 * 24 * 60 * 60 * 1000,
    grace: 3 * 24 * 60 * 60 * 1000,
  },

  // 암호화 키: 180일마다
  encryptionKeys: {
    interval: 180 * 24 * 60 * 60 * 1000,
    grace: 14 * 24 * 60 * 60 * 1000,
  },
};
```

### 7.2 무중단 로테이션

```typescript
// lib/secrets/rotation.ts

// 듀얼 키 지원 (로테이션 중 두 키 모두 유효)
export function verifyWithRotation(
  token: string,
  currentKey: string,
  previousKey?: string
): boolean {
  // 현재 키로 먼저 시도
  if (verify(token, currentKey)) {
    return true;
  }

  // 이전 키로 시도 (유예 기간 중)
  if (previousKey && verify(token, previousKey)) {
    console.warn('[Security] Token verified with previous key - rotation in progress');
    return true;
  }

  return false;
}
```

## 8. 빌드 시 검증

### 8.1 Pre-build 스크립트

```json
// package.json
{
  "scripts": {
    "prebuild": "node scripts/check-env.js",
    "build": "next build",
    "dev": "node scripts/check-env.js && next dev"
  }
}
```

### 8.2 CI/CD 검증

```yaml
# .github/workflows/ci.yml
jobs:
  security-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check for hardcoded secrets
        run: |
          # 하드코딩된 시크릿 패턴 검사
          if grep -rE "(sk_live_|sk_test_|service_role)" --include="*.ts" --include="*.tsx" .; then
            echo "❌ Potential hardcoded secrets found!"
            exit 1
          fi

      - name: Verify environment structure
        run: |
          # NEXT_PUBLIC_에 시크릿 패턴이 있는지 검사
          if grep -rE "NEXT_PUBLIC_.*(SECRET|KEY|PASSWORD)" --include=".env*" .; then
            echo "❌ Secret in NEXT_PUBLIC_ variable!"
            exit 1
          fi
```

## 9. 구현 체크리스트

### 9.1 P0 (필수 구현)

- [ ] NEXT_PUBLIC_ 접두사 올바르게 사용
- [ ] .env.local gitignore 확인
- [ ] 환경변수 검증 스크립트
- [ ] Vercel 환경변수로 프로덕션 시크릿 관리

### 9.2 P1 (권장 구현)

- [ ] Zod 런타임 환경변수 검증
- [ ] Data Access Layer 패턴 적용
- [ ] server-only 패키지 사용
- [ ] CI/CD 시크릿 검사

### 9.3 P2 (고급 구현)

- [ ] React Taint API 적용
- [ ] 시크릿 로테이션 정책
- [ ] 외부 시크릿 관리 서비스 (Vault)
- [ ] 시크릿 접근 감사 로깅

## 10. 참고 자료

- [Next.js Environment Variables](https://nextjs.org/docs/app/guides/environment-variables)
- [Next.js Data Security](https://nextjs.org/docs/app/guides/data-security)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

**Version**: 1.0 | **Created**: 2026-01-19
**Category**: 보안 심화 | **Priority**: P0
