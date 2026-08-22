# Task: 서비스 약관동의 시스템 (SDD-TERMS-AGREEMENT)

**Phase**: L-2 (출시 준비)
**작성일**: 2026-01-08
**업데이트**: 2026-08-21 (모바일 선택 동의 저장·계측 게이트)
**우선순위**: 🔴 높음 (출시 필수)
**관련**: SDD-VISUAL-SKIN-REPORT.md (이미지 저장 동의)

---

## 1. 비즈니스 목표

회원가입 시 법적 필수 동의를 받아 PIPA(개인정보보호법) 준수 및 서비스 신뢰도 확보

### 사용자 스토리

```
As a 신규 회원
I want to 이용약관과 개인정보 수집에 동의
So that 서비스를 안전하게 이용할 수 있다
```

### 레퍼런스

- PASS 인증서: 필수/선택 구분, 전체동의 체크박스
- 다이소: 약관동의 + 본인인증 통합
- 스타벅스: 브랜드 아이덴티티 + 간결한 동의 항목

---

## 2. 현재 상태 분석

### 2.1 존재하는 것

| 항목             | 경로                | 상태    |
| ---------------- | ------------------- | ------- |
| 이용약관 페이지  | `/terms`            | ✅ 완료 |
| 개인정보처리방침 | `/privacy`          | ✅ 완료 |
| 이미지 저장 동의 | `ImageConsentModal` | ✅ 완료 |

### 2.2 없는 것 (문제점)

| 문제                      | 설명                      | 법적 영향         |
| ------------------------- | ------------------------- | ----------------- |
| **회원가입 시 동의 없음** | Clerk 기본 UI만 사용      | ⚠️ PIPA 위반 가능 |
| **동의 기록 없음**        | 언제 동의했는지 추적 불가 | ⚠️ 감사 대응 불가 |
| **마케팅 수신 동의 없음** | 광고성 알림 발송 시 문제  | ⚠️ 정통망법 위반  |

### 2.3 인증 플로우 현황

```
[웹] Clerk 기본 UI → (약관동의 없음) → 서비스 이용
[모바일] 커스텀 회원가입 → (약관동의 없음) → 온보딩
```

---

## 3. 구현 범위

### IN (포함)

- [x] 약관동의 페이지 (`/agreement`)
- [x] 동의 항목 컴포넌트 (`AgreementCheckbox`)
- [x] 동의 기록 DB 테이블 (`user_agreements`)
- [x] 동의 API (`/api/agreement`)
- [x] 첫 로그인 시 동의 페이지로 리디렉션
- [x] 설정 > 마케팅 수신 동의 관리
- [x] 모바일 설정 > 이용기록 분석·마케팅 선택 동의 서버 저장
- [x] 분석 동의 기반 모바일 tracker fail-closed 게이트

### OUT (제외)

- [ ] 미성년자 법정대리인 동의 (추후 검토)
- [ ] 제3자 정보 제공 동의 (현재 없음)

---

## 4. 데이터베이스 설계

### 4.1 user_agreements 테이블

```sql
CREATE TABLE user_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 동의 항목별 상태
  terms_agreed BOOLEAN NOT NULL DEFAULT false,       -- (필수) 이용약관
  privacy_agreed BOOLEAN NOT NULL DEFAULT false,     -- (필수) 개인정보 수집/이용
  marketing_agreed BOOLEAN NOT NULL DEFAULT false,   -- (선택) 마케팅 정보 수신
  analytics_agreed BOOLEAN NOT NULL DEFAULT false,   -- (선택) 이용기록 분석

  -- 동의 버전 (약관 변경 시 재동의 필요)
  terms_version TEXT NOT NULL DEFAULT '1.0',
  privacy_version TEXT NOT NULL DEFAULT '1.0',

  -- 타임스탬프
  terms_agreed_at TIMESTAMPTZ,
  privacy_agreed_at TIMESTAMPTZ,
  marketing_agreed_at TIMESTAMPTZ,
  marketing_withdrawn_at TIMESTAMPTZ,
  analytics_agreed_at TIMESTAMPTZ,
  analytics_withdrawn_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT user_agreements_clerk_user_id_key UNIQUE (clerk_user_id)
);

-- RLS 정책
ALTER TABLE user_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agreements"
ON user_agreements FOR SELECT
TO authenticated
USING (clerk_user_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can insert own agreements"
ON user_agreements FOR INSERT
TO authenticated
WITH CHECK (clerk_user_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can update own marketing consent"
ON user_agreements FOR UPDATE
TO authenticated
USING (clerk_user_id = (SELECT auth.jwt()->>'sub'))
WITH CHECK (clerk_user_id = (SELECT auth.jwt()->>'sub'));
```

