# 바코드/QR 스캔 원리

> 이 문서는 바코드 스캔 및 제품 영양 정보 조회 모듈의 기반이 되는 기본 원리를 설명한다.

## 관련 문서

### 구현 스펙 (이 원리를 적용하는 문서)

| 문서                                       | 설명             |
| ------------------------------------------ | ---------------- |
| [SDD-BARCODE-SCAN](../SDD-BARCODE-SCAN.md) | 바코드 스캔 스펙 |

### 관련 원리 문서

| 문서                                           | 설명                 |
| ---------------------------------------------- | -------------------- |
| [nutrition-science.md](./nutrition-science.md) | 영양학 원리          |
| [offline-support.md](./offline-support.md)     | 오프라인 지원 (캐싱) |

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"모든 제품의 영양 정보를 즉시 확인"

- 100% 바코드 인식률 (모든 포맷, 저화질 포함)
- 전 세계 제품 DB 100% 커버리지
- 1초 이내 인식 및 정보 표시
- 오프라인에서도 동작 (로컬 DB 동기화)
- OCR 기반 영양성분표 자동 인식
```

### 물리적 한계

| 항목        | 한계                                                 |
| ----------- | ---------------------------------------------------- |
| DB 커버리지 | 전 세계 모든 제품 등록 불가능 (신규 제품, 지역 제품) |
| 인식률      | 저화질, 손상된 바코드 인식 한계                      |
| API 의존성  | 외부 API (Open Food Facts, 식품안전나라) 가용성      |
| 오프라인    | 로컬 DB 크기 vs 저장 공간                            |

### 100점 기준

| 항목           | 100점 기준   | 현재        | 달성률 |
| -------------- | ------------ | ----------- | ------ |
| 바코드 인식률  | 99%+         | 95%         | 96%    |
| DB 커버리지    | 글로벌 90%+  | 한국 80%    | 70%    |
| 인식 시간      | 1초 이내     | 2초 이내    | 80%    |
| 오프라인 지원  | 전체 DB 로컬 | 최근 스캔만 | 40%    |
| 영양성분표 OCR | 자동 인식    | 미지원      | 0%     |

### 현재 목표: 80%

- EAN-13, EAN-8, UPC-A, QR Code 지원
- 95%+ 인식률
- 2초 이내 스캔
- 3단계 Fallback (로컬 → Open Food Facts → 식품안전나라)
- 수동 입력 지원

### 의도적 제외

| 제외 항목             | 이유              | 재검토 시점 |
| --------------------- | ----------------- | ----------- |
| 영양성분표 OCR        | ML 모델 개발 비용 | MAU 10,000+ |
| 전체 DB 로컬 동기화   | 저장 공간 제약    | Phase 2     |
| 영수증 멀티 제품 인식 | 복잡도 높음       | Phase 3     |

---

## 1. 핵심 개념

### 1.1 바코드 포맷

#### EAN-13 (European Article Number)

한국 및 유럽 표준 바코드. 13자리 숫자로 구성.

```
구조: [국가 코드 3자리][제조사 코드 4-6자리][상품 코드 3-5자리][체크 디지트 1자리]

예시: 880 1234 56789 0
      ↑   ↑     ↑    ↑
      한국 제조사 상품  체크
```

**체크 디지트 계산**:

```
1. 홀수 자리 합 × 1 + 짝수 자리 합 × 3
2. 10 - (합계 % 10) = 체크 디지트
```

#### EAN-8

소형 제품용 8자리 바코드.

```
구조: [국가 코드 2-3자리][상품 코드 4-5자리][체크 디지트 1자리]
```

#### UPC-A (Universal Product Code)

미국 표준 12자리 바코드.

```
구조: [시스템 코드 1자리][제조사 코드 5자리][상품 코드 5자리][체크 디지트 1자리]
```

#### QR Code

2차원 매트릭스 코드. URL, 텍스트 등 다양한 데이터 인코딩.

```
용량: 최대 7,089자 (숫자), 4,296자 (영숫자)
오류 정정: L(7%), M(15%), Q(25%), H(30%)
```

### 1.2 바코드 디코딩 원리

```
카메라 스트림 → 이미지 캡처 → 패턴 인식 → 디코딩 → 숫자 추출

