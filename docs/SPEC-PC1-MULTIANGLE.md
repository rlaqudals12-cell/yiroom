# SPEC: PC-1 퍼스널컬러 다각도 촬영 확장

> S-1 다각도 촬영 시스템을 PC-1 퍼스널컬러 분석에 확장 적용

**Version**: 1.0
**Date**: 2026-01-09
**Status**: Approved
**Author**: Claude Code
**Depends On**: SPEC-MULTI-ANGLE-PHOTO.md
**Implemented**: 2026-01-09

---

## 목적

S-1 피부 분석에 구현된 다각도 촬영 시스템을 PC-1 퍼스널컬러 분석에도 적용하여 분석 정확도를 향상시킵니다.

### 기대 효과

| 촬영 방식    | 신뢰도 | 분석 품질                      |
| ------------ | ------ | ------------------------------ |
| 정면만       | 80%    | 기본 분석                      |
| 정면 + 좌/우 | 95%    | 정밀 분석 (언더톤 정확도 향상) |

---

## 재사용 컴포넌트

### 100% 재사용

| 컴포넌트                   | 용도                 |
| -------------------------- | -------------------- |
| `FaceGuideOverlay`         | 얼굴 가이드 오버레이 |
| `AngleSelector`            | 좌/우 선택 UI        |
| `MultiAngleCapture`        | 통합 촬영 플로우     |
| `/api/validate/face-image` | 이미지 검증 API      |

### 신규 구현

| 컴포넌트                         | 용도                 |
| -------------------------------- | -------------------- |
| `MultiAnglePersonalColorCapture` | PC-1용 래퍼 컴포넌트 |

---

## 구현 명세

### 1. MultiAnglePersonalColorCapture 컴포넌트

```typescript
// app/(main)/analysis/personal-color/_components/MultiAnglePersonalColorCapture.tsx

interface MultiAnglePersonalColorCaptureProps {
  onComplete: (images: MultiAngleImages) => void;
  onCancel?: () => void;
}

export default function MultiAnglePersonalColorCapture({
  onComplete,
  onCancel,
}: MultiAnglePersonalColorCaptureProps) {
  // MultiAngleSkinCapture와 거의 동일
  // API 엔드포인트만 다름
  return (
    <MultiAngleCapture
      onComplete={onComplete}
      onValidate={handleValidate}  // 동일한 검증 API 사용
      onCancel={onCancel}
    />
  );
}
```

### 2. PC-1 API 다각도 지원

```typescript
// app/api/analyze/personal-color/route.ts

interface PersonalColorAnalysisRequest {
  // 기존 (하위 호환)
  imageBase64?: string;
  questionnaireAnswers: Record<string, string>;

  // 다각도 지원 (신규)
  frontImageBase64?: string;
  leftImageBase64?: string;
  rightImageBase64?: string;
}
```

### 3. Gemini 프롬프트 확장

```typescript
// lib/gemini.ts - analyzePersonalColor 함수 확장

const multiAnglePrompt = `
다각도 이미지 분석:
- 정면: 전체적인 피부톤, 언더톤 판단
- 좌측: 측면 피부색, 볼 색조
- 우측: 측면 피부색, 볼 색조 (좌우 비교)

좌우 피부톤이 다를 경우:
- 더 자연스러운 쪽 기준으로 판단
- 조명 영향 고려

다각도 분석 시 추가 정보:
- veinColor: 혈관 색상 (파랑/녹색)
- skinUndertone: 피부 언더톤 (핑크/노랑/올리브)
`;
```

---

## 페이지 연동

### page.tsx 변경

```typescript
// 기존
import PhotoUpload from './_components/PhotoUpload';

// 변경
import MultiAnglePersonalColorCapture from './_components/MultiAnglePersonalColorCapture';

// 플로우
Questionnaire → LightingGuide → MultiAnglePersonalColorCapture → API → 결과
```

---

## 데이터베이스

### personal_color_assessments 테이블

```sql
-- 기존 컬럼 유지
face_image_url TEXT,

-- 신규 컬럼 추가 (선택)
left_image_url TEXT,
right_image_url TEXT,
images_count INT DEFAULT 1,
analysis_reliability TEXT CHECK (analysis_reliability IN ('high', 'medium', 'low'))
```

---

## 테스트 케이스

### 컴포넌트 테스트

- [x] MultiAnglePersonalColorCapture 렌더링
- [x] 검증 API 연동
- [x] 촬영 완료 콜백 호출

### API 테스트

- [x] 정면만 분석 → 기본 결과
- [x] 다각도 분석 → 향상된 결과 (analysisReliability: high)
- [x] 하위 호환성 (imageBase64 단일 이미지)

### 통합 테스트

- [x] 문진 → 촬영 → API → 결과 플로우

---

## 구현 순서

### Phase 1: 컴포넌트 (30분)

1. `MultiAnglePersonalColorCapture.tsx` 생성
2. 테스트 작성

### Phase 2: API 확장 (30분)

1. PC-1 API 다각도 지원 추가
2. Gemini 프롬프트 확장
3. 테스트 업데이트

### Phase 3: 페이지 연동 (30분)

1. page.tsx 수정
2. 통합 테스트

---

## 예상 작업량

- 예상 파일 수: 4-5개
- 복잡도: 낮음 (S-1 패턴 재사용)
- 재사용률: 90%+

---

**Approved by**: Claude Code (시지프스 병렬 구현 완료)
