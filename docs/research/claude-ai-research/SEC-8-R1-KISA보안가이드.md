# SEC-8-R1: KISA 보안 가이드

> 한국인터넷진흥원 보안 가이드라인 및 국내 규정 준수

## 1. 리서치 배경

### 1.1 주요 KISA 가이드라인

한국인터넷진흥원(KISA)은 다음 주요 보안 가이드를 제공합니다:

- 웹 사이트 개발·운영을 위한 개인정보보호 가이드
- 소프트웨어 보안약점 진단가이드 (행정안전부)
- 생성형 AI 개발·활용을 위한 개인정보 처리 안내서 (2025.8)
- ISMS-P (정보보호 및 개인정보보호 관리체계) 인증
- 클라우드 서비스 보안인증제 (CSAP)

### 1.2 리서치 목표

- 국내 개인정보보호법 준수
- KISA 보안 체크리스트 적용
- 생성형 AI 서비스 보안 요건 충족

## 2. 웹 개발 보안 가이드

### 2.1 개발 단계별 보안 요구사항

```typescript
// KISA 웹 사이트 개발·운영 가이드 기반

const DEVELOPMENT_SECURITY = {
  // 기획 단계
  planning: [
    '개인정보 수집 항목 최소화',
    '필수/선택 항목 명확히 구분',
    '수집 목적 명시',
    '보유 기간 설정',
  ],

  // 설계 단계
  design: [
    '초기 화면: 개인정보처리방침 링크 제공',
    '회원가입: 필수/선택 항목 구분, 동의 체크박스',
    '회원정보 조회: 본인 확인 후 접근',
    '회원정보 수정: 변경 이력 기록',
    '회원탈퇴: 즉시 삭제 또는 분리 보관',
    '로그인: 비밀번호 암호화 저장, 실패 제한',
  ],

  // 구현 단계
  implementation: [
    '입력값 검증 (서버 사이드 필수)',
    'SQL Injection 방지',
    'XSS 방지',
    '암호화 저장 (비밀번호, 민감정보)',
    '세션 관리 (타임아웃, 재생성)',
    '에러 메시지 최소화 (정보 노출 방지)',
  ],
};
```

### 2.2 페이지별 보안 체크리스트

```typescript
// 회원가입 페이지 보안 요구사항
const SIGNUP_REQUIREMENTS = {
  ui: [
    '필수 항목(*) 명확히 표시',
    '선택 항목 별도 구분',
    '개인정보 수집 동의 체크박스 (사전 체크 금지)',
    '개인정보처리방침 전문 링크',
    '제3자 제공 동의 별도 체크박스',
  ],

  validation: [
    '이메일 형식 검증',
    '비밀번호 복잡성 검증 (8자 이상, 특수문자 포함)',
    '비밀번호 확인 일치 검증',
    '중복 가입 방지',
  ],

  security: [
    '비밀번호 일방향 암호화 (bcrypt/Argon2)',
    'CAPTCHA 또는 reCAPTCHA',
    '가입 시도 Rate Limiting',
    'HTTPS 필수',
  ],
};

// 로그인 페이지 보안 요구사항
const LOGIN_REQUIREMENTS = {
  security: [
    '로그인 실패 5회 시 계정 잠금 또는 지연',
    '로그인 실패 로그 기록',
    '비밀번호 평문 전송 금지 (HTTPS)',
    '자동 로그인 시 안전한 토큰 사용',
    '로그인 성공 시 세션 ID 재생성',
  ],

  additional: [
    '비밀번호 찾기: 본인 인증 필수',
    '비밀번호 변경: 기존 비밀번호 확인',
    '이상 로그인 감지 시 알림',
  ],
};
```

## 3. 소프트웨어 보안약점 진단

### 3.1 입력 데이터 검증

