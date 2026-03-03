# L-2: 개인정보 보호 설계

> **Version**: 1.0 | **Created**: 2026-03-03
> **기반**: [R-2: SAFETY-LEGAL-R2](../research/claude-ai-research/SAFETY-LEGAL-R2-안전법률리서치.md) §3
> **기술 구현**: [ADR-070: Safety Profile](../adr/ADR-070-safety-profile-architecture.md)

---

## 1. 법적 근거

### 1.1 개인정보보호법 제23조 (민감정보)

```
민감정보 = 건강, 유전정보, 범죄경력, 사상/신념, 인종/민족 등

이룸 해당 데이터:
  - 알레르기 정보 → 민감정보
  - 건강 상태 (임신 등) → 민감정보
  - 피부 질환 → 민감정보
  - 복용 약물 → 민감정보

→ 별도 동의 필수 (일반 서비스 약관과 분리)
```

### 1.2 데이터 분류

| 데이터         | 분류         | 처리 방법               |
| -------------- | ------------ | ----------------------- |
| 이메일, 이름   | 개인정보     | Clerk 위임              |
| 피부타입, 체형 | 개인정보     | Supabase RLS            |
| 알레르기       | **민감정보** | RLS + AES-256 암호화    |
| 건강 상태      | **민감정보** | RLS + AES-256 암호화    |
| 피부 질환      | **민감정보** | RLS + AES-256 암호화    |
| 얼굴 이미지    | 개인정보     | Supabase Storage 비공개 |
| 분석 결과      | 개인정보     | Supabase RLS            |

---

## 2. 동의 설계

### 2.1 동의 계층 (ADR-070)

```
1단계 (필수): 서비스 이용 약관 + 개인정보처리방침
  → 동의하지 않으면 서비스 사용 불가
  → 수집 항목: 이메일, 이름, 분석 결과

2단계 (선택): Safety Profile 수집 동의
  → 동의하지 않으면 일반 추천만 제공
  → 수집 항목: 알레르기, 건강 상태, 피부 질환

3단계 (선택): 건강 상태 추가 입력
  → 각 항목 개별 입력 (전부 또는 일부)
  → 입력하지 않은 항목은 검사 미수행
```

### 2.2 동의 UI 요구사항

```
필수 요소:
  □ 동의 내용 전문 표시 (스크롤 가능)
  □ 수집 항목 명시 (구체적)
  □ 이용 목적 명시
  □ 보관 기간 명시
  □ 철회 방법 안내
  □ 체크박스 기본값 = 미선택

금지:
  ✗ 사전 선택된 체크박스
  ✗ "전체 동의" 버튼으로 민감정보 동의 포함
  ✗ 동의 없이 민감정보 수집
```

### 2.3 동의 문구 템플릿

```
[Safety Profile 수집 동의]

이룸은 더 안전한 제품 추천을 위해 아래 건강 정보를 수집해요:

• 알레르기 정보 (식품, 화장품 성분 등)
• 건강 상태 (임신 여부, 기저 질환 등)
• 피부 질환 (아토피, 건선 등)

수집 목적: 개인 맞춤 안전성 검사 (위험 성분 자동 차단)
보관 기간: 회원 탈퇴 시 또는 동의 철회 시 즉시 삭제
보관 방법: AES-256 암호화 저장, 본인만 접근 가능

동의를 철회하고 싶으시면 설정 > 개인정보 > Safety Profile에서
언제든 삭제할 수 있어요.

□ 위 내용을 이해했으며, 건강 정보 수집에 동의해요
```

---

## 3. 기술적 보호 조치

### 3.1 암호화 (ADR-070)

```
저장 시: AES-256-GCM 암호화
  - 키: SAFETY_ENCRYPTION_KEY (환경변수)
  - IV: 레코드별 고유 생성
  - 서버사이드에서만 암호화/복호화

접근 시: Supabase RLS
  - clerk_user_id 기반
  - 본인 데이터만 SELECT/UPDATE 가능

전송 시: HTTPS (Vercel 기본)
```

### 3.2 접근 제어

| 주체       | 일반 프로필 | Safety Profile          |
| ---------- | ----------- | ----------------------- |
| 본인       | 읽기/쓰기   | 읽기/쓰기 (API 통해)    |
| 관리자     | 읽기        | **접근 불가** (암호화)  |
| API 서버   | 읽기        | 복호화 가능 (검사 목적) |
| 클라이언트 | 읽기        | **접근 불가**           |

### 3.3 로깅 규칙

```
허용 로깅:
  - "[Safety] Profile updated for user: clerk_xxx" (ID만)
  - "[Safety] Check completed: grade=SAFE, alertCount=2"

금지 로깅:
  - 알레르기 목록
  - 건강 상태 상세
  - 복호화된 민감정보
  - 사용자 얼굴 이미지 URL
```

---

## 4. 데이터 생명주기

### 4.1 수집 → 삭제 플로우

```
수집: 2단계 동의 시
보관: 동의 유지 기간
갱신: 사용자 직접 수정
삭제 트리거:
  1. 사용자 동의 철회 → 즉시 삭제
  2. 회원 탈퇴 → 즉시 삭제
  3. 12개월 미접속 → 익명화 (통계 목적)
```

### 4.2 삭제 구현

```
동의 철회 시:
  1. safety_profiles 해당 행 DELETE
  2. 관련 SafetyReport 캐시 무효화
  3. 로그: "[Safety] Profile deleted for user: clerk_xxx"
  4. 일반 추천 모드로 전환
```

---

## 5. 권리 보장

### 5.1 정보주체 권리

| 권리      | 구현                | 경로                     |
| --------- | ------------------- | ------------------------ |
| 열람권    | Safety Profile 조회 | 설정 > Safety            |
| 정정권    | 정보 수정           | 설정 > Safety > 수정     |
| 삭제권    | 즉시 삭제           | 설정 > Safety > 삭제     |
| 동의 철회 | 즉시 비활성화       | 설정 > 개인정보          |
| 이동권    | JSON 내보내기       | 설정 > 데이터 > 내보내기 |

---

## 6. 체크리스트

### 출시 전 검증

- [ ] 민감정보 동의 UI 별도 구현 → `app/(settings)/safety/consent` 화면 확인
- [ ] 동의 없이 Safety 데이터 접근 불가 확인 → `tests/api/safety/auth.test.ts`
- [ ] AES-256 암호화 저장 확인 → `tests/api/safety/encryption.test.ts`
- [ ] 클라이언트에서 복호화 불가 확인 → RLS + API 라우트 전용 복호화 검증
- [ ] 로그에 민감정보 미포함 확인 → `scripts/check-pii-in-logs.sh`
- [ ] 동의 철회 시 즉시 삭제 확인 → `tests/api/safety/consent-withdrawal.test.ts`
- [ ] 개인정보처리방침에 Safety Profile 항목 포함 → `app/(legal)/privacy` 페이지 확인
- [ ] 12개월 미접속 익명화 스크립트 준비 → `scripts/anonymize-inactive-users.sql`

---

## 관련 문서

- [R-2: SAFETY-LEGAL-R2](../research/claude-ai-research/SAFETY-LEGAL-R2-안전법률리서치.md) — §3 개인정보보호법
- [ADR-070: Safety Profile](../adr/ADR-070-safety-profile-architecture.md) — 기술 아키텍처
- [L-1: DISCLAIMER-TEMPLATES](./DISCLAIMER-TEMPLATES.md) — 면책 조항
- [L-3: OPERATIONS-MANUAL](./OPERATIONS-MANUAL.md) — 사고 대응

---

**Version**: 1.0 | **Created**: 2026-03-03
