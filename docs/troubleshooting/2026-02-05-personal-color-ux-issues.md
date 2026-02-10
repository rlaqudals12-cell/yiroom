# 퍼스널컬러 분석 UX 이슈 트러블슈팅

> **날짜**: 2026-02-05
> **영향 파일**: GalleryMultiAngleUpload.tsx, MultiAngleCapture.tsx, route.ts (personal-color API)
> **심각도**: 중간 (UX 영향) → 높음 (DB 저장 실패)
> **상태**: ✅ 해결됨
> **세션 ID**: 75ea917b-9812-4329-981c-6bfc18b3f471

---

## 1. 좌/우 사진 카드 크기 문제

### 발생 시간

2026-02-05 오전 (세션 초반)

### 증상

추가 각도 (좌측/우측) 사진 선택 카드가 너무 작게 표시됨.

### 재현 단계

1. `/analysis/personal-color` 페이지 접속
2. 정면 사진 촬영/업로드 완료
3. 좌측/우측 추가 각도 카드 확인
4. 카드 크기가 작아 터치/클릭 어려움 확인

### 원인

이전 세션에서 수정한 카드 크기가 롤백되어 `max-w-[140px]`로 복원됨.

### 관련 커밋

- 관련 기능 구현: `4b07646` (feat(web): 퍼스널컬러 결과 카드 UI 개선)

### 해결

```diff
- <div key={angle} className="flex-1 max-w-[140px]">
+ <div key={angle} className="flex-1 max-w-[180px]">
```

### 영향 파일

- `apps/web/app/(main)/analysis/personal-color/_components/GalleryMultiAngleUpload.tsx`
- `apps/web/components/analysis/camera/MultiAngleCapture.tsx`

### 교훈

- 여러 파일에 동일한 변경을 적용할 때 모든 파일이 업데이트되었는지 확인 필요
- 컴포넌트 간 일관성 유지를 위해 공통 상수 또는 공유 스타일 고려

---

## 2. 레이아웃 정렬 변경 문제

### 발생 시간