```typescript
// lib/validation/kisa-patterns.ts

// KISA 소프트웨어 보안약점 진단가이드 기반

// SQL Injection 방지
// ❌ 위험한 패턴
const unsafeQuery = `SELECT * FROM users WHERE id = '${userId}'`;

// ✅ 안전한 패턴 (파라미터화 쿼리)
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);

// XSS 방지
// ❌ 위험한 패턴
const unsafeHtml = `<div>${userInput}</div>`;

// ✅ 안전한 패턴 (React 자동 이스케이프)
return <div>{userInput}</div>;

// 경로 조작 방지
export function sanitizePath(userPath: string): string {
  // 상위 디렉토리 이동 차단
  if (userPath.includes('..') || userPath.includes('~')) {
    throw new Error('Invalid path');
  }

  // 절대 경로 차단
  if (userPath.startsWith('/') || /^[a-zA-Z]:/.test(userPath)) {
    throw new Error('Absolute path not allowed');
  }

  // 허용된 확장자만
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = userPath.slice(userPath.lastIndexOf('.')).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    throw new Error('Invalid file extension');
  }

  return userPath;
}
```

### 3.2 인증 및 접근 제어

```typescript
// lib/auth/kisa-auth.ts

// KISA 가이드: 인증 보안

// 비밀번호 정책
export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  forbiddenPatterns: [
    /(.)\1{2,}/,      // 같은 문자 3회 이상 반복
    /^(012|123|234|345|456|567|678|789|890)/,  // 연속 숫자
    /^(abc|bcd|cde|def|efg)/i,  // 연속 문자
  ],
};

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`최소 ${PASSWORD_POLICY.minLength}자 이상이어야 합니다.`);
  }

  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('대문자를 포함해야 합니다.');
  }

  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('소문자를 포함해야 합니다.');
  }

  if (PASSWORD_POLICY.requireNumber && !/[0-9]/.test(password)) {
    errors.push('숫자를 포함해야 합니다.');
  }

  if (PASSWORD_POLICY.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('특수문자를 포함해야 합니다.');
  }

  for (const pattern of PASSWORD_POLICY.forbiddenPatterns) {
    if (pattern.test(password)) {
      errors.push('연속되거나 반복되는 문자/숫자는 사용할 수 없습니다.');
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}

// 세션 관리
export const SESSION_CONFIG = {
  // 세션 타임아웃 (비활성 30분)
  inactiveTimeout: 30 * 60 * 1000,

  // 절대 타임아웃 (최대 8시간)
  absoluteTimeout: 8 * 60 * 60 * 1000,

  // 로그인 시 세션 ID 재생성
  regenerateOnLogin: true,

  // 권한 변경 시 세션 ID 재생성
  regenerateOnPrivilegeChange: true,
};
```

### 3.3 암호화

```typescript
// lib/crypto/kisa-crypto.ts

// KISA 가이드: 암호화 요구사항

// 비밀번호 암호화 (bcrypt)
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;  // KISA 권장: 10 이상

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 개인정보 암호화 (AES-256)
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encryptPII(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag().toString('hex');

  // iv:encrypted:tag 형식으로 저장
  return `${iv.toString('hex')}:${encrypted}:${tag}`;
}

export function decryptPII(ciphertext: string): string {
  const [ivHex, encrypted, tagHex] = ciphertext.split(':');

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

## 4. 생성형 AI 보안 가이드

### 4.1 개인정보 처리 안내서 (2025.8)

```typescript
// KISA/개인정보보호위원회 생성형 AI 가이드

const AI_PRIVACY_REQUIREMENTS = {
  // 수집 단계
  collection: {
    principles: [
      '학습용 데이터 수집 시 법적 근거 필수',
      '개인정보 수집 최소화',
      '민감정보 처리 시 명시적 동의',
    ],
    implementation: [
      '얼굴 이미지 수집 전 동의 UI',
      '수집 목적 명확히 고지',
      '제3자 제공 시 별도 동의',
    ],
  },

  // 처리/학습 단계
  processing: {
    principles: [
      '학습 데이터에서 개인정보 비식별화',
      '데이터 주권 보호 (해외 전송 시 동의)',
      'AI 출력물에 개인정보 포함 방지',
    ],
    implementation: [
      '이미지 처리 후 원본 삭제',
      '분석 결과만 저장 (이미지 미저장)',
      '프롬프트에 개인정보 포함 금지',
    ],
  },

  // 서비스 제공 단계
  service: {
    principles: [
      'AI 결과의 설명 가능성 확보',
      '자동화된 의사결정 고지',
      '이의 제기 권리 보장',
    ],
    implementation: [
      '분석 결과에 근거 설명 포함',
      '"AI가 분석한 결과입니다" 고지',
      '결과에 이의가 있으면 문의 채널 제공',
    ],
  },
};
```

### 4.2 이룸 서비스 적용

```typescript
// lib/ai/kisa-compliance.ts

