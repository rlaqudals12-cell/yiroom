# CORE.md - 이룸 핵심 정보

> 통합: 정체성 + 기술스택 + 코딩규칙
> 버전: 1.0 | 업데이트: 2026-01-15

---

## 🎯 프로젝트 정체성

| 항목 | 내용 |
|------|------|
| 앱 이름 | 이룸 (Yiroom) |
| 슬로건 | "온전한 나는?" |
| 핵심 가치 | 통합된 자기 이해 플랫폼 |
| 타겟 | 한국 여성 10-30대 (1차) → 전 연령 (확장) |
| GitHub | https://github.com/rlaqudals12-cell/yiroom |

### 핵심 차별화
```
경쟁사: 파편화 (퍼스널컬러 따로, 운동 따로)
이룸: 통합된 "나"에 대한 이해
```

### 제1원리 질문
| 상황 | 질문 |
|------|------|
| 기능 추가 | "통합된 자기 이해에 기여하나?" |
| 기술 선택 | "가장 단순한 해결책인가?" |
| 버그 수정 | "근본 원인인가, 증상인가?" |

---

## 🔧 기술 스택

| 분야 | 기술 | 버전 |
|------|------|------|
| Frontend | Next.js + React + TypeScript | 16 / 19 / 5.x |
| Styling | Tailwind CSS | v4 |
| Auth | Clerk | clerk_user_id 기반 |
| Database | Supabase (PostgreSQL) | RLS 필수 |
| AI | Google Gemini 3 Flash | Mock Fallback 필수 |
| Testing | Vitest + Playwright | 2,776개 테스트 |
| Mobile | Expo (React Native) | EAS Build |

### 프로젝트 구조
```
yiroom/
├── apps/web/          ← Next.js 웹앱
├── apps/mobile/       ← Expo 모바일앱
├── packages/shared/   ← 공유 패키지
├── supabase/          ← DB 설정
├── .beads/            ← 이슈 트래킹 (JSONL)
└── CLAUDE.md          ← Claude Code 지침
```

### 도구

**시지푸스 (Sisyphus) - 복잡도 기반 오케스트레이터:**
| 복잡도 | 트랙 | 실행 방식 |
|--------|------|----------|
| 0-30점 | Quick | 직접 실행 |
| 31-50점 | Light | code-quality만 |
| 51-70점 | Standard | +test-writer |
| 71-100점 | Full | 전체 6개 에이전트 |

> ⚠️ 이룸은 OPUS 4.5 전용 (고난이도)

**.beads - 이슈 트래킹:**
- 위치: `.beads/` 폴더
- 형식: JSONL (JSON Lines)
- 용도: 이슈, 버그, 태스크 관리

**CORE-DOCS.md - 통합 문서:**
- 총 파일: 227개
- 총 용량: ~4MB (427KB 압축)

---

## 📋 코딩 규칙

### 3대 원칙 (절대)
1. **Spec-First**: 스펙 없는 코드 금지
2. **Plan-Then-Execute**: 계획 없는 실행 금지
3. **Verify-Loop**: typecheck + lint + test 통과 필수

### 네이밍
| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `UserProfile.tsx` |
| 함수/변수 | camelCase | `getUserData()` |
| 상수 | UPPER_SNAKE | `MAX_RETRY` |

### 주석
- 한국어 WHY 설명
- TODO 시 담당자 명시: `TODO(name): 내용`

### 제약
- 기존 파일 수정 → 승인 요청 필수
- 대규모 리팩토링 금지 (점진적 개선만)
- UI 텍스트: 신조어 금지 (GMG → 목표 달성)
