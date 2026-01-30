# 출시 전 체크리스트

> **Version**: 1.0 | **Updated**: 2026-01-21
> **Status**: `active`

---

## 1. 개요

이 문서는 이룸 서비스의 정식 출시 전 확인해야 할 모든 항목을 정의합니다.

---

## 2. 기능 완성도

### 2.1 핵심 기능 (P0 - 출시 필수)

```markdown
## AI 분석 기능
□ PC-1 퍼스널컬러 분석 작동 확인
□ S-1 피부 분석 작동 확인
□ C-1 체형 분석 작동 확인
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