// 생성형 AI 사용 전 체크리스트
export async function preAIAnalysisChecks(
  userId: string,
  imageData: string
): Promise<{ allowed: boolean; reason?: string }> {
  // 1. 동의 확인
  const consent = await getUserConsent(userId, 'ai_analysis');
  if (!consent) {
    return { allowed: false, reason: 'AI 분석 동의 필요' };
  }

  // 2. 이미지에 제3자 얼굴 포함 여부 경고
  // (사용자가 본인 얼굴만 촬영했는지 확인 UI)

  // 3. 데이터 주권 고지 확인 (해외 서버 전송)
  const dataTransferConsent = await getUserConsent(userId, 'overseas_transfer');
  if (!dataTransferConsent) {
    return { allowed: false, reason: '해외 데이터 전송 동의 필요' };
  }

  return { allowed: true };
}

// AI 결과 반환 시 필수 고지
export function addAIDisclosure<T extends object>(result: T): T & AIDisclosure {
  return {
    ...result,
    _aiDisclosure: {
      isAIGenerated: true,
      disclaimer: '이 결과는 AI가 분석한 것으로, 참고용입니다.',
      analysisDate: new Date().toISOString(),
      modelInfo: 'Google Gemini 2.0 Flash',
      feedbackChannel: 'support@yiroom.app',
    },
  };
}

interface AIDisclosure {
  _aiDisclosure: {
    isAIGenerated: boolean;
    disclaimer: string;
    analysisDate: string;
    modelInfo: string;
    feedbackChannel: string;
  };
}
```

## 5. 개인정보 생명주기 관리

### 5.1 수집

```typescript
// 수집 시 KISA 요구사항

const COLLECTION_REQUIREMENTS = {
  // 필수 고지 사항
  notice: [
    '수집 항목',
    '수집 목적',
    '보유 기간',
    '동의 거부 권리 및 불이익',
  ],

  // UI 요구사항
  ui: [
    '동의 체크박스 사전 체크 금지',
    '필수/선택 동의 분리',
    '전문 확인 링크 제공',
  ],
};

// 예시: 회원가입 동의 UI
const SIGNUP_CONSENTS = [
  {
    id: 'terms',
    type: 'required' as const,
    title: '서비스 이용약관 동의',
    link: '/terms',
  },
  {
    id: 'privacy',
    type: 'required' as const,
    title: '개인정보 수집 및 이용 동의',
    link: '/privacy',
    items: ['이메일', '이름'],
    purpose: '회원 관리',
    retention: '회원 탈퇴 시까지',
  },
  {
    id: 'ai_analysis',
    type: 'required' as const,
    title: '얼굴 이미지 수집 및 AI 분석 동의',
    link: '/privacy#ai-analysis',
    items: ['얼굴 이미지'],
    purpose: 'AI 피부/퍼스널컬러 분석',
    retention: '분석 완료 후 30일',
  },
  {
    id: 'marketing',
    type: 'optional' as const,
    title: '마케팅 정보 수신 동의',
    link: '/privacy#marketing',
  },
];
```

### 5.2 보유 및 파기

```typescript
// lib/data/retention.ts

// KISA 가이드: 보유 기간 및 파기

const RETENTION_POLICY = {
  // 얼굴 이미지: 분석 완료 후 30일
  facial_image: {
    period: 30 * 24 * 60 * 60 * 1000,  // 30일 (ms)
    trigger: 'analysis_complete',
    action: 'delete',
  },

  // 분석 결과: 회원 탈퇴 시까지
  analysis_result: {
    period: -1,  // 무제한
    trigger: 'account_deletion',
    action: 'delete',
  },

  // 접속 로그: 1년
  access_log: {
    period: 365 * 24 * 60 * 60 * 1000,
    trigger: 'creation',
    action: 'delete',
  },

  // 탈퇴 회원 정보: 별도 보관 후 삭제
  deleted_account: {
    period: 30 * 24 * 60 * 60 * 1000,  // 30일
    trigger: 'account_deletion',
    action: 'permanent_delete',
    storage: 'separate',  // 분리 보관
  },
};

