# 운영 문서

> **Version**: 1.0 | **Updated**: 2026-01-21
> 이룸 서비스 운영 및 출시 가이드

---

## 문서 목록

| 문서 | 설명 | 용도 |
|------|------|------|
| [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md) | 출시 전 체크리스트 | 배포 전 필수 확인 |
| [INCIDENT-RESPONSE.md](INCIDENT-RESPONSE.md) | 위기 대응 플레이북 | 장애 발생 시 대응 |
| [QA-PROCESS.md](QA-PROCESS.md) | QA 프로세스 가이드 | 품질 보증 절차 |

---

## 빠른 참조

### 장애 심각도

| 레벨 | 이름 | 대응 시간 | 예시 |
|------|------|----------|------|
| **P0** | Critical | 15분 이내 | 서비스 전체 중단, 보안 침해 |
| **P1** | High | 1시간 이내 | AI 분석 실패, 로그인 불가 |
| **P2** | Medium | 4시간 이내 | 특정 기능 장애 |
| **P3** | Low | 24시간 이내 | UI 버그, 성능 저하 |

### 비상 연락

```
Level 1 (5분)  → 담당 개발자
Level 2 (15분) → 시니어/리드
Level 3 (30분) → CEO/CTO
```

### 외부 서비스

| 서비스 | 상태 페이지 |
|--------|-----------|
| Vercel | status.vercel.com |
| Supabase | status.supabase.com |
| Clerk | status.clerk.dev |
| Google Cloud | status.cloud.google.com |

---

## 출시 체크리스트 요약

### 기능 완성도

```markdown
## P0 - 출시 필수
□ AI 분석 (PC-1, S-1, C-1) 작동
□ 회원가입/로그인 플로우
□ 분석 결과 저장/조회
□ 반응형 UI (모바일/데스크톱)

## P1 - 출시 권장
□ AI 코치 기본 기능
□ 다크 모드
□ 프로필 수정
```

### 품질 기준

```markdown
□ Lighthouse 90+ (모바일)
□ 테스트 커버리지 60%+
□ API 응답 < 500ms (일반)
□ AI 분석 < 5s
```

### 보안 체크

```markdown
□ RLS 정책 모든 테이블 적용
□ Rate Limiting 활성화 (50 req/24h)
□ HTTPS 강제
□ npm audit 심각 취약점 없음
```

---

## QA 파이프라인

```
┌─────────────────────────────────────────────────────────────────┐
│                      QA 파이프라인                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   개발 완료                                                      │
│       │                                                          │
│       ▼                                                          │
│   Stage 1: 자동화 테스트                                         │
│   ├── 단위 테스트 (npm run test)                                │
│   ├── 타입 체크 (npm run typecheck)                             │
│   └── 린트 (npm run lint)                                       │
│       │                                                          │
│       ▼                                                          │
│   Stage 2: 코드 리뷰                                             │
│   ├── PR 리뷰 (1명+ 승인)                                       │
│   └── 보안 체크리스트                                           │
│       │                                                          │
│       ▼                                                          │
│   Stage 3: 스테이징 테스트                                       │
│   ├── 수동 기능 테스트                                          │
│   └── UI/UX 검수                                                │
│       │                                                          │
│       ▼                                                          │
│   Stage 4: 프로덕션 배포                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 장애 대응 플로우

```
장애 감지 → 확인 (5분) → 공유 (5분) → 착수 (5분)
                ↓
         원인 조사 → 복구 → 검증 → Postmortem
```

### Postmortem 필수 항목

```markdown
1. 타임라인 (언제 무엇이 발생했나)
2. 근본 원인 (왜 발생했나)
3. 영향 (누가/무엇이 영향받았나)
4. 대응 조치 (무엇을 했나)
5. 재발 방지 (어떻게 방지할 것인가)
```

---

## 모니터링

| 도구 | 용도 | 알림 채널 |
|------|------|----------|
| Vercel Analytics | 트래픽, 성능 | - |
| Sentry | 에러 추적 | Slack |
| Uptime Robot | 가용성 | Email |
| Supabase Dashboard | DB 모니터링 | - |

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| [.claude/rules/security-checklist.md](../../.claude/rules/security-checklist.md) | 보안 체크리스트 |
| [.claude/rules/testing-patterns.md](../../.claude/rules/testing-patterns.md) | 테스트 패턴 |
| [.claude/commands/deploy-check.md](../../.claude/commands/deploy-check.md) | 배포 전 체크 명령어 |

---

**Author**: Claude Code
