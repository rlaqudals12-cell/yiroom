# Task: 마케팅 수신 동의 토글 UI (SDD-MARKETING-TOGGLE-UI)

**Phase**: L-2 (출시 준비)
**작성일**: 2026-01-08
**우선순위**: 중간
**관련**: SDD-TERMS-AGREEMENT.md (API 구현 완료)
**예상 복잡도**: 25점 (단일 컴포넌트)

---

## 1. 개요

### 1.1 목적

설정 > 개인정보 페이지에서 마케팅 수신 동의를 On/Off 할 수 있는 토글 UI 추가

### 1.2 사용자 스토리

```
As a 회원
I want to 설정에서 마케팅 수신 동의를 변경
So that 광고 알림 수신 여부를 제어할 수 있다
```

### 1.3 현재 상태

| 항목 | 상태      | 비고                               |
| ---- | --------- | ---------------------------------- |
| API  | ✅ 완료   | `PATCH /api/agreement`             |
| DB   | ✅ 완료   | `user_agreements.marketing_agreed` |
| UI   | ❌ 미구현 | 이 스펙에서 정의                   |

---

## 2. 구현 범위

### IN (포함)

- [x] 마케팅 동의 토글 컴포넌트
- [x] 동의/철회 시간 표시
- [x] 토글 변경 시 API 호출
- [x] 낙관적 업데이트 + 롤백

### OUT (제외)

- [ ] 푸시 알림 설정 (별도 Phase)
- [ ] 이메일/SMS 채널별 분리 (Phase 2)

---

## 3. UI 설계

### 3.1 위치

`app/(main)/settings/privacy/page.tsx` 내 이미지 동의 카드 아래

### 3.2 와이어프레임

```
┌─────────────────────────────────────────────┐
│ 📢 마케팅 정보 수신 동의                      │
│ 프로모션, 이벤트, 맞춤 추천 알림을 받습니다    │
├─────────────────────────────────────────────┤
│                                             │
│  마케팅 정보 수신          [Toggle: ON/OFF] │
│                                             │
│  ℹ️ 동의일: 2026-01-08                       │
│     (언제든 철회할 수 있습니다)               │
│                                             │
└─────────────────────────────────────────────┘
```

### 3.3 상태별 UI

| 상태    | 토글         | 설명 텍스트                 |
| ------- | ------------ | --------------------------- |
| 동의함  | ON (primary) | 동의일: YYYY-MM-DD          |
| 미동의  | OFF (muted)  | 마케팅 정보를 받지 않습니다 |
| 로딩 중 | disabled     | 업데이트 중...              |
| 에러    | 이전 상태    | toast 에러 표시             |

---

## 4. 컴포넌트 설계

### 4.1 파일 위치

```
components/
└── settings/
    └── MarketingConsentToggle.tsx
```

### 4.2 Props 인터페이스

```typescript
interface MarketingConsentToggleProps {
  initialValue: boolean;
  agreedAt: string | null;
  withdrawnAt: string | null;
}
```

### 4.3 구현 로직

```typescript
'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, Info } from 'lucide-react';
import { toast } from 'sonner';

export function MarketingConsentToggle({
  initialValue,
  agreedAt,
  withdrawnAt,
}: MarketingConsentToggleProps) {
  const [isAgreed, setIsAgreed] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    const previousValue = isAgreed;

    // 낙관적 업데이트
    setIsAgreed(checked);
    setIsLoading(true);

    try {
      const response = await fetch('/api/agreement', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketingAgreed: checked }),
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      toast.success(
        checked
          ? '마케팅 정보 수신에 동의했습니다'
          : '마케팅 정보 수신 동의를 철회했습니다'
      );
    } catch (error) {
      // 롤백
      setIsAgreed(previousValue);
      toast.error('설정 변경에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 표시할 날짜 결정
  const displayDate = isAgreed ? agreedAt : withdrawnAt;
  const dateLabel = isAgreed ? '동의일' : '철회일';

  return (
    <Card data-testid="marketing-consent-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="w-5 h-5" />
          마케팅 정보 수신 동의
        </CardTitle>
        <CardDescription>
          프로모션, 이벤트, 맞춤 추천 알림을 받습니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">마케팅 정보 수신</span>
          <Switch
            checked={isAgreed}
            onCheckedChange={handleToggle}
            disabled={isLoading}
            aria-label="마케팅 정보 수신 동의"
          />
        </div>

        {displayDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4" />
            <span>
              {dateLabel}: {new Date(displayDate).toLocaleDateString('ko-KR')}
            </span>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {isAgreed
            ? '언제든 설정에서 수신 동의를 철회할 수 있습니다.'
            : '마케팅 정보를 받지 않습니다.'
          }
        </p>
      </CardContent>
    </Card>
  );
}
```

