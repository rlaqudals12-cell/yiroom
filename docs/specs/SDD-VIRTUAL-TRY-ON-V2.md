# SDD-VIRTUAL-TRY-ON-V2: 가상 시착 확장 스펙 v2

> **Version**: 2.0 | **Created**: 2026-03-03 | **Status**: Draft
> **Author**: Claude Code
> **기반**: ADR-072, [기존 SDD-VIRTUAL-TRY-ON-EXTENSION v1.0](./SDD-VIRTUAL-TRY-ON-EXTENSION.md)

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"메이크업, 헤어컬러, 패션 실루엣을 실시간으로 가상 시착하여
캡슐 아이템 선택 전 미리 확인하는 통합 시착 플랫폼"

### 100점 기준

| 지표             | 100점           | 현재 목표 |
| ---------------- | --------------- | --------- |
| L1 메이크업 (립) | 자연스러운 합성 | 60%       |
| L2 헤어컬러      | 자연스러운 염색 | 40%       |
| L3 패션 실루엣   | 체형 맞춤 합성  | 0% (향후) |
| 합성 지연        | < 200ms         | < 500ms   |

### 현재 목표: 35%

---

## 1. L1: 메이크업 가상 시착

### 1.1 기능 (기존 v1 확장)

```
지원 메이크업:
  - 립스틱: Mediapipe 48~67 랜드마크 기반 마스킹
  - 블러셔: 볼 영역 랜드마크 기반 (신규)
  - 아이섀도: 눈 영역 랜드마크 기반 (향후)

합성 공식:
  output = original × (1 - α) + makeupColor × α
  α = 0.6 (립), 0.3 (블러셔), 0.4 (아이섀도)
```

### 1.2 기존 자산 재사용

```
lib/analysis/canvas-utils.ts:
  - getConstrainedCanvasSize() → 이미지 리사이즈
  - MAX_CANVAS_SIZE = 1024px

PC-1 드레이핑 시뮬레이션:
  - Canvas 2D 합성 파이프라인
  - 색상 블렌딩 로직
```

### 1.3 API

```
POST /api/fitting/makeup
Body: {
  imageBase64: string;       // 사용자 얼굴 이미지
  productId: string;         // 제품 ID
  makeupType: 'lip' | 'blush' | 'eyeshadow';
  color: string;             // HEX 색상 코드
  opacity?: number;          // α 오버라이드 (0-1)
}
Response: {
  resultImage: string;       // 합성 결과 base64
  landmarks: number[][];     // 사용된 랜드마크
  processingMs: number;
}
```

---

## 2. L2: 헤어컬러 시뮬레이션

### 2.1 기능

```
지원:
  - 단색 헤어컬러 변경
  - HSL 채널 시프트 방식
  - 경계 블러링 (feather 3px)

기술 스택:
  - @mediapipe/selfie_segmentation (헤어 마스크)
  - Canvas 2D HSL 시프트
  - 번들 영향: ~2MB 추가

제약:
  - 그라데이션/하이라이트 미지원 (L3)
  - 짧은 머리/대머리 감지 후 비활성화
```

### 2.2 API

```
POST /api/fitting/hair-color
Body: {
  imageBase64: string;
  targetColor: string;       // HEX 색상
}
Response: {
  resultImage: string;
  hairMaskConfidence: number; // 마스크 신뢰도 (0-1)
  processingMs: number;
}
```

---

## 3. 캡슐 연동

### 3.1 시착 플로우

```
1. Daily Capsule 또는 캡슐 상세에서 아이템 선택
2. "시착해보기" 버튼
3. 아이템 타입에 따라 적절한 엔진 호출:
   - cosmetic_lip → L1 립 합성
   - cosmetic_blush → L1 블러셔 합성
   - hair_color → L2 헤어 시뮬레이션
   - fashion → "준비 중" 표시 (L3)
4. Before/After 비교 뷰
5. "캡슐에 추가" 또는 "다른 색상 시도"
```

### 3.2 인터페이스

```typescript
interface VirtualFittingEngine<T extends FittableItem> {
  canFit(item: T): boolean;
  fit(imageBase64: string, item: T): Promise<FittingResult>;
  getRequiredLandmarks(item: T): LandmarkType[];
}

interface FittingResult {
  resultImage: string;
  processingMs: number;
  confidence: number;
}

type FittableItem = {
  id: string;
  type: 'cosmetic_lip' | 'cosmetic_blush' | 'hair_color' | 'fashion';
  color?: string; // fashion 타입은 색상 불필요할 수 있음
};
```

---

## 4. 성능 최적화

| 플랫폼      | 전략                          | 목표    |
| ----------- | ----------------------------- | ------- |
| 웹 (고사양) | Canvas 2D + OffscreenCanvas   | < 300ms |
| 웹 (저사양) | 서버사이드 폴백               | < 1.5s  |
| 모바일      | expo-image-manipulator + 서버 | < 1s    |

### 번들 최적화

```
@mediapipe/selfie_segmentation: ~2MB
  → L2 진입 시 dynamic import (코드 스플리팅)
  → L1만 사용하는 경우 로드 안 함
```

---

## 5. 테스트

| 테스트         | 내용                    | 기준         |
| -------------- | ----------------------- | ------------ |
| L1 립 합성     | 5개 피부톤 × 5개 립색상 | SSIM > 0.9   |
| L2 헤어 마스크 | 10개 헤어 스타일        | IoU > 0.8    |
| 성능           | 1024px 이미지 합성      | < 500ms (웹) |
| 캡슐 연동      | 시착 → 캡슐 추가 플로우 | E2E 통과     |

---

## 6. 의도적 제외

| 제외 항목                  | 이유                            | 재검토 시점               |
| -------------------------- | ------------------------------- | ------------------------- |
| L3 패션 실루엣 합성        | 체형 맞춤 3D 렌더링 기술 미성숙 | Phase N (AR 기술 성숙 시) |
| 그라데이션/하이라이트 헤어 | 복잡한 마스킹 필요              | L2 안정화 후              |
| 아이섀도 시착              | 눈 영역 정밀 랜드마크 추가 필요 | L1 립/블러셔 안정화 후    |
| AR 실시간 시착             | 모바일 성능 제약                | 디바이스 성능 향상 시     |

---

## 관련 문서

- [ADR-072: 가상 피팅 확장](../adr/ADR-072-virtual-fitting-extension.md)
- [기존 SDD-VIRTUAL-TRY-ON-EXTENSION](./SDD-VIRTUAL-TRY-ON-EXTENSION.md) — v1 스펙
- [원리: image-processing.md](../principles/image-processing.md) — Canvas 합성

---

**Version**: 2.0 | **Created**: 2026-03-03