// 자동 파기 Cron Job
export async function runRetentionCleanup(): Promise<RetentionReport> {
  const report: RetentionReport = {
    processedAt: new Date().toISOString(),
    deletedCounts: {},
  };

  // 1. 만료된 이미지 삭제
  const imageResult = await deleteExpiredImages();
  report.deletedCounts.images = imageResult.count;

  // 2. 만료된 로그 삭제
  const logResult = await deleteExpiredLogs();
  report.deletedCounts.logs = logResult.count;

  // 3. 탈퇴 후 30일 경과한 계정 완전 삭제
  const accountResult = await permanentDeleteAccounts();
  report.deletedCounts.accounts = accountResult.count;

  // 감사 로그
  await logAudit('retention.cleanup', report);

  return report;
}
```

## 6. ISMS-P 인증 대비

### 6.1 주요 인증 항목

```typescript
// ISMS-P 인증 체크리스트 (주요 항목)

const ISMS_P_CHECKLIST = {
  // 1. 관리체계 수립
  management: [
    '정보보호 정책 수립',
    '조직 및 책임 정의',
    '위험 관리',
  ],

  // 2. 보호대책 요구사항
  protection: {
    // 인적 보안
    human: [
      '보안 서약',
      '보안 교육',
      '퇴직 시 접근권한 회수',
    ],

    // 물리적 보안
    physical: [
      '출입 통제',
      '장비 보안',
    ],

    // 기술적 보안
    technical: [
      '접근 통제',
      '암호화',
      '로그 관리',
      '취약점 점검',
      '침해사고 대응',
    ],
  },

  // 3. 개인정보 보호
  privacy: [
    '개인정보 수집 적법성',
    '목적 외 이용 금지',
    '제3자 제공 시 동의',
    '파기 절차',
    '정보주체 권리 보장',
  ],
};
```

### 6.2 기술적 보호조치

```typescript
// ISMS-P 기술적 보호조치 구현

// 접근 통제
const ACCESS_CONTROL = {
  // 계정 관리
  accounts: {
    uniqueId: true,          // 공유 계정 금지
    passwordPolicy: true,     // 비밀번호 정책
    mfa: 'optional',          // 2단계 인증
    sessionManagement: true,  // 세션 관리
  },

  // 접근 권한
  authorization: {
    roleBasedAccess: true,    // 역할 기반
    leastPrivilege: true,     // 최소 권한
    periodicReview: 'quarterly',  // 정기 검토
  },

  // 로깅
  logging: {
    accessLogs: true,         // 접근 로그
    auditLogs: true,          // 감사 로그
    retention: '1year',       // 보관 기간
  },
};

// 암호화
const ENCRYPTION_REQUIREMENTS = {
  // 저장 시 암호화
  atRest: {
    passwords: 'bcrypt',      // 비밀번호
    personalInfo: 'aes-256',  // 개인정보
    sensitiveData: 'aes-256', // 민감정보
  },

  // 전송 시 암호화
  inTransit: {
    protocol: 'TLS 1.3',
    certificateManagement: true,
  },
};
```

## 7. 구현 체크리스트

### 7.1 P0 (필수 구현)

- [ ] 개인정보처리방침 페이지 (KISA 항목 포함)
- [ ] 회원가입 동의 UI (필수/선택 분리)
- [ ] 비밀번호 암호화 (bcrypt)
- [ ] HTTPS 적용
- [ ] SQL Injection/XSS 방지

### 7.2 P1 (권장 구현)

- [ ] 로그인 실패 제한 (5회)
- [ ] 세션 타임아웃 (30분)
- [ ] 접근 로그 기록
- [ ] 개인정보 암호화 저장

### 7.3 P2 (고급 구현)

- [ ] ISMS-P 인증 준비
- [ ] 생성형 AI 보안 가이드 준수
- [ ] 정기 보안 점검 자동화
- [ ] 침해사고 대응 절차

## 8. 참고 자료

- [KISA 한국인터넷진흥원](https://www.kisa.or.kr/)
- [ISMS-P 인증 포털](https://isms.kisa.or.kr/)
- [소프트웨어 보안약점 진단가이드](https://www.data.go.kr/data/15049185/fileData.do)
- [웹 사이트 개발·운영을 위한 개인정보보호 가이드](https://www.kisa.or.kr/204/form?postSeq=013799)

---

**Version**: 1.0 | **Created**: 2026-01-19
**Category**: 보안 심화 | **Priority**: P0
