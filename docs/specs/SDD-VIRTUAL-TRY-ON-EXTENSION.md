# 가상 시착 확장 스펙 (Virtual Try-On Extension)

> **Status**: 📋 Draft
> **Version**: 1.0
> **Created**: 2026-02-05
> **Author**: Claude Code
> **Phase**: Phase L (향후)
> **Depends on**: PC-1 드레이핑 시뮬레이션

---

## 0. P1 (궁극의 형태)

### 이상적 최종 상태

"사용자의 얼굴/몸 이미지에 메이크업, 헤어컬러, 악세서리, 패션 아이템을 실시간으로 가상 시착하여 구매 전 미리 확인할 수 있는 통합 AR/VR 스타일링 플랫폼"

### 물리적 한계

| 한계           | 이유                | 완화 전략                 |
| -------------- | ------------------- | ------------------------- |
| 이미지 정확도  | 카메라/조명 편차    | 색온도 보정, 다중 각도    |
| 실시간 렌더링  | 모바일 GPU 성능     | WebGL 최적화, 해상도 조절 |
| 3D 매핑 복잡도 | 얼굴/몸 형태 다양성 | 랜드마크 기반 2.5D 접근   |
| AR 기술 필요   | 네이티브 SDK 의존   | 웹 기반 Canvas 우선       |

### 100점 기준

| 지표                | 100점 기준                 | 현재 목표           |
| ------------------- | -------------------------- | ------------------- |
| 메이크업 가상 시착  | 립/아이/블러셔 실시간 합성 | 60% (립 우선)       |
| 헤어컬러 시뮬레이션 | 자연스러운 염색 효과       | 40% (단색 오버레이) |
| 악세서리 가상 시착  | 3D 렌더링 AR               | 0% (향후)           |
| 패션 가상 시착      | 체형 맞춤 옷 합성          | 0% (향후)           |

### 현재 목표: 25%

**1단계**: 메이크업 가상 시착 (립스틱) - 기존 드레이핑 기술 활용

---

## 1. P0 (요구사항 의심)

### 1.1 왜 이 기능이 필요한가?

| 질문                     | 답변                                                      |
| ------------------------ | --------------------------------------------------------- |
| 왜 가상 시착이 필요한가? | 구매 전 색상/스타일 적합성 확인 → 구매 전환율 ↑, 반품률 ↓ |
| 왜 드레이핑 확장인가?    | 기존 기술(캔버스 합성) 재사용 가능 → ROI 높음             |
| 삭제하면 어떻게 되는가?  | 색상 추천만 제공 → 사용자 상상에 의존 → 만족도 낮음       |

### 1.2 삭제 가능한 것

| 항목          | 삭제 가능 여부 | 이유                           |
| ------------- | -------------- | ------------------------------ |
| 악세서리 AR   | ✅ 삭제 가능   | 3D 기술 필요, ROI 낮음         |
| 패션 AR       | ✅ 삭제 가능   | 체형 인식 복잡, 전문 기술 필요 |
| 헤어컬러      | ⚠️ 축소 가능   | 세그멘테이션 난이도 높음       |
| 메이크업 (립) | ❌ 필수        | 드레이핑 기술 직접 활용 가능   |

---

## 2. P2 (원리 우선)

### 2.1 관련 원리 문서

- [원리: 색채학](../principles/color-science.md) - Lab 색공간, 블렌딩
- [원리: 이미지 처리](../principles/image-processing.md) - 캔버스 합성
- [원리: 3D 얼굴형](../principles/3d-face-shape.md) - 랜드마크

### 2.2 물리적 원리

#### 메이크업 합성 원리

```
립스틱 합성 = 원본 픽셀 × (1 - α) + 립 색상 × α

단, 입술 영역만 마스킹:
- 랜드마크 48~67 (Mediapipe 기준) = 입술 윤곽
- 폴리곤 내부 픽셀에만 적용
```

#### 헤어컬러 합성 원리

