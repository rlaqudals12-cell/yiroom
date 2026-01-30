# BUNDLE-07: 운영 및 인프라

> 스케일링, 배포, SLO/SLI 리서치

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| **Bundle ID** | BUNDLE-07 |
| **우선순위** | P1 |
| **예상 시간** | 2시간 |
| **도메인** | DevOps/인프라 |
| **포함 항목** | OPS-SCALING-STRATEGY, OPS-CANARY-DEPLOY, OPS-SLO-SLI, QUALITY-SCALABILITY, QUALITY-RELIABILITY |

---

## 입력

### 참조 문서
- `.claude/rules/performance-guidelines.md` - 성능 가이드라인
- `apps/web/vercel.json` - 현재 Vercel 설정
- `docs/research/claude-ai-research/PERFORMANCE-2026-R1.md` - 성능 리서치

### 선행 리서치
- BUNDLE-01: Next.js 기술 스택

---

## 출력

### 생성할 파일

| 파일명 | 내용 |
|--------|------|
| `docs/research/claude-ai-research/OPS-SCALING-STRATEGY-R1.md` | 스케일링 전략 |
| `docs/research/claude-ai-research/OPS-CANARY-DEPLOY-R1.md` | 카나리 배포 전략 |
| `docs/research/claude-ai-research/OPS-SLO-SLI-R1.md` | SLO/SLI 정의 |
| `docs/research/claude-ai-research/QUALITY-SCALABILITY-R1.md` | 확장성 품질 속성 |
| `docs/research/claude-ai-research/QUALITY-RELIABILITY-R1.md` | 신뢰성 품질 속성 |

### 출력 형식
- `RESEARCH-OUTPUT-FORMAT.md` 준수
- 각 파일 1500-3000단어

---

## 프롬프트

### OPS-SCALING-STRATEGY

```
이룸 서비스의 스케일링 전략을 조사해주세요.

조사 범위:
1. Vercel Serverless 자동 스케일링
2. Supabase 연결 풀링 (Supavisor)
3. AI API 병목 해결 전략
4. 이미지 처리 워커 스케일링
5. 캐싱 레이어 (Vercel Edge, Redis)
6. CDN 및 에셋 최적화

기대 결과:
- 사용자 수별 인프라 요구사항
- 스케일링 자동화 설정 가이드
- 비용 최적화된 스케일링 정책
- 병목 지점 식별 및 해결책
```

### OPS-CANARY-DEPLOY

```
안전한 배포를 위한 카나리 배포 전략을 조사해주세요.

조사 범위:
1. Vercel Preview Deployments 활용
2. Feature Flag 기반 점진적 롤아웃
3. 카나리 지표 모니터링
4. 자동 롤백 조건 설정
5. A/B 테스트와 카나리의 차이
6. 데이터베이스 마이그레이션과 카나리

기대 결과:
- 카나리 배포 파이프라인 설계
- 롤아웃 단계별 체크리스트
- 롤백 자동화 설정
- 위험도별 배포 전략
```

### OPS-SLO-SLI

```
이룸 서비스의 SLO/SLI 정의를 조사해주세요.

조사 범위:
1. SLI (Service Level Indicator) 정의
2. SLO (Service Level Objective) 설정
3. Error Budget 개념 및 활용
4. 알림 임계값 설정
5. SLO 대시보드 구축
6. 인시던트 대응과 SLO 연계

기대 결과:
- 이룸 핵심 SLI 목록 (가용성, 지연시간, 에러율)
- SLO 목표치 설정 (99.5% 등)
- Error Budget 정책
- 모니터링 알림 설정 가이드
```

### QUALITY-SCALABILITY

```
확장성 품질 속성을 상세히 조사해주세요.

조사 범위:
1. 수직 vs 수평 확장 전략
2. 상태 없는(Stateless) 설계 원칙
3. 데이터베이스 샤딩/파티셔닝
4. 비동기 처리 패턴 (Queue)
5. 읽기/쓰기 분리
6. 확장성 테스트 방법

기대 결과:
- 확장성 설계 원칙 체크리스트
- 현재 아키텍처 확장성 평가
- 개선 권장사항
- 확장성 테스트 계획
```

### QUALITY-RELIABILITY

```
신뢰성 품질 속성을 상세히 조사해주세요.

조사 범위:
1. 가용성 (Availability) 측정 및 개선
2. 내결함성 (Fault Tolerance) 설계
3. 복구 가능성 (Recoverability)
4. 회복탄력성 (Resilience) 패턴
5. 장애 격리 (Bulkhead)
6. 카오스 엔지니어링 적용

기대 결과:
- 신뢰성 설계 패턴 가이드
- MTTR/MTBF 목표 설정
- 장애 복구 절차
- 신뢰성 테스트 전략
```

---

## 의존성

```
선행: BUNDLE-01 (Tech)
후행: BUNDLE-15 (Crisis)
병렬: BUNDLE-04 (UX), BUNDLE-09 (Personalization)
```

---

## 검증

- [ ] 5개 파일 모두 생성됨
- [ ] Vercel/Supabase 특화 내용 포함
- [ ] 구체적인 SLO 수치 제안
- [ ] 자동화 가능한 설정 포함

---

**Version**: 1.0 | **Created**: 2026-01-18
