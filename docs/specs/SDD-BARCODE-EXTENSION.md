# SDD-BARCODE-EXTENSION: 바코드 스캔 확장 스펙

> **Version**: 1.0 | **Created**: 2026-03-03 | **Status**: Draft
> **Author**: Claude Code
> **연동**: [SDD-CAMERA-INGREDIENT](./SDD-CAMERA-INGREDIENT.md), [SDD-INVENTORY-EXTENSION](./SDD-INVENTORY-EXTENSION.md)

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"바코드 스캔 한 번으로 제품 정보 자동 조회 → 성분 안전성 검사 →
인벤토리 등록 → 캡슐 호환성 확인까지 원스톱으로 처리하는 시스템"

### 100점 기준

| 지표           | 100점 | 현재 목표  |
| -------------- | ----- | ---------- |
| 바코드 인식률  | 99%+  | 95%        |
| 제품 DB 히트율 | 90%+  | 60% (시드) |
| 스캔→결과 시간 | < 1s  | < 3s       |
| 자동 등록      | 1탭   | 2탭        |

### 현재 목표: 35%

---

## 1. 핵심 기능

### 1.1 바코드 스캔

```
지원 형식:
  - EAN-13 (한국 표준)
  - UPC-A (미국)
  - QR Code (제품 페이지 링크)

기술:
  - expo-barcode-scanner (모바일)
  - @zxing/library (웹 폴백)
```

### 1.2 제품 조회

```
스캔 → barcode_products 테이블 조회:

  히트 시:
    → 제품 정보 반환 (이름, 브랜드, 카테고리, 성분)
    → 바로 Safety 검사 + 캡슐 호환성

  미스 시:
    → "제품을 찾을 수 없어요"
    → 옵션 1: 성분표 직접 촬영 (SDD-CAMERA-INGREDIENT)
    → 옵션 2: 수동 입력
    → 입력 데이터 → barcode_products에 크라우드소싱 저장
```

### 1.3 원스톱 파이프라인

```
바코드 스캔
  → 제품 조회
  → Safety 검사 (ADR-070)
  → 캡슐 호환성 (ADR-071)
  → [인벤토리에 추가] 1탭
  → user_product_shelf 또는 wardrobe_items INSERT
```

---

## 2. 데이터 모델

### 2.1 barcode_products 테이블

```sql
CREATE TABLE barcode_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT NOT NULL UNIQUE,
  barcode_type TEXT DEFAULT 'EAN-13',
  product_name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  ingredients TEXT[],          -- 성분 목록
  image_url TEXT,
  source TEXT DEFAULT 'crowdsource', -- 'seed' | 'crowdsource' | 'api'
  verified BOOLEAN DEFAULT false,
  scan_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_barcode ON barcode_products(barcode);
```

### 2.2 TypeScript 타입

```typescript
interface BarcodeProduct {
  id: string;
  barcode: string;
  barcodeType: 'EAN-13' | 'UPC-A' | 'QR';
  productName: string;
  brand: string | null;
  category: string | null;
  ingredients: string[];
  imageUrl: string | null;
  verified: boolean;
}

interface BarcodeScanResult {
  product: BarcodeProduct | null;
  found: boolean;
  safetyReport?: SafetyReport;
  capsuleCompatibility?: number;
}
```

---

## 3. API

| Method | Path                  | 설명                          |
| ------ | --------------------- | ----------------------------- |
| GET    | /api/barcode/[code]   | 바코드로 제품 조회            |
| POST   | /api/barcode/scan     | 스캔 + Safety + 호환성 통합   |
| POST   | /api/barcode/register | 미등록 제품 크라우드소싱 등록 |

---

## 4. UI 플로우

```
1. 카메라 화면 + 바코드 가이드
2. 자동 인식 → 진동 피드백
3. 결과:
   ┌─────────────────────────────┐
   │ 🧴 [제품명]                  │
   │ [브랜드] | [카테고리]        │
   │                             │
   │ 안전 등급: ✅ 안전 (92점)    │
   │ 캡슐 호환: A등급 (78점)     │
   │                             │
   │ [인벤토리에 추가] [상세보기] │
   └─────────────────────────────┘

   미등록 제품:
   ┌─────────────────────────────┐
   │ ❓ 제품을 찾을 수 없어요     │
   │                             │
   │ [성분표 촬영하기]            │  → SDD-CAMERA-INGREDIENT
   │ [직접 입력하기]              │
   └─────────────────────────────┘
```

---

## 5. 시드 데이터

```
초기 시드: 500개 제품 (기존 cosmetic_ingredients 100시드 연동)
카테고리 분포:
  - 스킨케어: 200개
  - 메이크업: 100개
  - 헤어: 80개
  - 영양제: 70개
  - 기타: 50개
```

---

## 6. 테스트

| 테스트       | 내용                        | 기준      |
| ------------ | --------------------------- | --------- |
| 바코드 인식  | EAN-13 10개, UPC-A 5개      | 95%+      |
| DB 히트      | 시드 제품 조회              | 100%      |
| DB 미스      | 미등록 바코드 → 대체 플로우 | 정상 안내 |
| 원스톱       | 스캔→Safety→인벤토리        | < 5s E2E  |
| 크라우드소싱 | 미등록 제품 등록            | 저장 성공 |

---

## 7. 의도적 제외

| 제외 항목              | 이유                            | 재검토 시점        |
| ---------------------- | ------------------------------- | ------------------ |
| 외부 바코드 API 연동   | 초기 시드+크라우드소싱으로 충분 | 히트율 60% 미달 시 |
| QR 코드 딥링크 파싱    | 제조사마다 형식 상이            | 파트너십 체결 시   |
| 가격 비교 자동화       | 어필리에이트 시스템 별도 구현   | ADR-075 구현 후    |
| 유통기한 OCR 자동 추출 | 인쇄 형식 다양, 정확도 부족     | OCR 정밀도 향상 시 |

---

## 관련 문서

- [SDD-CAMERA-INGREDIENT](./SDD-CAMERA-INGREDIENT.md) — 성분표 OCR (바코드 미스 시 대체)
- [SDD-INVENTORY-EXTENSION](./SDD-INVENTORY-EXTENSION.md) — 인벤토리 등록 연동
- [ADR-070: Safety Profile](../adr/ADR-070-safety-profile-architecture.md) — 안전성 검사
- [SDD-CAPSULE-ECOSYSTEM](./SDD-CAPSULE-ECOSYSTEM.md) — 캡슐 호환성
- [L-1: DISCLAIMER-TEMPLATES](../legal/DISCLAIMER-TEMPLATES.md)
- [L-2: PRIVACY-DESIGN](../legal/PRIVACY-DESIGN.md)

---

**Version**: 1.0 | **Created**: 2026-03-03
