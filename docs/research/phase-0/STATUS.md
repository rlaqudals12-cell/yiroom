# STATUS.md - 프로젝트 상태

> 통합: 완료 Phase + 현재 Gap + 기능 분류 + 구현 가이드
> 버전: 1.1 | 업데이트: 2026-01-15

---

## ✅ 완료된 Phase (수정 금지)

| Phase | 모듈 | 설명 |
|-------|------|------|
| 1 | PC-1, S-1, C-1 | 퍼스널컬러, 피부, 체형 |
| 2 | W-1, N-1, R-1 | 운동, 영양, 리포트 |
| 3 | E2E | 크로스 모듈 테스트 |
| A | Product DB | 850+ 제품, RAG |
| B | React Native | Expo, 알림 동기화 |
| D | AI 피부 상담 | Q&A, 제품 추천 |
| H | 소셜 | 웰니스 스코어, 리더보드 |
| I | 어필리에이트 | iHerb, 쿠팡, 무신사 |
| J | AI 스타일링 | 색상 조합, 메이크업 |
| K | UX 고도화 | 성별 중립화, 패션 확장 |
| L | 온보딩 | 자세 시뮬, 가상 피팅 |
| M | 영양 고도화 | 팬트리, 레시피 DB |
| - | 개인정보 | 동의/철회/회원탈퇴 |

**총 테스트: 2,776개** ✅

---

## 🔄 현재 진행 (Phase N: 법적 완성)

| 항목 | 우선순위 | 복잡도 | 법적 근거 |
|------|----------|--------|----------|
| 만 14세 확인 UI | 🔴 필수 | 35점 | 개인정보보호법 §22 |
| 14세 미만 차단 MVP | 🔴 필수 | 25점 | 개인정보보호법 §22 |
| GDPR Cron 활성화 | 🔴 필수 | 15점 | GDPR Art.17 |

---

## 🔴 영구 제외 (재제안 금지)

| 기능 | 제외 사유 | 대안 |
|------|----------|------|
| 닮은 연예인/유튜버 | 초상권 침해 | 일러스트 가이드 |
| 연예인 사진 | 저작권/초상권 | 컬러칩 시각화 |
| 유튜버 리뷰 연동 | 저작권 | 자체 리뷰 |
| 구독 모델 | 비즈니스 방향 | 구매 전환 |

---

## 🟡 기술적 보류

| 기능 | 보류 사유 | 재검토 |
|------|----------|--------|
| 실시간 자세 교정 | 실시간 영상 처리 | Phase 3 |
| AR 가상 피팅 | 3D 모델링 | Phase 3 |

---

## 🟠 재정적 보류

| 기능 | 보류 사유 | 재검토 조건 |
|------|----------|-------------|
| GPT-4 Vision | API 비용 | MAU 1만+ |
| 실시간 AI 코칭 | 서버 비용 | 수익화 후 |

---

## 🔵 우선순위 보류 (Phase 2+)

| 기능 | 의존성 | 예정 |
|------|--------|------|
| 커뮤니티 | 사용자 풀 | Phase 2 |
| 챌린지/배틀 | 커뮤니티 | Phase 2 |
| 헬스장 연동 | 사업 개발 | Phase 3 |

---

## 🟢 조건부 활성화

| 기능 | 활성화 조건 |
|------|------------|
| 일본어 지원 | 일본 진출 확정 |
| 결제 기능 | 프리미엄 출시 |
| AI OCR | MAU 5,000+ |
| TestFlight | Apple 키 대기 |

---

## 🎯 Phase N 구현 가이드 (Claude Code용)

### N-1: 만 14세 확인 UI (35점 Light)
```
[파일 생성]
- apps/web/app/(auth)/sign-up/age-gate/page.tsx
- apps/web/components/auth/AgeGate.tsx
- lib/utils/age-verification.ts
- supabase/migrations/202601140001_age_verification.sql

[구현 코드]
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

[DB 마이그레이션]
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;

[테스트 케이스]
□ 14세 이상 → 정상 진행
□ 14세 미만 → 차단 메시지
□ 미입력 → 진행 불가
□ 미래 날짜 → 에러
□ 100세+ → 경고
```

### N-2: 14세 미만 차단 MVP (25점 Quick)
```
[MVP 구현]
if (isMinor(birthDate)) {
  throw new Error('만 14세 이상만 이용 가능합니다.');
}

[테스트]
□ 차단 메시지 표시
□ 회원가입 진행 불가
□ 안내 문구 정확성
```

### N-3: GDPR Cron 활성화 (15점 Quick)
```
[조치]
1. Supabase 대시보드 → Database → Extensions → pg_cron 활성화
2. SQL Editor에서 실행:

SELECT cron.schedule(
  'gdpr-auto-delete',
  '0 3 * * *',
  $$ SELECT net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/gdpr-auto-delete',
    headers := '{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
  ); $$
);

[검증]
SELECT * FROM cron.job;
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### 시지푸스 복잡도 평가
| 태스크 | 복잡도 | 트랙 | 예상 시간 |
|--------|--------|------|----------|
| N-1 | 35점 | Light | 4시간 |
| N-2 | 25점 | Quick | 2시간 |
| N-3 | 15점 | Quick | 30분 |

---

## 🚨 절대 주의사항

### 🔴 절대 하지 말 것
- 완료된 Phase 1~M 코드 수정
- 회원탈퇴 로직 변경 (이미 완벽)
- AI Fallback 패턴 변경
- 테스트 삭제/skip 처리

### ✅ 반드시 할 것
- Spec-First 원칙 준수
- typecheck + lint + test 통과
- DB 마이그레이션 롤백 가능하게
- 법적 텍스트는 법무 검토 표시
