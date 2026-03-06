# 프로젝트 파일 구조 현황

> **마지막 업데이트**: 2026-03-07
> **상태**: Phase P3+ 완료, 홈 리디자인 준비 중

---

## 디렉토리 구조

```
yiroom/
├── apps/
│   ├── web/              # Next.js 16 웹 앱 (Turbopack)
│   └── mobile/           # Expo SDK 54 React Native 앱
├── packages/
│   └── shared/           # 공통 타입/유틸리티
├── docs/                 # 설계 문서
├── turbo.json            # Turborepo 설정
└── vercel.json           # Vercel 배포 설정
```

---

## 기능 모듈 현황

### 웹 앱 (apps/web)

| 모듈            | 경로                                     | 상태 |
| --------------- | ---------------------------------------- | :--: |
| PC-1 퍼스널컬러 | `(main)/analysis/personal-color/`        | Done |
| S-1 피부 분석   | `(main)/analysis/skin/`                  | Done |
| C-1 체형 분석   | `(main)/analysis/body/`                  | Done |
| H-1 헤어 분석   | `(main)/analysis/hair/`                  | Done |
| M-1 메이크업    | `(main)/analysis/makeup/`                | Done |
| OH-1 구강건강   | `(main)/analysis/oral-health/`           | Done |
| W-1 운동        | `(main)/workout/`                        | Done |
| N-1 영양        | `(main)/nutrition/`                      | Done |
| R-1 리포트      | `(main)/reports/`                        | Done |
| 제품/위시리스트 | `(main)/products/`, `(main)/wishlist/`   | Done |
| 소셜            | `(main)/friends/`, `(main)/leaderboard/` | Done |
| 웰니스/스타일링 | `(main)/wellness/`, `(main)/styling/`    | Done |
| 인벤토리        | `(main)/inventory/`                      | Done |
| 캡슐            | `(main)/capsule/`                        | Done |
| Virtual Try-On  | `(main)/virtual-try-on/`                 | Done |
| 모니터링        | `admin/monitoring/`                      | Done |

### lib/ 주요 모듈

| 모듈              | 설명                                                |
| ----------------- | --------------------------------------------------- |
| `capsule/`        | 캡슐 에코시스템 (BeautyProfile, CCS, Safety, Daily) |
| `virtual-try-on/` | 립/블러셔/헤어 시착 엔진                            |
| `monitoring/`     | API 타이밍 + 헬스체크                               |
| `supabase/`       | DB 클라이언트 (Clerk JWT 통합)                      |
| `gemini.ts`       | Gemini 3 Flash AI                                   |
| `products/`       | Product DB Repository                               |
| `workout/`        | 운동 로직 (MET 기반)                                |
| `nutrition/`      | 영양 로직 (BMR/TDEE)                                |
| `affiliate/`      | 어필리에이트 (쿠팡/iHerb/무신사)                    |

---

## 완료된 Phase

| Phase     | 설명                                               | 완료일     |
| --------- | -------------------------------------------------- | ---------- |
| Phase 1   | 퍼스널컬러, 피부, 체형 분석                        | 2025-11    |
| Phase 2   | 운동, 영양, 리포트                                 | 2025-12    |
| Phase A-J | Product DB, 모바일, 소셜, 어필리에이트, AI스타일링 | ~2026-01   |
| Phase K   | 종합 업그레이드 (성별, 패션, 체형, 레시피)         | 2026-01    |
| 특화      | H-1 헤어, M-1 메이크업, OH-1 구강건강              | 2026-02    |
| P3        | 캡슐 에코시스템 5-Phase (60+ 파일)                 | 2026-03-04 |
| P3+       | Virtual Try-On V2, 모니터링, 홈위젯                | 2026-03-05 |
| Phase 28  | 미커밋 파일 전체 정리 (5그룹 커밋)                 | 2026-03-05 |

---

## 현재 진행 중

### 홈 리디자인 (3-State)

- [ ] UX 디자인 원칙 문서화 (`docs/principles/ux-design.md`)
- [ ] ADR 작성 (홈 3-State 아키텍처)
- [ ] 스펙 작성 (3-State Home SDD)
- [ ] 구현

### 출시 준비

- [ ] DB 마이그레이션 적용 (캡슐 7테이블, GFSA 후)
- [ ] Vercel 자동 배포 복원 (GFSA 후)
- [ ] Google Play 계정 생성 + 14일 테스트
- [ ] 브랜딩 로고 Figma 디자인

---

## 배포 상태

| 항목            | 상태                         |
| --------------- | ---------------------------- |
| 품질            | tsc 0, ESLint 0, build 144p  |
| Vercel          | GFSA용 롤백 (자동 배포 꺼짐) |
| DB 마이그레이션 | 7테이블 준비됨, GFSA 후 적용 |

---

## 테스트 현황

| 영역             | 테스트 수 | 상태 |
| ---------------- | :-------: | :--: |
| 웹 앱 (Vitest)   |  2,800+   | Pass |
| 모바일 앱 (Jest) |   700+    | Pass |

---

## 변경 이력

| 날짜       | 변경 내용                                             |
| ---------- | ----------------------------------------------------- |
| 2026-03-07 | Phase P3+ 전체 반영, 홈 리디자인 계획, 배포 상태 추가 |
| 2026-01-11 | Phase I/J 완료, 문서 전면 재정리                      |