---

## 5. API 연동

### 5.1 기존 API 사용

```
PATCH /api/agreement
Content-Type: application/json

{
  "marketingAgreed": true | false
}
```

### 5.2 응답

```json
{
  "success": true,
  "agreement": {
    "marketingAgreed": true,
    "marketingAgreedAt": "2026-01-08T12:00:00Z"
  }
}
```

---

## 6. 페이지 통합

### 6.1 privacy/page.tsx 수정

```typescript
// 기존 import에 추가
import { MarketingConsentToggle } from '@/components/settings/MarketingConsentToggle';

// 상태에 추가
const [marketingConsent, setMarketingConsent] = useState<{
  agreed: boolean;
  agreedAt: string | null;
  withdrawnAt: string | null;
} | null>(null);

// fetchConsent 함수에 추가
const { data: agreementData } = await supabase
  .from('user_agreements')
  .select('marketing_agreed, marketing_agreed_at, marketing_withdrawn_at')
  .maybeSingle();

if (agreementData) {
  setMarketingConsent({
    agreed: agreementData.marketing_agreed,
    agreedAt: agreementData.marketing_agreed_at,
    withdrawnAt: agreementData.marketing_withdrawn_at,
  });
}

// JSX에 추가 (이미지 동의 카드 아래)
{marketingConsent && (
  <MarketingConsentToggle
    initialValue={marketingConsent.agreed}
    agreedAt={marketingConsent.agreedAt}
    withdrawnAt={marketingConsent.withdrawnAt}
  />
)}
```

---

## 7. 테스트

### 7.1 단위 테스트

```typescript
// tests/components/settings/MarketingConsentToggle.test.tsx
describe('MarketingConsentToggle', () => {
  it('초기값이 true이면 토글이 켜져있다', () => {});
  it('토글 변경 시 API를 호출한다', () => {});
  it('API 실패 시 이전 상태로 롤백한다', () => {});
  it('로딩 중에는 토글이 비활성화된다', () => {});
  it('동의일/철회일을 올바르게 표시한다', () => {});
});
```

### 7.2 통합 테스트

```typescript
// tests/pages/settings/privacy.test.tsx
describe('PrivacySettingsPage', () => {
  it('마케팅 동의 카드를 렌더링한다', () => {});
  it('마케팅 동의 토글 변경이 반영된다', () => {});
});
```

---

## 8. 구현 체크리스트

| 순서 | 작업                                       | 상태 |
| ---- | ------------------------------------------ | ---- |
| 1    | `MarketingConsentToggle.tsx` 컴포넌트 작성 | ✅   |
| 2    | `privacy/page.tsx`에 통합                  | ✅   |
| 3    | 단위 테스트 작성 (20개)                    | ✅   |
| 4    | 통합 테스트 작성 (23개)                    | ✅   |
| 5    | 수동 QA 체크리스트                         | ✅   |

---

## 9. 참고

- API 스펙: [SDD-TERMS-AGREEMENT.md](../SDD-TERMS-AGREEMENT.md) §5
- Switch 컴포넌트: shadcn/ui

---

**Version**: 1.0
**Created**: 2026-01-08
