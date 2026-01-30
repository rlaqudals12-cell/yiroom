# ADR-022: 만 14세 회원가입 차단

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"법정대리인 동의 시스템까지 갖춘 완전한 연령별 접근 제어"

- 만 14세 미만: 법정대리인 동의 후 가입
- 14세 이상: 일반 가입
- 모든 민감 기능에 연령 확인 적용
```

### 물리적 한계 (MVP)

| 한계 | 설명 |
|------|------|
| 법정대리인 동의 구현 | MVP 범위 초과 |
| 본인인증 연동 | 추가 비용 발생 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| 연령 확인 | 100% 가입 시 확인 |
| 우회 방지 | 생년월일 위조 탐지 |
| 법적 준수 | 개인정보보호법 100% |

### 현재 달성률

**85%** - 생년월일 기반 차단 구현, 법정대리인 동의 미구현

---

## 상태

`accepted`

## 날짜

2026-01-16

## 맥락 (Context)

한국 개인정보보호법 제22조의2에 따르면, 만 14세 미만 아동의 개인정보를 수집하려면 **법정대리인의 동의**가 필요합니다. 이룸은 얼굴 이미지, 신체 정보 등 민감한 데이터를 수집하므로:

1. **법적 의무**: 만 14세 미만 가입 시 법정대리인 동의 필수
2. **구현 복잡도**: 법정대리인 동의 시스템 구축 비용 높음
3. **리스크**: 위반 시 5천만원 이하 과태료, 서비스 중단 가능

### 현실적 제약

- MVP 단계에서 법정대리인 동의 시스템 구축 어려움
- 미성년자 타겟 서비스가 아님 (주 타겟: 20-40대)
- 법적 리스크를 최소화하면서 빠르게 출시 필요

## 결정 (Decision)

**만 14세 미만 회원가입 차단** 방식을 채택합니다.

```
┌─────────────────────────────────────────────────────────────┐
│                    연령 확인 플로우                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  회원가입 시작                                               │
│       ↓                                                      │
│  생년월일 입력 (필수)                                        │
│       ↓                                                      │
│  만 14세 이상?  ─── No ──→ 가입 차단 + 안내 메시지          │
│       │                                                      │
│      Yes                                                     │
│       ↓                                                      │
│  회원가입 계속                                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 연령 확인 방법

| 방법 | 신뢰도 | 채택 여부 | 이유 |
|------|--------|----------|------|
| **생년월일 자가 입력** | 중 | ✅ 채택 | 비용 0, 대부분의 앱에서 사용 |
| 휴대폰 본인인증 | 상 | ❌ 미채택 | 비용 높음, MVP 과도 |
| 신분증 인증 | 상 | ❌ 미채택 | UX 복잡, 비용 높음 |

### 법적 근거

```
개인정보보호법 제22조의2 (아동의 개인정보 보호)
① 개인정보처리자는 만 14세 미만 아동의 개인정보를 처리하기 위하여
   이 법에 따른 동의를 받아야 할 때에는 그 법정대리인의 동의를 받아야 한다.
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 법정대리인 동의 시스템 구축 | 만 14세 미만도 가입 가능 | 구현 복잡, 비용 높음 | `HIGH_COMPLEXITY` - MVP 범위 초과 |
| 연령 확인 없음 | 구현 간단 | 법적 위반 | `LEGAL_ISSUE` - 법적 리스크 |
| 휴대폰 본인인증 | 신뢰도 높음 | 비용 발생 | `FINANCIAL_HOLD` - MAU 10K 이상 시 재검토 |

## 결과 (Consequences)

### 긍정적 결과

- **법적 준수**: 개인정보보호법 위반 리스크 제거
- **구현 간단**: 생년월일 검증만으로 충분
- **빠른 출시**: 복잡한 인증 시스템 불필요

### 부정적 결과

- **사용자 이탈**: 만 14세 미만 사용자 차단
- **신뢰도 한계**: 거짓 생년월일 입력 가능

### 리스크

- 거짓 생년월일 입력 → **자가 입력 방식의 법적 면책 확인 필요**
- 향후 법정대리인 동의 요구 시 → **MAU 10K 이상에서 재검토**

## 구현 가이드

### 연령 검증 유틸리티

```typescript
// lib/utils/age-verification.ts
export function isAge14OrOlder(birthDate: Date): boolean {
  const today = new Date();
  const age14Date = new Date(
    today.getFullYear() - 14,
    today.getMonth(),
    today.getDate()
  );
  return birthDate <= age14Date;
}
```

### 차단 UI

```typescript
// components/auth/AgeBlockScreen.tsx
export function AgeBlockScreen() {
  return (
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold mb-4">
        가입할 수 없습니다
      </h1>
      <p className="text-muted-foreground">
        이룸은 만 14세 이상만 이용할 수 있습니다.
        <br />
        개인정보보호법에 따라 만 14세 미만은
        법정대리인의 동의가 필요합니다.
      </p>
    </div>
  );
}
```

### 회원가입 플로우 통합

```typescript
// app/(auth)/sign-up/page.tsx
const birthDate = formData.get('birthDate') as string;
const isOldEnough = isAge14OrOlder(new Date(birthDate));

if (!isOldEnough) {
  return <AgeBlockScreen />;
}
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 법적 준수](../principles/legal-compliance.md) - 개인정보보호법, 만 14세 기준

### 관련 ADR/스펙
- [ADR-004: 인증 전략](./ADR-004-auth-strategy.md)
- [스펙: N-1 연령 확인](../specs/SDD-N-1-age-verification.md)

## 구현 스펙

이 ADR을 구현하는 스펙 문서:

| 스펙 | 상태 | 설명 |
|------|------|------|
| [SDD-N-1-AGE-VERIFICATION](../specs/SDD-N-1-AGE-VERIFICATION.md) | ✅ 구현됨 | 연령 확인 UI/UX, API, 테스트 케이스 |

### 핵심 구현 파일

```
lib/age-verification/
├── check.ts              # isAge14OrOlder() 함수
└── types.ts              # 타입 정의

components/
├── providers/AgeVerificationProvider.tsx
└── auth/AgeBlockScreen.tsx

app/api/user/birthdate/route.ts
```

---

**Author**: Claude Code
**Reviewed by**: -
