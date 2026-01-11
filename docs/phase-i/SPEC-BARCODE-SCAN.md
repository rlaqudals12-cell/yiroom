# SPEC-BARCODE-SCAN.md

> N-1 바코드 스캔 음식 입력 기능
>
> **상태**: ✅ 구현 완료 (2026-01-11)
> **테스트**: 16개 통과
> **커밋**: 7b374bd

## 개요

| 항목      | 내용                    |
| --------- | ----------------------- |
| 모듈      | N-1 (영양 관리)         |
| 우선순위  | 높음 (Phase I-1)        |
| 예상 기간 | 3-4일                   |
| 의존성    | html5-qrcode 라이브러리 |

## 목표

카메라로 식품 바코드를 스캔하여 영양 정보를 자동 입력하는 기능 구현.
수동 검색 대비 입력 시간 80% 단축 목표.

## 기능 요구사항

### 핵심 기능 (Must Have)

1. **바코드 스캔**
   - 카메라 권한 요청 및 관리
   - EAN-13, EAN-8, UPC-A 바코드 인식
   - 스캔 성공/실패 피드백 (진동, 사운드)

2. **식품 데이터베이스**
   - 한국 식품 DB 연동 (식약처 공공데이터)
   - 자주 사용하는 식품 캐싱
   - 바코드 없는 식품 수동 등록

3. **영양 정보 표시**
   - 칼로리, 탄단지 표시
   - 1회 제공량 기준 자동 계산
   - 섭취량 조절 UI

### 부가 기능 (Nice to Have)

4. **최근 스캔 이력**
   - 최근 10개 스캔 식품 저장
   - 빠른 재선택 UI

5. **알레르기 경고**
   - 사용자 알레르기 정보 연동
   - 위험 성분 발견 시 경고

## 기술 설계

### 라이브러리

```bash
npm install html5-qrcode
```

### 파일 구조

```
apps/web/
├── app/
│   ├── (main)/nutrition/
│   │   └── barcode/
│   │       └── page.tsx          # 바코드 스캔 페이지
│   └── api/nutrition/
│       └── foods/
│           └── barcode/
│               └── [code]/
│                   └── route.ts  # 바코드 조회 API
├── components/nutrition/
│   └── BarcodeScanner.tsx        # 스캐너 컴포넌트
├── lib/nutrition/
│   └── barcodeService.ts         # 바코드 서비스
└── types/
    └── nutrition.ts              # 타입 확장
```

### 데이터베이스

```sql
-- 바코드 식품 테이블
CREATE TABLE barcode_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  brand VARCHAR(100),
  serving_size DECIMAL(10,2),
  serving_unit VARCHAR(20) DEFAULT 'g',
  calories DECIMAL(10,2),
  protein DECIMAL(10,2),
  carbs DECIMAL(10,2),
  fat DECIMAL(10,2),
  fiber DECIMAL(10,2),
  sodium DECIMAL(10,2),
  sugar DECIMAL(10,2),
  allergens TEXT[],
  category VARCHAR(50),
  image_url TEXT,
  source VARCHAR(50) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_barcode_foods_barcode ON barcode_foods(barcode);
CREATE INDEX idx_barcode_foods_name ON barcode_foods USING gin(to_tsvector('korean', name));

-- 사용자 스캔 이력
CREATE TABLE user_barcode_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  barcode_food_id UUID REFERENCES barcode_foods(id),
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_barcode_history_user ON user_barcode_history(clerk_user_id);

-- RLS
ALTER TABLE barcode_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_barcode_history ENABLE ROW LEVEL SECURITY;

-- 바코드 식품은 모든 인증 사용자가 읽기 가능
CREATE POLICY "barcode_foods_read" ON barcode_foods
  FOR SELECT USING (auth.jwt() IS NOT NULL);

-- 스캔 이력은 본인만 접근
CREATE POLICY "user_barcode_history_policy" ON user_barcode_history
  FOR ALL USING (clerk_user_id = auth.jwt() ->> 'sub');
```

### API 설계

#### GET /api/nutrition/foods/barcode/[code]

**Request:**

```
GET /api/nutrition/foods/barcode/8801234567890
```

**Response (Success):**

```json
{
  "found": true,
  "food": {
    "id": "uuid",
    "barcode": "8801234567890",
    "name": "신라면 건면",
    "brand": "농심",
    "servingSize": 120,
    "servingUnit": "g",
    "calories": 375,
    "protein": 9,
    "carbs": 68,
    "fat": 8,
    "fiber": 3,
    "sodium": 1590,
    "allergens": ["밀", "대두", "쇠고기"],
    "category": "즉석식품",
    "imageUrl": "https://..."
  }
}
```

