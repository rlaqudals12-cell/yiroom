# SDD: Cost-per-Wear (착용 비용 통계)

> 버전: 1.0
> 작성일: 2026-01-02
> 상태: 구현 완료

---

## 1. 개요

### 1.1 목적

옷장 아이템의 구매 가격 대비 착용 횟수를 기반으로 "1회 착용 비용"을 계산하여 사용자에게 경제적 인사이트 제공.

### 1.2 핵심 가치

- **부담 없는 인사이트**: 구매 결정을 후회하게 하지 않고, 긍정적 피드백 제공
- **활용도 인식**: 자주 입는 옷의 가치를 수치화
- **의류 순환 촉진**: 잘 안 입는 옷 인식 → 기부/판매 유도

---

## 2. 기능 요구사항

### 2.1 Cost-per-Wear 계산

```
Cost-per-Wear = 구매가격 / 착용횟수
```

| 조건          | 동작                                  |
| ------------- | ------------------------------------- |
| 가격 미입력   | 계산 불가, 해당 섹션 미표시           |
| 착용 0회      | "착용하면 1회 비용이 계산돼요" 메시지 |
| 착용 1회 이상 | 계산 결과 표시 (원 단위, 반올림)      |

### 2.2 표시 위치

| 위치               | 컴포넌트            | 표시 내용                  |
| ------------------ | ------------------- | -------------------------- |
| 아이템 상세 시트   | `ItemDetailSheet`   | 개별 아이템 Cost-per-Wear  |
| 옷장 인사이트 카드 | `ClosetInsightCard` | 평균 Cost-per-Wear, 최애템 |

### 2.3 인사이트 통계

| 통계          | 설명                                    |
| ------------- | --------------------------------------- |
| 총 착용 횟수  | 모든 옷장 아이템 착용 합계              |
| 평균 1회 비용 | 가격 있는 아이템들의 평균 Cost-per-Wear |
| 최애템        | 가장 많이 입은 아이템                   |

---

## 3. 데이터 스키마

### 3.1 기존 테이블 활용

```sql
-- inventory_items 테이블 (기존)
metadata JSONB  -- { price: number, ... }

-- 착용 횟수 (기존)
use_count INTEGER DEFAULT 0
```

### 3.2 메타데이터 구조

```typescript
interface ClothingMetadata {
  price?: number; // 구매 가격 (원)
  purchaseDate?: string; // 구매일
  brand?: string; // 브랜드
  // ... 기타
}
```

---

## 4. 구현 명세

### 4.1 ItemDetailSheet 추가 영역

```tsx
{
  /* Cost-per-wear */
}
{
  metadata?.price && metadata.price > 0 && (
    <div className="border-t border-muted-foreground/10 pt-2 space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">구매가</span>
        <span>{metadata.price.toLocaleString()}원</span>
      </div>
      {item.useCount > 0 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">1회 착용 비용</span>
          <span className="font-semibold text-primary">
            {Math.round(metadata.price / item.useCount).toLocaleString()}원
          </span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center">착용하면 1회 비용이 계산돼요</p>
      )}
    </div>
  );
}
```

### 4.2 ClosetInsightCard 통계 계산

```typescript
interface WearStats {
  totalWearCount: number;
  avgCostPerWear: number | null;
  mostWornItem: InventoryItem | null;
  leastWornItem: InventoryItem | null;
  itemsWithPrice: number;
}

const wearStats = useMemo((): WearStats | null => {
  if (closetItems.length === 0) return null;

  const totalWearCount = closetItems.reduce((sum, item) => sum + item.useCount, 0);

  const itemsWithPriceData = closetItems.filter((item) => {
    const meta = item.metadata as Partial<ClothingMetadata>;
    return meta?.price && meta.price > 0;
  });

  let avgCostPerWear: number | null = null;
  if (itemsWithPriceData.length > 0) {
    const totalCost = itemsWithPriceData.reduce((sum, item) => {
      const meta = item.metadata as Partial<ClothingMetadata>;
      return sum + (meta?.price || 0);
    }, 0);
    const totalWears = itemsWithPriceData.reduce((sum, item) => sum + item.useCount, 0);
    if (totalWears > 0) {
      avgCostPerWear = Math.round(totalCost / totalWears);
    }
  }

  const sortedByWear = [...closetItems].sort((a, b) => b.useCount - a.useCount);

  return {
    totalWearCount,
    avgCostPerWear,
    mostWornItem: sortedByWear[0]?.useCount > 0 ? sortedByWear[0] : null,
    leastWornItem: sortedByWear.length > 1 ? sortedByWear[sortedByWear.length - 1] : null,
    itemsWithPrice: itemsWithPriceData.length,
  };
}, [closetItems]);
```

---

## 5. UI/UX 가이드

### 5.1 톤앤매너

- 부담 없는 톤: "가성비 좋아요!" (X) → "자주 입고 계시네요" (O)
- 비난 회피: "안 입은 옷" (X) → 표시 안 함 (O)

### 5.2 아이콘

| 통계      | 아이콘     | 색상       |
| --------- | ---------- | ---------- |
| 총 착용   | TrendingUp | primary    |
| 평균 비용 | Coins      | primary    |
| 최애템    | Crown      | yellow-500 |

---

## 6. 테스트 체크리스트

- [x] 가격 없는 아이템: Cost-per-Wear 섹션 미표시
- [x] 착용 0회: 안내 메시지 표시
- [x] 착용 1회 이상: 계산값 표시
- [x] 통계 카드: 총 착용, 평균 비용, 최애템 표시
- [x] 반올림: 원 단위 정수 표시

---

## 7. 구현 파일

| 파일                                                        | 변경 내용               |
| ----------------------------------------------------------- | ----------------------- |
| `components/inventory/common/ItemDetailSheet.tsx`           | Cost-per-Wear 표시 추가 |
| `components/inventory/recommendation/ClosetInsightCard.tsx` | WearStats 계산 및 표시  |

---

## 8. 참고

- 리서치: [UXUI-TECH-RESEARCH-2026.md](./UXUI-TECH-RESEARCH-2026.md)
- 유사 기능: Cladwell, Stylebook 앱 참고