```
헤어 합성 = 원본 명도 유지 + 색조 교체

HSL 변환:
- H (색조): 새 헤어컬러로 교체
- S (채도): 부분 조정
- L (명도): 원본 유지 (하이라이트/쉐도우 보존)
```

---

## 3. P3 (원자 분해)

### 3.1 메이크업 가상 시착 (VS-1)

#### VS-1.1: 입술 영역 마스크 생성 (2h)

```
입력: 얼굴 이미지, 랜드마크 68점
출력: 입술 마스크 (Uint8Array)
성공 기준: 입술 윤곽 95% 정확도
의존성: 없음
```

#### VS-1.2: 립스틱 색상 블렌딩 (2h)

```
입력: 원본 이미지, 입술 마스크, 립 색상 (hex)
출력: 립 적용 이미지
성공 기준: 자연스러운 블렌딩 (α=0.4~0.6)
의존성: VS-1.1
```

#### VS-1.3: 피니시 효과 적용 (1h)

```
입력: 립 적용 이미지, 피니시 타입 (matte/glossy/shimmer)
출력: 피니시 적용 이미지
성공 기준: 매트/글로시 구분 가능
의존성: VS-1.2
```

#### VS-1.4: 실시간 프리뷰 컴포넌트 (3h)

```
입력: 카메라 스트림 또는 업로드 이미지
출력: React 컴포넌트 (LipstickTryOn)
성공 기준: 30fps 이상, 색상 선택 즉시 반영
의존성: VS-1.1 ~ VS-1.3
```

### 3.2 아이섀도 가상 시착 (VS-2)

#### VS-2.1: 눈 영역 마스크 생성 (3h)

```
입력: 얼굴 이미지, 랜드마크 68점
출력: 눈꺼풀 마스크 (상/하 분리)
성공 기준: 눈꺼풀 영역 90% 정확도
의존성: 없음
```

#### VS-2.2: 그라데이션 블렌딩 (3h)

```
입력: 원본 이미지, 눈 마스크, 아이섀도 팔레트 (3-4색)
출력: 아이섀도 적용 이미지
성공 기준: 자연스러운 그라데이션
의존성: VS-2.1
```

#### VS-2.3: 컴포넌트 통합 (2h)

```
입력: VS-2.1, VS-2.2
출력: EyeshadowTryOn 컴포넌트
성공 기준: VS-1.4와 통합 가능
의존성: VS-2.1 ~ VS-2.2
```

### 3.3 헤어컬러 시뮬레이션 (VS-3)

#### VS-3.1: 헤어 영역 세그멘테이션 (4h)

```
입력: 얼굴 이미지
출력: 헤어 마스크
성공 기준: 헤어 영역 85% 정확도
의존성: 없음 (외부 모델 필요 가능)
기술 옵션:
  - TensorFlow.js BodyPix
  - MediaPipe Selfie Segmentation
  - 직접 학습 모델 (비용 ↑)
```

#### VS-3.2: 색조 교체 알고리즘 (2h)

```
입력: 원본 이미지, 헤어 마스크, 목표 헤어컬러
출력: 헤어컬러 적용 이미지
성공 기준: 명도 보존, 자연스러운 색상
의존성: VS-3.1
```

#### VS-3.3: 하이라이트/쉐도우 보존 (2h)

```
입력: VS-3.2 결과
출력: 입체감 보존된 결과
성공 기준: 머릿결 텍스처 유지
의존성: VS-3.2
```

### 3.4 의존성 그래프

```
VS-1.1 ─────┬──► VS-1.2 ──► VS-1.3 ──► VS-1.4
            │
VS-2.1 ─────┴──► VS-2.2 ──► VS-2.3 ──► 통합 컴포넌트
            │
VS-3.1 ──────────► VS-3.2 ──► VS-3.3 ──► 통합 컴포넌트
```

---

## 4. P4 (단순화)

### 4.1 제거된 복잡성

