# 이룸 (Yiroom) v8 고도화 프롬프트 + 가이드

> 생성일: 2026-01-14
> 목적: 2차 고도화 (법적 완성 + 안정화)
> 대상: Cursor AI / Claude Code

---

## 📋 현재 상태 요약

### ✅ 완료된 것 (건드리지 말 것)
| 영역 | 상태 | 비고 |
|------|------|------|
| 핵심 분석 (PC/S/C) | ✅ 완료 | 퍼스널컬러, 피부, 체형 |
| 운동/영양 (W/N/R) | ✅ 완료 | 루틴, 레시피, 리포트 |
| 소셜 (Phase H) | ✅ 완료 | 웰니스 스코어, 친구, 리더보드 |
| 어필리에이트 (Phase I) | ✅ 완료 | iHerb, 쿠팡, 무신사 |
| AI 스타일링 (Phase J) | ✅ 완료 | 색상 조합, 악세서리, 메이크업 |
| UX 고도화 (Phase K) | ✅ 완료 | 성별 중립화, 패션 확장 |
| 온보딩 (Phase L) | ✅ 완료 | 자세 시뮬, Best 5, 가상 피팅 |
| 영양 고도화 (Phase M) | ✅ 완료 | 팬트리, 레시피 DB |
| 개인정보 동의 시스템 | ✅ 완료 | 동의/철회/마케팅 토글 |
| 회원탈퇴 | ✅ 완료 | 18개 테이블 순차 삭제 |
| 제3자 AI 고지 | ✅ 완료 | 개인정보처리방침 명시 |
| AI Fallback | ✅ 완료 | 17개 함수 Mock 적용 |
| 테스트 | ✅ 2,776개 | 웹 + 모바일 |

### ❌ Gap (이번에 해결할 것)
| 항목 | 우선순위 | 법적 근거 |
|------|----------|-----------|
| 만 14세 이상 확인 UI | 🔴 필수 | 개인정보보호법 제22조 |
| 법정대리인 동의 (14세 미만) | 🔴 필수 | 개인정보보호법 제22조 |
| GDPR 자동 삭제 Cron | 🔴 필수 | GDPR Art.17 |

### 🟡 보류 중 (이번에 안 함)
| 항목 | 보류 사유 |
|------|-----------|
| TestFlight | Apple Developer 키 대기 |
| AI OCR 바코드 | MAU 5,000+ 조건 |
| 실시간 자세 교정 | MediaPipe 통합 필요 |
| 타입 정의 일관성 | 중간 우선순위 |

---

## 🎯 Phase N: 법적 완성 스펙

### N-1: 만 14세 이상 확인 UI

#### 요구사항
```
[필수 동작]
1. 회원가입 시 생년월일 입력 필드 추가
2. 14세 미만 판별 시 → 법정대리인 동의 플로우로 이동
3. 14세 이상 → 기존 플로우 유지

[UI 위치]
- 회원가입 폼: apps/web/app/(auth)/sign-up/page.tsx
- 또는 온보딩: apps/web/app/(main)/onboarding/

[저장]
- users 테이블에 birth_date 컬럼 (DATE 타입)
- 또는 별도 age_verification 테이블
```

#### 구현 가이드
```typescript
// lib/utils/age-verification.ts
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function isMinor(birthDate: Date): boolean {
  return calculateAge(birthDate) < 14;
}
```

#### DB 마이그레이션
```sql
-- supabase/migrations/202601140001_age_verification.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 선택: 별도 테이블
CREATE TABLE IF NOT EXISTS age_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  birth_date DATE NOT NULL,
  is_minor BOOLEAN GENERATED ALWAYS AS (
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) < 14
  ) STORED,
  verified_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (clerk_user_id)
    REFERENCES users(clerk_user_id) ON DELETE CASCADE
);
```

#### 테스트 케이스
```
□ 14세 이상 생년월일 입력 → 정상 진행
□ 14세 미만 생년월일 입력 → 법정대리인 동의 화면
□ 생년월일 미입력 → 진행 불가
□ 미래 날짜 입력 → 에러 메시지
□ 100세 이상 입력 → 경고 또는 에러
```

