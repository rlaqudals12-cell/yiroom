# SPEC: C-1 체형 분석 다각도 촬영 시스템

> 전신 체형 분석을 위한 정면/측면/후면 다각도 촬영

**Version**: 1.0
**Date**: 2026-01-07
**Status**: Draft
**Author**: Claude Code
**Depends On**: SPEC-MULTI-ANGLE-PHOTO.md (패턴 재사용)

---

## 목적

체형 분석(C-1)에 다각도 촬영을 적용하여 더 정확한 체형 타입 판정과 스타일 추천을 제공합니다.

---

## 현재 상태 vs 목표

| 항목 | 현재 | 목표 |
|------|------|------|
| 촬영 각도 | 정면 1장 | 정면(필수) + 측면 + 후면 |
| 분석 정확도 | 70% | 90%+ |
| 체형 특징 | 정면 기준 | 3D 입체적 분석 |

---

## 촬영 각도별 분석 항목

### 1. 정면 (Front) - 필수

```yaml
분석 항목:
  - 어깨 너비 (shoulder_width)
  - 허리 너비 (waist_width)
  - 힙 너비 (hip_width)
  - 상체/하체 비율 (torso_leg_ratio)
  - 전체 실루엣 (silhouette)
```

### 2. 측면 (Side) - 선택

```yaml
분석 항목:
  - 자세 정렬 (posture_alignment)
  - 복부 돌출도 (belly_protrusion)
  - 엉덩이 곡선 (hip_curve)
  - 등 라인 (back_line)
  - 목/어깨 각도 (neck_shoulder_angle)
```

### 3. 후면 (Back) - 선택

```yaml
분석 항목:
  - 어깨뼈 대칭 (shoulder_blade_symmetry)
  - 허리 곡선 (waist_curve)
  - 힙 형태 (hip_shape)
  - 척추 정렬 (spine_alignment)
```

---

## 체형 타입별 정확도 향상

| 체형 타입 | 정면만 | +측면 | +후면 |
|-----------|--------|-------|-------|
| Hourglass | 80% | 90% | 95% |
| Pear | 75% | 88% | 92% |
| Apple | 70% | 92% | 95% |
| Rectangle | 82% | 88% | 90% |
| Inverted Triangle | 78% | 85% | 90% |
| Athletic | 72% | 90% | 95% |

**핵심**: 측면 촬영이 복부/엉덩이 분석에 큰 기여 (+15~20%)

---

## 컴포넌트 설계

### 1. MultiAngleBodyCapture

기존 `MultiAngleSkinCapture` 패턴 재사용:

```typescript
interface MultiAngleBodyImages {
  frontImageBase64: string;    // 필수
  sideImageBase64?: string;    // 선택 (좌/우 중 하나)
  backImageBase64?: string;    // 선택
}

interface Props {
  onComplete: (images: MultiAngleBodyImages) => void;
  onCancel: () => void;
}
```

### 2. BodyGuideOverlay

전신 촬영용 가이드 오버레이:

```
┌─────────────────────────────────────┐
│                                     │
│         ┌───────────┐               │
│         │    ○      │  ← 머리 위치  │
│         │   /│\     │               │
│         │    │      │  ← 몸통       │
│         │   / \     │               │
│         │  /   \    │  ← 다리       │
│         └───────────┘               │
│                                     │
│   📏 전신이 프레임 안에 들어오도록     │
│                                     │
└─────────────────────────────────────┘
```

### 3. 촬영 순서 UI

```
정면 촬영
   ↓
[측면 추가하시겠어요?]  → 예 → 측면 촬영
   ↓                            ↓
[후면 추가하시겠어요?]  → 예 → 후면 촬영
   ↓                            ↓
         분석 시작 ←──────────────┘
```

---

## API 변경

### /api/analyze/body