| 제거 항목               | 이유                            |
| ----------------------- | ------------------------------- |
| 3D 얼굴 모델링          | 2.5D (랜드마크 기반)로 충분     |
| AR SDK 의존             | 웹 Canvas로 구현 가능           |
| 실시간 비디오 필수      | 정지 이미지 우선, 비디오는 선택 |
| 다중 메이크업 동시 적용 | 단일 카테고리씩 적용            |

### 4.2 최소 구현

```
1단계 (MVP): 립스틱만 (VS-1)
2단계: 아이섀도 추가 (VS-2)
3단계: 헤어컬러 (VS-3) - 외부 모델 의존
4단계: 악세서리/패션 - AR 기술 도입 시
```

---

## 5. P7 (워크플로우 순서)

### 5.1 필수 선행 작업

| 단계      | 산출물                 | 상태    |
| --------- | ---------------------- | ------- |
| 리서치    | 메이크업 AR 기술 조사  | ⏳ 필요 |
| 원리 문서 | `makeup-synthesis.md`  | ⏳ 필요 |
| ADR       | ADR-0XX-virtual-try-on | ⏳ 필요 |
| 스펙      | 이 문서                | ✅ 완료 |
| 구현      | VS-1.1 ~ VS-1.4        | ⏳ 대기 |

### 5.2 작업 순서

```
1. 리서치: TensorFlow.js 얼굴 랜드마크 라이브러리 조사
2. 원리 문서: makeup-synthesis.md 작성
3. ADR: 기술 선택 (MediaPipe vs TensorFlow.js)
4. VS-1.1 구현: 입술 마스크
5. VS-1.2 구현: 색상 블렌딩
6. VS-1.3 구현: 피니시 효과
7. VS-1.4 구현: 컴포넌트 통합
8. 테스트: 단위 + 통합
```

---

## 6. P8 (모듈 경계)

### 6.1 모듈 구조

```
lib/
├── virtual-try-on/
│   ├── index.ts              # 공개 API
│   ├── types.ts              # 공개 타입
│   └── internal/
│       ├── lip-mask.ts       # VS-1.1
│       ├── lip-blend.ts      # VS-1.2
│       ├── lip-finish.ts     # VS-1.3
│       ├── eye-mask.ts       # VS-2.1
│       ├── eye-blend.ts      # VS-2.2
│       ├── hair-segment.ts   # VS-3.1
│       └── hair-color.ts     # VS-3.2, VS-3.3
```

### 6.2 공개 API

```typescript
// lib/virtual-try-on/index.ts
export { applyLipstick, type LipstickOptions } from './internal/lip-blend';
export { applyEyeshadow, type EyeshadowPalette } from './internal/eye-blend';
export { applyHairColor, type HairColorOptions } from './internal/hair-color';
export { VirtualTryOnCanvas } from './components/VirtualTryOnCanvas';
```

### 6.3 호출 방향

```
components/virtual-try-on/
        ↓
lib/virtual-try-on/index.ts
        ↓
lib/virtual-try-on/internal/*
        ↓
lib/analysis/drape-palette.ts (기존 활용)
lib/analysis/canvas-utils.ts (기존 활용)
```

---

## 7. 기술 스택

### 7.1 기존 활용 (재사용 가능 함수 목록)

| 기술            | 용도        | 파일                     |
| --------------- | ----------- | ------------------------ |
| Canvas 2D       | 이미지 합성 | `canvas-utils.ts`        |
| 드레이프 블렌딩 | 색상 합성   | `after-simulation.ts`    |
| 얼굴 랜드마크   | 영역 감지   | `face-landmark-utils.ts` |

#### 재사용 가능 함수 상세 (`after-simulation.ts`)

| 함수명                      | 용도                    | VS 적용                   |
| --------------------------- | ----------------------- | ------------------------- |
| `applyDrapeReflection()`    | 드레이프 색상 반사 효과 | VS-1.2 (립 블렌딩 베이스) |
| `applySkinToneCorrection()` | 피부톤 보정             | VS-1.3 (피니시 효과)      |
| `blendColors()`             | 알파 블렌딩             | VS-1.2, VS-2.2            |
| `hexToRgb()` / `rgbToHex()` | 색상 변환               | 전체                      |
| Canvas 픽셀 조작 패턴       | ImageData 기반 합성     | VS-1~3 전체               |

