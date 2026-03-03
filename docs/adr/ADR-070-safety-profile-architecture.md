# ADR-070: Safety Profile 기술 아키텍처

## 상태

**제안** (2026-03-03)

## 컨텍스트

캡슐 에코시스템에서 제품 추천 시 사용자의 알레르기, 건강 상태, 임신 여부 등을
고려한 안전성 검증이 필수이다. Safety Profile은 "Better Safe Than Sorry" 원칙에 따라
False Negative(위험한데 통과) 발생률을 0.1% 미만으로 유지해야 한다.

### 법적 경계

- 약사법 제44조: 의약품 판매 행위 금지 → "정보 제공"으로 한정
- 화장품법 제13조: 효능/효과 표현 범위 준수
- 개인정보보호법 제23조: 건강 데이터 = 민감정보 → 별도 동의 필수
- 상세: [R-2 안전법률리서치](../research/claude-ai-research/SAFETY-LEGAL-R2-안전법률리서치.md)

## 결정

### 1. 민감정보 분리 저장

```
일반 프로필 (Supabase 일반 테이블):
  - 이름, 이메일, 피부타입, 체형 등

Safety Profile (Supabase + 암호화):
  - allergies: string[]         — 알레르기 목록
  - conditions: string[]        — 건강 상태 (임신, 질환)
  - skinConditions: string[]    — 피부 질환
  - age: number
  - medications: string[]       — 복용 약물 (향후)
```

**저장 전략**: Supabase RLS + 애플리케이션 레벨 암호화

- `safety_profiles` 테이블: `clerk_user_id` 기반 RLS (본인만 접근)
- 알레르기/질환 데이터: AES-256 암호화 후 저장
- 복호화는 서버 사이드에서만 수행 (클라이언트 노출 금지)

### 2. 3-Level 위험 분류

| Level | 이름     | 조건                       | 행동               | 허용 FNR |
| ----- | -------- | -------------------------- | ------------------ | -------- |
| 1     | CRITICAL | 알레르겐 + 확인된 알레르기 | BLOCK (추천 제외)  | ≤ 0.1%   |
| 2     | WARNING  | 특정 상태 + 주의 성분      | WARN (경고 표시)   | ≤ 5%     |
| 3     | INFO     | 일반 주의                  | INFORM (정보 제공) | ≤ 15%    |

### 3. 안전성 검사 파이프라인

```
입력: [사용자 SafetyProfile] + [제품 성분 목록]

Step 1: 알레르겐 교차 반응 검사 (Level 1)
  → CROSS_REACTIVITY_GROUPS DB 조회
  → 매칭 시 BLOCK

Step 2: 금기사항 검사 (Level 2)
  → 임산부/질환/연령 주의 성분 DB 조회
  → 매칭 시 WARN

Step 3: 성분 상호작용 검사 (Level 2-3)
  → pH 충돌, 산화 비호환, 킬레이션 검사
  → ingredient_interactions 테이블 활용

Step 4: EWG 등급 기반 일반 안전성 (Level 3)
  → cosmetic_ingredients 테이블 활용 (100시드)

출력: SafetyReport { grade, score, alerts[], blockedIngredients[] }
```

### 4. 동의 체계

```
1단계 (필수): 서비스 약관 동의
2단계 (선택): Safety Profile 수집 동의
  → 동의 거부 시: 일반 추천만 (안전성 검사 비활성화)
  → 동의 시: 개인화 안전성 검사 활성화
3단계 (선택): 건강 상태 추가 입력
  → 입력하지 않은 항목은 검사 미수행
```

### 5. 면책 표시 전략

모든 안전성 정보에 면책 문구 동반:

- 의료 조언이 아닌 일반 정보임을 명시
- "전문가와 상담하세요" 안내
- 상세 템플릿: L-1 면책 조항 참조

## 대안

| 대안                     | 장점                     | 단점                                     | 기각 이유        |
| ------------------------ | ------------------------ | ---------------------------------------- | ---------------- |
| Supabase Vault 사용      | Supabase 네이티브 암호화 | Vault는 키 관리용, 행 단위 암호화 미지원 | 용도 불일치      |
| 별도 암호화 DB (AWS KMS) | 최고 수준 보안           | 인프라 비용/복잡도                       | 현재 규모에 과도 |
| 안전성 검사 비제공       | 법적 리스크 제거         | 사용자 안전 미보장                       | 핵심 가치 훼손   |

## 결과

### 장점

- 기존 cosmetic_ingredients + ingredient_interactions 테이블 활용
- RLS + 앱 레벨 암호화 이중 보호
- 3-Level 분류로 경고 피로(Warning Fatigue) 방지
- 동의 기반 수집으로 법률 준수

### 단점

- 앱 레벨 암호화 키 관리 필요
- Safety Profile 미입력 사용자는 일반 추천만 가능

## 관련 문서

- [P-2: safety-science.md](../principles/safety-science.md) — 안전성 과학 원리
- [R-2: SAFETY-LEGAL-R2](../research/claude-ai-research/SAFETY-LEGAL-R2-안전법률리서치.md) — 법률 리서치
- [ADR-069: 캡슐 아키텍처](./ADR-069-capsule-ecosystem-architecture.md) — BeautyProfile 연동

---

**Version**: 1.0 | **Created**: 2026-03-03
