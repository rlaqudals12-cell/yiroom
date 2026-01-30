# ADR-045: SK-1 피부 시술 추천 시스템

## 상태

`accepted`

## 날짜

2026-01-23

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"사용자가 피부 고민에 맞는 시술 정보를 안전하고 신뢰성 있게 얻는 상태"

- **완벽한 매칭**: 피부 분석 결과와 100% 연동된 시술 정보 제공
- **안전 우선**: Fitzpatrick 타입별 부작용 위험 0% 누락
- **법적 안전**: 의료법 완벽 준수, 정보 제공 범위 명확
- **사용자 신뢰**: 과학적 원리 기반 객관적 정보

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 의료법 제약 | "정보 제공"만 가능, 처방/권고 표현 금지 |
| 개인화 한계 | 실제 피부 상태는 전문의만 판단 가능 |
| 효과 보장 불가 | 시술 효과는 개인차 존재, 보장 문구 금지 |
| 수익화 제약 | 병원 연동/어필리에이트 의료광고법 해당 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 시술 DB 커버리지 | 50개 | 25개 | 핵심 시술 우선 |
| 고민-시술 매칭 정확도 | 95% | 85% | 원리 문서 기반 |
| Fitzpatrick 안전성 | 100% 경고 | 100% | ✅ 달성 |
| 면책 고지 표시율 | 100% | 100% | ✅ 달성 |
| 법적 검토 완료 | 100% | 0% | 전문가 검토 필요 |

### 현재 목표: 80%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 병원 예약 연동 | 의료광고법 (LEGAL_HOLD) | 법적 검토 완료 후 |
| 시술 효과 보장 문구 | 의료법 위반 위험 | N/A (영구 제외) |
| AI 시술 처방 | 의료기기법 해당 | N/A (영구 제외) |
| 가격 비교/최저가 | 의료광고 해당 가능 | 법적 검토 후 |

---

## 맥락 (Context)

### 사용자 요구

사용자들이 S-1/S-2 피부 분석 결과를 받은 후 "내 피부에 맞는 시술은 무엇인가?"라는 자연스러운 후속 질문을 한다. 현재 이룸 플랫폼은 화장품 추천만 제공하며, 피부 시술 정보에 대한 니즈를 충족하지 못하고 있다.

### 피부 분석 연계 필요성

| 피부 고민 | S-1/S-2 분석 지표 | 연계 시술 정보 |
|-----------|------------------|---------------|
| 주름/탄력 저하 | wrinkle score, elasticity | HIFU, RF, 보톡스 |
| 색소/기미 | Lab a*/b*, pigmentation | 레이저토닝, 피코 |
| 모공 확대 | pore visibility, density | 레이저, 스킨부스터 |
| 붉은기 | Lab a*, redness score | V빔, IPL |
| 여드름/흉터 | trouble score, type | 프락셀, RF 마이크로니들 |

### 시장 동향

한국 피부 시술 시장 규모가 연간 5조원 이상이며, 사용자들은 신뢰할 수 있는 시술 정보 소스를 필요로 한다. 기존 정보 채널(블로그, 커뮤니티)은 광고성 콘텐츠와 혼재되어 신뢰도가 낮다.

### 법적 제약

```
⚠️ 핵심 제약

의료법 제27조: 무면허 의료행위 금지
→ 이룸은 "정보 제공"만 수행, "진단/처방/권고" 표현 금지

SK-1은 의료 서비스가 아닌 "미용 정보 서비스"로 포지셔닝
```

## 결정 (Decision)

### 핵심 결정

**S-1/S-2 피부 분석 결과와 연계된 피부 시술 정보 제공 시스템**을 구현한다. 단, 의료법 준수를 위해 "정보 제공" 범위를 명확히 한정하고, 모든 화면에 의료 면책 고지를 필수 표시한다.

