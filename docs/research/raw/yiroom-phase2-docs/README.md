# 이룸 Phase 2 개발 문서 패키지

> **버전**: 1.0.0  
> **생성일**: 2025-12-18  
> **용도**: Claude Code 구현용

---

## 📦 패키지 구성

```
yiroom-phase2-docs/
├── specs/                    # 📋 개발 스펙 (3개)
├── prototypes/               # 🎨 UI 프로토타입 (10개)
├── guides/                   # 📚 가이드 문서 (3개)
├── seed-data/                # 🗃️ 시드 데이터 (5개)
│   ├── foods/                #    - 음식 80개
│   └── exercises/            #    - 운동 70개
└── references/               # 📎 참고 문서 (4개)
```

---

## 📋 파일 목록

### 1. 스펙 문서 (specs/)

| 파일 | 설명 | 분량 |
|------|------|------|
| `w1-workout-module-spec.md` | W-1 운동 모듈 전체 스펙 | ~1,200줄 |
| `n1-nutrition-module-spec.md` | N-1 영양 모듈 전체 스펙 | ~1,800줄 |
| `w1-n1-integration-spec.md` | 모듈 간 연동 스펙 | ~550줄 |

**포함 내용:**
- 모듈 개요 및 목표 지표
- 정보 구조 (IA)
- 화면별 상세 스펙 (ASCII 와이어프레임)
- TypeScript 인터페이스 정의
- Supabase DB 스키마 (SQL)
- Server Actions 코드
- UX 체크리스트

### 2. 프로토타입 (prototypes/)

| 파일 | 모듈 | 화면 |
|------|------|------|
| `w1-dashboard-prototype.jsx` | W-1 | 대시보드 |
| `w1-detail-prototype.jsx` | W-1 | 운동 상세 |
| `w1-session-prototype.jsx` | W-1 | 운동 실행 (3상태) |
| `w1-history-prototype.jsx` | W-1 | 기록/통계 |
| `n1-dashboard-prototype.jsx` | N-1 | 대시보드 |
| `n1-food-log-prototype.jsx` | N-1 | 식단 기록 + AI 인식 |
| `n1-history-prototype.jsx` | N-1 | 기록/통계 |
| `onboarding-prototype.jsx` | 공통 | 온보딩 플로우 |
| `integrated-home-prototype.jsx` | 통합 | 메인 홈 대시보드 |
| `empty-error-states-prototype.jsx` | 공통 | 빈 상태/에러/로딩 |

**특징:**
- 실행 가능한 React 컴포넌트 (JSX)
- Tailwind CSS 스타일링
- 샘플 데이터 포함
- 인터랙션 시뮬레이션

### 3. 가이드 문서 (guides/)

| 파일 | 설명 |
|------|------|
| `claude-code-implementation-guide.md` | 단계별 구현 순서 + 명령어 예시 |
| `common-components-library.md` | 공통 컴포넌트 29개 정의 |
| `design-tokens-system.md` | 컬러/타이포/스페이싱 시스템 |

### 4. 시드 데이터 (seed-data/)

#### 음식 (foods/)
| 파일 | 항목 수 | 설명 |
|------|--------|------|
| `n1-korean-food-complete.json` | 80개 | 한국 음식 전체 |
| `n1-korean-food-extended.json` | 30개 | 확장 데이터 |

#### 운동 (exercises/)
| 파일 | 항목 수 | 설명 |
|------|--------|------|
| `w1-yoga-poses.json` | 20개 | 요가 자세 |
| `w1-pilates-exercises.json` | 25개 | 필라테스 동작 |
| `w1-stretching-exercises.json` | 25개 | 스트레칭 동작 |

### 5. 참고 문서 (references/)

| 파일 | 설명 |
|------|------|
| `yiroom-module-integration-guide.md` | 모듈 통합 가이드 |
| `yiroom-w1-yoga-guide.md` | 요가 운동 상세 가이드 |
| `yiroom-w1-pilates-guide.md` | 필라테스 상세 가이드 |
| `yiroom-w1-stretching-guide.md` | 스트레칭 상세 가이드 |

---

## ✅ 검토 결과

### 일관성 체크
- [x] 모든 스펙 문서 버전: 1.0.0
- [x] 작성일: 2025-12-18
- [x] 기술 스택 일치: Next.js 16 + React 19 + Supabase + Clerk
- [x] 컬러 시스템 통일: Primary #7C3AED, Secondary #4CD4A1

### 완성도 체크
- [x] W-1 전체 화면 스펙 완료 (6개 화면)
- [x] N-1 전체 화면 스펙 완료 (6개 화면)
- [x] 통합 홈 대시보드 스펙 완료
- [x] DB 스키마 SQL 코드 포함
- [x] Server Actions 코드 포함
- [x] 모듈 간 연동 로직 정의

### 데이터 체크
- [x] 운동 데이터: 70개 (요가 20 + 필라테스 25 + 스트레칭 25)
- [x] 음식 데이터: 80개 (한국 음식)
- [x] 체형별 추천 매핑 포함
- [x] 영양 정보 (칼로리, 탄단지) 포함

---

## 🚀 Claude Code 시작 방법

### 1. 파일 배치

```bash
# 프로젝트 루트에서
unzip yiroom-phase2-docs.zip -d docs/
```

### 2. 첫 번째 명령어

```
docs/guides/claude-code-implementation-guide.md를 읽고
Phase 2-1 Step 1부터 순서대로 진행해줘.

먼저 docs/specs/w1-workout-module-spec.md 섹션 4번을 참조해서
Supabase 마이그레이션 파일을 생성해줘.
```

### 3. 구현 순서 요약

```
Phase 2-1: DB + 타입 + 공통 컴포넌트 (1주)
Phase 2-2: W-1 운동 모듈 (2주)
Phase 2-3: N-1 영양 모듈 (2주)
Phase 2-4: 통합 + 고도화 (1주)
```

---

## 📞 문의

Claude.ai에서 추가 문서가 필요하거나 수정이 필요하면 요청해주세요.

---

**Happy Building! 🏗️**
