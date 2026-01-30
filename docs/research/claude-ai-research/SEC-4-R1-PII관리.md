# SEC-4-R1: PII 관리

> 개인식별정보(PII) 마스킹, 익명화, 가명처리 전략

## 1. 리서치 배경

### 1.1 현재 상황

이룸 프로젝트는 사용자의 얼굴 이미지, 생년월일, 피부/체형 분석 결과 등 민감한 PII를 처리합니다. GDPR과 개인정보보호법 준수가 필수입니다.

### 1.2 리서치 목표

- PII 데이터 분류 체계 수립
- 마스킹/익명화 전략 정의
- 로깅 시 PII 자동 필터링

## 2. PII 분류 체계

### 2.1 데이터 민감도 분류

```typescript
// types/pii.ts

// PII 민감도 레벨
export enum PIISensitivity {
  // 높음: 생체 데이터, 건강 정보
  HIGH = 'high',
  // 중간: 개인 식별 가능 정보
  MEDIUM = 'medium',
  // 낮음: 간접 식별 정보
  LOW = 'low',
  // 비PII: 민감하지 않은 데이터
  NONE = 'none',
}

// 이룸 프로젝트 PII 분류
export const PII_CLASSIFICATION = {
  // 높은 민감도 (생체 데이터)
  high: [
    'facial_image',           // 얼굴 이미지
    'skin_analysis_image',    // 피부 분석 이미지
    'body_analysis_image',    // 체형 분석 이미지
    'health_data',            // 건강 관련 데이터
  ],

  // 중간 민감도 (개인 식별)
  medium: [
    'email',                  // 이메일
    'phone_number',           // 전화번호
    'birthdate',              // 생년월일
    'full_name',              // 성명
    'address',                // 주소
    'clerk_user_id',          // 사용자 ID
  ],

  // 낮은 민감도 (간접 식별)
  low: [
    'gender',                 // 성별
    'age_range',              // 연령대
    'skin_type',              // 피부 타입 (복합성 등)
    'personal_color_season',  // 퍼스널컬러 시즌
  ],

  // 비민감 데이터
  none: [
    'analysis_timestamp',     // 분석 시간
    'product_recommendation', // 제품 추천 (비식별)
    'general_tips',           // 일반 팁
  ],
} as const;
```

### 2.2 민감도별 처리 정책

```typescript
// lib/pii/policy.ts

export interface PIIPolicy {
  retention: number;        // 보관 기간 (일)
  encryption: boolean;      // 암호화 필수 여부
  logging: 'mask' | 'hash' | 'exclude';  // 로깅 정책
  exportable: boolean;      // 데이터 포터빌리티
  deletable: boolean;       // 삭제 요청 가능
}

export const PII_POLICIES: Record<PIISensitivity, PIIPolicy> = {
  [PIISensitivity.HIGH]: {
    retention: 30,           // 30일 보관
    encryption: true,        // 필수 암호화
    logging: 'exclude',      // 로그 제외
    exportable: true,        // 내보내기 가능
    deletable: true,         // 즉시 삭제 가능
  },

  [PIISensitivity.MEDIUM]: {
    retention: 365,          // 1년 보관
    encryption: true,        // 필수 암호화
    logging: 'hash',         // 해시화 로깅
    exportable: true,
    deletable: true,
  },

  [PIISensitivity.LOW]: {
    retention: 730,          // 2년 보관
    encryption: false,       // 암호화 선택
    logging: 'mask',         // 마스킹 로깅
    exportable: true,
    deletable: true,
  },

  [PIISensitivity.NONE]: {
    retention: -1,           // 무제한
    encryption: false,
    logging: 'mask',         // 일반 로깅 허용
    exportable: true,
    deletable: true,
  },
};
```

## 3. PII 마스킹

### 3.1 마스킹 유틸리티

