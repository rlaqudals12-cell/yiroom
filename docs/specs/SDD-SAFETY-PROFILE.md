# SDD-SAFETY-PROFILE: 안전성 프로필 스펙

> **Version**: 1.0 | **Created**: 2026-03-03 | **Status**: Draft
> **Author**: Claude Code
> **기반 ADR**: ADR-070
> **원리 문서**: [P-2: safety-science.md](../principles/safety-science.md)
> **법률 리서치**: [R-2: SAFETY-LEGAL-R2](../research/claude-ai-research/SAFETY-LEGAL-R2-안전법률리서치.md)

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"사용자의 알레르기, 건강 상태, 복용 약물을 고려하여 모든 제품 추천에서
위험 성분을 자동 차단하고, 법적 준수와 개인정보 보호가 완전히 보장되는 시스템"

### 100점 기준

| 지표                 | 100점 기준 | 현재 목표           |
| -------------------- | ---------- | ------------------- |
| Level 1 FNR          | ≤ 0.01%    | ≤ 0.1%              |
| Level 2 FNR          | ≤ 1%       | ≤ 5%                |
| 알레르겐 DB 커버리지 | 1000+ 성분 | 100 시드            |
| 동의 체계            | GDPR 수준  | 개인정보보호법 준수 |

### 현재 목표: 65%

---

## 1. 데이터 모델

### 1.1 safety_profiles 테이블

```sql
CREATE TABLE safety_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  -- 암호화 저장 (AES-256, 앱 레벨)
  allergies_encrypted TEXT,        -- string[] 암호화
  conditions_encrypted TEXT,       -- string[] 암호화
  skin_conditions_encrypted TEXT,  -- string[] 암호화
  medications_encrypted TEXT,      -- string[] 암호화 (향후)
  age INTEGER,
  -- 동의 관리
  consent_given BOOLEAN DEFAULT false,
  consent_given_at TIMESTAMPTZ,
  consent_version TEXT DEFAULT '1.0',
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: 본인만 접근
ALTER TABLE safety_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_safety" ON safety_profiles
  FOR ALL USING (clerk_user_id = auth.get_user_id());
```

### 1.2 TypeScript 타입

```typescript
interface SafetyProfile {
  userId: string;
  allergies: string[]; // 복호화된 알레르기 목록
  conditions: string[]; // 임신, 질환 등
  skinConditions: string[]; // 아토피, 건선 등
  medications: string[]; // 복용 약물 (향후)
  age: number;
  consentGiven: boolean;
  consentVersion: string;
}

interface SafetyAlert {
  level: 1 | 2 | 3;
  type: 'ALLERGEN' | 'CONTRAINDICATION' | 'INTERACTION' | 'EWG';
  ingredient: string;
  reason: string;
  action: 'BLOCK' | 'WARN' | 'INFORM';
  source: string; // 규칙 출처
}

interface SafetyReport {
  productId: string;
  grade: 'SAFE' | 'CAUTION' | 'DANGER';
  score: number; // 0-100
  alerts: SafetyAlert[];
  blockedIngredients: string[];
  disclaimer: string; // L-1 면책 문구
}
```

---

## 2. 안전성 검사 파이프라인

### 2.1 4단계 검사 (ADR-070)

```
Step 1: 알레르겐 교차 반응 검사 (Level 1, FNR ≤ 0.1%)
  → CROSS_REACTIVITY_GROUPS 5개 그룹 확인
  → 매칭 시 BLOCK

  교차 반응 그룹 (P-2):
    Group 1: 견과류 (아몬드↔호두↔캐슈↔피스타치오↔브라질넛)
    Group 2: 라텍스-과일 (라텍스↔바나나↔아보카도↔키위↔밤)
    Group 3: 국화과 (카모마일↔아르니카↔캘린듈라↔에키네시아)
    Group 4: 프로폴리스-발삼 (프로폴리스↔페루발삼↔벤조인↔톨루발삼)
    Group 5: 니켈 (니켈↔코발트↔크롬)

Step 2: 금기사항 검사 (Level 2, FNR ≤ 5%)
  → 임산부 주의 성분: 레티놀, 살리실산, 하이드로퀴논
  → 연령 주의: 12세 미만 AHA/BHA 제한
  → 질환 주의: 아토피 → 향료/알코올 경고

Step 3: 성분 상호작용 검사 (Level 2-3)
  → pH 충돌: 비타민C(pH 2.5-3.5) + 나이아신아마이드(pH 5-7)
  → 산화 비호환: 레티놀 + 벤조일퍼옥사이드
  → 킬레이션: EDTA + 금속이온 성분

Step 4: EWG 등급 일반 안전성 (Level 3, FNR ≤ 15%)
  → cosmetic_ingredients 테이블 활용
  → EWG 7+ 성분 INFORM 표시
```

### 2.2 점수 계산 (P-2)

```
Safety Score = EWG_Base + Personalization_Correction + Interaction_Correction

EWG_Base:
  EWG 1-2: 100점
  EWG 3-4: 80점
  EWG 5-6: 60점
  EWG 7+:  40점

Personalization_Correction:
  사용자 알레르기 매칭 → -50점
  금기사항 매칭 → -30점

Interaction_Correction:
  pH 충돌 → -20점
  산화 비호환 → -15점
```

---

## 3. 동의 체계

### 3.1 3단계 동의 (ADR-070)

