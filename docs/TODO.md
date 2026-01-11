# 프로젝트 파일 구조 현황

> **마지막 업데이트**: 2026-01-11
> **상태**: Phase 1~J 완료, 런칭 준비 중

---

## 설정 파일 ✅ 완료

- [x] `.env.local` 환경 변수
- [x] `tsconfig.json` TypeScript 설정
- [x] `eslint.config.mjs` ESLint 설정
- [x] `.prettierrc` Prettier 설정
- [x] `.prettierignore` Prettier 제외
- [x] `.gitignore` Git 제외
- [x] `.husky/pre-commit` Git hooks

---

## 디렉토리 구조 ✅ 완료

```
yiroom/
├── apps/
│   ├── web/              # Next.js 웹 앱 (Lite PWA)
│   └── mobile/           # Expo React Native 앱
├── packages/
│   └── shared/           # 공통 타입/유틸리티
├── docs/                 # 설계 문서
├── turbo.json            # Turborepo 설정
└── vercel.json           # Vercel 배포 설정
```

---

## 주요 파일 현황

### app/ (웹 앱)

| 파일/디렉토리          | 상태 | 비고                          |
| ---------------------- | ---- | ----------------------------- |
| `layout.tsx`           | ✅   | 루트 레이아웃 + ThemeProvider |
| `page.tsx`             | ✅   | 홈페이지                      |
| `globals.css`          | ✅   | 다크모드 + 모듈 색상          |
| `not-found.tsx`        | ✅   | 404 페이지                    |
| `error.tsx`            | ✅   | 에러 페이지 + Sentry          |
| `robots.ts`            | ✅   | SEO 크롤링 규칙               |
| `sitemap.ts`           | ✅   | 동적 사이트맵                 |
| `manifest.webmanifest` | ✅   | PWA 매니페스트                |

### 기능 모듈 ✅ 완료

| 모듈            | 경로                              | 상태 |
| --------------- | --------------------------------- | ---- |
| PC-1 퍼스널컬러 | `(main)/analysis/personal-color/` | ✅   |
| S-1 피부 분석   | `(main)/analysis/skin/`           | ✅   |
| C-1 체형 분석   | `(main)/analysis/body/`           | ✅   |
| W-1 운동        | `(main)/workout/`                 | ✅   |
| N-1 영양        | `(main)/nutrition/`               | ✅   |
| R-1 리포트      | `(main)/reports/`                 | ✅   |
| 제품            | `(main)/products/`                | ✅   |
| 위시리스트      | `(main)/wishlist/`                | ✅   |
| 친구            | `(main)/friends/`                 | ✅   |
| 리더보드        | `(main)/leaderboard/`             | ✅   |
| 웰니스          | `(main)/wellness/`                | ✅   |
| 스타일링        | `(main)/styling/`                 | ✅   |
| 인벤토리        | `(main)/inventory/`               | ✅   |
| 관리자          | `admin/`                          | ✅   |

### public/ ✅ 완료

| 파일                   | 상태 |
| ---------------------- | ---- |
| `icons/` (192~512px)   | ✅   |
| `logo.png`             | ✅   |
| `og-image.png`         | ✅   |
| `favicon-*.png`        | ✅   |
| `manifest.webmanifest` | ✅   |

### lib/ 주요 모듈 ✅ 완료

| 모듈            | 설명                       |
| --------------- | -------------------------- |
| `supabase/`     | DB 클라이언트 (Clerk 통합) |
| `gemini.ts`     | Gemini AI 연동             |
| `products/`     | Product DB Repository      |
| `workout/`      | 운동 로직                  |
| `nutrition/`    | 영양 로직                  |
| `admin/`        | 관리자 기능                |
| `rag/`          | RAG 시스템                 |
| `share/`        | 공유 기능                  |
| `friends/`      | 친구 기능                  |
| `leaderboard/`  | 리더보드                   |
| `wellness/`     | 웰니스 스코어              |
| `gamification/` | 게이미피케이션             |
| `challenges/`   | 챌린지 시스템              |
| `affiliate/`    | 어필리에이트               |
| `inventory/`    | 내 인벤토리                |

---

## 완료된 Phase

| Phase   | 설명                                                   | 완료일     |
| ------- | ------------------------------------------------------ | ---------- |
| Phase 1 | 퍼스널컬러, 피부, 체형 분석                            | -          |
| Phase 2 | 운동, 영양, 리포트                                     | -          |
| Phase 3 | 앱 고도화, E2E 테스트                                  | -          |
| Phase A | Product DB (850+ 제품)                                 | -          |
| Phase B | React Native 앱                                        | -          |
| Phase H | 소셜 (웰니스, 친구, 리더보드)                          | 2025-12    |
| Phase I | 어필리에이트 (날씨 코디, 바코드, 비포애프터, 인벤토리) | 2026-01-11 |
| Phase J | AI 스타일링 (색상 조합, 악세서리, 메이크업)            | 2026-01-11 |

---

## 남은 작업

### 런칭 준비

- [ ] Vercel 환경변수 Production 설정
- [ ] Clerk Production Keys 교체 (사업자 등록 후)
- [ ] 도메인 연결 (yiroom.app)

### 브랜드 중립화

- [x] 벤치마크 리서치 완료
- [x] 심볼 후보 선정 (나선/동심원)
- [x] 브랜딩 스펙 문서 작성
- [ ] Figma 디자인 (로고 + 앱 아이콘)
- [ ] 에셋 제작 및 적용

---

## 테스트 현황

| 영역             | 테스트 수 | 상태 |
| ---------------- | --------- | ---- |
| 웹 앱 (Vitest)   | 2,700+    | ✅   |
| 모바일 앱 (Jest) | 151       | ✅   |
| E2E (Playwright) | 20+       | ✅   |

---

## 참조 문서

| 문서                                      | 설명            |
| ----------------------------------------- | --------------- |
| [NEXT-TASKS.md](phase-next/NEXT-TASKS.md) | 다음 작업 목록  |
| [CLAUDE.md](../CLAUDE.md)                 | 프로젝트 가이드 |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)      | 디자인 시스템   |

---

## 변경 이력

| 날짜       | 변경 내용                        |
| ---------- | -------------------------------- |
| 2026-01-11 | Phase I/J 완료, 문서 전면 재정리 |
| 2025-12-19 | UI/UX 개선, 브랜딩 리서치        |