```typescript
// lib/utils/redact-pii.ts

interface RedactOptions {
  preserveLength?: boolean;
  preserveFormat?: boolean;
}

// 이메일 마스킹: test@example.com → t***@e***.com
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const [domainName, tld] = domain.split('.');

  return `${local[0]}***@${domainName[0]}***.${tld}`;
}

// 전화번호 마스킹: 010-1234-5678 → 010-****-5678
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return '***';

  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}

// 이름 마스킹: 홍길동 → 홍**
export function maskName(name: string): string {
  if (name.length <= 1) return '*';
  return `${name[0]}${'*'.repeat(name.length - 1)}`;
}

// 생년월일 마스킹: 1990-05-15 → 1990-**-**
export function maskBirthdate(date: string): string {
  const parts = date.split('-');
  if (parts.length !== 3) return '****-**-**';
  return `${parts[0]}-**-**`;
}

// User ID 마스킹: user_abc123xyz → user_abc***xyz
export function maskUserId(userId: string): string {
  if (userId.length < 10) return '***';
  return `${userId.slice(0, 8)}***${userId.slice(-3)}`;
}

// URL 마스킹 (서명된 URL 토큰 제거)
export function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // 토큰 파라미터 제거
    parsed.searchParams.delete('token');
    parsed.searchParams.delete('signature');
    parsed.searchParams.delete('t');
    return parsed.toString().replace(/\?$/, '');
  } catch {
    return '[INVALID_URL]';
  }
}
```

### 3.2 로깅용 PII 필터

```typescript
// lib/utils/sanitize-for-logging.ts
import {
  maskEmail,
  maskPhone,
  maskName,
  maskUserId,
  maskUrl,
} from './redact-pii';

type Primitive = string | number | boolean | null | undefined;
type JsonValue = Primitive | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

// PII 필드 패턴
const PII_PATTERNS = {
  email: /email/i,
  phone: /phone|mobile|tel/i,
  name: /name|fullname/i,
  userId: /user_?id|clerk_?user/i,
  image: /image|photo|picture/i,
  url: /url|path|src/i,
  token: /token|secret|key|password/i,
  birthdate: /birth|dob|birthday/i,
};

export function sanitizeForLogging(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeForLogging);
  }

  const result: JsonObject = {};

  for (const [key, value] of Object.entries(data as JsonObject)) {
    result[key] = sanitizeField(key, value);
  }

  return result;
}

function sanitizeField(key: string, value: JsonValue): JsonValue {
  if (value === null || value === undefined) {
    return value;
  }

  // 중첩 객체 재귀 처리
  if (typeof value === 'object') {
    return sanitizeForLogging(value);
  }

  if (typeof value !== 'string') {
    return value;
  }

  // 패턴별 마스킹
  if (PII_PATTERNS.email.test(key)) {
    return maskEmail(value);
  }
  if (PII_PATTERNS.phone.test(key)) {
    return maskPhone(value);
  }
  if (PII_PATTERNS.name.test(key)) {
    return maskName(value);
  }
  if (PII_PATTERNS.userId.test(key)) {
    return maskUserId(value);
  }
  if (PII_PATTERNS.url.test(key)) {
    return maskUrl(value);
  }
  if (PII_PATTERNS.token.test(key)) {
    return '[REDACTED]';
  }
  if (PII_PATTERNS.birthdate.test(key)) {
    return maskBirthdate(value);
  }
  if (PII_PATTERNS.image.test(key)) {
    return '[IMAGE_DATA]';
  }

  return value;
}
```

### 3.3 로거 통합

```typescript
// lib/logger.ts
import { sanitizeForLogging } from './utils/sanitize-for-logging';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (module: string, message: string, data?: unknown) => void;
  info: (module: string, message: string, data?: unknown) => void;
  warn: (module: string, message: string, data?: unknown) => void;
  error: (module: string, message: string, error?: unknown) => void;
}

function createLogger(): Logger {
  const log = (level: LogLevel, module: string, message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();

    // PII 자동 마스킹
    const sanitizedData = data ? sanitizeForLogging(data) : undefined;

    const logEntry = {
      timestamp,
      level,
      module,
      message,
      ...(sanitizedData && { data: sanitizedData }),
    };

    // 환경별 출력
    if (process.env.NODE_ENV === 'production') {
      // 프로덕션: JSON 포맷 (로그 수집기용)
      console[level](JSON.stringify(logEntry));
    } else {
      // 개발: 가독성 포맷
      console[level](`[${module}] ${message}`, sanitizedData || '');
    }
  };

  return {
    debug: (module, message, data) => log('debug', module, message, data),
    info: (module, message, data) => log('info', module, message, data),
    warn: (module, message, data) => log('warn', module, message, data),
    error: (module, message, error) => log('error', module, message, error),
  };
}

export const logger = createLogger();
```

