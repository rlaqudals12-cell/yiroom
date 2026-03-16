# SDD: 페르소나 기반 UX 시뮬레이션 개선 V1

> **Version**: 1.0 | **Created**: 2026-03-15
> **ADR**: [ADR-095](../adr/ADR-095-ux-simulation-improvements.md)
> **상태**: 구현 완료

---

## 1. 개요

6명의 전문가+일반 사용자 페르소나 시뮬레이션에서 도출된 UX 개선 항목 구현.
3차에 걸쳐 보안, 편의성, 사용성 개선을 수행.

## 2. 변경 범위

### 2.1 에러 상태 개선

#### useAnalysisStatus 훅 (hooks/useAnalysisStatus.ts)

**변경 전**: fetch 실패 시 `analyses=[]`만 설정, 에러 정보 없음
**변경 후**:

- `hasError: boolean` 필드 추가
- `refetch(): void` 메서드 추가 (캐시 무효화 + 재조회)
- catch 블록에서 `setHasError(true)` 설정

```typescript
interface AnalysisStatus {
  isLoading: boolean;
  hasError: boolean; // 신규
  analyses: AnalysisSummary[];
  // ...
  refetch: () => void; // 신규
}
```

#### HomeStateRouter (app/(main)/home/\_components/HomeStateRouter.tsx)

**변경 전**: `isLoading=false + analyses=[]` → "신규 사용자"로 표시
**변경 후**: `hasError=true` 시 에러 UI + "다시 시도" 버튼 표시

### 2.2 네비게이션 개선

| 페이지                     | 변경                    | 파일                             |
| -------------------------- | ----------------------- | -------------------------------- |
| 피부 분석 checkingExisting | "돌아가기" 버튼 추가    | analysis/skin/page.tsx           |
| PC-1 checkingExisting      | "돌아가기" 버튼 추가    | analysis/personal-color/page.tsx |
| 구강건강 분석 헤더         | ArrowLeft 뒤로가기 추가 | analysis/oral-health/page.tsx    |

### 2.3 구강건강 인사이트 개선 (lib/nutrition/oralInsight.ts)

**변경 전**: `ORAL_FOOD_RECOMMENDATIONS`에 `warning`/`normal` 키만 존재, `good` 등급 시 0건 추천
**변경 후**:

- `good` 키 추가 (cavityRisk, gumHealth, plaque에 low 우선순위 유지 식품)
- 요약 메시지 4단계 분화: 경고 3+, 경고 1-2, good 4+("매우 좋아요"), 나머지("양호")

### 2.4 피드백 개선

| 항목           | 변경                          | 파일                                        |
| -------------- | ----------------------------- | ------------------------------------------- |
| 알림 설정 저장 | sonner toast 성공/실패 피드백 | profile/settings/page.tsx                   |
| 분석 로딩 시간 | "약 N초 남음" 표시            | components/analysis/AnalysisLoadingBase.tsx |

### 2.5 에러 바운더리

| 라우트                   | 변경                | 파일                              |
| ------------------------ | ------------------- | --------------------------------- |
| /analysis/personal-color | error.tsx 신규 생성 | analysis/personal-color/error.tsx |
| /analysis/skin           | 이모지 ✨→⚠️ 교체   | analysis/skin/error.tsx           |

## 3. 테스트

- oralInsight.test.ts: 30 tests (good 등급 추천, 요약 메시지 분화 테스트 추가)
- 전체: 12,065 tests 통과 (484 파일)

---

**Version**: 1.0 | **Created**: 2026-03-15