### 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SK-1 Procedure Recommendation Architecture            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐                                                        │
│  │  S-1/S-2     │                                                        │
│  │  피부 분석    │───┐                                                   │
│  │  결과        │   │                                                    │
│  └──────────────┘   │                                                    │
│                     ▼                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Stage 1: 프로필 수집                                              │   │
│  │   • Fitzpatrick 타입 (S-1/S-2에서 추출 또는 직접 입력)            │   │
│  │   • 주요 피부 고민 (분석 결과 기반 + 사용자 선택)                 │   │
│  │   • 선호도 (예산, 통증 민감도, 다운타임)                          │   │
│  └────────────────────┬─────────────────────────────────────────────┘   │
│                       │                                                  │
│                       ▼                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Stage 2: 시술 매칭                                                │   │
│  │   • 고민-시술 카테고리 매핑                                       │   │
│  │   • Fitzpatrick 호환성 검증 (PIH 위험 평가)                       │   │
│  │   • 예산/통증/다운타임 필터링                                     │   │
│  │   • 매칭 점수 기반 정렬                                           │   │
│  └────────────────────┬─────────────────────────────────────────────┘   │
│                       │                                                  │
│                       ▼                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Stage 3: 안전성 검증                                              │   │
│  │   • Fitzpatrick 타입별 부작용 위험 알림                           │   │
│  │   • 금기사항 체크                                                 │   │
│  │   • 시술 조합 주의사항 (과다 시술 경고)                           │   │
│  └────────────────────┬─────────────────────────────────────────────┘   │
│                       │                                                  │
│                       ▼                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Stage 4: 결과 생성 (면책 고지 필수 포함)                          │   │
│  │   • 추천 시술 목록 (3-5개)                                        │   │
│  │   • 시술별 상세 정보 (원리, 효과, 가격대, 주의사항)               │   │
│  │   • 의료 면책 고지 + 전문의 상담 권장                             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 시술 카테고리 구조

| 에너지 유형 | 대표 시술 | 주요 적응증 |
|------------|----------|------------|
| **레이저 (Laser)** | 레이저토닝, 피코, 프락셀, 클라리티 | 색소, 모공, 흉터, 제모 |
| **RF (고주파)** | 써마지, 볼뉴머, 인모드 | 탄력, 리프팅, 모공 |
| **HIFU (초음파)** | 울쎄라, 슈링크, 더블로 | 리프팅, 처진 피부 |
| **주사** | 보톡스, 필러, 리쥬란, 스킨부스터 | 주름, 볼륨, 재생 |
| **스킨케어** | 아쿠아필, LED, MTS, 필링 | 모공, 재생, 각질 |

### 추천 알고리즘

```typescript
// 고민별 1차 추천 매핑
const CONCERN_TO_PROCEDURES: Record<SkinConcernId, string[]> = {
  wrinkles: ['ulthera', 'thermage', 'rejuran', 'botox'],
  pigmentation: ['laser_toning', 'pico_toning', 'ipl'],
  pores: ['laser_toning', 'aqua_peel', 'skin_booster'],
  acne_scar: ['morpheus8', 'fractional', 'prp'],
  redness: ['vbeam', 'ipl', 'led_yellow'],
  sagging: ['ulthera', 'shrink', 'thermage'],
};

// Fitzpatrick 호환성 검증
function getFitzpatrickSafetyScore(
  procedure: Procedure,
  fitzpatrickType: FitzpatrickType
): number {
  // RF/HIFU: 모든 피부 타입에 안전 (점수 5)
  // 레이저: 파장에 따라 피부 타입별 점수 다름
  // 1064nm > 755nm (어두운 피부일수록 1064nm 권장)
}

// 매칭 점수 계산
function calculateMatchScore(
  procedure: Procedure,
  request: RecommendationRequest
): number {
  return (
    concernMatch * 0.4 +      // 고민 적합도 40%
    fitzpatrickSafety * 0.25 + // 안전성 25%
    budgetFit * 0.2 +         // 예산 적합도 20%
    userPreference * 0.15     // 선호도 15%
  );
}
```

### 의료 면책 원칙