#### 재사용 코드 패턴

```typescript
// after-simulation.ts의 핵심 패턴 (재사용 예정)
const imageData = ctx.getImageData(0, 0, width, height);
const data = imageData.data;

for (let i = 0; i < data.length; i += 4) {
  if (isInMask(i / 4)) {
    // 알파 블렌딩: result = original × (1-α) + color × α
    data[i] = data[i] * (1 - alpha) + targetR * alpha; // R
    data[i + 1] = data[i + 1] * (1 - alpha) + targetG * alpha; // G
    data[i + 2] = data[i + 2] * (1 - alpha) + targetB * alpha; // B
  }
}

ctx.putImageData(imageData, 0, 0);
```

### 7.2 신규 도입 검토

| 기술                   | 용도              | 선택 기준         |
| ---------------------- | ----------------- | ----------------- |
| MediaPipe Face Mesh    | 478점 랜드마크    | 정확도 우선 시    |
| TensorFlow.js FaceMesh | 웹 네이티브       | 번들 크기 우선 시 |
| BodyPix                | 헤어 세그멘테이션 | 헤어컬러 구현 시  |

---

## 8. 테스트 계획

### 8.1 단위 테스트

```typescript
// tests/lib/virtual-try-on/lip-mask.test.ts
describe('createLipMask', () => {
  it('should generate mask from landmarks', () => {
    const landmarks = mockLandmarks68;
    const mask = createLipMask(100, 100, landmarks);
    expect(mask.length).toBe(10000);
    expect(mask.filter((v) => v > 0).length).toBeGreaterThan(100);
  });
});
```

### 8.2 시각적 테스트

- Storybook 스토리 작성
- 다양한 피부톤에서 테스트
- 조명 조건별 테스트

---

## 9. 예상 일정

| 원자           | 예상 시간 | 의존성    |
| -------------- | --------- | --------- |
| 리서치         | 4h        | -         |
| 원리 문서      | 2h        | 리서치    |
| ADR            | 1h        | 원리 문서 |
| VS-1.1         | 2h        | ADR       |
| VS-1.2         | 2h        | VS-1.1    |
| VS-1.3         | 1h        | VS-1.2    |
| VS-1.4         | 3h        | VS-1.3    |
| 테스트         | 2h        | VS-1.4    |
| **1단계 총계** | **17h**   | -         |

---

## 10. 위험 요소 및 완화

| 위험            | 영향          | 완화 전략                 |
| --------------- | ------------- | ------------------------- |
| 랜드마크 정확도 | 마스크 불일치 | 여유 영역 추가, 블러 처리 |
| 모바일 성능     | 프레임 드롭   | 해상도 제한, WebWorker    |
| 색상 보정       | 부자연스러움  | 알파값 조절, 테스트       |
| 외부 모델 의존  | 번들 크기     | 동적 로딩, CDN            |

---

## 11. 성능 벤치마크

### 11.1 측정 지표

| 지표        | 목표           | 측정 방법                          |
| ----------- | -------------- | ---------------------------------- |
| 렌더링 시간 | < 100ms        | `performance.now()` 시작/종료      |
| 프레임 속도 | ≥ 30fps        | `requestAnimationFrame` 카운터     |
| 메모리 사용 | < 50MB         | Chrome DevTools Memory             |
| 번들 크기   | < 100KB (gzip) | `npm run build && npm run analyze` |

### 11.2 벤치마크 테스트 코드