## 4. 데이터 익명화

### 4.1 익명화 vs 가명처리

```typescript
// lib/pii/anonymization.ts

// 익명화: 복원 불가능 (통계/분석용)
export interface AnonymizedData {
  ageRange: string;           // '20-29' (정확한 나이 대신)
  skinTypeCategory: string;   // '복합성' (세부 점수 없이)
  regionCode: string;         // '서울' (상세 주소 없이)
}

// 가명처리: 키로 복원 가능 (연구/개선용)
export interface PseudonymizedData {
  pseudoId: string;           // 'PSEUDO_abc123' (실제 ID 대신)
  hashedEmail: string;        // SHA256 해시
  encryptedData: string;      // 복호화 가능한 암호화
}
```

### 4.2 익명화 함수

```typescript
// lib/pii/anonymize.ts
import crypto from 'crypto';

// 나이 → 연령대 변환
export function anonymizeAge(birthdate: string): string {
  const birth = new Date(birthdate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();

  const decade = Math.floor(age / 10) * 10;
  return `${decade}-${decade + 9}`;
}

// 이메일 도메인만 추출
export function anonymizeEmailDomain(email: string): string {
  const domain = email.split('@')[1];
  // 주요 도메인만 유지, 나머지는 'other'
  const knownDomains = ['gmail.com', 'naver.com', 'kakao.com', 'daum.net'];
  return knownDomains.includes(domain) ? domain : 'other';
}

// k-익명성을 위한 일반화
export function generalizeForKAnonymity(
  value: number,
  bucketSize: number
): string {
  const lowerBound = Math.floor(value / bucketSize) * bucketSize;
  const upperBound = lowerBound + bucketSize - 1;
  return `${lowerBound}-${upperBound}`;
}

// 분석 결과 익명화 (통계용)
export function anonymizeAnalysisResult(result: SkinAnalysisResult): AnonymizedAnalysis {
  return {
    // 정확한 점수 대신 범위
    hydrationLevel: generalizeForKAnonymity(result.scores.hydration, 10),
    skinTypeCategory: result.skinType,  // 이미 카테고리
    analysisMonth: result.createdAt.slice(0, 7),  // YYYY-MM만
    // 개인 식별 정보 제거
    userId: undefined,
    imageUrl: undefined,
  };
}
```

### 4.3 가명처리 함수

```typescript
// lib/pii/pseudonymize.ts
import crypto from 'crypto';

const PSEUDO_SALT = process.env.PSEUDONYMIZATION_SALT!;

// 일방향 가명처리 (복원 불가, 일관성 유지)
export function pseudonymizeOneWay(value: string): string {
  return crypto
    .createHmac('sha256', PSEUDO_SALT)
    .update(value)
    .digest('hex')
    .slice(0, 16);  // 충분한 고유성 유지
}

// 양방향 가명처리 (복원 가능, 연구용)
export function pseudonymizeTwoWay(
  value: string,
  encryptionKey: string
): { pseudoId: string; encrypted: string } {
  const pseudoId = `PSEUDO_${pseudonymizeOneWay(value)}`;

  // AES-256-GCM 암호화
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(encryptionKey, 'hex'),
    iv
  );

  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    pseudoId,
    encrypted: `${iv.toString('hex')}:${encrypted}:${tag}`,
  };
}

// 가명 복원 (권한 있는 연구자만)
export function depseudonymize(
  encrypted: string,
  encryptionKey: string
): string {
  const [ivHex, data, tagHex] = encrypted.split(':');

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(encryptionKey, 'hex'),
    Buffer.from(ivHex, 'hex')
  );

  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

## 5. GDPR 권리 구현

### 5.1 데이터 접근 요청 (Right to Access)

```typescript
// lib/gdpr/data-access.ts
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function exportUserData(userId: string): Promise<UserDataExport> {
  const supabase = createSupabaseServerClient();

  // 모든 사용자 데이터 수집
  const [
    profile,
    skinAnalyses,
    colorAnalyses,
    bodyAnalyses,
    productHistory,
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('clerk_user_id', userId).single(),
    supabase.from('skin_analysis_results').select('*').eq('clerk_user_id', userId),
    supabase.from('personal_color_assessments').select('*').eq('clerk_user_id', userId),
    supabase.from('body_analysis_results').select('*').eq('clerk_user_id', userId),
    supabase.from('product_view_history').select('*').eq('clerk_user_id', userId),
  ]);

  // JSON 포맷으로 내보내기
  return {
    exportDate: new Date().toISOString(),
    userId,
    profile: profile.data,
    analyses: {
      skin: skinAnalyses.data,
      personalColor: colorAnalyses.data,
      body: bodyAnalyses.data,
    },
    history: {
      products: productHistory.data,
    },
  };
}
```

### 5.2 데이터 삭제 요청 (Right to Erasure)

```typescript
// lib/gdpr/data-deletion.ts