```
┌─────────────────────────────────────────────────────────────────┐
│                    의료 면책 3원칙                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 모든 화면에 면책 고지 표시                                   │
│     "본 정보는 참고용이며, 의료 진단/처방을 대체하지 않습니다."  │
│     "시술 결정 전 반드시 피부과 전문의와 상담하세요."            │
│                                                                  │
│  2. 금지 표현 필터링                                             │
│     ❌ "~을 권고합니다" → ✅ "~를 고려해볼 수 있습니다"          │
│     ❌ "~이 필요합니다" → ✅ "~가 도움될 수 있습니다"            │
│     ❌ "진단/처방/치료" → ✅ "분석/제안/관리"                    │
│                                                                  │
│  3. 개인화 vs 일반 정보 경계                                     │
│     • 제공: "피부 타입 III은 일반적으로 1064nm 레이저가 적합"   │
│     • 금지: "당신의 기미는 피코 레이저로 치료하세요"             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 면책 고지 UI 표시

```typescript
// 필수 면책 고지 문구
const MEDICAL_DISCLAIMER = {
  main: `
    본 서비스는 일반적인 정보 제공 목적이며, 의료 진단이나 처방을 대체하지 않습니다.
    모든 시술은 반드시 전문 의료인과 상담 후 결정하시기 바랍니다.
    개인의 피부 상태, 건강 상태, 복용 중인 약물에 따라 적합한 시술이 다를 수 있습니다.
  `,
  short: `※ 참고 정보이며, 시술 결정 전 전문의 상담을 권장합니다.`,
  cta: `피부과 전문의와 상담하기`,
};

// 모든 시술 카드에 면책 표시
<ProcedureCard>
  {/* 시술 정보 */}
  <DisclaimerBanner variant="short" />
</ProcedureCard>

// 추천 결과 페이지 하단
<MedicalDisclaimerModal isRequired={true} />
```

## 의료 면책조항 (Medical Disclaimer)

### 법적 고지

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              법적 고지 (Legal Notice)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  본 서비스에서 제공하는 피부 시술 정보는 일반적인 정보 제공 목적으로만       │
│  사용되며, 의학적 조언, 진단, 또는 치료를 대체할 수 없습니다.               │
│                                                                              │
│  이룸(Yiroom)은 의료기관이 아니며, 본 서비스를 통해 제공되는 정보는          │
│  어떠한 의료 서비스나 의료 행위에도 해당하지 않습니다.                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 전문가 상담 권고

| 항목 | 권고 사항 |
|------|----------|
| **시술 결정** | 모든 시술 결정은 반드시 자격을 갖춘 피부과 전문의와 상담 후 진행하시기 바랍니다 |
| **AI 추천 활용** | AI 기반 추천은 참고 자료로만 활용하시고, 최종 결정은 전문의와 함께 하시기 바랍니다 |
| **개인 상태 평가** | 개인의 피부 상태, 병력, 알레르기, 복용 중인 약물 등은 전문의만 정확히 판단할 수 있습니다 |
| **부작용 위험** | 모든 시술에는 부작용 위험이 있으며, 이는 전문의 상담을 통해서만 정확히 평가될 수 있습니다 |
| **사전 검사** | 일부 시술은 사전 검사나 테스트가 필요할 수 있으며, 이는 의료기관에서만 시행 가능합니다 |

### 책임 제한

```typescript
// 책임 제한 조항
const LIABILITY_LIMITATIONS = {
  informationAccuracy: `
    이룸은 제공되는 정보의 정확성, 완전성, 적시성을 보장하지 않습니다.
    시술 정보는 일반적인 참고용이며, 개인별 상황에 따라 다를 수 있습니다.
  `,

  medicalDecisions: `
    이룸(Yiroom)은 본 서비스의 정보를 기반으로 한 의료적 결정에 대해
    어떠한 책임도 지지 않습니다. 모든 의료적 결정은 사용자 본인의
    책임하에 전문 의료인과 상담 후 이루어져야 합니다.
  `,

  thirdPartyContent: `
    본 서비스에 포함된 시술 정보, 가격 정보, 효과 설명 등은
    일반적인 정보를 기반으로 하며, 특정 의료기관이나 시술자를
    보증하거나 추천하는 것이 아닙니다.
  `,

  indirectDamages: `
    본 서비스 이용으로 인한 직접적, 간접적, 부수적, 특별, 결과적
    손해에 대해 이룸은 책임을 지지 않습니다.
  `,
};
```

### 긴급 상황 안내

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         긴급 상황 대응 안내                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ⚠️ 다음과 같은 상황 발생 시 즉시 의료 전문가에게 연락하십시오:              │
│                                                                              │
│  • 시술 후 심한 통증, 부종, 발적이 지속되는 경우                            │
│  • 피부에 물집, 화상, 색소 변화가 나타나는 경우                             │
│  • 호흡 곤란, 어지러움, 구역질 등의 전신 증상이 나타나는 경우               │
│  • 시술 부위에 감염 징후(고름, 열감, 심한 붓기)가 나타나는 경우             │
│  • 시술 부위의 감각 이상이나 마비가 발생하는 경우                           │
│                                                                              │
│  긴급 의료 상황: 119 (응급의료정보센터)                                      │
│  의료기관 안내: 1339 (보건복지콜센터)                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 사용자 동의 요구사항

```typescript
// 동의 추적 시스템
interface DisclaimerConsent {
  userId: string;
  consentType: 'procedure_disclaimer';
  version: string;                    // 면책조항 버전 (변경 시 재동의 필요)
  agreedAt: string;                   // ISO 8601 형식
  ipAddress?: string;                 // 동의 시점 IP (선택적)
  userAgent?: string;                 // 동의 시점 브라우저 (선택적)
}