---

### N-2: 법정대리인 동의 (14세 미만)

#### 요구사항
```
[필수 동작]
1. 14세 미만 사용자 감지 시 법정대리인 동의 화면 표시
2. 법정대리인 정보 입력: 이름, 연락처(이메일 또는 휴대폰)
3. 법정대리인에게 동의 요청 발송 (이메일 또는 SMS)
4. 법정대리인 동의 완료 시 서비스 이용 허용
5. 동의 미완료 시 서비스 이용 불가

[대안 - MVP]
- 14세 미만은 회원가입 자체 차단
- "만 14세 이상만 이용 가능합니다" 메시지 표시
- Phase 2에서 법정대리인 동의 구현
```

#### MVP 구현 (회원가입 차단)
```typescript
// components/auth/AgeGate.tsx
'use client';

import { useState } from 'react';
import { isMinor } from '@/lib/utils/age-verification';

export function AgeGate({ onVerified }: { onVerified: () => void }) {
  const [birthDate, setBirthDate] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = () => {
    const date = new Date(birthDate);
    
    if (isMinor(date)) {
      setError('만 14세 이상만 이용 가능합니다. 법정대리인 동의 기능은 추후 지원 예정입니다.');
      return;
    }
    
    onVerified();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">연령 확인</h2>
      <p className="text-sm text-muted-foreground">
        개인정보보호법에 따라 생년월일을 확인합니다.
      </p>
      
      <input
        type="date"
        value={birthDate}
        onChange={(e) => setBirthDate(e.target.value)}
        className="w-full p-2 border rounded"
        max={new Date().toISOString().split('T')[0]}
      />
      
      {error && <p className="text-sm text-red-500">{error}</p>}
      
      <button onClick={handleSubmit} className="w-full btn-primary">
        확인
      </button>
    </div>
  );
}
```

#### DB 스키마 (향후 확장용)
```sql
-- 법정대리인 동의 테이블 (Phase 2)
CREATE TABLE IF NOT EXISTS guardian_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minor_clerk_user_id TEXT NOT NULL,
  guardian_name TEXT NOT NULL,
  guardian_contact TEXT NOT NULL, -- 이메일 또는 휴대폰
  consent_token UUID DEFAULT gen_random_uuid(),
  consent_status TEXT DEFAULT 'pending' CHECK (consent_status IN ('pending', 'approved', 'rejected', 'expired')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  CONSTRAINT fk_minor FOREIGN KEY (minor_clerk_user_id)
    REFERENCES users(clerk_user_id) ON DELETE CASCADE
);
```

---

### N-3: GDPR 자동 삭제 Cron 활성화

#### 현재 상태
```
✅ Edge Function 코드 작성됨
❌ pg_cron 설정 안 됨 (대시보드에서 활성화 필요)
```

#### 필요 조치
```
1. Supabase 대시보드 접속
2. Database > Extensions > pg_cron 활성화
3. SQL Editor에서 Cron Job 등록

-- Edge Function 호출 Cron 설정
SELECT cron.schedule(
  'gdpr-auto-delete',
  '0 3 * * *',  -- 매일 새벽 3시
  $$
  SELECT net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/gdpr-auto-delete',
    headers := '{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
  );
  $$
);
```

#### 검증 방법
```sql
-- Cron Job 목록 확인
SELECT * FROM cron.job;

-- 실행 이력 확인
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

### N-4: 개인정보처리방침 보완 (선택)

#### 추가할 내용
```markdown
## 3. 아동의 개인정보 보호

① 만 14세 미만 아동의 개인정보 수집
- 당사는 만 14세 미만 아동의 개인정보를 수집하지 않습니다.
- 회원가입 시 생년월일 확인을 통해 연령을 검증합니다.

② 법정대리인 동의 (향후 지원 예정)
- 만 14세 미만 아동이 서비스를 이용하고자 하는 경우,
  법정대리인의 동의를 받은 후에만 서비스 이용이 가능합니다.