export async function deleteAllUserData(
  userId: string
): Promise<DeletionResult> {
  const supabase = createSupabaseServerClient();
  const results: DeletionResult = {
    success: true,
    deletedTables: [],
    errors: [],
  };

  // 삭제 대상 테이블 (순서 중요: 외래키 의존성)
  const tablesToDelete = [
    'product_view_history',
    'supplement_recommendations',
    'nutrition_analyses',
    'body_analysis_results',
    'personal_color_assessments',
    'skin_analysis_results',
    'user_profiles',
  ];

  for (const table of tablesToDelete) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('clerk_user_id', userId);

    if (error) {
      results.errors.push({ table, error: error.message });
    } else {
      results.deletedTables.push(table);
    }
  }

  // Storage 이미지 삭제
  const { data: files } = await supabase.storage
    .from('user-images')
    .list(userId);

  if (files?.length) {
    const filePaths = files.map(f => `${userId}/${f.name}`);
    await supabase.storage.from('user-images').remove(filePaths);
  }

  // 감사 로그 (삭제 요청 기록)
  await logAudit('gdpr.data_deleted', {
    userId,
    deletedTables: results.deletedTables,
    deletedAt: new Date().toISOString(),
  });

  results.success = results.errors.length === 0;
  return results;
}
```

### 5.3 동의 철회

```typescript
// lib/gdpr/consent.ts

export async function withdrawConsent(
  userId: string,
  consentType: 'marketing' | 'analytics' | 'all'
): Promise<void> {
  const supabase = createSupabaseServerClient();

  if (consentType === 'all') {
    // 모든 동의 철회 → 데이터 삭제
    await deleteAllUserData(userId);
    return;
  }

  // 특정 동의만 철회
  await supabase
    .from('user_consents')
    .update({
      [consentType]: false,
      withdrawn_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', userId);

  // 해당 목적의 데이터 처리 중단
  if (consentType === 'analytics') {
    await supabase
      .from('user_profiles')
      .update({ analytics_enabled: false })
      .eq('clerk_user_id', userId);
  }
}
```

## 6. 구현 체크리스트

### 6.1 P0 (필수 구현)

- [ ] PII 분류 체계 정의
- [ ] 로깅 시 자동 PII 마스킹
- [ ] 민감 데이터 암호화 저장
- [ ] 데이터 삭제 API 구현

### 6.2 P1 (권장 구현)

- [ ] 데이터 내보내기 API (GDPR)
- [ ] 동의 관리 시스템
- [ ] 익명화 통계 파이프라인
- [ ] 보존 기간 자동 삭제

### 6.3 P2 (고급 구현)

- [ ] k-익명성 적용
- [ ] 차등 프라이버시 (DP) 적용
- [ ] 가명처리 연구 데이터셋
- [ ] PII 접근 감사 대시보드

## 7. 참고 자료

- [GDPR Article 17 - Right to Erasure](https://gdpr-info.eu/art-17-gdpr/)
- [NIST Privacy Framework](https://www.nist.gov/privacy-framework)
- [K-Anonymity](https://en.wikipedia.org/wiki/K-anonymity)

---

**Version**: 1.0 | **Created**: 2026-01-19
**Category**: 보안 심화 | **Priority**: P0