```
1단계 (필수): 서비스 약관 동의
  → 캡슐 시스템 기본 기능 사용 가능
  → Safety Profile 없이 일반 추천만

2단계 (선택): Safety Profile 수집 동의
  → "건강 정보를 제공하면 더 안전한 추천을 받을 수 있어요"
  → 동의 거부 시: 일반 추천 (EWG 등급만)
  → 동의 시: 개인화 안전성 검사 활성화

3단계 (선택): 건강 상태 추가 입력
  → 알레르기, 임신 여부, 피부 질환
  → 입력하지 않은 항목은 검사 미수행
  → "나중에 입력" 가능
```

### 3.2 동의 UI

```
┌─────────────────────────────────┐
│ 더 안전한 추천을 받아보세요       │
│                                  │
│ 알레르기나 건강 상태를 입력하면   │
│ 위험한 성분을 자동으로 걸러줘요   │
│                                  │
│ ℹ️ 건강 정보는 암호화되어 저장되며  │
│   본인만 접근할 수 있어요         │
│                                  │
│ [건강 정보 입력하기]              │
│ [나중에 할게요]                   │
│                                  │
│ 자세히 보기: 개인정보 처리 방침    │
└─────────────────────────────────┘
```

---

## 4. 암호화

### 4.1 앱 레벨 암호화 (ADR-070)

```
전략: Supabase RLS + AES-256 이중 보호

암호화:
  plaintext → AES-256-GCM(key, iv) → ciphertext + authTag
  → base64 인코딩 → DB 저장

복호화:
  DB 조회 → base64 디코딩 → AES-256-GCM(key, iv, authTag) → plaintext

키 관리:
  - SAFETY_ENCRYPTION_KEY: 환경변수 (서버사이드 전용)
  - 클라이언트에 키 노출 금지
  - 복호화는 API 라우트에서만 수행
```

### 4.2 접근 제어

```
클라이언트 → API → 복호화 → 응답

API 라우트만 복호화 가능:
  /api/safety/profile (GET)  → 복호화하여 반환
  /api/safety/profile (PUT)  → 암호화하여 저장
  /api/safety/check (POST)   → 복호화 + 검사 → SafetyReport 반환
```

---

## 5. 면책 표시

### 5.1 필수 면책 문구

모든 안전성 정보 표시 시:

```
"이 정보는 의료 조언이 아닌 일반 참고 정보입니다.
알레르기가 심하거나 건강 상태가 우려되시면
전문 의료인과 상담하세요."
```

### 5.2 Level별 면책

- Level 1 BLOCK: "이 성분은 회원님의 알레르기 정보와 일치하여 제외했어요. 정확한 확인은 전문의와 상담해주세요."
- Level 2 WARN: "이 성분은 회원님의 상태에서 주의가 필요할 수 있어요."
- Level 3 INFO: "참고: EWG 등급이 높은 성분이 포함되어 있어요."

---

## 6. 사고 대응

### 6.1 Level 1 오검증 발견 시

```
1. 즉시: 해당 알레르겐 규칙 긴급 패치
2. 1시간 내: 영향 받은 사용자 식별 + 알림
3. 24시간 내: 근본 원인 분석 + 재발 방지
4. 문서화: docs/incidents/ 사고 보고서 작성
```

### 6.2 FNR 모니터링

```
매주: 알레르겐 DB 교차 검증 (100건 샘플)
매월: 전체 규칙 무결성 검사
분기: 신규 알레르겐 정보 업데이트
```

---

## 7. 테스트

| 테스트        | 내용                      | 기준      |
| ------------- | ------------------------- | --------- |
| 알레르겐 매칭 | 5그룹 × 10케이스 = 50TC   | FNR 0%    |
| 금기사항      | 임산부/연령/질환 각 10TC  | FNR ≤ 5%  |
| pH 충돌       | 알려진 10쌍 검사          | 100% 탐지 |
| 암호화        | 저장/복호화/키 미노출     | Pass      |
| 동의 미제공   | Safety 검사 비활성화 확인 | Pass      |
| 성능          | 100성분 제품 검사         | < 500ms   |

---

## 8. 의도적 제외

| 제외 항목                 | 이유                        | 재검토 시점           |
| ------------------------- | --------------------------- | --------------------- |
| 약물-성분 상호작용 DB     | 의료 영역, 전문가 검증 필요 | 의료 파트너십 체결 시 |
| 농도 기반 정밀 분석       | 제품 농도 비공개가 대부분   | 제조사 API 연동 시    |
| 실시간 피부 반응 모니터링 | 하드웨어(패치 센서) 의존    | Phase N               |
| GDPR 수준 동의 체계       | 현재 국내 서비스만          | 해외 출시 시          |

---

## 관련 문서

- [ADR-070: Safety Profile 아키텍처](../adr/ADR-070-safety-profile-architecture.md)
- [P-2: safety-science.md](../principles/safety-science.md)
- [R-2: SAFETY-LEGAL-R2](../research/claude-ai-research/SAFETY-LEGAL-R2-안전법률리서치.md)
- [L-1: DISCLAIMER-TEMPLATES](../legal/DISCLAIMER-TEMPLATES.md)
- [L-2: PRIVACY-DESIGN](../legal/PRIVACY-DESIGN.md)

---

**Version**: 1.0 | **Created**: 2026-03-03
