# ADR-090: 스트레스→피부 영향 시각화

## 상태

`accepted`

## 날짜

2026-03-15

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

사용자의 스트레스 수준(바이오리듬)이 피부에 미치는 영향을 실시간으로 시각화하고,
개인 맞춤 스킨케어 추천 + 트렌드 추적으로 피부 관리 의사결정을 지원한다.

### 물리적 한계

| 항목                   | 한계                                         |
| ---------------------- | -------------------------------------------- |
| 스트레스→피부 인과관계 | 상관관계만 보여줄 수 있음 (의학적 진단 아님) |
| 데이터 지연            | 스트레스 영향은 24~72시간 뒤 피부에 나타남   |
| 개인차                 | 동일 스트레스에도 피부 반응은 사람마다 다름  |

### 100점 기준

| 지표           | 100점 기준                              | 현재 | 비고      |
| -------------- | --------------------------------------- | ---- | --------- |
| 등급 분류      | 4단계 (low/moderate/high/critical)      | ✅   | 구현 완료 |
| 피부 영향 매핑 | 5개 영역 (피지, 장벽, 염증, 탈모, 색소) | ✅   | 구현 완료 |
| 추세 분석      | improving/stable/worsening 3단계        | ✅   | 구현 완료 |
| 게이지 시각화  | 0-100% 반비례 건강 게이지               | ✅   | 구현 완료 |
| AI 연동        | 스트레스 기반 스킨케어 코칭             | -    | 향후      |

### 현재 목표: 80%

### 의도적 제외

| 제외 항목              | 이유                             | 재검토 시점    |
| ---------------------- | -------------------------------- | -------------- |
| AI 코칭 연동           | Phase 순서, 코칭 모듈 고도화 후  | 배치 1 완료 후 |
| 웨어러블 실시간 데이터 | 헬스 디바이스 연동 (#16) 구현 후 | 배치 6         |

## 1. 맥락 (Context)

웰니스 모듈(#2)에 바이오리듬 통합 중, 스트레스 점수가 피부에 미치는 영향을
사용자에게 시각적으로 전달할 방법이 필요했다.

기존 `lib/wellness/biorhythm.ts`에서 스트레스 수준(1-10)과 점수(0-25)를 계산하지만,
이를 UI에서 활용할 수 있는 구조화된 데이터로 변환하는 레이어가 없었다.

## 2. 결정 (Decision)

`lib/wellness/stress-visualization.ts` 모듈을 신규 작성하여:

1. **스트레스 등급 분류** (1-10 → low/moderate/high/critical)
2. **피부 영향 매핑** (등급별 영향 영역 + severity)
3. **스킨케어 권장 사항** (등급별 문자열 목록)
4. **게이지 데이터 빌드** (stressLevel + stressScore → 시각화 객체)
5. **트렌드 분석** (시계열 → improving/stable/worsening)

순수 함수 기반, DB/API 의존성 없이 프레젠테이션 레이어로 구현한다.

## 3. 대안 (Alternatives Considered)

| 대안                    | 장점           | 단점                       | 제외 사유           |
| ----------------------- | -------------- | -------------------------- | ------------------- |
| biorhythm.ts에 통합     | 파일 수 감소   | SRP 위반, 파일 비대화      | 기존 모듈 책임 초과 |
| 컴포넌트 내 인라인 계산 | 빠른 구현      | 재사용 불가, 테스트 어려움 | P3 원자 분해 위반   |
| DB 기반 매핑 테이블     | 동적 변경 가능 | 오버엔지니어링             | P4 단순화 위반      |

## 4. 결과 (Consequences)

### 긍정적

- 순수 함수로 100% 단위 테스트 가능 (22개 테스트 통과)
- UI에서 바로 소비 가능한 구조화된 데이터
- 한국어 라벨 내장 (i18n 확장 가능)

### 부정적

- 피부 영향 데이터가 하드코딩 (의학적 근거 추가 검증 필요)

### 리스크

- 사용자가 의학적 조언으로 오해할 수 있음 → disclamer 표시 필요

## 5. 구현 가이드

```typescript
// lib/wellness/stress-visualization.ts
import { buildStressVisualization, analyzeStressTrend } from '@/lib/wellness';

// 단일 시점 시각화
const viz = buildStressVisualization(stressLevel, stressScore);
// → { grade, gradeLabel, color, skinImpacts, recommendations, gaugePercent }

// 시계열 트렌드
const trend = analyzeStressTrend(points);
// → { trend: 'improving'|'stable'|'worsening', averageLevel, trendMessage }
```

## 6. 관련 문서

- [원리: 바이오리듬 과학](../principles/biorhythm-science.md) ← 과학적 기초
- [ADR-089: 바이오리듬 웰니스 통합](./ADR-089-biorhythm-wellness-integration.md)
- [원리: 피부 생리학](../principles/skin-physiology.md) ← 스트레스→피부 영향 근거

---

**Author**: Claude Code
**Reviewed by**: -