2026-02-05 오전 (이슈 #1 수정 직후)

### 증상

좌/우 카드가 중앙 정렬 대신 좌측 정렬로 변경됨.

### 재현 단계

1. `/analysis/personal-color` 페이지 접속
2. 정면 사진 촬영/업로드 완료
3. 좌측/우측 추가 각도 카드 섹션 확인
4. 카드가 좌측 정렬되어 있음 확인 (중앙 정렬 아님)

### 원인

카드 크기 수정 시 의도치 않게 `justify-center` 클래스가 제거됨:

### 관련 커밋

- 이슈 #1과 동일한 수정 과정에서 발생

```diff
- <div className="flex gap-3 justify-center">
+ <div className="flex gap-4 px-4">  // justify-center 누락!
```

### 해결

```diff
- <div className="flex gap-4 px-4">
+ <div className="flex gap-4 justify-center">
```

### 영향 파일

- `apps/web/app/(main)/analysis/personal-color/_components/GalleryMultiAngleUpload.tsx`
- `apps/web/components/analysis/camera/MultiAngleCapture.tsx`

### 교훈

- CSS 클래스 변경 시 기존 레이아웃 클래스 유지 여부 확인 필수
- 변경 전후 UI 비교 테스트 권장
- 레이아웃 관련 클래스(`flex`, `justify-*`, `items-*`)는 특히 주의

---

## 3. AI 분석 실패 오류

### 발생 시간

2026-02-05 오전 (기능 점검 중)

### 증상

퍼스널컬러 분석 시 "AI 분석 실패" 오류 메시지 표시.

### 재현 단계

1. `/analysis/personal-color` 페이지 접속
2. 정면 + 좌/우 사진 업로드 완료
3. "분석 시작" 버튼 클릭
4. 로딩 후 "AI 분석 실패" 에러 메시지 표시

### 원인

Mock Fallback이 비활성화되어 있어 AI API 호출 실패 시 에러 반환:

### 관련 커밋

- Mock 설정: `.env.local` 파일 (버전 관리 제외)
- API 로직: `apps/web/app/api/analyze/personal-color/route.ts`

```typescript
// apps/web/app/api/analyze/personal-color/route.ts (305-316행)
// 신뢰성 문제로 랜덤 Mock Fallback 금지 - 에러를 사용자에게 전달
return NextResponse.json(
  { error: 'AI 분석 실패', message: errorMessage, retryable: true },
  { status: 503 }
);
```

### 해결

테스트 기간 동안 Mock 데이터 활성화:

```bash
# apps/web/.env.local
FORCE_MOCK_AI=true
```

### 영향 파일

- `apps/web/.env.local`
- `apps/web/app/api/analyze/personal-color/route.ts`

### 교훈

- 전체 기능 점검 시 `FORCE_MOCK_AI=true` 설정 권장
- 프로덕션에서는 `FORCE_MOCK_AI=false` 유지
- Mock Fallback vs 에러 반환 정책은 ADR-007 참조

---

## 4. 드레이핑 기능 체크박스 혼동

### 발생 시간

2026-02-05 오전 (기능 점검 중 발견)

### 증상

분석 화면에 "드레이핑 시뮬레이션용 이미지 저장 동의" 체크박스 표시되어 사용자 혼란.

### 재현 단계

1. `/analysis/personal-color` 페이지 접속
2. 분석 화면 하단 확인
3. "드레이핑 시뮬레이션용 이미지 저장 동의" 체크박스 발견
4. 해당 기능의 용도가 불명확하여 혼란

### 원인

드레이핑 기능이 PC-1 결과 페이지에 구현되어 있으며, 이미지 저장 동의가 필요함.

### 관련 커밋

- 드레이핑 구현: `753164d` (feat(web): 홈 컴포넌트 구조 개선) 근처
- 관련 파일: `apps/web/components/analysis/visual/DrapingSimulationTab.tsx`

### 해결

드레이핑 기능 용도 문서화:

- **PC-1 (퍼스널컬러)**: 드레이프 색상이 피부에 반사되는 효과 시뮬레이션
- **S-1 (피부 분석)**: 스킨케어 후 예상 효과 시뮬레이션 (별도 기능)

### 영향 파일

- `apps/web/components/analysis/visual/DrapingSimulationTab.tsx`
- `apps/web/lib/analysis/after-simulation.ts`

### 교훈

- 기능 목적과 사용 위치를 명확히 문서화
- 사용자 동의 UI는 기능과 함께 설명 필요

---

## 5. DB 스키마 불일치로 인한 500 에러 (분석 저장 실패)

### 발생 시간

2026-02-05 오후 (기능 점검 중)

### 증상

퍼스널컬러 분석 완료 후 "Failed to save analysis" 500 에러 발생. 분석은 정상 수행되나 결과 저장 실패.

### 재현 단계

1. `/analysis/personal-color` 페이지 접속
2. 이미지 저장 동의 체크 (필수)
3. 정면 + 좌/우 사진 업로드 완료
4. "분석 시작" 버튼 클릭
5. Mock 분석 성공 후 DB 저장 시 500 에러

### 에러 메시지

```
Database insert error: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'images_count' column of 'personal_color_assessments' in the schema cache"
}
```

### 원인

마이그레이션 파일 `20260113_pc_multi_angle_columns.sql`이 **로컬에만 적용**되고 **클라우드 Supabase에는 미적용**됨.

API 코드가 존재하지 않는 컬럼들에 insert 시도:

- `left_image_url` ❌
- `right_image_url` ❌
- `images_count` ❌
- `analysis_reliability` ❌

### 관련 파일

- 마이그레이션: `supabase/migrations/20260113_pc_multi_angle_columns.sql`
- API: `apps/web/app/api/analyze/personal-color/route.ts`

### 해결

**즉시 해결 (코드 수정)**:

```diff
// apps/web/app/api/analyze/personal-color/route.ts (DB insert 부분)
- left_image_url: leftImageUrl,
- right_image_url: rightImageUrl,
- images_count: imagesCount,
+ // 다각도 컬럼 제외 (마이그레이션 적용 후 복원 필요):
+ // left_image_url: leftImageUrl,
+ // right_image_url: rightImageUrl,
+ // images_count: imagesCount,
```

다각도 이미지 정보는 `image_analysis` JSONB 필드에 보존됨.

**근본 해결 (DB 마이그레이션)** - 클라우드 Supabase에 적용 필요:

```sql
ALTER TABLE personal_color_assessments
  ADD COLUMN IF NOT EXISTS left_image_url TEXT,
  ADD COLUMN IF NOT EXISTS right_image_url TEXT,
  ADD COLUMN IF NOT EXISTS images_count INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS analysis_reliability TEXT DEFAULT 'medium'
    CHECK (analysis_reliability IN ('high', 'medium', 'low'));
```

### 교훈

- 로컬 마이그레이션 적용 후 **클라우드 DB 동기화 필수**
- API 코드 변경 시 **DB 스키마 존재 여부 확인**
- 다각도 분석 같은 새 기능은 마이그레이션 적용 상태 체크 필요
- 마이그레이션 체크리스트에 "클라우드 적용 여부" 항목 추가 권장

### 이전 테스트 성공 이유

이전 테스트에서 결과 페이지가 표시된 이유:

1. **이미지 저장 동의 미체크**: 동의하지 않으면 DB insert가 스킵되어 분석 결과만 반환
2. **로컬 DB 사용**: 로컬 Supabase에서는 마이그레이션이 적용되어 있었음

---

## 6. users 테이블 face_image_url 컬럼 불일치

### 발생 시간

2026-02-05 오후 (이슈 #5 수정 후)

### 증상

퍼스널컬러 분석 완료 후 users 테이블 업데이트 시 500 에러 발생. 분석 저장은 성공하나 사용자 프로필 동기화 실패.

### 에러 메시지

```
[PC-1] Failed to sync to users table: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'face_image_url' column of 'users' in the schema cache"
}
```

### 재현 단계

1. `/analysis/personal-color` 페이지 접속
2. 이미지 저장 동의 체크
3. 정면 + 좌/우 사진 업로드 완료
4. "분석 시작" 버튼 클릭
5. 분석 완료 후 users 테이블 동기화 시 에러

### 원인

API 코드에서 `users` 테이블에 `face_image_url` 컬럼이 있다고 가정하고 업데이트 시도:

```typescript
// apps/web/app/api/analyze/personal-color/route.ts (473-482행)
const { error: userUpdateError } = await supabase
  .from('users')
  .update({
    latest_pc_assessment_id: data.id,
    personal_color_season: season,
    personal_color_undertone: undertone,
    face_image_url: faceImageUrl, // ❌ users 테이블에 없는 컬럼!
  })
  .eq('clerk_user_id', userId);
```

**설계 의도**: `face_image_url`은 `personal_color_assessments` 테이블에만 존재함. 각 분석마다 다른 이미지를 사용할 수 있으므로 users 테이블에 복사할 필요 없음.

### 관련 파일

- API: `apps/web/app/api/analyze/personal-color/route.ts`
- 스키마: `supabase/migrations/` (users 테이블 정의)

### 해결

**코드 수정** (적용됨):

```diff
// apps/web/app/api/analyze/personal-color/route.ts (473-482행)
+ // 주의: face_image_url 컬럼은 users 테이블에 존재하지 않음
+ // 얼굴 이미지 URL은 personal_color_assessments.face_image_url에만 저장됨
const { error: userUpdateError } = await supabase
  .from('users')
  .update({
    latest_pc_assessment_id: data.id,
    personal_color_season: season,
    personal_color_undertone: undertone,
-   face_image_url: faceImageUrl,
  })
  .eq('clerk_user_id', userId);
```

### 영향 파일

- `apps/web/app/api/analyze/personal-color/route.ts`

### 교훈

- **테이블 간 컬럼 혼동 주의**: 비슷한 이름의 컬럼이 다른 테이블에 있을 수 있음
- API 코드에서 테이블 업데이트 시 **해당 테이블의 실제 스키마 확인**
- `personal_color_assessments.face_image_url` ≠ `users.face_image_url` (후자는 존재하지 않음)

### 이슈 #5와의 관계

이슈 #5 (personal_color_assessments 컬럼 불일치) 수정 후에도 별도의 users 테이블 관련 에러가 남아있었음. 두 이슈는 별개의 테이블 스키마 문제.

---

## 7. Canvas 요소로 인한 레이아웃 높이 폭발 (height: 28558px)

### 발생 시간

2026-02-05 오후 (퍼스널컬러 결과 페이지 점검 중)

### 증상

퍼스널컬러 분석 결과 페이지에서 computed height가 28558px로 과도하게 커져 레이아웃 깨짐.

### 재현 단계

1. `/analysis/personal-color/result/[id]` 페이지 접속
2. 드레이프 시뮬레이터 또는 히트맵 탭 확인
3. DevTools Elements 패널에서 computed height 확인
4. 28558px 등 비정상적으로 큰 높이값 발견

### 원인

Canvas 요소가 이미지의 `naturalWidth`/`naturalHeight`를 intrinsic 크기로 설정하는데, CSS로 부모 컨테이너에 constrain하지 않아 레이아웃 계산에 영향:

```typescript
// 문제 코드 (DrapeSimulator.tsx, SkinHeatmapCanvas.tsx)
canvas.width = image.naturalWidth || image.width; // 예: 4032px
canvas.height = image.naturalHeight || image.height; // 예: 5376px
```

CSS `w-full h-full object-contain`만으로는 canvas의 intrinsic dimensions이 부모 컨테이너 크기 계산에 영향을 줌.

### 관련 파일

- `apps/web/components/analysis/visual/DrapeSimulator.tsx`
- `apps/web/components/analysis/visual/SkinHeatmapCanvas.tsx`

### 해결

Canvas 요소에 `absolute inset-0` 추가하여 부모 컨테이너에 완전히 고정:

```diff
// DrapeSimulator.tsx (line 140-143)
- <canvas
-   ref={canvasRef}
-   className="w-full h-full object-contain"
-   aria-label="드레이프 시뮬레이션"
- />
+ {/* 캔버스 - absolute로 부모 컨테이너에 고정하여 intrinsic 크기 무시 */}
+ <canvas
+   ref={canvasRef}
+   className="absolute inset-0 w-full h-full object-contain"
+   aria-label="드레이프 시뮬레이션"
+ />

// SkinHeatmapCanvas.tsx (line 63-67)
- <canvas
-   ref={canvasRef}
-   className="w-full h-full object-contain"
-   aria-label={...}
- />
+ {/* absolute로 부모 컨테이너에 고정하여 canvas intrinsic 크기 무시 */}
+ <canvas
+   ref={canvasRef}
+   className="absolute inset-0 w-full h-full object-contain"
+   aria-label={...}
+ />
```

### 이미 올바른 패턴을 사용 중인 컴포넌트

- `FaceLandmarkHeatMap.tsx`: 이미 `absolute inset-0` 사용
- `BodyVisualization.tsx`: 고정 dimensions (300x400) 사용
- `PostureSimulator.tsx`: 고정 상수 (CANVAS_WIDTH=600, CANVAS_HEIGHT=800) 사용

### 교훈

- Canvas 요소는 `width`/`height` 속성으로 intrinsic 크기가 설정됨
- CSS만으로는 intrinsic 크기가 레이아웃 계산에 영향을 줄 수 있음
- **패턴**: 동적 크기 canvas는 `absolute inset-0`으로 부모에 고정
- **대안**: 고정 dimensions 사용 (예: `canvas.width = 1024`)

---

## 예방 체크리스트

### UI 변경 시

- [ ] 변경 전/후 스크린샷 비교
- [ ] 모바일/데스크톱 모두 확인
- [ ] 관련된 모든 컴포넌트에 동일 변경 적용
- [ ] 레이아웃 클래스 (`flex`, `justify-*`, `items-*`) 유지 확인
- [ ] Canvas 사용 시 `absolute inset-0`으로 부모에 고정 (동적 크기 canvas)

### API/환경 변수 변경 시

- [ ] `.env.local` 설정 확인
- [ ] Mock 모드 활성화 여부 확인
- [ ] 에러 핸들링 동작 테스트

### DB 스키마 변경 시

- [ ] 마이그레이션 파일 작성 완료
- [ ] 로컬 Supabase에 적용 및 테스트
- [ ] **클라우드 Supabase에 마이그레이션 적용**
- [ ] API 코드의 insert/update 필드와 DB 스키마 일치 확인

### 기능 추가 시

- [ ] 관련 ADR/스펙 문서 확인
- [ ] 사용자 동의 필요 여부 검토
- [ ] 기능 목적 및 위치 문서화

---

## 8. 드레이핑 색상 팔레트 하단 스크롤 시 색상 잘림

### 발생 시간

2026-02-06 (드레이핑 탭 점검 중)

### 증상

128색 팔레트에서 스크롤을 제일 아래로 내리면 마지막 행 색상이 잘려서 보임.

### 재현 단계

1. `/analysis/personal-color/result/[id]` 페이지 접속
2. "드레이핑" 탭 선택
3. "색상 팔레트" 탭에서 128색 그리드 확인
4. 스크롤을 맨 아래로 내림
5. 마지막 행 색상이 부분적으로 잘려서 보임

### 원인 분석 (P0-P4 제1원칙 적용)

**P0 요구사항 의심**: "128색을 스크롤로 표시해야 하는가?"

- 스크롤 컨테이너 내 128색 = UX 문제의 근본 원인
- 패딩 조정은 증상 치료, 근본 해결이 아님

**P1 궁극의 형태**: "퍼스널컬러 드레이핑의 이상적 UX는?"

- 사용자는 자신의 시즌(봄/여름/가을/겨울) 색상만 주로 사용
- 128색 전체를 한 번에 볼 필요 없음

**P4 단순화**: "더 단순한 방법은?"

- 사용자 시즌(32색)만 기본 표시 → 스크롤 불필요
- "전체 보기" 버튼으로 128색 확장 가능

### 관련 파일

- `apps/web/components/analysis/visual/DrapeColorPalette.tsx`
- `apps/web/components/analysis/visual/DrapingSimulationTab.tsx`
- `apps/web/app/(main)/analysis/personal-color/result/[id]/page.tsx`

### 해결 과정

#### 1차 시도 (실패): 패딩 미세 조정

```diff
- className="max-h-[40vh] overflow-y-auto ... p-2"
+ className="max-h-[40vh] overflow-y-auto ... p-3"
```

→ 여전히 잘림

#### 2차 시도 (실패): 시즌 필터로 색상 수 축소

- 사용자 시즌(32색)만 기본 표시
- 조건부 스크롤 (32색일 때 스크롤 제거)
  → 스크롤 제거 시 색상 아예 안 보임 (악화)

#### 최종 해결: 항상 스크롤 + 충분한 하단 패딩

**DrapeColorPalette.tsx**:

```tsx
// 수정 전: 조건부 스크롤 + pb-2
className={cn(
  'rounded-lg border border-border/50 p-3',
  activeSeasonFilter === 'all' && 'max-h-[40vh] overflow-y-auto'
)}
<div className={cn('grid gap-1.5 pb-2', ...)}>

// 수정 후: 항상 스크롤 + pb-12
<div className="max-h-[40vh] overflow-y-auto rounded-lg border border-border/50 p-3">
  <div className={cn('grid gap-1.5 pb-12', ...)}>
```

### 최종 UX

1. **스크롤**: 항상 활성화 (32색/128색 모두)
2. **하단 패딩**: `pb-12`로 마지막 행 충분히 보호
3. **시즌 필터**: 사용자 시즌 기본 선택 + ★ 표시
4. **전체 보기**: 버튼으로 128색 확장 가능

### 교훈

- **단순한 해결이 최선**: 복잡한 조건부 로직보다 충분한 패딩이 효과적
- **스크롤 제거는 위험**: 콘텐츠 안 보이는 부작용 발생 가능
- **실제 테스트 필수**: 코드 로직만으로 판단하지 말고 브라우저 확인
- **점진적 증가**: pb-2 → pb-8 → pb-12 순으로 테스트하며 적정값 찾기

---

## 9. 드레이프 오버레이 부자연스러움

### 발생 시간

2026-02-05~06 (드레이핑 시뮬레이션 리뷰 중)

### 증상

드레이프 색상이 사진 하단에 적용될 때 평면적이고 부자연스럽게 보임. 실제 천이 덮인 것 같은 느낌이 부족함.

### 원인

1. 드레이프 경계가 하드 에지로 처리됨 (그라데이션 없음)
2. 천 질감/주름 효과 없음
3. 원본 배경과 블렌딩 비율이 단조로움

### 관련 파일

- `apps/web/lib/analysis/drape-reflectance.ts` (`applyDrapeColor` 함수)

### 해결

`applyDrapeColor` 함수 개선:

```typescript
// 1. 상단 그라데이션 페이드 (8% 영역)
const fadeZone = Math.floor(canvasHeight * 0.08);
if (localY < fadeZone) {
  blendRatio = 0.2 + (localY / fadeZone) * 0.65; // 0.2→0.85 전환
}

// 2. 노이즈 기반 주름 효과
const getNoiseValue = (x: number, y: number): number => {
  const seed = (x * 12.9898 + y * 78.233) * 43758.5453;
  return (seed - Math.floor(seed)) * 0.12 - 0.06; // ±6% 밝기 변화
};

// 3. 드레이프 영역 확장 (35% → 목/어깨 커버)
const drapeStartY = Math.floor(canvasHeight * 0.65);
```

### 향후 고도화 방향

[docs/roadmaps/draping-enhancement.md](../roadmaps/draping-enhancement.md) 참조

### 교훈

- 시각적 사실감은 단순 색상 오버레이로 충분하지 않음
- 그라데이션, 노이즈, 조명 반영이 자연스러움에 중요
- 원리 문서(color-science.md)의 드레이핑 반사광 이론 참고 필요

---

## 예방 체크리스트

### UI 변경 시

- [ ] 변경 전/후 스크린샷 비교
- [ ] 모바일/데스크톱 모두 확인
- [ ] 관련된 모든 컴포넌트에 동일 변경 적용
- [ ] 레이아웃 클래스 (`flex`, `justify-*`, `items-*`) 유지 확인
- [ ] Canvas 사용 시 `absolute inset-0`으로 부모에 고정 (동적 크기 canvas)
- [ ] **스크롤 컨테이너는 끝까지 스크롤하여 마지막 항목 확인**

### API/환경 변수 변경 시

- [ ] `.env.local` 설정 확인
- [ ] Mock 모드 활성화 여부 확인
- [ ] 에러 핸들링 동작 테스트

### DB 스키마 변경 시

- [ ] 마이그레이션 파일 작성 완료
- [ ] 로컬 Supabase에 적용 및 테스트
- [ ] **클라우드 Supabase에 마이그레이션 적용**
- [ ] API 코드의 insert/update 필드와 DB 스키마 일치 확인

### 기능 추가 시

- [ ] 관련 ADR/스펙 문서 확인
- [ ] 사용자 동의 필요 여부 검토
- [ ] 기능 목적 및 위치 문서화

---

**작성자**: Claude Code
**검토일**: 2026-02-06
**버전**: 1.7 (이슈 #8 최종 해결: 항상 스크롤 + pb-12 패딩)