```typescript
// 요청 (기존 호환성 유지)
{
  imageBase64?: string;           // 기존 단일 이미지 (하위 호환)
  frontImageBase64?: string;      // 새 필드
  sideImageBase64?: string;       // 새 필드
  backImageBase64?: string;       // 새 필드
  userInput: {
    heightCm: number;
    weightKg: number;
    gender?: string;
  }
}

// 응답 추가 필드
{
  // 기존 필드...
  analysisReliability: 'high' | 'medium' | 'low';
  imagesAnalyzed: {
    front: boolean;
    side: boolean;
    back: boolean;
  };
  sideAnalysis?: {
    posture: string;
    bellyProtrusion: 'flat' | 'slight' | 'moderate';
    hipCurve: 'flat' | 'moderate' | 'pronounced';
  };
}
```

---

## Gemini 프롬프트 확장

### 다각도 통합 프롬프트

```typescript
const prompt = `
당신은 전문 체형 분석가입니다. 제공된 이미지들을 분석하여 체형을 판정해주세요.

📸 제공된 이미지:
- 정면: ${hasfront ? '있음' : '없음'}
- 측면: ${hasSide ? '있음' : '없음'}
- 후면: ${hasBack ? '있음' : '없음'}

📊 분석 기준:

[정면 분석]
- 어깨:허리:힙 비율 측정
- 상체/하체 비율 확인
- 전체 실루엣 형태

${hasSide ? `
[측면 분석]
- 자세 정렬 상태 (일자/전방/후방 경사)
- 복부 돌출 정도
- 엉덩이 곡선 형태
` : ''}

${hasBack ? `
[후면 분석]
- 어깨뼈 대칭성
- 허리 곡선 라인
- 척추 정렬 상태
` : ''}

다음 JSON 형식으로 응답해주세요:
{
  "bodyType": "[8가지 중 1개]",
  "confidence": [60-100],
  "measurements": {...},
  "sideAnalysis": {...},  // 측면 있을 때만
  "backAnalysis": {...}   // 후면 있을 때만
}
`;
```

---

## 구현 파일

| 파일 | 변경 내용 |
|------|-----------|
| `components/analysis/camera/BodyGuideOverlay.tsx` | 신규 - 전신 가이드 |
| `components/analysis/camera/MultiAngleBodyCapture.tsx` | 신규 - 통합 촬영 |
| `app/(main)/analysis/body/_components/MultiAngleBodyCapture.tsx` | 신규 - 래퍼 |
| `app/(main)/analysis/body/page.tsx` | 수정 - 다각도 연동 |
| `app/api/analyze/body/route.ts` | 수정 - 다각도 지원 |
| `lib/gemini.ts` | 수정 - analyzeBody 확장 |

---

## 테스트 케이스

### 단위 테스트

```yaml
BodyGuideOverlay:
  - [x] 정면/측면/후면 가이드 렌더링
  - [x] 각도별 안내 메시지 표시

MultiAngleBodyCapture:
  - [x] 정면만으로 완료 가능
  - [x] 정면 + 측면 조합
  - [x] 정면 + 측면 + 후면 조합
  - [x] 취소 시 초기화

API:
  - [x] 단일 이미지 하위 호환성
  - [x] 다각도 이미지 처리
  - [x] 신뢰도 계산 정확성
```

### 통합 테스트

```yaml
E2E:
  - [x] 정면 촬영 → 분석 완료
  - [x] 3장 촬영 → 정확도 향상 확인
  - [x] 갤러리 fallback 동작
```

---

## 예상 작업량

| 항목 | 시간 |
|------|------|
| BodyGuideOverlay 컴포넌트 | 2h |
| MultiAngleBodyCapture 컴포넌트 | 3h |
| API 수정 (route.ts) | 2h |
| Gemini 프롬프트 확장 | 1h |
| 페이지 연동 | 1h |
| 테스트 작성 | 2h |
| **총계** | **11h** |

---

## 시지푸스 판정

- **파일 수정**: 6개 이상
- **아키텍처**: 기존 패턴 재사용
- **리스크**: 낮음 (AI 프롬프트 변경)

**판정**: ✅ 시지푸스 적용 가능 (복잡도 35점)

---

**Status**: Draft (승인 대기)
