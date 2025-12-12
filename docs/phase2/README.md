# 📦 이룸 Phase 2 개발 패키지 (Final)

> **버전**: v2.0 (Claude Code 최적화)  
> **생성일**: 2025-11-27  
> **총 Task**: 150개 (W-1: 91개, N-1: 59개)

---

## 📁 패키지 구조

```
phase2-final-package/
├── README.md                              # 이 파일
├── CLAUDE.md                              # 프로젝트 루트에 배치
├── Claude-Code-베스트프랙티스-적용가이드.md
├── docs/
│   ├── W-1-sprint-backlog-v1.4.md         # W-1 91개 Task (최신)
│   ├── N-1-sprint-backlog-v1.3.md         # N-1 59개 Task (최신)
│   ├── W-1-feature-spec-template-v1.1-final.md
│   ├── N-1-feature-spec-template-v1.0.3.md
│   ├── Database-스키마-v2.5-업데이트-권장.md
│   ├── Phase-2-로드맵-v1.0.md
│   ├── Phase1-개선-Task-목록-간략.md
│   ├── sprint-backlog-methodology.md
│   └── 경쟁사-분석-통합-Phase2.md
└── prompts/
    ├── README.md
    ├── 01-simple-task.md                  # 🟢 낮음 복잡도
    ├── 02-medium-task.md                  # 🟡 중간 복잡도
    ├── 03-complex-task.md                 # 🔴 높음 복잡도
    ├── 04-debugging.md
    ├── 05-code-review.md
    └── 06-data-generation.md
```

---

## 🚀 사용 방법

### 1. 프로젝트에 배치

```bash
# CLAUDE.md → 프로젝트 루트
cp CLAUDE.md /path/to/yiroom/

# docs/ → 프로젝트 docs 폴더
cp -r docs/* /path/to/yiroom/docs/

# prompts/ → 프로젝트 docs 폴더 하위
cp -r prompts /path/to/yiroom/docs/
```

### 2. CLAUDE.md 커스터마이징

CLAUDE.md 하단의 "커스터마이징 가이드" 섹션을 참고하여:
- 프로젝트 구조를 실제 `tree` 결과로 교체
- DB 테이블을 실제 Supabase 스키마로 교체
- 문서 경로를 실제 구조에 맞게 수정

### 3. Claude Code로 개발 시작

```bash
# Sprint 시작 전 Plan Mode
> 이 프로젝트의 코드베이스를 분석해주세요. [Plan Mode 프롬프트]

# Task 구현
> Task 1.5를 구현해주세요. [prompts/02-medium-task.md 참고]
```

---

## 📊 Phase 2 요약

| 모듈 | Task | 🟢 | 🟡 | 🔴 | 기간 |
|------|------|----|----|----|----|
| W-1 운동 | 91개 | 52 | 31 | 8 | 8주 |
| N-1 영양 | 59개 | 35 | 22 | 2 | 3주 |
| **합계** | **150개** | 87 | 53 | 10 | **11주** |

---

## ✅ Anthropic 공식 베스트 프랙티스 적용

1. ✅ **반복 개선**: Task별 예상 반복 횟수 명시
2. ✅ **테스트 케이스**: Given-When-Then + Jest 템플릿
3. ✅ **CLAUDE.md**: 프로젝트 컨텍스트 제공
4. ✅ **Plan Mode**: Sprint 시작 전 코드베이스 탐색
5. ✅ **Extended Thinking**: 🔴 Task에 "Think hard" 프롬프트
6. ✅ **TDD 워크플로우**: 테스트 먼저 작성 가이드

---

## 📝 버전 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2025-11-27 | Phase 2 초안 (W-1 63개, N-1 44개) |
| v1.5 | 2025-11-27 | Task 구체화 (W-1 91개, N-1 57개) |
| v2.0 | 2025-11-27 | **Claude Code 최적화** (복잡도, 프롬프트, 테스트, TDD) |

---

**문서 끝**
