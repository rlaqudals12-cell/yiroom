# SPEC: S-1 페이지 다각도 촬영 연동

> 기존 S-1 피부 분석 페이지에 다각도 촬영 시스템 연동

**Version**: 1.0
**Date**: 2026-01-09
**Status**: Draft
**Author**: Claude Code
**Depends On**: SPEC-MULTI-ANGLE-PHOTO.md

---

## 목적

구현된 `MultiAngleSkinCapture` 컴포넌트를 S-1 피부 분석 페이지에 실제 연동하여 사용자가 다각도 촬영을 통해 정확한 피부 분석을 받을 수 있도록 합니다.

---

## 현재 상태

### 구현 완료 (SPEC-MULTI-ANGLE-PHOTO)

- `MultiAngleSkinCapture` 컴포넌트 ✅
- `/api/validate/face-image` API ✅
- `/api/analyze/skin` 다각도 지원 ✅

### 미연동 상태

- `app/(main)/analysis/skin/page.tsx` - 기존 단일 이미지 플로우 사용 중

---

## 변경 범위

### 1. S-1 페이지 플로우 변경

```
[현재]
LightingGuide → PhotoUpload (단일) → API 호출 → 결과

[변경]
LightingGuide → MultiAngleSkinCapture → API 호출 → 결과
                 ↓
         정면(필수) + 좌/우(선택)
```

### 2. 수정 파일

| 파일                                | 변경 내용                                |
| ----------------------------------- | ---------------------------------------- |
| `app/(main)/analysis/skin/page.tsx` | PhotoUpload → MultiAngleSkinCapture 교체 |
| `_components/PhotoUpload.tsx`       | 유지 (갤러리 업로드용 fallback)          |

---

## 구현 명세

### 1. page.tsx 수정

```typescript
// 기존
import PhotoUpload from './_components/PhotoUpload';

// 변경
import MultiAngleSkinCapture from './_components/MultiAngleSkinCapture';

// 촬영 완료 핸들러
const handleCaptureComplete = async (images: MultiAngleImages) => {
  setIsAnalyzing(true);

  const response = await fetch('/api/analyze/skin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      frontImageBase64: images.frontImageBase64,
      leftImageBase64: images.leftImageBase64,
      rightImageBase64: images.rightImageBase64,
    }),
  });

  // 결과 처리...
};
```

### 2. 촬영 모드 선택 UI (선택 사항)

```
┌─────────────────────────────────────┐
│                                     │
│   피부 분석을 위한 사진이 필요해요    │
│                                     │
│   ┌─────────────┐ ┌─────────────┐   │
│   │  📷 촬영    │ │  🖼️ 갤러리  │   │
│   │  (다각도)   │ │  (단일)     │   │
│   └─────────────┘ └─────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 3. 상태 관리

```typescript
type CaptureMode = 'select' | 'camera' | 'gallery';
const [captureMode, setCaptureMode] = useState<CaptureMode>('select');
```

---

## API 호출 변경

### 기존 (단일 이미지)

```typescript
{
  imageBase64: 'data:image/jpeg;base64,...';
}
```

### 변경 (다각도)

```typescript
{
  frontImageBase64: "data:image/jpeg;base64,...",  // 필수
  leftImageBase64: "data:image/jpeg;base64,...",   // 선택
  rightImageBase64: "data:image/jpeg;base64,..."   // 선택
}
```

---

## 테스트 케이스

### 페이지 테스트

- [ ] 촬영 모드에서 MultiAngleSkinCapture 렌더링
- [ ] 정면만 촬영 후 분석 가능
- [ ] 3장 모두 촬영 후 분석 가능
- [ ] 취소 시 모드 선택으로 복귀

### 통합 테스트

- [ ] 촬영 → API 호출 → 결과 페이지 이동
- [ ] 갤러리 모드 fallback 동작

---

## 구현 순서

1. page.tsx에 모드 선택 UI 추가
2. camera 모드에서 MultiAngleSkinCapture 렌더링
3. 촬영 완료 시 API 호출 연동
4. 결과 페이지로 리다이렉트
5. 테스트 작성

---

## 예상 작업량

- 예상 파일 수: 2-3개
- 복잡도: 낮음 (컴포넌트 교체 수준)

---

**Approved by**: (승인 대기)
