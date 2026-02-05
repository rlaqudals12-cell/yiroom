# ADR-064: PC-1 결과 페이지 탭 콘텐츠 정리

## 상태

accepted

## 날짜

2026-02-06

## 컨텍스트

PC-1 결과 페이지의 3개 탭(기본/색상입혀보기/상세) 중,
기본 탭과 상세 탭에 동일한 콘텐츠가 중복되어 있다.

### 중복 현황

| 콘텐츠                 | 기본 탭 | 상세 탭 | 중복 |
| ---------------------- | ------- | ------- | ---- |
| AnalysisEvidenceReport | O       | O       | 중복 |
| ConsultantCTA          | O       | O       | 중복 |
| 액션 버튼 블록         | O       | O       | 중복 |
| DetailedEvidenceReport | X       | O       | 고유 |
| 정확도 팁              | X       | O       | 고유 |

또한 `AnalysisResult` 컴포넌트 하단에도 "다시 분석하기" + ShareButton이
있으나, `page.tsx`의 기본 탭에 동일 버튼이 이미 존재한다.

### 문제

1. **선택 마비**: 동일 기능이 2곳에 있으면 사용자가 혼란
2. **유지보수 비용**: 변경 시 2곳 수정 필요
3. **화면 낭비**: 중복 콘텐츠로 스크롤 증가

## 결정

### 각 탭의 고유 목적 명확화

| 탭                | 목적             | 포함 콘텐츠                                    |
| ----------------- | ---------------- | ---------------------------------------------- |
| **기본**          | 핵심 결과 + 액션 | 시즌 결과, Evidence, CTA, 액션 버튼            |
| **색상 입혀보기** | 체험             | 드레이핑 팔레트 + 미리보기                     |
| **상세**          | 심화 정보        | DetailedEvidenceReport + 정확도 팁 (순수 정보) |

### 제거 대상

1. 상세 탭의 `AnalysisEvidenceReport` → 기본 탭에 이미 존재
2. 상세 탭의 `ConsultantCTA` → 기본 탭에 이미 존재
3. 상세 탭의 액션 버튼 블록 → 기본 탭에 이미 존재
4. `AnalysisResult` 내부 "다시 분석하기" + ShareButton → `page.tsx`에 이미 존재

### 축하 애니메이션 제거

사용자 요청에 따라 `CelebrationEffect` 컴포넌트 및 관련 로직 삭제.

## 대안

### 대안 1: 모든 탭에 액션 버튼 유지

- 장점: 어느 탭에서든 바로 액션 가능
- 단점: 중복 유지보수, 화면 낭비
- **탈락 이유**: 기본 탭으로 돌아가면 되므로 불필요

### 대안 2: 탭 2개로 축소 (기본 + 색상입혀보기)

- 장점: 더 단순
- 단점: 상세 정보 원하는 사용자 충족 불가
- **탈락 이유**: DetailedEvidenceReport는 고유 가치 있음

## 영향

- 제거 코드: ~130줄 (중복 콘텐츠)
- 3탭 구조 유지 (S-1의 5탭, C-1의 4탭과 일관성)
- Canvas 3중 보호(L1 JS, L2 CSS, L3 max-height) 유지

## 참고

- `apps/web/app/(main)/analysis/personal-color/result/[id]/page.tsx` - 결과 페이지
- `apps/web/app/(main)/analysis/personal-color/_components/AnalysisResult.tsx` - 분석 결과 컴포넌트
