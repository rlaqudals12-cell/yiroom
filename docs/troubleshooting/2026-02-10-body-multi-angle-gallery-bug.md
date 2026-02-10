# C-1 체형 분석 갤러리 업로드 버그 + 4각도 확장

> **날짜**: 2026-02-10
> **영향 파일**: 8개 소스 + 2개 테스트 + 1개 마이그레이션
> **심각도**: 중간
> **상태**: ✅ 해결됨

---

## 1. 갤러리 업로드 버그

### 증상

체형 분석에서 정면 사진은 갤러리에서 정상 업로드되지만, 측면/후면 버튼 클릭 후 갤러리에서 사진을 선택해도 업로드가 안 됨.

### 원인

`MultiAngleBodyCapture.tsx`의 `handleFileSelect`에서 `setStep('additional')` 호출이 `currentAngle === 'front'`일 때만 실행됨.

```typescript
// 버그 코드
reader.onload = (e) => {
  const imageBase64 = e.target?.result as string;
  if (currentAngle === 'front') {
    setImages((prev) => ({ ...prev, frontImageBase64: imageBase64 }));
    setStep('additional'); // 정면일 때만 다음 단계로 전환
  } else if (currentAngle === 'side') {
    setImages((prev) => ({ ...prev, sideImageBase64: imageBase64 }));
    // setStep 호출 없음 → UI 변화 없음 → 사용자는 업로드 안 된 줄 앎
  }
};
```

측면/후면 각도에서는 이미지가 state에 저장은 되지만 `setStep`이 호출되지 않아 UI가 갱신되지 않았고, file input도 초기화되지 않아 같은 파일을 다시 선택할 수도 없었음.

### 해결

1. `ANGLE_IMAGE_KEY` Record 맵으로 각도→이미지키 매핑 통합
2. `setStep('additional')`은 정면 완료 시에만 호출 (이것은 올바른 동작 — 추가 촬영 단계로의 전환)
3. `setCapturedAngles`로 촬영 완료 상태 업데이트 (UI 갱신)
4. `fileInputRef.current.value = ''`로 file input 초기화 (재선택 허용)

```typescript
// 수정 코드
const ANGLE_IMAGE_KEY: Record<BodyAngle, keyof MultiAngleBodyImages> = {
  front: 'frontImageBase64',
  left_side: 'leftSideImageBase64',
  right_side: 'rightSideImageBase64',
  back: 'backImageBase64',
};

reader.onload = (e) => {
  const imageBase64 = e.target?.result as string;
  const imageKey = ANGLE_IMAGE_KEY[currentAngle];

  setImages((prev) => ({ ...prev, [imageKey]: imageBase64 }));
  setCapturedAngles((prev) => [...prev, currentAngle]);

  if (currentAngle === 'front') {
    setStep('additional');
  }
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};
```

### 영향 파일

- `apps/web/components/analysis/camera/MultiAngleBodyCapture.tsx`

---

## 2. 4각도 확장 (3각도 → 4각도)

### 변경 내용

기존 3각도(정면/측면/후면) 시스템을 4각도(정면/좌측면/우측면/후면)로 확장.

- 정면(필수) + 좌측면/우측면/후면(모두 선택)
- 좌우 비대칭 분석 강화 (C-1: 스타일 보완 추천)

### 변경 파일

| 파일                                                        | 변경                                   |
| ----------------------------------------------------------- | -------------------------------------- |
| `components/analysis/camera/BodyGuideOverlay.tsx`           | `BodyAngle` 타입 4값, 좌/우측면 메시지 |
| `components/analysis/camera/MultiAngleBodyCapture.tsx`      | 인터페이스 4각도 + 버그 수정           |
| `components/analysis/camera/BodyAngleSelector.tsx`          | 3버튼 UI (좌측면/우측면/후면)          |
| `supabase/migrations/20260210_body_multi_angle_columns.sql` | DB nullable 컬럼 3개                   |
| `app/api/analyze/body/route.ts`                             | 4이미지 수신/저장, 하위 호환           |
| `lib/gemini.ts`                                             | `analyzeBody` 시그니처 4파라미터       |
| `app/(main)/analysis/body/page.tsx`                         | 요청 body 4각도                        |
| `lib/db/expected-schema.ts`                                 | 스키마 검증 3컬럼 추가                 |

### 테스트 파일

| 파일                                                          | 변경         |
| ------------------------------------------------------------- | ------------ |
| `tests/components/analysis/camera/BodyGuideOverlay.test.tsx`  | 4각도 테스트 |
| `tests/components/analysis/camera/BodyAngleSelector.test.tsx` | 4각도 테스트 |

### 하위 호환

- API가 기존 `sideImageBase64` 필드를 `leftSideImageBase64`로 매핑
- DB `image_url` (NOT NULL) = 정면 이미지 (기존 데이터 안전)
- 새 3개 컬럼은 모두 nullable

### DB 마이그레이션

```sql
ALTER TABLE body_analyses
  ADD COLUMN IF NOT EXISTS left_side_image_url TEXT,
  ADD COLUMN IF NOT EXISTS right_side_image_url TEXT,
  ADD COLUMN IF NOT EXISTS back_image_url TEXT;
```

**원격 Supabase에 수동 적용 필요.**

---

## 교훈

1. **파일 업로드 핸들러에서 모든 분기의 UI 갱신 확인**: state만 업데이트하고 UI 전환(setStep 등)을 누락하면 사용자 관점에서 "동작 안 함"으로 보임
2. **file input 초기화 필수**: `input.value = ''`로 리셋하지 않으면 같은 파일 재선택 불가
3. **Record 맵으로 조건 분기 대체**: 3-way/4-way 조건문 대신 `Record<BodyAngle, keyof T>` 매핑이 확장에 유리하고 버그 위험 감소