1. 이미지 전처리 (그레이스케일, 이진화)
2. 바코드 영역 탐지 (에지 검출)
3. 바 너비 측정 (두꺼운 바 = 1, 얇은 바 = 0)
4. 패턴 매칭 (룩업 테이블)
5. 체크섬 검증
```

### 1.3 데이터 파이프라인

```
┌─────────────┐
│ 바코드 스캔  │
└─────┬───────┘
      │
      ▼
┌─────────────┐     Found
│ 1. 로컬 DB   │─────────────────────┐
└─────┬───────┘                      │
      │ Not Found                    │
      ▼                              │
┌─────────────────┐     Found        │
│ 2. Open Food   │───────────────────┤
│    Facts API   │                   │
└─────┬───────────┘                  │
      │ Not Found                    │
      ▼                              │
┌─────────────────┐     Found        │
│ 3. 식품안전나라  │───────────────────┤
│    API         │                   │
└─────┬───────────┘                  │
      │ Not Found                    │
      ▼                              │
┌─────────────┐                      │
│ 4. 수동 입력  │                     │
└─────────────┘                      │
                                     ▼
                            ┌─────────────┐
                            │ 로컬 DB 캐싱 │
                            └─────────────┘
```

---

## 2. 수학적/물리학적 기반

### 2.1 EAN-13 체크 디지트 계산

```python
def calculate_check_digit(barcode_12: str) -> int:
    """EAN-13 체크 디지트 계산"""
    total = 0
    for i, digit in enumerate(barcode_12):
        weight = 1 if i % 2 == 0 else 3
        total += int(digit) * weight

    return (10 - (total % 10)) % 10

# 예: 880123456789 → 체크 디지트 = 0
```

### 2.2 바코드 인코딩 테이블

**EAN-13 L 코드 (왼쪽 홀수)**:
| 숫자 | 패턴 |
|------|------|
| 0 | 0001101 |
| 1 | 0011001 |
| 2 | 0010011 |
| 3 | 0111101 |
| ... | ... |

**바 너비 → 숫자 변환**:

```
패턴: 0001101 → 3개 공백, 2개 바, 1개 공백, 1개 바 → "0"
```

### 2.3 오류 정정 (QR Code)

```
Reed-Solomon 오류 정정 코드

오류 정정 수준:
- L (Low): 7% 데이터 복구 가능
- M (Medium): 15% 데이터 복구 가능
- Q (Quartile): 25% 데이터 복구 가능
- H (High): 30% 데이터 복구 가능
```

---

## 3. 구현 도출

### 3.1 원리 → 알고리즘

| 원리        | 알고리즘                     |
| ----------- | ---------------------------- |
| 바코드 인식 | html5-qrcode 라이브러리 사용 |
| 체크섬 검증 | EAN-13/UPC 체크 디지트 계산  |
| 데이터 조회 | 3단계 Fallback 체인          |
| 캐싱        | API 결과 로컬 DB 저장        |

### 3.2 알고리즘 → 코드

**바코드 스캐너 설정**:

```typescript
// lib/nutrition/barcode/scanner.ts
import { Html5Qrcode } from 'html5-qrcode';

const config = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  formatsToSupport: [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.QR_CODE,
  ],
};
```

**3단계 Fallback 조회**:

```typescript
// lib/nutrition/barcode/api.ts
async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  // 1. 로컬 DB
  const local = await supabase.from('barcode_products').select('*').eq('barcode', barcode).single();

  if (local.data) {
    return { ...local.data, source: 'local' };
  }

  // 2. Open Food Facts
  const offResult = await fetchOpenFoodFacts(barcode);
  if (offResult) {
    await cacheProduct(offResult); // 캐싱
    return { ...offResult, source: 'openfoodfacts' };
  }

  // 3. 식품안전나라
  const fskResult = await fetchFoodSafetyKorea(barcode);
  if (fskResult) {
    await cacheProduct(fskResult); // 캐싱
    return { ...fskResult, source: 'foodsafetykorea' };
  }

  return null; // 수동 입력 필요
}
```

**체크 디지트 검증**:

```typescript
function validateBarcode(barcode: string): boolean {
  if (barcode.length !== 13) return false;

  const digits = barcode.split('').map(Number);
  const checkDigit = digits.pop()!;

  const sum = digits.reduce((acc, digit, i) => {
    return acc + digit * (i % 2 === 0 ? 1 : 3);
  }, 0);

  const calculated = (10 - (sum % 10)) % 10;
  return calculated === checkDigit;
}
```

---

## 4. 검증 방법

### 4.1 원리 준수 검증

| 검증 항목     | 방법                                          |
| ------------- | --------------------------------------------- |
| 바코드 인식   | 다양한 포맷 테스트 (EAN-13, EAN-8, UPC-A, QR) |
| 체크섬 검증   | 유효/무효 바코드 검증                         |
| Fallback 체인 | 각 단계 Mock 후 다음 단계 호출 확인           |
| 캐싱          | API 조회 후 로컬 DB 저장 확인                 |

### 4.2 테스트 케이스

```typescript
describe('Barcode Scanner', () => {
  it('should decode valid EAN-13 barcode');
  it('should decode valid EAN-8 barcode');
  it('should decode valid UPC-A barcode');
  it('should decode valid QR code');
  it('should reject invalid checksum');
});