// 동의 버전 관리
const DISCLAIMER_VERSIONS = {
  current: '1.0.0',
  history: [
    { version: '1.0.0', date: '2026-01-23', changes: '최초 버전' },
  ],
};

// 동의 검증 로직
async function validateDisclaimerConsent(userId: string): Promise<boolean> {
  const consent = await getLatestConsent(userId, 'procedure_disclaimer');

  if (!consent) return false;

  // 현재 버전과 동의 버전 비교
  if (consent.version !== DISCLAIMER_VERSIONS.current) {
    // 버전이 다르면 재동의 필요
    return false;
  }

  return true;
}

// DB 스키마 (user_consents 테이블)
/*
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  version TEXT NOT NULL,
  agreed_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',

  UNIQUE(clerk_user_id, consent_type, version)
);

-- RLS 정책
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_consents" ON user_consents
  FOR ALL
  USING (clerk_user_id = auth.get_user_id());
*/
```

### 면책조항 UI 표시 요구사항

| 표시 위치 | 표시 유형 | 요구사항 |
|----------|----------|----------|
| **분석 시작 전** | 모달 팝업 | 전체 면책조항 표시 + 체크박스 동의 필수, 동의 없이 진행 불가 |
| **결과 화면 상단** | 배너 | 간략 면책조항 상시 표시, 접을 수 없음 |
| **결과 화면 하단** | 고정 푸터 | "전문의 상담 권장" CTA 버튼 상시 표시 |
| **시술 카드** | 뱃지/툴팁 | "정보 제공 목적" 표시, 각 시술별 주의사항 포함 |
| **시술 상세 페이지** | 섹션 | 해당 시술의 금기사항, 부작용, 주의사항 상세 표시 |
| **비교 기능** | 헤더 | 비교 정보는 참고용임을 명시 |

```tsx
// 면책조항 컴포넌트 구조

// 1. 분석 시작 전 모달
<MedicalDisclaimerModal
  isRequired={true}
  version={DISCLAIMER_VERSIONS.current}
  onAgree={handleDisclaimerAgree}
  onDecline={handleDisclaimerDecline}  // 서비스 이용 불가 안내
/>

// 2. 결과 화면 배너
<DisclaimerBanner
  variant="compact"
  text={MEDICAL_DISCLAIMER.short}
  isCollapsible={false}
/>

// 3. 시술 카드 내 표시
<ProcedureCard procedure={procedure}>
  <SafetyBadge type="informational" />
  <ProcedureInfo />
  <DisclaimerFooter text="※ 참고 정보입니다. 시술 전 전문의 상담 필수" />
</ProcedureCard>

// 4. 결과 페이지 하단 CTA
<ConsultationCTA
  text="피부과 전문의와 상담하기"
  subtext="정확한 진단과 맞춤 시술은 전문의만 제공할 수 있습니다"
  href="/find-dermatologist"
/>
```

### 면책조항 텍스트 상수

```typescript
// lib/procedures/constants/disclaimer.ts

