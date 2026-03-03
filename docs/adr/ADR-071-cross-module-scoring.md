# ADR-071: 크로스 모듈 호환성 스코어링 모델

## 상태

**제안** (2026-03-03)

## 컨텍스트

캡슐 에코시스템에서 아이템 간 호환성을 정량 평가하는 점수 체계가 필요하다.
C2(호환성) 원리에 따르면 CCS = Σ(pairwise_compatibility) / C(n,2) ≥ 70 이어야 한다.
기존 SDD-CROSS-MODULE-PROTOCOL(v1.1)에 모듈 간 데이터 흐름은 정의되어 있으나,
캡슐 단위의 통합 호환성 점수 계산 모델은 부재하다.

### 핵심 과제

1. **도메인 간 호환성 정의**: 스킨케어 성분 vs 패션 색상 등 이종 도메인 비교
2. **가중치 체계**: 9모듈 간 호환성 중요도 차등
3. **기존 시스템 활용**: `ingredient_interactions`, `lib/smart-matching/` 11모듈

## 결정

### 1. 3계층 호환성 모델

```
Layer 1: Intra-Domain (도메인 내)
  → 같은 도메인 아이템 간 호환성
  → 예: 스킨케어 제품 A와 B의 성분 호환성
  → 데이터: ingredient_interactions 테이블

Layer 2: Cross-Domain (도메인 간)
  → 다른 도메인 아이템 간 시너지/충돌
  → 예: 스킨케어 제품 vs 영양제 성분 상호작용
  → 데이터: cross_domain_rules (신규)

Layer 3: Profile-Fit (프로필 적합도)
  → 아이템 vs BeautyProfile 개인 적합도
  → 예: 사용자 퍼스널컬러 vs 의류 색상
  → 데이터: BeautyProfile + 각 모듈 분석 결과
```

### 2. 점수 계산 공식

```
CCS (Capsule Compatibility Score):

  CCS = w1 × IntraDomain + w2 × CrossDomain + w3 × ProfileFit

  기본 가중치:
    w1 = 0.40 (도메인 내 호환성 — 안전 최우선)
    w2 = 0.25 (도메인 간 시너지)
    w3 = 0.35 (개인 프로필 적합도)

Pairwise Score:
  각 아이템 쌍(a, b)에 대해:
    pair(a, b) = {
      같은 도메인: intraDomainScore(a, b)    // 0-100
      다른 도메인: crossDomainScore(a, b)    // 0-100
    }

전체 캡슐 CCS 계산:
  Layer 1: 동일 도메인 내 아이템 쌍만 (w1=0.40)
  Layer 2: 서로 다른 도메인 아이템 쌍 (w2=0.25)
  Layer 3: 각 아이템의 BeautyProfile 적합도 평균 (w3=0.35)

  CCS = (L1_avg × 0.40) + (L2_avg × 0.25) + (L3_avg × 0.35)
  (n = 캡슐 아이템 수, 각 Layer 평균은 0-100 정규화)
```

### 3. 도메인별 호환성 규칙

| 도메인 쌍           | 호환성 요소            | 점수 소스               |
| ------------------- | ---------------------- | ----------------------- |
| Skin × Skin         | pH 충돌, 성분 상호작용 | ingredient_interactions |
| Skin × Nutrition    | 영양소 ↔ 피부 영향     | cross_domain_rules      |
| Fashion × PC        | 색상 조화도 (Lab ΔE)   | lib/smart-matching/     |
| Fashion × Body      | 실루엣 적합도          | ADR-050 종합 점수       |
| Workout × Nutrition | 운동-식단 매칭         | 칼로리/단백질 균형      |
| Hair × Skin         | 두피-피부 성분 호환    | ingredient_interactions |

### 4. 임계값 및 등급

| 등급 | 점수 범위 | 행동                      |
| ---- | --------- | ------------------------- |
| S    | 90-100    | "완벽한 조합" — 추천 강조 |
| A    | 70-89     | "좋은 조합" — 기본 추천   |
| B    | 50-69     | "보통" — 개선 제안 표시   |
| C    | 30-49     | "주의" — 대체 아이템 추천 |
| F    | 0-29      | "비호환" — 조합에서 제외  |

C2 원칙: 캡슐 내 CCS ≥ 70 (A등급 이상) 유지

### 5. 기존 시스템 연동

```
lib/smart-matching/ (11모듈):
  → 패션 매칭 점수 → Layer 3 ProfileFit에 활용

ingredient_interactions (DB):
  → 성분 상호작용 → Layer 1 IntraDomain에 활용

lib/inventory/ (16함수):
  → 사용자 보유 아이템 조회 → 캡슐 구성 시 활용

cosmetic_ingredients (100시드):
  → EWG 등급 → Safety Profile 연동 시 가중치 보정
```

## 대안

| 대안                    | 장점        | 단점                  | 기각 이유        |
| ----------------------- | ----------- | --------------------- | ---------------- |
| 단일 점수 (가중합 없음) | 단순        | 도메인 특성 반영 불가 | 정밀도 부족      |
| ML 기반 점수 예측       | 높은 정확도 | 학습 데이터 필요      | 현재 데이터 부족 |
| 규칙 기반만 (점수 없음) | 구현 간단   | 미세 차이 표현 불가   | 캡슐 최적화 불가 |

## 결과

### 장점

- 기존 ingredient_interactions + smart-matching 최대 활용
- 3계층 분리로 각 레이어 독립 테스트/개선 가능
- CCS ≥ 70 임계값으로 C2 원칙 준수 자동 검증

### 단점

- cross_domain_rules 테이블 신규 생성 필요
- 9모듈 × 9모듈 = 36쌍 호환성 규칙 정의 필요 (대칭이므로 실제 36개)

## 관련 문서

- [P-1: capsule-principle.md](../principles/capsule-principle.md) — C2 호환성 원리
- [SDD-CROSS-MODULE-PROTOCOL](../specs/SDD-CROSS-MODULE-PROTOCOL.md) — 모듈 간 데이터 흐름
- [ADR-069: 캡슐 아키텍처](./ADR-069-capsule-ecosystem-architecture.md) — BeautyProfile 구조
- [ADR-050: Fashion-Closet 크로스모듈](./ADR-050-fashion-closet-crossmodule.md) — 종합 점수 공식

---

**Version**: 1.0 | **Created**: 2026-03-03
