# 리서치 문서

> 이룸 프로젝트 기술 리서치 결과물 저장소

## 폴더 구조

```
docs/research/
├── _templates/           # 리서치 티켓 템플릿
│   ├── RESEARCH-TICKET.md
│   └── CLAUDE-AI-REQUEST.md
├── phase-0/              # 기반 구조 리서치 (기존 문서 포함)
│   ├── CORE.md           # 정체성 + 기술스택 + 코딩규칙
│   ├── STATUS.md         # 완료/진행/제외 기능
│   ├── SYSTEMS.md        # 캡슐엔진 + 인벤토리 + 컨설팅
│   └── REFERENCE.md      # 법적 + 경쟁사 + 디자인
├── phase-1/              # Core Image Engine (CIE-1~4)
│   ├── CIE-1-image-quality/
│   ├── CIE-2-landmarks/
│   ├── CIE-3-lighting/
│   └── CIE-4-roi/
├── phase-2/              # 진단 모듈 v2 (PC-2, S-2, C-2)
├── phase-3/              # 확장 모듈 (SK-1, OH-1, W-2)
├── claude-ai-research/   # claude.ai 리서치 결과물
├── architecture/         # 아키텍처 관련 리서치
├── archive/              # 과거 리서치 아카이브
└── PROGRESS.md           # 진행 상황 추적
```

## 리서치 워크플로우

```
┌─────────────────────────────────────────────────────────────────┐
│                   리서치 → 구현 파이프라인                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 딥 리서치 (claude.ai)                                       │
│     └── 기술 스펙, 알고리즘 비교, 학술 자료, 라이브러리 벤치마크 │
│     └── 출력: 리서치 리포트 (Markdown)                          │
│                           ↓                                     │
│  2. ADR 작성 (Claude Code)                                      │
│     └── 결정 사항 문서화, 대안 기록, 근거 명시                  │
│     └── 위치: docs/adr/ADR-XXX-*.md                             │
│                           ↓                                     │
│  3. 구현 (Claude Code)                                          │
│     └── 코드 작성, 테스트, 타입체크, 린트                       │
│     └── 검증: npm run typecheck && npm run lint && npm run test │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 리서치 티켓 추적

### Phase 1: Core Image Engine

| ID | 제목 | 상태 | 결과물 |
|----|------|------|--------|
| CIE-1-R1 | 이미지 품질 평가 알고리즘 | 대기 | - |
| CIE-2-R1 | 얼굴 랜드마크 라이브러리 선정 | 대기 | - |
| CIE-3-R1 | Lab 색공간 피부톤 분석 | 대기 | - |
| CIE-4-R1 | 손목 혈관 감지 알고리즘 | 대기 | - |

### Phase 2: 진단 모듈 v2

| ID | 제목 | 상태 | 결과물 |
|----|------|------|--------|
| S-2-R1 | 피부 텍스처 메트릭 계산 | 대기 | - |

### Phase 3: 확장 모듈

| ID | 제목 | 상태 | 결과물 |
|----|------|------|--------|
| OH-1-R1 | 치아 셰이드 가이드 (VITA) | 대기 | - |
| W-2-R1 | 체형별 자세 교정 스트레칭 | 대기 | - |

## 파일 명명 규칙

```
[티켓ID]-[주제]-[버전].md

예시:
CIE-1-R1-image-sharpness-v1.md
CIE-2-R1-face-api-comparison-v1.md
CIE-3-R1-lab-colorspace-v1.md
```

## 리서치 문서 상태

| 상태 | 설명 |
|------|------|
| 대기 | 리서치 시작 전 |
| 진행중 | 자료 수집/분석 중 |
| 검토중 | 결과 검토 중 |
| 완료 | ADR 작성 완료 |
| 보류 | 추가 정보 필요 |

---

## 기존 문서 참조

### claude.ai 지침 파일

```
phase-0/yiroom-claude-instructions-v8.md  # claude.ai Instructions용
phase-0/CORE.md                           # 기술스택/코딩규칙
phase-0/STATUS.md                         # 완료/진행/제외 기능
phase-0/SYSTEMS.md                        # 시스템 설계
phase-0/REFERENCE.md                      # 참조 문서
```

### 연관 문서

| 문서 | 위치 | 용도 |
|------|------|------|
| ADR 목록 | `docs/adr/` | 아키텍처 결정 기록 (21개) |
| 규칙 파일 | `.claude/rules/` | 코딩 표준 (20개) |
| 로드맵 | 플랜 파일 | 엔지니어링 로드맵 v3.6 |
| 스펙 | `docs/specs/` | SDD 스펙 문서 |

---

**Version**: 1.1 | **Updated**: 2026-01-15
