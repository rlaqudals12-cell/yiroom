# SDD-STRESS-VIZ: 스트레스→피부 영향 시각화

> **Status**: implemented
> **Version**: 1.0 | **Date**: 2026-03-15
> **ADR**: [ADR-090](../adr/ADR-090-stress-skin-visualization.md)
> **원리**: [biorhythm-science.md](../principles/biorhythm-science.md), [skin-physiology.md](../principles/skin-physiology.md)

---

## 1. 개요

바이오리듬 모듈에서 계산된 스트레스 수준(1-10)과 점수(0-25)를
UI에서 소비 가능한 시각화 데이터로 변환하는 프레젠테이션 레이어.

### 궁극의 형태 (P1)

- **100점**: 실시간 웨어러블 데이터 연동 + AI 기반 개인화 피부 영향 예측
- **현재 목표**: 80% (정적 매핑 + 트렌드 분석)
- **의도적 제외**: 웨어러블 연동 (#16), AI 개인화 코칭

---

## 2. 데이터 모델

### 2.1 입력

```typescript
// 단일 시점
stressLevel: number; // 1-10 (클램핑 적용)
stressScore: number; // 0-25 (바이오리듬 원점수)

// 트렌드
StressTrendPoint: {
  date: string; // 'YYYY-MM-DD'
  stressLevel: number;
  grade: StressGrade;
}
```

### 2.2 출력

```typescript
type StressGrade = 'low' | 'moderate' | 'high' | 'critical';

interface SkinImpactItem {
  area: string; // '피지 분비' | '피부 장벽' | '염증' | '탈모' | '색소 침착'
  description: string;
  severity: 1 | 2 | 3;
}

interface StressVisualizationData {
  stressLevel: number;
  stressScore: number;
  grade: StressGrade;
  gradeLabel: string; // '낮음' | '보통' | '높음' | '매우 높음'
  color: string; // CSS color
  skinImpacts: SkinImpactItem[];
  recommendations: string[];
  gaugePercent: number; // 0-100 (스트레스와 반비례)
}

interface StressTrendAnalysis {
  trend: 'improving' | 'stable' | 'worsening';
  averageLevel: number;
  points: StressTrendPoint[];
  trendMessage: string;
}
```

---

## 3. 핵심 로직

### 3.1 등급 분류

| 스트레스 레벨 | 등급     | 라벨      | 색상 |
| ------------- | -------- | --------- | ---- |
| 1-3           | low      | 낮음      | 녹색 |
| 4-6           | moderate | 보통      | 노랑 |
| 7-8           | high     | 높음      | 주황 |
| 9-10          | critical | 매우 높음 | 빨강 |

### 3.2 피부 영향 매핑

| 스트레스 ≥ | 영향 영역      | severity |
| ---------- | -------------- | -------- |
| 4          | 피지 분비 증가 | 1        |
| 5          | 피부 장벽 약화 | 1        |
| 6          | 염증 반응 증가 | 2        |
| 8          | 탈모 위험      | 2        |
| 9          | 색소 침착      | 3        |

### 3.3 트렌드 판별

```
포인트 < 3개 → stable (데이터 부족)
전반부 평균 - 후반부 평균 ≥ 2 → improving
후반부 평균 - 전반부 평균 ≥ 2 → worsening
그 외 → stable
```

### 3.4 게이지 퍼센트

```
gaugePercent = Math.round(((10 - clampedLevel) / 9) * 100)
// 스트레스 1 → 100%, 스트레스 10 → 0%
```

---

## 4. 파일 구조

```
lib/wellness/
├── index.ts                    # barrel export (stress-visualization 포함)
├── stress-visualization.ts     # 핵심 모듈
└── biorhythm.ts               # 스트레스 점수 계산 (기존)

tests/lib/wellness/
└── stress-visualization.test.ts  # 22개 테스트
```

---

## 5. 테스트 전략

| 레벨 | 대상                     | 파일                         | 테스트 수 |
| ---- | ------------------------ | ---------------------------- | --------- |
| 단위 | getStressGrade           | stress-visualization.test.ts | 4         |
| 단위 | getSkinImpacts           | stress-visualization.test.ts | 5         |
| 단위 | getStressRecommendations | stress-visualization.test.ts | 3         |
| 단위 | buildStressVisualization | stress-visualization.test.ts | 3         |
| 단위 | analyzeStressTrend       | stress-visualization.test.ts | 7         |

---

**Version**: 1.0 | **Created**: 2026-03-15
