# 출시 전 체크리스트

> **Version**: 2.0 | **Updated**: 2026-04-23 (정체성 재정의 v2 반영 — ADR-098)
> **Status**: `active`

---

## 0. 정체성 v2 일관성 (2026-04-22 확정)

```markdown
## 5축 모델 반영 확인

□ 스토어 리스팅이 "거울 + 옷장 이해" 톤인지 (docs/plans/google-play-store-listing.md)
□ OH-1(구강), W-1(운동), N-1(영양) 언급이 UI/랜딩/스토어에 없는지
□ 랜딩 페이지 메타/OG 뷰티 포지셔닝 통일 확인 (커밋 356e13f1)
□ FEATURE_FLAGS.WELLNESS_PHASE2=false 유지 (packages/shared/src/feature-flags/)
□ Google Play 카테고리: "건강/피트니스" → **"뷰티"** 재분류 결정
```

---

## 1. 개요

이 문서는 이룸 서비스의 정식 출시 전 확인해야 할 모든 항목을 정의합니다.

---

## 2. 기능 완성도

### 2.1 핵심 기능 (P0 - 출시 필수, 5축 모델)

```markdown
## AI 분석 기능 (5축)

□ PC-1 퍼스널컬러 분석 작동 확인
□ S-1 피부 분석 작동 확인
□ C-1 체형 분석 — **3섹션(원칙+코디+옷장 CTA) 렌더링 확인**
□ H-1 헤어 분석 작동 확인
□ M-1 메이크업 제안 작동 확인 (PC+S 실행 레이어)
□ 분석 결과 저장/조회 확인
□ 분석 히스토리 표시

## 사용자 인증

□ 회원가입 플로우 완료
□ 로그인/로그아웃 작동
□ 소셜 로그인 (Google, Apple)
□ 비밀번호 재설정
□ 회원 탈퇴

## 제품 추천

□ 분석 기반 제품 추천 작동
□ 어필리에이트 링크 연결
□ 광고 표기 노출

## 기본 UI

□ 대시보드 페이지
□ 분석 결과 페이지
□ 설정 페이지
□ 반응형 레이아웃 (모바일/데스크톱)
```

### 2.2 지원 기능 (P1 - 출시 권장)

```markdown
□ AI 코치 기본 기능
□ 푸시 알림 설정
□ 다크 모드
□ 프로필 수정
□ 언어 설정 (한국어 기본)
```

### 2.3 향후 기능 (P2 - 출시 후)

```markdown
□ 운동 모듈 (W-1)
□ 영양 모듈 (N-1)
□ 소셜 기능
□ 프리미엄 구독
```

---

## 3. 품질 보증

### 3.1 테스트 완료

```markdown
## 단위 테스트

□ lib/ 테스트 커버리지 70% 이상
□ 핵심 함수 테스트 완료
□ API 라우트 테스트 완료

## 통합 테스트

□ 분석 플로우 E2E 테스트
□ 결제 플로우 테스트 (유료 기능 시)
□ 인증 플로우 테스트

## 수동 테스트

□ 모바일 브라우저 테스트 (iOS Safari, Android Chrome)
□ 데스크톱 브라우저 테스트 (Chrome, Safari, Firefox)
□ 느린 네트워크 테스트 (3G 시뮬레이션)
```

### 3.2 성능 검증

```markdown
## Core Web Vitals

□ LCP < 2.5s
□ FID < 100ms (INP < 200ms)
□ CLS < 0.1
□ Lighthouse 점수 90+ (모바일)

## API 성능

□ 일반 API 응답 < 500ms
□ AI 분석 응답 < 5s
□ 이미지 업로드 < 3s

## 부하 테스트

□ 동시 100명 접속 테스트
□ 분석 API 부하 테스트
```

---

## 4. 보안 검증

### 4.1 OWASP Top 10

```markdown
□ A01 - Broken Access Control: RLS 정책 검증
□ A02 - Cryptographic Failures: HTTPS, 암호화 확인
□ A03 - Injection: SQL/NoSQL Injection 테스트
□ A05 - Security Misconfiguration: 환경변수 확인
□ A07 - XSS: 사용자 입력 검증
```

### 4.2 인증/인가

```markdown
□ 모든 API에 인증 적용 확인
□ RLS 정책 전체 테이블 적용
□ Rate Limiting 적용 (50 req/24h)
□ 민감 정보 로깅 제외 확인
```

### 4.3 데이터 보호

```markdown
□ 이미지 데이터 암호화 저장
□ 서명된 URL 만료 시간 설정
□ 개인정보 접근 로그 기록
```

---

## 5. 법률/규정 준수

### 5.1 필수 문서

```markdown
□ 이용약관 게시
□ 개인정보처리방침 게시
□ 민감정보 처리 동의 UI
□ 마케팅 수신 동의 UI (선택)
```

### 5.2 광고/표시

```markdown
□ 어필리에이트 광고 표기
□ AI 분석 면책 조항
□ 의료 경계 문구
□ 쿠팡 파트너스 필수 문구
```

### 5.3 사업자 등록

```markdown
□ 사업자등록 완료
□ 통신판매업 신고 (해당 시)
□ 개인정보 보호책임자 지정
```

