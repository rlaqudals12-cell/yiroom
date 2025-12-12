# 🚀 Claude Code 베스트 프랙티스 적용 가이드

**기반 문서**: Anthropic 공식 문서 (anthropic.com/learn, code.claude.com/docs)  
**적용 대상**: 이룸 Phase 2 (W-1, N-1) 개발  
**작성일**: 2025-11-27

---

## 📋 목차

1. [공식 문서 핵심 인사이트](#1-공식-문서-핵심-인사이트)
2. [Phase 2 문서 적용 방안](#2-phase-2-문서-적용-방안)
3. [새로 추가할 문서/파일](#3-새로-추가할-문서파일)
4. [Sprint Backlog 개선안](#4-sprint-backlog-개선안)
5. [실제 적용 예시](#5-실제-적용-예시)

---

## 1. 공식 문서 핵심 인사이트

### 1.1 Claude Code Best Practices

| 원칙 | 설명 | Phase 2 적용 |
|------|------|-------------|
| **반복 개선** | 첫 버전보다 2-3회 반복 후 훨씬 좋아짐 | Task별 반복 횟수 명시 |
| **명확한 목표** | 테스트 케이스, 시각적 목표 제공 시 성능 향상 | 수락 기준에 테스트 포함 |
| **Claude.md 활용** | 프로젝트 문서화 → Claude 성능 향상 | CLAUDE.md 파일 생성 |
| **Plan Mode** | 읽기 전용 분석으로 안전한 탐색 | Sprint 시작 전 Plan Mode 권장 |
| **Extended Thinking** | 복잡한 Task에서 "think hard" 사용 | 복잡도 높은 Task에 표시 |

### 1.2 Anthropic 팀 실제 사용 패턴

```yaml
빠른 프로토타이핑:
  - auto-accept mode (Shift+Tab)
  - 80% 완성 후 개발자가 마무리
  - 적용: MVP 기능 개발에 활용

TDD 워크플로우:
  - 의사코드 → 테스트 작성 → 구현 → 반복
  - 적용: 각 Task에 테스트 우선 접근

코드베이스 탐색:
  - Claude.md 파일 참조
  - "어떤 파일이 관련있나요?" 질문
  - 적용: Phase 1 코드 이해에 활용
```

### 1.3 Agent Skills 패턴

```
Skills = 폴더 + SKILL.md + 리소스 파일
        ↓
Claude가 자동으로 관련 스킬 로드
        ↓
전문화된 작업 수행
```

---

## 2. Phase 2 문서 적용 방안

### 2.1 기존 문서 개선

| 문서 | 개선 내용 |
|------|----------|
| **Sprint Backlog** | Claude Code 프롬프트 예시 추가 |
| **기능 스펙** | 시각적 목표(UI Mock) 참조 추가 |
| **로드맵** | Plan Mode / Extended Thinking 가이드 추가 |
| **방법론** | TDD 워크플로우 추가 |

### 2.2 신규 문서 추가

| 문서 | 목적 |
|------|------|
| **CLAUDE.md** | 프로젝트 컨텍스트 제공 (Claude Code용) |
| **yiroom-skill/** | Agent Skill 형식 패키징 |
| **prompts/** | 재사용 가능한 프롬프트 템플릿 |

---

## 3. 새로 추가할 문서/파일

### 3.1 CLAUDE.md (프로젝트 루트)

```markdown
# 이룸 (Yiroom) 프로젝트

## 개요
AI 기반 통합 웰니스 플랫폼 (퍼스널컬러 + 피부 + 체형 + 운동 + 영양)

## 기술 스택
- Frontend: Next.js 16, React 19, TypeScript
- Backend: Supabase (PostgreSQL + Auth)
- AI: Gemini API
- Auth: Clerk

## 프로젝트 구조
src/
├── app/              # Next.js App Router
│   ├── (auth)/       # 인증 관련 페이지
│   ├── (main)/       # 메인 페이지
│   ├── workout/      # W-1 운동 모듈
│   └── nutrition/    # N-1 영양 모듈
├── components/       # 공통 컴포넌트
├── lib/              # 유틸리티
└── types/            # TypeScript 타입

## 코딩 컨벤션
- 컴포넌트: PascalCase (WorkoutCard.tsx)
- 함수: camelCase (calculateBMR)
- 상수: UPPER_SNAKE_CASE (MAX_EXERCISES)
- 파일: kebab-case (workout-card.tsx)

## 현재 개발 단계
Phase 2: W-1 운동 모듈 (91 Task) + N-1 영양 모듈 (57 Task)

## 주요 문서 위치
- docs/W-1-sprint-backlog-v1.4.md
- docs/N-1-sprint-backlog-v1.3.md
- docs/Database-스키마-v2.5.md

## Claude Code 사용 시 참고
1. Plan Mode로 먼저 코드베이스 탐색
2. 각 Task의 수락 기준 확인
3. 테스트 먼저 작성 (TDD)
4. 복잡한 Task는 "think hard" 사용
```

### 3.2 yiroom-skill/SKILL.md

```markdown
# 이룸 개발 스킬

## 설명
이룸 프로젝트 개발을 위한 Claude Code 스킬

## 트리거
- "이룸", "yiroom", "운동 모듈", "영양 모듈"
- "W-1", "N-1", "Phase 2"

## 워크플로우

### Task 시작 시
1. Sprint Backlog에서 Task 확인
2. 수락 기준(Given-When-Then) 파악
3. Plan Mode로 관련 파일 탐색
4. 테스트 먼저 작성

### Task 완료 시
1. 모든 수락 기준 충족 확인
2. lint/type 검사 통과
3. 관련 테스트 통과
4. 커밋 메시지 작성

## 명령어

### /yiroom-task [Task ID]
해당 Task의 상세 정보 조회 및 구현 시작

### /yiroom-test
현재 작업 중인 기능의 테스트 실행

### /yiroom-commit
Task 완료 후 적절한 커밋 메시지 생성
```

### 3.3 prompts/task-implementation.md

```markdown
# Task 구현 프롬프트 템플릿

## 기본 프롬프트
```
Task [ID]를 구현해주세요.

수락 기준:
- Given: [조건]
- When: [행동]
- Then: [결과]

먼저 Plan Mode로 관련 파일들을 확인하고,
테스트를 먼저 작성한 후 구현해주세요.
```

## Extended Thinking 프롬프트 (복잡한 Task용)
```
Task [ID]를 구현해야 합니다. Think hard about:
1. 기존 코드와의 통합 방법
2. 성능 고려사항
3. 엣지 케이스 처리

수락 기준을 모두 만족하는 구현 계획을 세워주세요.
```

## 디버깅 프롬프트
```
[에러 메시지]

이 에러를 해결해주세요. 
코드베이스를 분석하고, 문제를 식별하고, 수정을 구현해주세요.
```
```

---

## 4. Sprint Backlog 개선안

### 4.1 Task 구조 개선

**현재 구조:**
```markdown
#### Task 1.5: Step 1 - C-1 데이터 확인 화면

| 항목 | 내용 |
|------|------|
| **파일** | `app/workout/onboarding/step1/page.tsx` |
| **예상 시간** | 3h |

**수락 기준:**
Given: C-1 분석 완료 사용자
When: Step 1 진입 시
Then: 체형 타입 + 주요 특징 표시
```

**개선된 구조 (Claude Code 최적화):**
```markdown
#### Task 1.5: Step 1 - C-1 데이터 확인 화면

| 항목 | 내용 |
|------|------|
| **파일** | `app/workout/onboarding/step1/page.tsx` |
| **예상 시간** | 3h |
| **복잡도** | 🟡 중간 |
| **Claude Mode** | Plan → Implement |

**수락 기준:**
Given: C-1 분석 완료 사용자
When: Step 1 진입 시
Then: 체형 타입 + 주요 특징 표시

**Claude Code 프롬프트:**
```
Task 1.5를 구현해주세요.

1. 먼저 Plan Mode로 기존 C-1 컴포넌트 확인
2. app/body/results/ 패턴 참고
3. 테스트 먼저 작성

수락 기준:
- C-1 데이터 있으면 체형 카드 표시
- C-1 데이터 없으면 "분석 필요" 안내
```

**테스트 케이스:**
```typescript
describe('Step1Page', () => {
  it('C-1 데이터 있으면 체형 표시', () => {
    // Given: C-1 분석 완료
    // When: 렌더링
    // Then: 체형 카드 visible
  });
});
```

**참고 파일:**
- `app/body/results/page.tsx` (패턴 참고)
- `types/body.ts` (타입 정의)
```

### 4.2 복잡도별 Claude Mode 가이드

| 복잡도 | 표시 | Claude Mode | 프롬프트 |
|--------|------|-------------|----------|
| 🟢 낮음 | Simple | 바로 구현 | 기본 프롬프트 |
| 🟡 중간 | Medium | Plan → Implement | 테스트 포함 |
| 🔴 높음 | Complex | Think Hard → Plan → Implement | Extended Thinking |

---

## 5. 실제 적용 예시

### 5.1 W-1 Task 1.14 개선 예시

**Before:**
```markdown
#### Task 1.14: 운동 DB JSON - 상체 (50개)

| 항목 | 내용 |
|------|------|
| **파일** | `data/exercises/upper-body.json` |
| **예상 시간** | 4h |

수락 기준:
- 총 50개, 모든 필드 채움
```

**After (Claude Code 최적화):**
```markdown
#### Task 1.14: 운동 DB JSON - 상체 (50개)

| 항목 | 내용 |
|------|------|
| **파일** | `data/exercises/upper-body.json` |
| **예상 시간** | 4h |
| **복잡도** | 🟢 낮음 (반복 작업) |
| **Claude Mode** | Auto-accept 권장 |

**수락 기준:**
- 총 50개 운동
- 모든 필드 채움 (id, name, category, bodyParts, equipment, difficulty, instructions, tips)

**Claude Code 프롬프트:**
```
운동 DB JSON 파일을 생성해주세요.

파일: data/exercises/upper-body.json
형식: types/exercise.ts의 Exercise 타입 참조
개수: 50개

카테고리 분포:
- 가슴: 12개
- 어깨: 12개  
- 등: 12개
- 팔: 14개

각 운동에 한국어 이름, 설명, 호흡법 팁 포함.
실제 운동 이름과 정확한 동작 설명 사용.
```

**검증:**
```bash
# JSON 유효성 검사
npx jsonlint data/exercises/upper-body.json

# 개수 확인
jq '. | length' data/exercises/upper-body.json  # 50
```

**참고:**
- 플랜핏, 짐워크 운동 목록 참고
- 한국어 운동 명칭 표준화
```

### 5.2 N-1 복잡한 Task 개선 예시

**Before:**
```markdown
#### Task 2.5: 음식 AI 분석 API

| 항목 | 내용 |
|------|------|
| **파일** | `app/api/nutrition/analyze/route.ts` |
| **예상 시간** | 6h |
```

**After:**
```markdown
#### Task 2.5: 음식 AI 분석 API

| 항목 | 내용 |
|------|------|
| **파일** | `app/api/nutrition/analyze/route.ts` |
| **예상 시간** | 6h |
| **복잡도** | 🔴 높음 (AI 통합) |
| **Claude Mode** | Think Hard → Plan → Implement |

**수락 기준:**
Given: 음식 사진 업로드
When: AI 분석 요청
Then: 음식명 + 영양정보 반환 (3초 이내)

**Claude Code 프롬프트 (Extended Thinking):**
```
Task 2.5: 음식 AI 분석 API를 구현해야 합니다.

Think hard about:
1. Gemini Vision API 최적 프롬프트
2. 이미지 전처리 필요성
3. 응답 파싱 및 검증
4. 에러 핸들링 (인식 실패, API 오류)
5. 캐싱 전략 (동일 이미지 재분석 방지)

기존 S-1 피부 분석 API 패턴을 참고하되,
음식 인식에 최적화된 구현을 제안해주세요.
```

**테스트 케이스:**
```typescript
describe('POST /api/nutrition/analyze', () => {
  it('정상 이미지 → 영양정보 반환', async () => {});
  it('음식 아닌 이미지 → 에러 메시지', async () => {});
  it('API 타임아웃 → 적절한 에러', async () => {});
});
```

**반복 개선 계획:**
1. 기본 구현 (Gemini API 연결)
2. 프롬프트 최적화 (한국 음식 인식률)
3. 응답 정확도 검증 및 조정
4. 성능 최적화 (캐싱, 압축)
```

---

## 6. 적용 체크리스트

### Phase 2 개발 시작 전

- [ ] CLAUDE.md 파일 프로젝트 루트에 생성
- [ ] Sprint Backlog에 Claude Mode 컬럼 추가
- [ ] 복잡한 Task에 Extended Thinking 프롬프트 추가
- [ ] 테스트 케이스 템플릿 추가
- [ ] prompts/ 폴더 생성 및 템플릿 저장

### Sprint 시작 시

- [ ] Plan Mode로 해당 Sprint 범위 코드 탐색
- [ ] 관련 Phase 1 코드 패턴 파악
- [ ] 의존성 Task 확인

### Task 구현 시

- [ ] 복잡도 확인 → 적절한 Claude Mode 선택
- [ ] 테스트 먼저 작성 (TDD)
- [ ] 수락 기준 기반 검증
- [ ] 2-3회 반복 개선

---

**문서 버전**: v1.0  
**다음 단계**: 실제 Sprint Backlog에 개선사항 적용