```typescript
// lib/virtual-try-on/__tests__/performance.test.ts
describe('Performance Benchmark', () => {
  it('should render lipstick in under 100ms', async () => {
    const start = performance.now();
    await applyLipstick(testImage, mockMask, '#FF5555');
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
    console.log(`Lipstick render time: ${duration.toFixed(2)}ms`);
  });

  it('should maintain 30fps during real-time preview', async () => {
    let frameCount = 0;
    const startTime = performance.now();

    while (performance.now() - startTime < 1000) {
      await applyLipstick(testImage, mockMask, '#FF5555');
      frameCount++;
    }

    expect(frameCount).toBeGreaterThanOrEqual(30);
    console.log(`FPS: ${frameCount}`);
  });
});
```

### 11.3 CI 성능 게이트

```yaml
# .github/workflows/performance.yml
- name: Performance Test
  run: npm run test:performance
  env:
    PERF_THRESHOLD_MS: 100
    PERF_MIN_FPS: 30
```

---

## 12. 롤백 및 Fallback 계획

### 12.1 기능 플래그

```typescript
// lib/feature-flags/config.ts
enableVirtualTryOn: {
  id: 'enable-virtual-try-on',
  name: 'Virtual Try-On',
  description: '가상 시착 기능 (립스틱, 아이섀도)',
  type: 'release',
  defaultValue: false,  // 기본 비활성화
  rolloutPercentage: 0, // 점진적 출시
},
```

### 12.2 Fallback UI 전략

| 상황                | Fallback                                         |
| ------------------- | ------------------------------------------------ |
| 랜드마크 감지 실패  | "얼굴을 정면으로 향해주세요" 가이드 표시         |
| 렌더링 성능 부족    | 정지 이미지 모드로 전환 (실시간 프리뷰 비활성화) |
| 외부 모델 로딩 실패 | 기본 드레이핑 기능으로 대체                      |
| 메모리 초과         | 이미지 해상도 자동 축소 (1024px → 512px)         |

### 12.3 Fallback 컴포넌트

```tsx
// components/virtual-try-on/VirtualTryOnFallback.tsx
export function VirtualTryOnFallback({ reason }: { reason: FallbackReason }) {
  const messages: Record<FallbackReason, string> = {
    face_not_detected: '얼굴이 감지되지 않았습니다. 정면을 바라봐 주세요.',
    performance_low: '실시간 미리보기가 비활성화되었습니다. 사진을 촬영해 주세요.',
    model_load_failed: '기능을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.',
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-sm text-yellow-800">{messages[reason]}</p>
    </div>
  );
}
```

### 12.4 롤백 트리거

| 조건                      | 액션                 |
| ------------------------- | -------------------- |
| 에러율 > 10%              | 자동 기능 비활성화   |
| 렌더링 시간 > 500ms (p95) | 실시간 모드 비활성화 |
| 사용자 피드백 부정적      | 수동 롤백 검토       |

### 12.5 롤백 절차

```bash
# 1. 기능 플래그 즉시 비활성화
# lib/feature-flags/config.ts
enableVirtualTryOn.defaultValue = false;
enableVirtualTryOn.rolloutPercentage = 0;

# 2. 긴급 배포
git commit -m "fix: disable virtual try-on (rollback)"
git push && vercel --prod

# 3. 모니터링 확인
# - Sentry 에러율 확인
# - 사용자 피드백 모니터링
```

---

## 13. 참고 자료

- [MediaPipe Face Mesh](https://google.github.io/mediapipe/solutions/face_mesh)
- [TensorFlow.js Face Landmarks](https://github.com/tensorflow/tfjs-models/tree/master/face-landmarks-detection)
- [기존 드레이핑 구현](../../apps/web/lib/analysis/after-simulation.ts)
- [ADR-007: Mock Fallback 전략](../adr/ADR-007-mock-fallback-strategy.md)
- [ADR-021: Feature Flags](../adr/ADR-021-feature-flags.md)

---

**Version**: 1.1 | **Status**: Draft
**Updated**: 2026-02-05 (재사용 함수, 성능 벤치마크, 롤백 계획 추가)
**다음 단계**: 리서치 진행 후 ADR 작성