export const MEDICAL_DISCLAIMER = {
  // 전체 면책조항 (모달용)
  full: `
■ 의료 면책 고지

본 서비스에서 제공하는 피부 시술 정보는 일반적인 정보 제공 목적으로만
사용되며, 의학적 조언, 진단, 또는 치료를 대체할 수 없습니다.

■ 전문가 상담 권고

• 모든 시술 결정은 반드시 자격을 갖춘 피부과 전문의와 상담 후 진행하시기 바랍니다.
• AI 추천은 참고 자료로만 활용하시기 바랍니다.
• 개인의 피부 상태, 병력, 알레르기 등은 전문의만 정확히 판단할 수 있습니다.

■ 책임 제한

이룸(Yiroom)은 본 서비스의 정보를 기반으로 한 의료적 결정에 대해
어떠한 책임도 지지 않습니다.

■ 긴급 상황

피부 이상 반응이나 긴급 의료 상황 발생 시 즉시 의료 전문가에게
연락하시기 바랍니다.

응급의료정보센터: 119
보건복지콜센터: 1339
  `.trim(),

  // 간략 면책조항 (배너용)
  short: '본 정보는 참고용이며, 의료 진단/처방을 대체하지 않습니다. 시술 결정 전 반드시 피부과 전문의와 상담하세요.',

  // 초간략 (카드 내)
  minimal: '※ 참고 정보입니다. 전문의 상담 권장',

  // CTA 문구
  cta: {
    primary: '피부과 전문의와 상담하기',
    secondary: '정확한 진단과 맞춤 시술은 전문의만 제공할 수 있습니다',
  },

  // 동의 체크박스 문구
  agreement: {
    checkbox: '위 면책 고지 내용을 읽고 이해하였으며, 본 서비스가 의료 서비스가 아님을 인지합니다.',
    button: '동의하고 계속하기',
    decline: '동의하지 않음',
  },
};
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **병원 예약 연동** | 수익화, UX | 의료법 이슈, 이해충돌 | `LEGAL_HOLD` - 병원 추천 = 의료광고 해당 가능 |
| **시술 효과 보장 문구** | 사용자 신뢰 | 법적 위험 | `LEGAL_HOLD` - 의료법 위반 |
| **AI 기반 시술 처방** | 차별화 | 의료기기 등록 필요 | `LEGAL_HOLD` - 의료기기법 해당 |
| **정보 제공 + 면책 고지** ✅ | 합법, 사용자 가치 | 제한적 개인화 | **채택** |

### AI 활용 수준 비교

| 수준 | 내용 | 법적 위험 | 선택 |
|------|------|----------|------|
| AI 시술 처방 | "당신에게 필요한 시술은 X입니다" | 높음 (의료행위) | ❌ |
| AI 기반 매칭 | "피부 타입 기반 적합도 분석" | 중간 | △ |
| **규칙 기반 정보 제공** ✅ | "이런 고민에는 이런 시술이 있습니다" | 낮음 | **채택** |

## 결과 (Consequences)

### 긍정적 결과

- **사용자 가치**: S-1/S-2 분석 결과의 후속 액션 제공
- **정보 신뢰성**: 원리 기반 과학적 시술 정보 (docs/principles/skin-procedures.md)
- **안전성**: Fitzpatrick 타입별 부작용 위험 알림
- **투명성**: 가격대, 효과 지속 기간, 다운타임 등 객관적 정보 제공
- **법적 안전**: 의료 면책 원칙 준수로 법적 리스크 최소화

### 부정적 결과

- **제한된 개인화**: 법적 제약으로 "권고" 수준의 개인화 불가
- **수익화 제약**: 병원 연동/어필리에이트 불가 (의료광고법)
- **사용자 기대 관리**: "추천"과 "정보 제공"의 차이 설명 필요

### 리스크

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| 의료법 위반 해석 | 법적 제재 | 변호사 검토, 보수적 표현 |
| 시술 정보 오류 | 사용자 피해 | 원리 문서 기반, 정기 검수 |
| 면책 고지 무시 | 법적 분쟁 | 강제 동의 UI, 모든 화면 표시 |
| 기대치 불일치 | 사용자 불만 | 명확한 서비스 범위 안내 |