```

---

## 📁 파일 구조 가이드

### 생성할 파일
```
apps/web/
├── app/
│   └── (auth)/
│       └── sign-up/
│           └── age-gate/
│               └── page.tsx          # 연령 확인 페이지
├── components/
│   └── auth/
│       ├── AgeGate.tsx               # 연령 확인 컴포넌트
│       └── GuardianConsentForm.tsx   # 법정대리인 동의 (Phase 2)
├── lib/
│   └── utils/
│       └── age-verification.ts       # 연령 계산 유틸리티
└── tests/
    └── auth/
        └── age-verification.test.ts  # 테스트

supabase/
└── migrations/
    └── 202601140001_age_verification.sql
```

### 수정할 파일
```
apps/web/
├── app/
│   └── (auth)/
│       └── sign-up/
│           └── page.tsx              # AgeGate 연동
└── app/
    └── (main)/
        └── privacy-policy/
            └── page.tsx              # 아동 보호 조항 추가
```

---

## 🔄 시지푸스 복잡도 평가

### N-1: 만 14세 확인 UI
```
복잡도: 35점 → Light 트랙
- UI 복잡도: 10 (입력 폼 1개)
- 로직 복잡도: 10 (연령 계산)
- DB 변경: 10 (컬럼 1개 추가)
- 테스트: 5 (유닛 테스트 5개)

실행: code-quality 에이전트만
```

### N-2: 법정대리인 동의 (MVP)
```
복잡도: 25점 → Quick 트랙
- UI 복잡도: 10 (에러 메시지만)
- 로직 복잡도: 5 (조건 분기)
- DB 변경: 0 (없음)
- 테스트: 10 (엣지 케이스)

실행: 직접 실행 (에이전트 없음)
```

### N-3: GDPR Cron 활성화
```
복잡도: 15점 → Quick 트랙
- 코드 작성: 0 (이미 있음)
- 설정 작업: 15 (대시보드)

실행: 수동 (대시보드 작업)
```

---

## ✅ 체크리스트

### Phase N 완료 조건
```
□ N-1: 만 14세 확인 UI 구현
  □ 생년월일 입력 필드
  □ 연령 계산 로직
  □ DB 마이그레이션
  □ 테스트 5개 이상

□ N-2: 법정대리인 동의 MVP
  □ 14세 미만 회원가입 차단
  □ 안내 메시지 표시
  □ 테스트 3개 이상

□ N-3: GDPR Cron 활성화
  □ pg_cron 확장 활성화
  □ Cron Job 등록
  □ 실행 이력 확인

□ N-4: 개인정보처리방침 업데이트 (선택)
  □ 아동 보호 조항 추가
```

---

## 🚨 주의사항

### 절대 하지 말 것
```
🔴 기존 완료된 기능 수정 (Phase 1~M)
🔴 회원탈퇴 로직 변경 (이미 완벽함)
🔴 AI Fallback 패턴 변경 (이미 적용됨)
🔴 테스트 삭제 또는 skip 처리
```

### 반드시 할 것
```
✅ 새 기능은 Spec-First 원칙 준수
✅ 모든 변경은 typecheck + lint + test 통과
✅ DB 마이그레이션은 되돌릴 수 있게 작성
✅ 법적 텍스트는 법무 검토 필요 표시
```

---

## 📊 예상 작업량

| 태스크 | 예상 시간 | 담당 |
|--------|----------|------|
| N-1: 연령 확인 UI | 4시간 | 개발 |
| N-2: 14세 미만 차단 | 2시간 | 개발 |
| N-3: GDPR Cron | 30분 | 운영 |
| N-4: 개인정보처리방침 | 1시간 | 법무+개발 |
| 테스트 작성 | 2시간 | 개발 |
| **총계** | **~10시간** | |

---

## 🔗 관련 문서

| 문서 | 위치 |
|------|------|
| 개인정보보호법 제22조 | [법률 링크] |
| GDPR Art.17 | [EU 규정] |
| 기존 동의 시스템 | `app/(main)/settings/privacy/` |
| 회원탈퇴 API | `app/api/user/account/route.ts` |
| GDPR Edge Function | `supabase/functions/gdpr-auto-delete/` |

---

**Version**: 8.0
**Author**: Claude
**Created**: 2026-01-14