---

## 6. 인프라 준비

### 6.1 프로덕션 환경

```markdown
## 호스팅

□ Vercel 프로덕션 배포 완료
□ 커스텀 도메인 연결 (yiroom.app)
□ SSL 인증서 확인

## 데이터베이스

□ Supabase Pro 플랜 확인
□ 프로덕션 DB 마이그레이션 완료
□ 백업 설정 확인

## API 키

□ 프로덕션 Gemini API 키
□ 프로덕션 Clerk 키
□ 어필리에이트 API 키

## AI Mock → Real 전환 (출시 필수)

□ `apps/web/.env.local` — **FORCE_MOCK_AI=true → false** 또는 라인 제거
□ Vercel 프로덕션 환경변수 — `FORCE_MOCK_AI` 미설정 또는 `false`
□ `apps/mobile/.env.local` — 동일 확인
□ EAS 빌드 시 환경변수 확인 (`eas env:list`)
□ 프로덕션 배포 후 Real AI 호출 스모크 테스트:

- PC-1 · S-1 · C-1 · H-1 · M-1 각 1회씩 실제 Gemini 호출 확인
- 응답 시간 p95 < 3s 확인
- Mock fallback 트리거 조건(타임아웃 3s, 재시도 2회) 검증

## DB 마이그레이션 (출시 직후)

□ 5개 보류 마이그레이션 적용 (GFSA 롤백 복원 후):

- 20260305 (캡슐), 20260307 (ConnectionAwareness),
- 20260309 (모더레이션), 20260313 (위젯순서),
- **20260422_drop_oral_health** (OH-1 테이블 drop) — ADR-098
  □ 프로덕션 DB 적용 전 스테이징에서 검증
  □ Rollback SQL 준비 (각 마이그레이션마다)

## Vercel Cron 정리 (Free 플랜)

□ 현재 13개 → 2개로 축소 (Free 플랜 제한)
□ 비필수 Cron 비활성화 (가격 알림 등은 Phase 2 이후 재개)
```

### 6.2 모니터링

```markdown
□ Vercel Analytics 활성화
□ Sentry 에러 추적 설정
□ Uptime 모니터링 설정
□ 알림 채널 설정 (Slack/Email)
```

### 6.3 백업/복구

```markdown
□ DB 자동 백업 확인
□ 복구 테스트 완료
□ 롤백 절차 문서화
```

---

## 7. 운영 준비

### 7.1 고객 지원

```markdown
□ FAQ 페이지 작성
□ 문의 채널 설정 (이메일/인앱)
□ 응답 템플릿 준비
□ 지원 담당자 지정
```

### 7.2 문서화

```markdown
□ 사용자 가이드 작성
□ API 문서 (B2B 시)
□ 내부 운영 매뉴얼
```

### 7.3 위기 대응

```markdown
□ 장애 대응 플레이북 작성
□ 비상 연락망 구축
□ 롤백 절차 숙지
```

---

## 8. 마케팅 준비

### 8.1 앱스토어

```markdown
## iOS App Store (해당 시)

□ 앱 메타데이터 작성
□ 스크린샷 준비 (5.5", 6.5")
□ 앱 아이콘 등록
□ 심사 가이드라인 준수 확인

## Google Play (해당 시)

□ 스토어 등록 정보 작성
□ 그래픽 에셋 준비
□ 콘텐츠 등급 설정
```

### 8.2 웹사이트

```markdown
□ 랜딩 페이지 준비
□ SEO 메타 태그 설정
□ Open Graph 이미지
□ sitemap.xml 생성
□ robots.txt 설정
```

### 8.3 SNS

```markdown
□ 공식 계정 생성 (Instagram, TikTok)
□ 런칭 콘텐츠 준비
□ 해시태그 전략
```

---

## 9. 출시 당일 체크리스트

### 9.1 출시 전 (D-Day 오전)

```markdown
□ 프로덕션 환경 최종 확인
□ 모든 API 정상 작동 확인
□ 모니터링 대시보드 확인
□ 팀 대기 상태 확인
```

### 9.2 출시 시점

```markdown
□ 앱스토어 출시 (해당 시)
□ 랜딩 페이지 공개
□ SNS 런칭 포스트
□ 프레스 릴리스 (해당 시)
```

### 9.3 출시 후 (D-Day 오후)

```markdown
□ 실시간 모니터링 (2시간)
□ 첫 사용자 피드백 수집
□ 긴급 버그 대응 대기
□ 성능 지표 확인
```

---

## 10. 출시 후 1주일

```markdown
□ DAU/MAU 추적
□ 사용자 피드백 분석
□ 버그 리포트 대응
□ 성능 최적화 (필요시)
□ 첫 업데이트 계획
```

---

## 관련 문서

- [docs/ops/INCIDENT-RESPONSE.md](INCIDENT-RESPONSE.md) - 위기 대응
- [docs/ops/QA-PROCESS.md](QA-PROCESS.md) - QA 프로세스
- [.claude/rules/security-checklist.md](../../.claude/rules/security-checklist.md) - 보안 체크리스트

---

**Author**: Claude Code