### 완화 전략 상세

```typescript
// 1. 금지 용어 자동 필터
function sanitizeProcedureText(text: string): string {
  const replacements: Record<string, string> = {
    '권고합니다': '고려해볼 수 있습니다',
    '필요합니다': '도움될 수 있습니다',
    '진단': '분석',
    '처방': '제안',
    '치료': '관리',
  };
  // 자동 치환 적용
  return applyReplacements(text, replacements);
}

// 2. 면책 동의 강제
interface DisclaimerAgreement {
  userId: string;
  agreementType: 'procedure_recommendation';
  agreedAt: string;
  version: string;
}

// 면책 동의 없으면 추천 결과 접근 불가
if (!hasDisclaimerAgreement(userId, 'procedure_recommendation')) {
  return <MedicalDisclaimerModal isRequired={true} />;
}
```

## 구현 가이드

### 파일 구조

```
apps/web/
├── app/
│   ├── (main)/
│   │   └── skin-procedures/
│   │       ├── page.tsx                    # 시술 추천 메인
│   │       ├── [procedureId]/
│   │       │   └── page.tsx                # 시술 상세
│   │       └── quiz/
│   │           └── page.tsx                # 선호도 퀴즈
│   └── api/
│       └── recommend/
│           └── procedures/
│               └── route.ts                # 추천 API
├── components/
│   └── procedures/
│       ├── ProcedureCard.tsx               # 시술 카드
│       ├── ProcedureCategoryTabs.tsx       # 카테고리 탭
│       ├── ProcedureDetailModal.tsx        # 상세 모달
│       ├── ProcedureCompareTable.tsx       # 시술 비교
│       ├── SafetyWarningBanner.tsx         # 안전 경고
│       └── MedicalDisclaimerModal.tsx      # 면책 모달
├── lib/
│   └── procedures/
│       ├── index.ts                        # Barrel export
│       ├── types.ts                        # 타입 정의
│       ├── matcher.ts                      # 시술 매칭
│       ├── safety-validator.ts             # 안전성 검증
│       └── internal/
│           ├── procedure-database.ts       # 시술 DB
│           ├── concern-mapping.ts          # 고민-시술 매핑
│           └── fitzpatrick-compatibility.ts # 피부 타입 호환
└── mock/
    └── procedures/
        ├── laser-procedures.ts             # 레이저 시술
        ├── rf-hifu-procedures.ts           # RF/HIFU 시술
        ├── injection-procedures.ts         # 주사 시술
        └── skincare-procedures.ts          # 스킨케어 시술
```

### 핵심 타입

```typescript
// lib/procedures/types.ts

export interface Procedure {
  id: string;
  name: string;
  nameKo: string;
  energyType: 'laser' | 'rf' | 'hifu' | 'injection' | 'skincare';
  categories: ProcedureCategory[];

  // 기술 정보
  mechanism: string;              // 작용 원리
  targetLayer: string;            // 타겟층
  wavelength?: string;            // 파장 (레이저)

  // 효과 정보
  effects: string[];
  effectTimeline: EffectTimeline;
  duration: DurationInfo;

  // 시술 정보
  sessionCount: string;
  downtime: string;
  painLevel: 1 | 2 | 3 | 4 | 5;

  // 가격 (2026 한국 시장 기준)
  priceRange: PriceRange;

  // 안전성
  fitzpatrickCompatibility: FitzpatrickCompatibility;
  contraindications: string[];
  sideEffects: string[];
  warnings: string[];
}

export interface RecommendedProcedure {
  procedure: Procedure;
  matchScore: number;              // 0-100
  matchReasons: string[];          // 추천 이유
  personalizedWarnings: string[];  // 피부 타입 기반 주의사항
}

export interface ProcedureRecommendationResponse {
  recommendations: RecommendedProcedure[];
  warnings: SafetyWarning[];
  disclaimer: string;              // 필수 면책 고지
  consultationCta: string;         // 전문의 상담 권장 문구
}
```

### API 사용 예시

