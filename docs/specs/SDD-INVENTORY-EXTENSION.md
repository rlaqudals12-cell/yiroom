# SDD-INVENTORY-EXTENSION: 인벤토리 캡슐 확장 스펙

> **Version**: 1.0 | **Created**: 2026-03-03 | **Status**: Draft
> **Author**: Claude Code
> **기반 ADR**: ADR-069 (캡슐 아키텍처)
> **기존 시스템**: `lib/inventory/` (16함수)

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"사용자의 모든 보유 아이템(화장품, 의류, 영양제 등)을 통합 관리하고,
캡슐 시스템과 연동하여 보유량/소진 추적, 재구매 알림, 갭 분석을 지원하는 시스템"

### 100점 기준

| 지표             | 100점     | 현재 목표   |
| ---------------- | --------- | ----------- |
| 보유 아이템 등록 | 자동 인식 | 수동+바코드 |
| 소진 추적        | 실시간    | 예상 소진일 |
| 캡슐 연동        | 자동      | 수동 매핑   |
| 재구매 알림      | AI 예측   | 규칙 기반   |

### 현재 목표: 45%

---

## 1. 기존 시스템 (lib/inventory/ 16함수)

### 1.1 현재 함수 목록

```
CRUD 기본:
  addToShelf()        — 제품 추가
  removeFromShelf()   — 제품 삭제
  getShelfItems()     — 보유 목록 조회
  updateShelfItem()   — 제품 정보 수정

조회/검색:
  getShelfByCategory()  — 카테고리별 조회
  searchShelf()         — 검색
  getShelfStats()       — 통계 (총 개수, 카테고리별)

상태 관리:
  markAsOpened()      — 개봉 표시
  markAsFinished()    — 소진 표시
  getExpiringItems()  — 유통기한 임박 조회

옷장 전용:
  addWardrobeItem()   — 의류 추가
  removeWardrobeItem() — 의류 삭제
  getWardrobeItems()  — 의류 조회
  logWear()           — 착용 기록
  getWearHistory()    — 착용 이력
  getUnwornItems()    — 미착용 아이템
```

### 1.2 관련 DB 테이블

```
user_product_shelf:    화장품/영양제 보유 목록
wardrobe_items:        의류 보유 목록
outfits:              코디 조합
wear_logs:            착용 기록
```

---

## 2. 캡슐 확장

### 2.1 신규 함수

```typescript
// lib/inventory/capsule-integration.ts

// 인벤토리 → 캡슐 매핑
getItemsForCapsule(domain: string): Promise<ShelfItem[]>
  // 도메인에 해당하는 보유 아이템 반환

// 소진 예측
estimateDepletion(itemId: string): Promise<Date | null>
  // 사용 빈도 기반 소진일 예측

// 재구매 알림 대상
getRepurchaseNeeded(): Promise<ShelfItem[]>
  // 소진 임박 + 캡슐 활성 아이템

// 캡슐 갭과 인벤토리 교차 확인
checkGapAgainstInventory(gaps: GapItem[]): Promise<{
  coverable: GapItem[];     // 보유 아이템으로 커버 가능
  needPurchase: GapItem[];  // 구매 필요
}>
```

### 2.2 소진 예측 알고리즘

```
estimateDepletion(item):
  1. 사용 빈도 = (Daily Capsule 완료 횟수에서 해당 아이템 사용 횟수)
  2. 용량 = item.totalAmount (ml 또는 개수)
  3. 1회 사용량 = 도메인별 기본값
     - 스킨케어: 0.5ml/회
     - 영양제: 1정/회
  4. 잔여량 = 용량 - (사용 횟수 × 1회 사용량)
  5. 예상 소진일 = now + (잔여량 / 일평균 사용량) 일
```

### 2.3 통합 대시보드 데이터

```typescript
interface InventoryDashboard {
  totalItems: number;
  byDomain: Record<string, number>;
  expiringCount: number; // 유통기한 30일 이내
  depletingCount: number; // 소진 예상 14일 이내
  capsuleUtilization: number; // 캡슐 내 보유 아이템 수 / 이상적 캡슐 아이템 수 × 100 (%)
  unwornCount: number; // 미착용 의류 수
}
```

---

## 3. API

| Method | Path                            | 설명               |
| ------ | ------------------------------- | ------------------ |
| GET    | /api/inventory/dashboard        | 통합 대시보드      |
| GET    | /api/inventory/capsule/[domain] | 도메인별 캡슐 매핑 |
| GET    | /api/inventory/repurchase       | 재구매 필요 목록   |
| POST   | /api/inventory/depletion-check  | 소진 예측 실행     |

---

## 4. 테스트

| 테스트      | 내용                   | 기준           |
| ----------- | ---------------------- | -------------- |
| 기존 16함수 | 하위 호환성            | 변경 없이 통과 |
| 캡슐 매핑   | 도메인별 아이템 필터링 | 정확한 분류    |
| 소진 예측   | 30일/60일/90일 예측    | ±7일 이내      |
| 갭 교차     | 보유 아이템 커버 판단  | 정확한 분류    |

---

## 5. 의도적 제외

| 제외 항목               | 이유                               | 재검토 시점           |
| ----------------------- | ---------------------------------- | --------------------- |
| AI 기반 자동 등록       | 이미지만으로 제품 식별 정확도 부족 | 바코드 스캔 안정화 후 |
| 실시간 소진 추적        | IoT 센서 의존 (스마트 디스펜서)    | Phase N               |
| 가격 추적/재구매 최저가 | 어필리에이트 시스템 연동 필요      | ADR-075 구현 후       |
| 멀티 위치 관리          | 사용자 대부분 단일 위치            | MAU 1만+ 후           |

---

## 관련 문서

- [ADR-069: 캡슐 아키텍처](../adr/ADR-069-capsule-ecosystem-architecture.md) — lib/inventory 활용 계획
- [ADR-075: 쇼핑 컴패니언](../adr/ADR-075-shopping-companion.md) — 갭 분석 연동
- [SDD-CAPSULE-ECOSYSTEM](./SDD-CAPSULE-ECOSYSTEM.md) — 통합 스펙

---

**Version**: 1.0 | **Created**: 2026-03-03
