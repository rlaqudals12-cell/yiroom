# ADR-006: Phase 실행 순서 원칙

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"법적 요구사항 → 안정성 → 공유 커널 → 기능 순으로 완벽히 정렬된 개발 로드맵"

- Legal 요구사항 100% 사전 충족
- 기술부채 제로 상태 유지
- Phase 간 의존성 그래프 명확
```

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| 법적 준수 | 배포 전 100% 검증 |
| 기술부채 | 누적 0 유지 |
| Phase 순서 | 역순 실행 0건 |

### 현재 달성률

**80%** - 법적 요건 충족, Phase 순서 준수 중

---

## 상태

`accepted`

## 날짜

2026-01-15

## 맥락 (Context)

이룸 엔지니어링 로드맵은 여러 Phase로 구성되어 있습니다. 잘못된 실행 순서는 다음 문제를 야기합니다:

1. **법적 리스크**: 14세 미만 사용자 데이터 수집 시 법적 책임
2. **기술부채 누적**: 500 에러 반복 (실제 사례: PC-1 DB 컬럼 불일치)
3. **비효율**: 공유 컴포넌트 없이 개별 구현 → 중복 코드

## 결정 (Decision)

**Legal First → Stability First → Shared Kernel → Dependency Flow** 원칙을 채택합니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                        실행 우선순위 계층                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase -2: 법적 필수 (Legal Requirements)                       │
│     └── 배포 전 반드시 충족해야 하는 법적 의무                   │
│                           ↓                                     │
│  Phase -1: 기술부채 P0 (Stability Foundation)                   │
│     └── 500 에러 방지, 보안, 인증 안정화                        │
│                           ↓                                     │
│  Phase 0: 기반 구조 (Infrastructure)                            │
│     └── 색상 토큰, 디자인 시스템, PC-1 안정화                   │
│                           ↓                                     │
│  Phase 1: Core Image Engine (Shared Kernel)                     │
│     └── CIE-1~4 공유 이미지 처리 파이프라인                     │
│                           ↓                                     │
│  Phase 2: 진단 모듈 v2 (Analysis Modules)                       │
│     └── PC-2, S-2, C-2 (CIE 통합)                               │
│                           ↓                                     │
│  Phase 3+: 확장 및 고도화                                       │
│     └── SK-1, OH-1, W-2, Fashion, UX 트렌드                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 기능 우선 개발 | 빠른 기능 출시 | 법적 리스크, 불안정 | `NOT_NEEDED` - 법적 준수 필수 |
| 병렬 개발 | 빠른 진행 | 의존성 충돌, 통합 어려움 | `HIGH_COMPLEXITY` - 조정 비용 높음 |
| 사용자 요청 기반 | 시장 반응 반영 | 체계 없는 개발 | `LOW_ROI` - 기술부채 누적 |

## 결과 (Consequences)

### 긍정적 결과

- **법적 준수**: 서비스 중단 리스크 제거
- **안정성**: 500 에러 방지, 보안 강화
- **효율성**: 공유 커널로 코드 중복 제거
- **예측 가능성**: 명확한 의존성 순서

### 부정적 결과

- **초기 지연**: 기반 작업에 시간 소요
- **유연성 감소**: 순서 변경 어려움

### 리스크

- Phase 건너뛰기 유혹 → **체크리스트로 순서 강제**

## 구현 가이드

### Phase 체크리스트

```
Phase -2: 법적 필수 (6.5시간)
├── [ ] N-1: 만 14세 확인 UI (4시간)
├── [ ] N-2: 14세 미만 차단 MVP (2시간)
├── [ ] N-3: GDPR Cron 활성화 (30분)
└── [ ] N-4: 이용약관, 개인정보처리방침

Phase -1: 기술부채 P0 (8시간)
├── [ ] P0-1: DB-API 동기화 규칙 확립
├── [ ] P0-2: proxy.ts 공개 라우트 확인
├── [ ] P0-3: 환경변수 검증 스크립트
├── [ ] P0-4: OWASP 보안 점검
├── [ ] P0-5: RLS 정책 설정 확인
├── [ ] P0-6: Rate Limiting 구현
└── [ ] P0-7: RLS 정책 완성 (20 테이블)

(이하 Phase 0~5A 계속)
```

### 의존성 검증

각 Phase 시작 전 선행 Phase 완료 확인:

```typescript
// 의사 코드
function canStartPhase(phase: Phase): boolean {
  const prerequisites = PHASE_DEPENDENCIES[phase];
  return prerequisites.every(p => isPhaseComplete(p));
}

const PHASE_DEPENDENCIES = {
  'Phase-1': ['Phase-2', 'Phase-1', 'Phase0'],
  'Phase1': ['Phase0'],
  'Phase2': ['Phase1'],
  // ...
};
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 법적 준수](../principles/legal-compliance.md) - Phase -2 법적 필수 요건의 기초

### 관련 ADR/스펙
- [First Principles](../../.claude/rules/00-first-principles.md) - P7 워크플로우
- [DB Migration Rules](../../.claude/rules/db-migration-rules.md) - 마이그레이션 규칙

---

**Author**: Claude Code
**Reviewed by**: -