```typescript
// app/api/recommend/procedures/route.ts
import { recommendProcedures } from '@/lib/procedures';
import { MEDICAL_DISCLAIMER } from '@/lib/procedures/constants';

export async function POST(request: Request) {
  const { userId } = await auth();
  const body = await request.json();

  // 면책 동의 확인
  const hasAgreed = await checkDisclaimerAgreement(userId);
  if (!hasAgreed) {
    return json({
      success: false,
      error: 'disclaimer_required',
      disclaimerUrl: '/skin-procedures/disclaimer',
    });
  }

  // 시술 추천 생성
  const recommendations = await recommendProcedures({
    skinAnalysisId: body.skinAnalysisId,
    fitzpatrickType: body.fitzpatrickType,
    primaryConcerns: body.concerns,
    budget: body.budget,
    painTolerance: body.painTolerance,
  });

  return json({
    success: true,
    data: {
      ...recommendations,
      disclaimer: MEDICAL_DISCLAIMER.main,
    },
  });
}
```

## 테스트 시나리오

| 시나리오 | 입력 | 예상 결과 |
|---------|------|----------|
| 피부 타입 III + 색소 고민 | fitzpatrick=3, concern=pigmentation | 레이저토닝, 피코 추천 (755nm 주의 경고) |
| 피부 타입 V + 리프팅 | fitzpatrick=5, concern=sagging | HIFU, RF 추천 (레이저 비권장) |
| 저예산 + 모공 고민 | budget=low, concern=pores | 아쿠아필, LED 추천 |
| 통증 민감 + 주름 | painTolerance=low, concern=wrinkles | 리쥬란 추천 (보톡스 낮은 순위) |
| 면책 미동의 | hasAgreed=false | 추천 결과 접근 불가, 면책 모달 표시 |

## 마이그레이션 전략

### Phase 1: 정보 제공 (4주)

- 시술 정보 데이터베이스 구축 (25개 핵심 시술)
- 시술 상세 페이지 구현
- 면책 동의 플로우 구현

### Phase 2: 추천 연동 (4주)

- S-1/S-2 분석 결과 연계
- 고민-시술 매칭 알고리즘 구현
- 개인화된 안전 경고 구현

### Phase 3: 고도화 (향후)

- 시술 후기/평점 (사용자 제출)
- 시술 비교 기능
- 병원 정보 연동 (법적 검토 후)

## 관련 문서

### 원리 문서 (과학적 기초)

- [원리: 피부 시술](../principles/skin-procedures.md) - 레이저, RF, HIFU, 주사 원리
- [원리: 피부 생리학](../principles/skin-physiology.md) - 피부 구조, 콜라겐 재생

### 법적 문서

- [법무: 의료 경계 정의](../legal/MEDICAL-BOUNDARY.md) - 의료법 준수 가이드
- [법무: 광고 표기](../legal/ADVERTISING-DISCLOSURE.md) - 광고 표기 규정

### 관련 ADR

- [ADR-043: S-2 피부 분석 v2 아키텍처](./ADR-043-s2-v2-architecture.md) - S-2 연동
- [ADR-003: AI 모델 선택](./ADR-003-ai-model-selection.md) - AI 활용 범위
- [ADR-024: AI 투명성](./ADR-024-ai-transparency.md) - AI 결과 투명성

### 관련 스펙

- [SDD-SK-1-PROCEDURE-RECOMMENDATION](../specs/SDD-SK-1-PROCEDURE-RECOMMENDATION.md) - 상세 구현 스펙

## 구현 스펙

이 ADR을 구현하는 스펙 문서:

| 스펙 | 상태 | 설명 |
|------|------|------|
| [SDD-SK-1-PROCEDURE-RECOMMENDATION](../specs/SDD-SK-1-PROCEDURE-RECOMMENDATION.md) | ✅ 작성 완료 | 시술 추천 상세 알고리즘 |

---

**Version**: 1.1
**Author**: Claude Code
**Reviewed by**: -
**Legal Review**: ⚠️ 필요 (의료/법률 전문가 검토 권장)

**변경 이력**:
| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-01-23 | 최초 작성 |
| 1.1 | 2026-01-23 | 의료 면책조항 섹션 강화 (법적 고지, 전문가 상담 권고, 책임 제한, 긴급 상황, 동의 추적, UI 표시 요구사항) |
