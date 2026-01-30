# ADR-023: 약관/개인정보처리방침 동의 플로우

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"모든 법적 동의가 버전 관리되고, 변경 시 자동 재동의 요청"

- 필수 동의: 서비스 이용약관, 개인정보처리방침
- 선택 동의: 마케팅, 제3자 제공
- 버전 관리: 변경 이력 추적
- 재동의: 약관 변경 시 자동 알림
```

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| 동의 기록 | 100% DB 저장 |
| 버전 관리 | 모든 약관 버전 추적 |
| 재동의 플로우 | 변경 시 자동 알림 |

### 현재 달성률

**80%** - 동의 기록 구현, 버전 관리 부분 구현

---

## 상태

`accepted`

## 날짜

2026-01-16

## 맥락 (Context)

한국 법률상 다음 동의가 필수입니다:

1. **서비스 이용약관**: 전자상거래법, 정보통신망법
2. **개인정보처리방침**: 개인정보보호법 제30조
3. **개인정보 수집/이용 동의**: 개인정보보호법 제15조
4. **민감정보 처리 동의**: 개인정보보호법 제23조 (얼굴, 건강 정보)

### 문제점

- 동의 없이 서비스 이용 시 법적 리스크
- 동의 기록 미보관 시 분쟁 대응 불가
- 약관 변경 시 재동의 절차 필요

## 결정 (Decision)

**단계별 동의 플로우 + DB 기록** 방식을 채택합니다.

```
┌─────────────────────────────────────────────────────────────┐
│                    동의 플로우                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  회원가입 시작 (연령 확인 통과 후)                          │
│       ↓                                                      │
│  ┌────────────────────────────────────┐                     │
│  │ □ 서비스 이용약관 (필수) [보기]    │                     │
│  │ □ 개인정보처리방침 (필수) [보기]   │                     │
│  │ □ 민감정보 처리 동의 (필수) [보기] │                     │
│  │ □ 마케팅 정보 수신 (선택) [보기]   │                     │
│  │                                    │                     │
│  │ [전체 동의] [가입하기]             │                     │
│  └────────────────────────────────────┘                     │
│       ↓                                                      │
│  모든 필수 동의?  ─── No ──→ 가입 불가 안내                 │
│       │                                                      │
│      Yes                                                     │
│       ↓                                                      │
│  user_agreements 테이블에 기록                               │
│       ↓                                                      │
│  회원가입 완료                                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 동의 항목 정의

| 항목 | 필수 여부 | 법적 근거 | 버전 관리 |
|------|----------|----------|----------|
| 서비스 이용약관 | 필수 | 전자상거래법 | terms_v1.0 |
| 개인정보처리방침 | 필수 | 개인정보보호법 제30조 | privacy_v1.0 |
| 민감정보 처리 동의 | 필수 | 개인정보보호법 제23조 | sensitive_v1.0 |
| 마케팅 정보 수신 | 선택 | 정보통신망법 | marketing_v1.0 |

### 버전 관리

- 약관 변경 시 버전 업데이트 (terms_v1.0 → terms_v1.1)
- 중요 변경 시 재동의 요청
- 이전 버전 동의 기록 유지

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 단일 체크박스 | UX 간단 | 법적 요건 미충족 | `LEGAL_ISSUE` - 개별 동의 필수 |
| 페이지별 분리 동의 | 명확한 동의 | UX 복잡 | `LOW_ROI` - 과도한 단계 |
| 동의 기록 미저장 | 구현 간단 | 분쟁 대응 불가 | `LEGAL_ISSUE` - 기록 의무 |

## 결과 (Consequences)

### 긍정적 결과

- **법적 준수**: 모든 필수 동의 확보
- **분쟁 대응**: 동의 시점, 버전 기록 보관
- **유연성**: 약관 버전 관리로 변경 용이

### 부정적 결과

- **UX 복잡**: 여러 체크박스 필요
- **구현 비용**: DB 테이블, 버전 관리 필요