describe('Barcode Lookup', () => {
  it('should return local DB result first');
  it('should fallback to Open Food Facts');
  it('should fallback to 식품안전나라');
  it('should cache API results');
  it('should return null when product not found');
});
```

---

## 5. 외부 API 명세

### 5.1 Open Food Facts API

```
엔드포인트: https://world.openfoodfacts.org/api/v2/product/{barcode}.json

응답 예시:
{
  "code": "8801234567890",
  "product": {
    "product_name": "제품명",
    "brands": "브랜드",
    "serving_size": "100g",
    "nutriments": {
      "energy-kcal_100g": 200,
      "carbohydrates_100g": 30,
      "proteins_100g": 5,
      "fat_100g": 8,
      "sodium_100g": 500
    },
    "image_url": "https://..."
  }
}

제한: 없음 (무료)
라이선스: Open Database License (ODbL)
```

### 5.2 식품안전나라 API

```
엔드포인트: https://apis.data.go.kr/1471000/FoodNtrIrdntInfoService1

파라미터:
- ServiceKey: API 키
- PRDLST_NM: 제품명 (선택)
- BAR_CD: 바코드 (선택)

제한: 일 1,000건
인증: API 키 필요 (공공데이터포털 발급)
```

---

## 6. 성능 고려사항

### 6.1 스캔 최적화

| 최적화    | 방법                             |
| --------- | -------------------------------- |
| FPS 조절  | 10fps (배터리 vs 인식 속도 균형) |
| 해상도    | 720p (저사양 기기 호환)          |
| 스캔 영역 | 중앙 영역만 스캔 (성능 향상)     |

### 6.2 캐싱 전략

```typescript
// 캐싱 우선순위
1. 메모리 캐시 (최근 10개)
2. 로컬 DB (barcode_products)
3. 외부 API

// TTL
로컬 DB: 무기한 (검증된 데이터)
메모리 캐시: 세션 동안
```

### 6.3 오프라인 지원

```typescript
// 오프라인 시 동작
1. 로컬 DB만 조회
2. 미발견 시 "온라인에서 다시 시도" 안내
3. 온라인 복귀 시 자동 동기화
```

---

## 7. 보안 고려사항

| 항목          | 조치                                               |
| ------------- | -------------------------------------------------- |
| 카메라 스트림 | 로컬에서만 처리, 서버 전송 X                       |
| API 키        | 서버 사이드에서만 사용 (FOOD_SAFETY_KOREA_API_KEY) |
| 사용자 제출   | verified: false로 저장, 추후 검증                  |

---

## 8. 참고 자료

- [GS1 - 바코드 표준](https://www.gs1.org/standards/barcodes)
- [EAN-13 Specification](https://en.wikipedia.org/wiki/International_Article_Number)
- [Open Food Facts API](https://world.openfoodfacts.org/data)
- [공공데이터포털 - 식품안전나라](https://www.data.go.kr/data/15057436/openapi.do)
- [html5-qrcode Documentation](https://github.com/mebjas/html5-qrcode)
- [Reed-Solomon Error Correction](https://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction)

---

**Version**: 1.0 | **Created**: 2026-02-03 | **Updated**: 2026-02-03