**Response (Not Found):**

```json
{
  "found": false,
  "barcode": "8801234567890",
  "message": "등록되지 않은 바코드입니다. 직접 등록하시겠어요?"
}
```

#### POST /api/nutrition/foods/barcode

**Request (수동 등록):**

```json
{
  "barcode": "8801234567890",
  "name": "신라면 건면",
  "brand": "농심",
  "servingSize": 120,
  "calories": 375,
  "protein": 9,
  "carbs": 68,
  "fat": 8
}
```

### 컴포넌트 설계

#### BarcodeScanner.tsx

```tsx
interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export function BarcodeScanner({ onScan, onError, onClose }: BarcodeScannerProps) {
  // html5-qrcode 사용
  // 카메라 권한 요청
  // 스캔 성공 시 진동 피드백
  // 에러 핸들링
}
```

#### 바코드 스캔 플로우

```
1. 사용자가 바코드 버튼 클릭
   ↓
2. 카메라 권한 요청
   ↓
3. 바코드 스캐너 UI 표시
   ↓
4. 바코드 인식
   ↓
5. API 조회
   ↓
6-a. 식품 발견 → 영양 정보 표시 → 섭취량 입력 → 기록 저장
6-b. 미등록 → 수동 등록 폼 표시 → 저장 → 기록
```

## UI/UX 설계

### 화면 구성

1. **스캐너 화면**
   - 전체 화면 카메라 뷰
   - 스캔 가이드 프레임 (중앙)
   - 닫기 버튼 (우상단)
   - 플래시 토글 (좌하단)
   - 갤러리 선택 (우하단) - 바코드 이미지 업로드

2. **결과 화면**
   - 식품 이미지 (있는 경우)
   - 식품명, 브랜드
   - 영양 정보 카드
   - 섭취량 슬라이더 (0.5배 ~ 3배)
   - 식사 시간 선택
   - 기록 버튼

3. **미등록 식품 화면**
   - 바코드 표시
   - 입력 폼 (이름, 브랜드, 영양정보)
   - 사진 촬영 옵션
   - 등록 버튼

### 접근성

- 스캔 성공: 진동 + "삐" 소리
- 스캔 실패: 에러 메시지 음성 안내 옵션
- 화면 리더 지원

## 테스트 계획

### 단위 테스트

```
tests/
├── components/nutrition/
│   └── BarcodeScanner.test.tsx
├── lib/nutrition/
│   └── barcodeService.test.ts
└── api/nutrition/
    └── barcode.test.ts
```

### 테스트 케이스

1. **스캐너 컴포넌트**
   - 카메라 권한 거부 시 에러 표시
   - 바코드 인식 시 콜백 호출
   - 닫기 버튼 동작

2. **API**
   - 존재하는 바코드 조회
   - 존재하지 않는 바코드 처리
   - 신규 바코드 등록
   - 인증 없는 요청 거부

3. **통합 테스트**
   - 스캔 → 조회 → 기록 플로우
   - 미등록 → 등록 → 기록 플로우

## 데이터 소스

### 1차: 공공데이터 (무료)

- 식품의약품안전처 식품영양성분 DB
- 한국소비자원 가공식품 DB
- 약 50,000개 식품 정보

### 2차: 크라우드소싱

- 사용자 등록 데이터 축적
- 검증 프로세스 (3명 이상 동일 정보 시 승인)

## 성공 지표

| 지표           | 목표                            |
| -------------- | ------------------------------- |
| 바코드 인식률  | 95% 이상                        |
| 식품 매칭률    | 70% 이상 (1차) → 90% (6개월 후) |
| 입력 시간 단축 | 수동 대비 80%                   |
| 사용자 만족도  | 4.0/5.0 이상                    |

## 보안 고려사항

- 카메라 접근은 HTTPS 필수
- 바코드 데이터는 개인정보 아님 (RLS 완화 가능)
- 사용자 스캔 이력은 본인만 접근

## 일정

| 날짜  | 작업                         |
| ----- | ---------------------------- |
| Day 1 | DB 마이그레이션, API 구현    |
| Day 2 | BarcodeScanner 컴포넌트 구현 |
| Day 3 | 바코드 페이지 UI, 통합       |
| Day 4 | 테스트, 버그 수정            |

---

**문서 버전**: 1.0
**작성일**: 2025-12-28
**작성자**: Claude Code
