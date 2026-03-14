# ADR-089: 바이오리듬 웰니스 통합

## 상태

승인됨 (2026-03-14)

## 컨텍스트

경쟁사 분석 결과 Flo Health, Amareta 등이 신체 리듬/수면→뷰티 연결을 제공.
이룸의 웰니스 모듈은 4영역(운동/영양/피부/체형) 점수 합산 방식이나,
수면/스트레스/기분 등 일상 컨디션이 뷰티/건강에 미치는 영향을 반영하지 못함.

`mental_health_logs` 테이블에 이미 mood, stress, sleep, energy 데이터 수집 중.

## 결정

### 1. 바이오리듬을 "보정 계수"로 통합 (5번째 영역 아님)

**대안 1**: 5번째 영역 추가 (각 20점씩 5영역)

- 장점: 균등한 비중
- 단점: 기존 4영역 점수 체계(각 25점) 전면 변경 필요, 하위 호환성 깨짐

**대안 2 (채택)**: 보정 계수 (0.85~1.15)

- 장점: 기존 점수 체계 유지, 점진적 도입, 바이오리듬 미입력 시 영향 없음
- 단점: 바이오리듬의 영향이 간접적

**근거**: P4(단순화) — 기존 동작하는 코드를 최소 변경. 바이오리듬 데이터 미입력 시 modifier=1.0으로 무영향.

### 2. 수면→피부 연결 인사이트 자동 생성

기존 `getConditionInsights()` 확장이 아닌, 별도 `getBiorhythmInsights()` 함수로 분리.
피부 분석 결과와 수면/스트레스 데이터를 교차 분석.

### 3. 성별별 UI는 gender-provider 활용

여성 사용자에게만 생리주기 입력 UI 노출.
`useGender()` 훅으로 분기. 데이터는 `mental_health_logs`에 `cycle_day` 컬럼 추가.

### 4. DB 변경

`mental_health_logs`에 `cycle_day INTEGER NULL` 컬럼 추가 (마이그레이션 필요, GFSA 후).
현재는 프론트엔드에서만 계산, DB 저장은 후속.

## 결과

- 기존 웰니스 점수 체계 100% 호환
- 바이오리듬 데이터 없는 사용자: 기존과 동일 (modifier 1.0)
- 바이오리듬 데이터 있는 사용자: ±15% 보정

## 관련 문서

- [원리: biorhythm-science.md](../principles/biorhythm-science.md)
- [ADR-007: Mock Fallback](./ADR-007-mock-fallback-strategy.md)
