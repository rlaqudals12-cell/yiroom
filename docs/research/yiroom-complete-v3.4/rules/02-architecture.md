# 02. 아키텍처 및 도구

> version: 1.0
> last_updated: 2026-01-14
> source: v2.2 섹션 12, 15, 25

---

## 📂 프로젝트 구조

### GitHub 레포지토리
```
https://github.com/rlaqudals12-cell/yiroom
```

### 폴더 구조
```
yiroom/
├── apps/
│   ├── web/           ← Next.js 웹앱
│   │   └── specs/     ← 스펙 문서
│   └── mobile/        ← Expo 모바일 앱
│       └── docs/
├── packages/
│   └── shared/        ← 공유 패키지
├── docs/              ← 프로젝트 문서
├── supabase/          ← DB 설정
├── .beads/            ← 이슈 트래킹 (JSONL)
├── .claude/           ← 에이전트/명령어/규칙
├── .cursor/rules/     ← Cursor 규칙
├── CLAUDE.md          ← 핵심 지침
├── AGENTS.md          ← 에이전트 정의
├── PLAN.md            ← 계획
├── COMPLETED.md       ← 완료 목록
└── SCRATCHPAD.md      ← 메모
```

### 프로젝트 파일
```
프로젝트 파일/
├── CORE-DOCS.md              ← 프로젝트 전체 문서 (427KB)
├── yiroom-v8-upgrade-guide.md ← 2차 고도화 가이드
└── yiroom-masterplan-review-v7.md ← 검토 프롬프트
```

### CORE-DOCS.md 통합 문서
- 총 파일: 227개
- 총 용량: ~4MB (427KB 압축 시)
- 포함: 모든 핵심 문서 통합본

---

## 🛠️ 도구

### 시지푸스 (Sisyphus)

복잡도 기반 적응형 오케스트레이터:

| 복잡도 | 트랙 | 실행 방식 |
|--------|------|----------|
| 0-30점 | Quick | 직접 실행 (에이전트 없음) |
| 31-50점 | Light | code-quality만 |
| 51-70점 | Standard | code-quality + test-writer |
| 71-100점 | Full | 전체 6개 에이전트 파이프라인 |

> ⚠️ 이룸 프로젝트는 **OPUS 4.5 전용**으로 사용 (고난이도 프로젝트)

### .beads

JSONL 기반 이슈 트래킹 시스템
- 위치: `.beads/` 폴더
- 형식: JSONL (JSON Lines)
- 용도: 이슈, 버그, 태스크 관리

---

## 🏗️ 모노레포 구조

```
packages/
└── shared/
    ├── types/         ← 공유 타입
    ├── utils/         ← 공유 유틸리티
    ├── hooks/         ← 공유 훅
    └── constants/     ← 공유 상수
```
