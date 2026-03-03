# SDD-CAMERA-INGREDIENT: 카메라 성분 스캔 스펙

> **Version**: 1.0 | **Created**: 2026-03-03 | **Status**: Draft
> **Author**: Claude Code
> **기반 ADR**: ADR-070 (Safety Profile), ADR-071 (크로스 모듈 스코어링)
> **원리**: [P-2: safety-science.md](../principles/safety-science.md)

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"카메라로 제품 성분표를 촬영하면 OCR로 성분을 추출하고,
사용자의 Safety Profile과 대조하여 즉시 안전성을 판정하는 시스템"

### 100점 기준

| 지표             | 100점 | 현재 목표   |
| ---------------- | ----- | ----------- |
| OCR 정확도       | 98%+  | 90%         |
| 성분 매칭률      | 95%+  | 80%         |
| 판정 시간        | < 2s  | < 5s        |
| 한국어/영어 지원 | 둘 다 | 한국어 우선 |

### 현재 목표: 40%

---

## 1. 핵심 기능

### 1.1 성분표 촬영 → OCR

```
입력: 카메라 촬영 이미지 (성분표 영역)
처리:
  1. 이미지 전처리 (크롭, 대비 보정)
  2. Gemini Vision API로 OCR
     → 프롬프트: "이 화장품 성분표의 모든 성분을 순서대로 추출해주세요"
  3. 성분명 정규화 (INCI → 한국어 매핑)
출력: string[] (성분 목록)
```

### 1.2 성분 매칭 + Safety 검사

```
입력: 추출된 성분 목록 + 사용자 SafetyProfile
처리:
  1. cosmetic_ingredients 테이블에서 성분 조회
  2. ADR-070 안전성 파이프라인 실행
     → Step 1: 알레르겐 교차 반응
     → Step 2: 금기사항
     → Step 3: 성분 상호작용
     → Step 4: EWG 등급
출력: SafetyReport
```

### 1.3 캡슐 호환성 검사

```
선택적: 현재 캡슐과의 호환성 확인
입력: SafetyReport + 현재 스킨케어 캡슐
처리:
  → ADR-071 CCS 계산 (스캔 제품 vs 캡슐 아이템)
출력: CompatibilityResult { score, conflicts[] }
```

---

## 2. 데이터 모델

### 2.1 스캔 기록

```typescript
interface IngredientScan {
  id: string;
  userId: string;
  imageUrl: string; // Supabase Storage
  ingredients: string[]; // OCR 추출 결과 (정규화된 성분 목록)
  matchedIngredients: MatchedIngredient[];
  safetyReport: SafetyReport;
  capsuleCompatibility?: number; // CCS 점수
  createdAt: string;
}

interface MatchedIngredient {
  name: string; // 원본 OCR 텍스트
  normalizedName: string; // 정규화된 이름
  inciName: string | null; // INCI 명칭
  ewgGrade: number | null; // EWG 등급 (1-10)
  matched: boolean; // DB 매칭 여부
}
```

---

## 3. API

```
POST /api/scan/ingredient
Body: { imageBase64: string }
Response: {
  ingredients: MatchedIngredient[];
  safetyReport: SafetyReport;
  capsuleCompatibility?: number;
}

Rate Limit: 20 req/24h/user
```

---

## 4. UI 플로우

```
1. 카메라 화면 + 성분표 가이드 오버레이
2. 촬영 → "성분 분석 중..." 로딩
3. 결과 화면:
   ┌─────────────────────────────┐
   │ 안전 등급: ⚠️ 주의           │
   │ 점수: 72/100                │
   │                             │
   │ ⛔ 위험 성분 (1개)           │
   │   레티놀 — 임신 중 주의     │
   │                             │
   │ ⚠️ 주의 성분 (2개)           │
   │   향료, 파라벤              │
   │                             │
   │ ✅ 안전 성분 (15개)          │
   │   [전체 보기]               │
   │                             │
   │ 캡슐 호환성: 85점 (A등급)   │
   │ [캡슐에 추가] [다시 스캔]   │
   └─────────────────────────────┘
4. 면책 문구 하단 표시
```

---

## 5. 테스트

| 테스트      | 내용                   | 기준       |
| ----------- | ---------------------- | ---------- |
| OCR 정확도  | 10개 제품 성분표       | 90%+ 매칭  |
| Safety 검사 | 알레르겐 포함 제품 5개 | BLOCK 100% |
| 성능        | 촬영→결과 E2E          | < 5s       |
| 오프라인    | 네트워크 끊김 시 안내  | 에러 표시  |

---

## 6. 의도적 제외

| 제외 항목                    | 이유                          | 재검토 시점            |
| ---------------------------- | ----------------------------- | ---------------------- |
| 영어 성분표 OCR              | 한국어 우선, 글로벌 확장 시   | 해외 출시 시           |
| 성분 농도 추출               | 대부분 성분표에 농도 미기재   | 제조사 API 연동 시     |
| 오프라인 OCR                 | 디바이스 모델 용량 제약       | 경량 모델 출시 시      |
| 제품 자동 식별 (바코드 없이) | 이미지만으로 제품 식별 어려움 | 제품 이미지 DB 구축 시 |

---

## 관련 문서

- [ADR-070: Safety Profile](../adr/ADR-070-safety-profile-architecture.md)
- [ADR-071: 크로스 모듈 스코어링](../adr/ADR-071-cross-module-scoring.md)
- [P-2: safety-science.md](../principles/safety-science.md)
- [SDD-SAFETY-PROFILE](./SDD-SAFETY-PROFILE.md)
- [L-1: DISCLAIMER-TEMPLATES](../legal/DISCLAIMER-TEMPLATES.md)
- [L-2: PRIVACY-DESIGN](../legal/PRIVACY-DESIGN.md)

---

**Version**: 1.0 | **Created**: 2026-03-03
