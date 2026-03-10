# ADR-084: 성별 중립화 전략 (K-1)

- **상태**: 수락됨
- **날짜**: 2026-03-10
- **결정자**: Claude Code
- **관련**: K-1 성별 중립화, Phase K 종합 업그레이드

## 맥락

이룸은 뷰티/웰니스 AI 플랫폼으로, 초기에는 여성 중심 콘텐츠로 설계되었다.
10-30대 남성 사용자 확보를 위해 성별 중립화가 필요했다.

## 핵심 결정

### 2-Layer 성별 모델

| 레이어        | 타입                                                 | neutral 지원 | 근거                                                                     |
| ------------- | ---------------------------------------------------- | ------------ | ------------------------------------------------------------------------ |
| **콘텐츠**    | `GenderPreference = 'male' \| 'female' \| 'neutral'` | O            | 악세서리/용어/카테고리는 성별 구분 없이 제공 가능                        |
| **과학 계산** | `Gender = 'male' \| 'female'`                        | X            | Harris-Benedict BMR, WHR 건강 기준 등은 생물학적 성별 분리가 과학적 근거 |

### 설계 원칙

1. **콘텐츠 레이어는 neutral 우선**: 악세서리, 패션 용어, 제품 추천은 성별 중립 기본값 제공
2. **과학 계산 레이어는 생물학적 성별 필수**: BMR, WHR 건강 기준은 남녀 분리 공식 사용
3. **UI에서 자연스러운 전환**: 체형 분석 InputForm은 neutral 옵션 제공하되, 영양 온보딩은 BMR 계산을 위해 male/female 선택 강제
4. **체형 분류 v2는 gender-free**: `classifyBodyType(ratios)` — 비율만으로 분류, 성별 파라미터 불필요

### 타입 정의 위치

```
lib/content/gender-adaptive.ts  → GenderPreference (콘텐츠)
hooks/useUserProfile.ts         → GenderType (프로필 DB)
types/nutrition.ts              → Gender (과학 계산)
lib/body/types.ts               → Gender (과학 계산)
```

## 고려한 대안

### 대안 1: 단일 Gender 타입으로 통일

- `Gender = 'male' | 'female' | 'neutral'`을 모든 곳에 사용
- **기각 이유**: Harris-Benedict 공식에 neutral 분기가 없음. 임의의 fallback(예: 남녀 평균)은 과학적 근거 없음

### 대안 2: 비바이너리 전용 BMR 공식 도입

- Mifflin-St Jeor 등 대안 공식 연구
- **기각 이유 (V2 예정)**: 현재 학술적으로 검증된 성별 중립 BMR 공식이 없음. 도입 시 별도 리서치 필요

## 의도적 제외

| 항목                      | 이유                                 | 시점           |
| ------------------------- | ------------------------------------ | -------------- |
| 비바이너리 전용 분류 체계 | 학술 근거 부족                       | V2             |
| they/them 대명사          | 한국어에서 불필요 (이미 성별 중립적) | 해당 없음      |
| 성별 중립 BMR             | 검증된 공식 없음                     | 리서치 후 검토 |

## 결과

- K-1 성별 중립화 100% 완료 (4/4 항목)
- neutral 사용자도 모든 기능 사용 가능 (영양 온보딩에서 생물학적 성별 선택)
- 콘텐츠 레이어에서 성별 구분 없는 추천 제공

## 관련 문서

- [SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md](../specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md) — Phase K 스펙
- [lib/content/gender-adaptive.ts](../../apps/web/lib/content/gender-adaptive.ts) — 콘텐츠 적응형 유틸리티
- [lib/body/classify.ts](../../apps/web/lib/body/classify.ts) — 체형 분류
- [lib/nutrition/calculateBMR.ts](../../apps/web/lib/nutrition/calculateBMR.ts) — BMR 계산
