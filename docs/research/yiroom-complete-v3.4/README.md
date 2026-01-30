# 이룸 (Yiroom) Claude Projects 통합 패키지

> 버전: 3.4 (세션 자동화 + 추가 문서 통합)
> 최종 업데이트: 2026-01-15
> 총 파일: 24개 + 지침 1개

---

## 📦 패키지 구성

```
yiroom-complete-v3.4/
│
├── 📋 지침 (Instructions 탭용)
│   └── yiroom-claude-instructions-v6.1.md  ← 복사/붙여넣기
│
├── 📁 파일 (Files 탭 업로드용)
│   ├── PROGRESS.md                 ← 진행 상황
│   ├── rules/ (19개)               ← 프로젝트 지침
│   │   ├── _index.md
│   │   ├── 00~16-*.md
│   │   └── 99-changelog.md
│   │
│   └── 추가 문서 (4개)
│       ├── yiroom-v8-upgrade-guide.md       ← 고도화 로드맵
│       ├── yiroom-masterplan-review-v7.md   ← 전체 검토 문서
│       ├── yiroom-consulting-methodology.md ← 컨설팅 방법론
│       └── yiroom-full-diagnosis-prompt.md  ← 진단 프롬프트
│
├── decisions/                  ← ADR (향후 사용)
├── sessions/                   ← 대화 산출물 (향후 사용)
└── README.md                   ← 이 파일
```

---

## 🚀 설정 방법

### Step 1: 지침 (Instructions) 설정

1. Claude Projects 설정 페이지 열기
2. **"지침"** 탭 → 기존 내용 전체 삭제
3. `yiroom-claude-instructions-v6.1.md` 내용 전체 복사/붙여넣기
4. 저장

### Step 2: 파일 (Files) 업로드

1. **"파일"** 탭 → 기존 파일 전체 삭제
2. 아래 파일들 업로드:

```
업로드 파일 목록 (24개):

[기본 파일]
PROGRESS.md

[rules/ 폴더 - 19개]
_index.md
00-project-identity.md
01-tech-stack.md
02-architecture.md
03-feature-classification.md
04-completed-phases.md
05-current-gap.md
06-avatar-system.md
07-data-consistency.md
08-body-correction.md
09-capsule-engine.md
10-inventory.md
11-consulting-methodology.md
12-design-system.md
13-coding-rules.md
14-legal.md
15-competitor-analysis.md
16-prompt-patterns.md
99-changelog.md

[추가 문서 - 4개]
yiroom-v8-upgrade-guide.md
yiroom-masterplan-review-v7.md
yiroom-consulting-methodology.md
yiroom-full-diagnosis-prompt.md
```

---

## 🎯 지침 구조 (v6.1 기준)

Anthropic 2025-2026 베스트 프랙티스 + 세션 자동화 적용:

```xml
<role>             ← 역할 정의 (시니어 풀스택 개발자)
<context>          ← 프로젝트 현황 (파일 참조 방식)
<guidelines>       ← 작업 원칙, 코드 스타일
<constraints>      ← 제약사항 (파일 참조 방식)
<session_protocol> ← 세션 자동화 프로토콜 (v6.1 신규)
<output_format>    ← 상황별 응답 형식
<examples>         ← 실제 사용 예시 6개
<file_usage>       ← 파일 참조 방법
```

### 적용된 원칙

| 원칙 | 설명 |
|------|------|
| **Role Prompting** | 태스크보다 역할 정의 우선 |
| **XML 구조화** | 섹션별 명확한 분리 |
| **Examples 활용** | Claude 4.x는 예시 패턴을 학습 |
| **긍정형 지시** | "~하지 마" → "~해라" |
| **파일 참조** | 하드코딩 대신 파일 참조로 유지보수성 향상 |
| **세션 자동화** | 시작/종료 시 자동 맥락 관리 |

---

## 💡 사용 팁

### 효과적인 질문 방법

```
✅ 좋은 예:
"09-capsule-engine.md 참조해서, 
레시피 추천에 캡슐 이론 적용하는 방법 설계해줘.
TypeScript 코드와 한국어 주석 포함해줘."

❌ 나쁜 예:
"레시피 기능 만들어줘"
```

### 파일 참조 방법

```
"14-legal.md에 있는 연령 확인 요구사항 확인해줘"
"08-body-correction.md 기반으로 어깨 말림 교정 운동 추천해줘"
```

### 컨텍스트 관리

- 긴 대화 후: `/compact` 또는 새 대화 시작
- 지시 무시 시: 구체적으로 재요청

---

## 📊 파일 참조 가이드

| 작업 | 참조 파일 |
|------|----------|
| 새 기능 기획 | 00, 03, 04, 05 |
| 분석 모듈 개발 | 06, 07, 11 |
| 운동/영양 개발 | 08, 09, 10 |
| UI/UX 작업 | 12 |
| 법적 검토 | 14 |
| 코드 작성 | 01, 13 |
| 프롬프트 최적화 | 16 |

---

## 🔄 업데이트 방법

### 파일 수정 시

1. 해당 파일 수정
2. 파일 상단 `version`, `last_updated` 업데이트
3. `99-changelog.md`에 변경 내용 기록
4. Claude Projects에 파일 재업로드

### 중요 결정 시

1. `decisions/` 폴더에 ADR 작성
2. 예: `decisions/001-ai-model-selection.md`

---

## ⚠️ 주의사항

1. **영구 제외 기능은 재제안 불가**
   - 닮은 유튜버, 연예인 사진, 구독 모델 등

2. **완료된 Phase 코드 수정 시 승인 필요**
   - Phase 1~3, A, B, D, H~M

3. **Claude 4.x 특성 고려**
   - 명시적 지시 필요
   - 예시가 중요
   - 모호한 표현 피하기

---

## 📞 지원

문제 발생 시:
1. `16-prompt-patterns.md` 트러블슈팅 섹션 확인
2. 구체적인 에러/상황 설명하여 재질문