### 4.2 인덱스

```sql
CREATE INDEX idx_user_agreements_clerk_user_id
ON user_agreements(clerk_user_id);
```

---

## 5. API 설계

### 5.1 GET /api/agreement

동의 상태 조회

**Response 200:**

```json
{
  "hasAgreed": true,
  "agreement": {
    "termsAgreed": true,
    "privacyAgreed": true,
    "marketingAgreed": false,
    "termsVersion": "1.0",
    "privacyVersion": "1.0",
    "termsAgreedAt": "2026-01-08T12:00:00Z",
    "privacyAgreedAt": "2026-01-08T12:00:00Z"
  }
}
```

**Response 200 (미동의):**

```json
{
  "hasAgreed": false,
  "agreement": null
}
```

### 5.2 POST /api/agreement

동의 저장

**Request Body:**

```json
{
  "termsAgreed": true,
  "privacyAgreed": true,
  "marketingAgreed": false
}
```

**Response 201:**

```json
{
  "success": true,
  "agreement": {
    "termsAgreed": true,
    "privacyAgreed": true,
    "marketingAgreed": false
  }
}
```

**Response 400:**

```json
{
  "error": "필수 약관에 동의해주세요",
  "missingAgreements": ["terms", "privacy"]
}
```

### 5.3 PATCH /api/agreement

마케팅 동의 변경 (설정에서 사용)

**Request Body:**

```json
{
  "marketingAgreed": true
}
```

### 5.4 GET /api/agreement/preferences