### 리스크

- 약관 변경 시 기존 사용자 재동의 → **점진적 안내 + 유예 기간**
- 동의 철회 시 처리 → **개인정보 삭제 절차 연동 (ADR-025)**

## 구현 가이드

### DB 스키마

```sql
-- supabase/migrations/20260116_user_agreements.sql
CREATE TABLE user_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  agreement_type TEXT NOT NULL,        -- 'terms', 'privacy', 'sensitive', 'marketing'
  agreement_version TEXT NOT NULL,     -- 'v1.0', 'v1.1'
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,                     -- 동의 시 IP (법적 증거)
  user_agent TEXT,                     -- 동의 시 브라우저

  UNIQUE(clerk_user_id, agreement_type, agreement_version)
);

-- RLS
ALTER TABLE user_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_agreements" ON user_agreements
  FOR ALL USING (
    clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );
```

### 동의 저장 유틸리티

```typescript
// lib/agreements/save-agreement.ts
interface AgreementInput {
  clerkUserId: string;
  agreementType: 'terms' | 'privacy' | 'sensitive' | 'marketing';
  agreementVersion: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function saveAgreement(
  supabase: SupabaseClient,
  input: AgreementInput
) {
  const { data, error } = await supabase
    .from('user_agreements')
    .upsert({
      clerk_user_id: input.clerkUserId,
      agreement_type: input.agreementType,
      agreement_version: input.agreementVersion,
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
      agreed_at: new Date().toISOString(),
    });

  if (error) throw error;
  return data;
}
```

### 동의 확인 유틸리티

```typescript
// lib/agreements/check-agreement.ts
export async function hasRequiredAgreements(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<{ hasAll: boolean; missing: string[] }> {
  const REQUIRED = [
    { type: 'terms', version: 'v1.0' },
    { type: 'privacy', version: 'v1.0' },
    { type: 'sensitive', version: 'v1.0' },
  ];

  const { data } = await supabase
    .from('user_agreements')
    .select('agreement_type, agreement_version')
    .eq('clerk_user_id', clerkUserId);

  const agreed = new Set(
    data?.map(d => `${d.agreement_type}:${d.agreement_version}`) ?? []
  );

  const missing = REQUIRED.filter(
    r => !agreed.has(`${r.type}:${r.version}`)
  ).map(r => r.type);

  return { hasAll: missing.length === 0, missing };
}
```

### UI 컴포넌트

```tsx
// components/auth/AgreementCheckboxes.tsx
interface Props {
  agreements: AgreementType[];
  onAgree: (type: AgreementType, agreed: boolean) => void;
}

export function AgreementCheckboxes({ agreements, onAgree }: Props) {
  return (
    <div className="space-y-3">
      {agreements.map((agreement) => (
        <label key={agreement.type} className="flex items-start gap-3">
          <input
            type="checkbox"
            onChange={(e) => onAgree(agreement, e.target.checked)}
            className="mt-1"
          />
          <div>
            <span className={agreement.required ? 'font-medium' : ''}>
              {agreement.label}
              {agreement.required && <span className="text-red-500"> (필수)</span>}
            </span>
            <button
              type="button"
              onClick={() => openAgreementModal(agreement.type)}
              className="ml-2 text-sm text-primary underline"
            >
              보기
            </button>
          </div>
        </label>
      ))}
    </div>
  );
}
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 법적 준수](../principles/legal-compliance.md) - 약관 동의 요건, 철회권

### 관련 ADR
- [ADR-022: 만 14세 회원가입 차단](./ADR-022-age-verification.md)
- [ADR-025: 감사 로그](./ADR-025-audit-logging.md)

### 구현 스펙
- [SDD-LEGAL-SUPPORT](../specs/SDD-LEGAL-SUPPORT.md) - 법적 지원 기능

---

**Author**: Claude Code
**Reviewed by**: -