모바일 설정의 이용기록 분석·마케팅 선택 동의를 조회한다. 동의 행이 없으면 두 값 모두
`false`이며, 인증 전에는 조회할 수 없다.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "analyticsConsent": false,
    "marketingConsent": true
  }
}
```

### 5.5 PATCH /api/agreement/preferences

한 항목 또는 두 항목을 함께 변경한다. 인증·Zod 검증 후 `user_agreements`에 upsert하며,
동의/철회 시각과 감사 로그를 함께 남긴다.

**Request Body:**

```json
{
  "analyticsConsent": false,
  "marketingConsent": true
}
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "analyticsConsent": false,
    "marketingConsent": true
  }
}
```

오류는 `{ "success": false, "error": { "code", "message", "userMessage" } }`
표준 봉투를 사용한다. 모바일 tracker는 서버 조회가 끝나기 전과
`analyticsConsent: false` 상태에서 이벤트를 큐에 넣거나 전송하지 않는다.

---

## 6. UI/UX 설계

### 6.1 약관동의 페이지 (`/agreement`)

```
┌─────────────────────────────────────┐
│                                     │
│           [이룸 로고]                │
│                                     │
│          고객님 환영합니다!           │
│                                     │
│    서비스 이용을 위해 약관에           │
│    동의해주세요.                      │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ☑ 전체동의                         │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  ○ (필수) 이용약관 동의           >  │
│                                     │
│  ○ (필수) 개인정보 수집 및 이용   >  │
│                                     │
│  ○ (선택) 마케팅 정보 수신 동의   >  │
│     프로모션, 이벤트 알림을 받습니다   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [     동의하고 시작하기     ]       │
│                                     │
│  필수 항목에 동의해야 서비스를        │
│  이용할 수 있습니다.                  │
│                                     │
└─────────────────────────────────────┘
```

### 6.2 동의 항목 인터랙션

| 액션           | 동작                               |
| -------------- | ---------------------------------- |
| 전체동의 체크  | 모든 항목 체크                     |
| 전체동의 해제  | 모든 항목 해제                     |
| 개별 필수 해제 | 전체동의 해제                      |
| 모든 항목 체크 | 전체동의 자동 체크                 |
| `>` 클릭       | 해당 약관 상세 페이지 이동 (새 탭) |

### 6.3 버튼 상태

| 상태     | 조건                | 스타일                |
| -------- | ------------------- | --------------------- |
| 활성화   | 필수 항목 모두 체크 | `bg-primary`          |
| 비활성화 | 필수 항목 미체크    | `bg-muted opacity-50` |

### 6.4 상세 보기 모달 (선택적)

약관 전문을 모달로 보여주는 옵션 (새 탭 대신)

```
┌─────────────────────────────────────┐
│  ✕                    이용약관       │
├─────────────────────────────────────┤
│                                     │
│  제1조 (목적)                        │
│  본 약관은 이룸(이하 "회사")이...     │
│                                     │
│  제2조 (정의)                        │
│  ...                                │
│                                     │
│  [스크롤 가능 영역]                   │
│                                     │
├─────────────────────────────────────┤
│  [         확인         ]           │
└─────────────────────────────────────┘
```

---

## 7. 라우팅 로직

### 7.1 미동의 사용자 리디렉션

```typescript
// middleware.ts 또는 레이아웃에서 처리
async function checkAgreement() {
  const { hasAgreed } = await fetch('/api/agreement').then((r) => r.json());

  if (!hasAgreed && pathname !== '/agreement') {
    redirect('/agreement');
  }
}
```

### 7.2 예외 경로

다음 경로는 동의 체크 제외:

- `/agreement` - 동의 페이지 자체
- `/terms` - 약관 상세
- `/privacy` - 개인정보처리방침
- `/api/*` - API 라우트
- `/sign-in`, `/sign-up` - 인증 페이지

---

## 8. 컴포넌트 설계

### 8.1 파일 구조

```
components/agreement/
├── index.ts
├── types.ts
├── AgreementPage.tsx        # 메인 페이지 컴포넌트
├── AgreementCheckbox.tsx    # 개별 동의 항목
├── AgreementAllCheckbox.tsx # 전체동의 체크박스
└── AgreementDetailModal.tsx # 약관 상세 모달 (선택)
```

### 8.2 타입 정의

```typescript
// types.ts
export interface UserAgreement {
  id: string;
  clerkUserId: string;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
  termsVersion: string;
  privacyVersion: string;
  termsAgreedAt: string | null;
  privacyAgreedAt: string | null;
  marketingAgreedAt: string | null;
}

export interface AgreementItem {
  id: 'terms' | 'privacy' | 'marketing';
  label: string;
  required: boolean;
  description?: string;
  detailUrl: string;
}

export const AGREEMENT_ITEMS: AgreementItem[] = [
  {
    id: 'terms',
    label: '이용약관 동의',
    required: true,
    detailUrl: '/terms',
  },
  {
    id: 'privacy',
    label: '개인정보 수집 및 이용 동의',
    required: true,
    detailUrl: '/privacy',
  },
  {
    id: 'marketing',
    label: '마케팅 정보 수신 동의',
    required: false,
    description: '프로모션, 이벤트, 신기능 알림을 받습니다',
    detailUrl: '/help/marketing',
  },
];

// 현재 약관 버전
export const CURRENT_TERMS_VERSION = '1.0';
export const CURRENT_PRIVACY_VERSION = '1.0';
```

### 8.3 AgreementCheckbox 컴포넌트

```typescript
interface AgreementCheckboxProps {
  item: AgreementItem;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function AgreementCheckbox({ item, checked, onChange }: AgreementCheckboxProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={checked}
          onCheckedChange={onChange}
          aria-label={item.label}
        />
        <div>
          <span className={item.required ? 'text-primary' : 'text-muted-foreground'}>
            ({item.required ? '필수' : '선택'})
          </span>
          <span className="ml-1">{item.label}</span>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {item.description}
            </p>
          )}
        </div>
      </div>
      <Link href={item.detailUrl} target="_blank">
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </Link>
    </div>
  );
}
```

---

## 9. 설정 페이지 연동

### 9.1 마케팅 수신 동의 토글

`/settings/privacy` 페이지에 추가:

```
┌─────────────────────────────────────┐
│  📢 마케팅 정보 수신                  │
├─────────────────────────────────────┤
│                                     │
│  프로모션, 이벤트, 신기능 알림        │
│                                     │
│  [토글 스위치]                       │
│                                     │
│  동의일: 2026-01-08                  │
│                                     │
└─────────────────────────────────────┘
```

---

## 10. 테스트 시나리오

### 10.1 유닛 테스트

```typescript
describe('AgreementCheckbox', () => {
  it('필수 항목에 (필수) 라벨 표시', () => {
    render(<AgreementCheckbox item={AGREEMENT_ITEMS[0]} checked={false} onChange={() => {}} />);
    expect(screen.getByText('(필수)')).toBeInTheDocument();
  });

  it('체크박스 클릭 시 onChange 호출', async () => {
    const onChange = vi.fn();
    render(<AgreementCheckbox item={AGREEMENT_ITEMS[0]} checked={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
```

### 10.2 통합 테스트

```typescript
describe('AgreementPage', () => {
  it('필수 항목 미체크 시 버튼 비활성화', () => {
    render(<AgreementPage />);
    expect(screen.getByRole('button', { name: /동의하고 시작하기/ })).toBeDisabled();
  });

  it('전체동의 체크 시 모든 항목 체크됨', async () => {
    render(<AgreementPage />);
    await userEvent.click(screen.getByLabelText('전체동의'));

    AGREEMENT_ITEMS.forEach(item => {
      expect(screen.getByLabelText(item.label)).toBeChecked();
    });
  });

  it('필수 항목만 체크해도 버튼 활성화', async () => {
    render(<AgreementPage />);
    await userEvent.click(screen.getByLabelText('이용약관 동의'));
    await userEvent.click(screen.getByLabelText('개인정보 수집 및 이용 동의'));

    expect(screen.getByRole('button', { name: /동의하고 시작하기/ })).toBeEnabled();
  });
});
```

### 10.3 API 테스트

```typescript
describe('Agreement API', () => {
  it('POST - 필수 동의 없이 요청 시 400', async () => {
    const res = await POST({ body: { termsAgreed: false, privacyAgreed: true } });
    expect(res.status).toBe(400);
  });

  it('POST - 정상 동의 시 201', async () => {
    const res = await POST({
      body: { termsAgreed: true, privacyAgreed: true, marketingAgreed: false },
    });
    expect(res.status).toBe(201);
  });

  it('GET - 미동의 사용자 hasAgreed: false', async () => {
    const res = await GET();
    const data = await res.json();
    expect(data.hasAgreed).toBe(false);
  });
});
```

---

## 11. 체크리스트

### 구현 전

- [ ] 스펙 문서 작성
- [ ] 사용자 검토/승인

### 구현

- [ ] DB 마이그레이션 생성
- [ ] API 라우트 구현 (GET/POST/PATCH)
- [ ] 컴포넌트 구현
- [ ] 약관동의 페이지 생성
- [ ] 미동의 사용자 리디렉션 로직
- [ ] 설정 페이지 마케팅 동의 토글 추가

### 검증

- [ ] 유닛 테스트 작성
- [ ] 통합 테스트 작성
- [ ] typecheck 통과
- [ ] lint 통과
- [ ] 수동 테스트

---

## 12. 파일 변경 목록

| 파일                                                     | 변경 내용           |
| -------------------------------------------------------- | ------------------- |
| `supabase/migrations/202601080600_user_agreements.sql`   | 신규                |
| `app/agreement/page.tsx`                                 | 신규                |
| `app/api/agreement/route.ts`                             | 신규                |
| `app/api/agreement/preferences/route.ts`                 | 선택 동의 조회·저장 |
| `supabase/migrations/202608210200_analytics_consent.sql` | 분석 동의 컬럼 추가 |
| `components/agreement/index.ts`                          | 신규                |
| `components/agreement/types.ts`                          | 신규                |
| `components/agreement/AgreementCheckbox.tsx`             | 신규                |
| `components/agreement/AgreementAllCheckbox.tsx`          | 신규                |
| `app/(main)/layout.tsx`                                  | 동의 체크 로직 추가 |
| `app/(main)/settings/privacy/page.tsx`                   | 마케팅 토글 추가    |
| `tests/api/agreement/route.test.ts`                      | 신규                |
| `tests/components/agreement/*.test.tsx`                  | 신규                |
| `tests/pages/agreement.test.tsx`                         | 신규                |

---

## 13. 리스크

| 리스크                        | 확률 | 영향 | 대응                                    |
| ----------------------------- | ---- | ---- | --------------------------------------- |
| 약관 버전 변경 시 재동의 필요 | 중간 | 중간 | 버전 필드로 관리, 변경 시 재동의 플로우 |
| 기존 사용자 일괄 동의 처리    | 높음 | 낮음 | 첫 로그인 시 동의 페이지 표시           |
| Clerk 세션과 동의 상태 동기화 | 낮음 | 중간 | 서버 사이드에서 항상 DB 확인            |

---

**다음 단계**: 사용자 승인 후 구현 진행
