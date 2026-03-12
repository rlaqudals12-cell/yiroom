# ADR-088: VTO 모바일 렌더링 — Server-Side Sharp 기반 API-First

> **Status**: accepted
> **Date**: 2026-03-12
> **Deciders**: Claude Code
> **ADR-086 참조**: [ADR-086 Thin Client 전략](./ADR-086-mobile-gap-sync.md)

---

## Context

웹 Virtual Try-On(VTO) 엔진은 5개(lip, blush, hair, eyeshadow, foundation)가 Canvas 2D + MediaPipe 468 랜드마크 기반으로 동작한다. React Native에는 Canvas 2D API가 없으므로 모바일에서 동일 엔진을 직접 실행할 수 없다.

### 모바일 VTO 현황

- UI 완성: 이미지 업로드, 3카테고리 탭(lip/blush/hair), 컬러 프리셋, 20+ 테스트
- 엔진 미연동: `setTimeout(() => setProcessing(false), 800)` 스텁

## Decision

**API-First + Server-Side Sharp 렌더링**을 채택한다.

모바일은 base64 이미지 + 설정을 웹 API(`POST /api/fitting/try-on`)에 전송하고, 서버에서 `sharp` SVG compositing으로 색상 오버레이를 적용하여 결과 이미지를 반환한다.

## Considered Alternatives

| 방안                     | 장점                                      | 단점                                           | 결정     |
| ------------------------ | ----------------------------------------- | ---------------------------------------------- | -------- |
| **A. Server-Side Sharp** | 코드 최소, sharp 이미 설치됨, Vercel 호환 | 얼굴 랜드마크 없이 휴리스틱 영역 사용          | **채택** |
| B. WebView 브릿지        | 웹 엔진 100% 재사용                       | UX 복잡(로딩, 통신 오버헤드), 메모리 이중 사용 | 기각     |
| C. React Native Skia     | 네이티브 성능, 오프라인                   | 25h+ 포팅 비용, Skia 학습 곡선, 코드 중복      | 기각     |
| D. expo-gl + GLSL        | GPU 렌더링                                | GLSL 셰이더 작성 필요, 디바이스 호환성         | 기각     |
| E. node-canvas 서버      | Canvas API 동일                           | 네이티브 바이너리, Vercel 호환 불확실          | 기각     |

## Architecture

```
┌──────────────┐     POST /api/fitting/try-on     ┌──────────────┐
│   Mobile     │  ─────────────────────────────▸  │   Web API    │
│  (RN Client) │    { imageBase64, config }       │  (Next.js)   │
│              │  ◂─────────────────────────────  │              │
│              │    { resultBase64, timeMs }       │  sharp SVG   │
└──────────────┘                                  │  compositing │
                                                  └──────────────┘
```

### Server-Side 렌더링 전략

얼굴 랜드마크 없이 **selfie 중심 휴리스틱**으로 메이크업 영역을 결정:

| 타입       | 영역                 | 비율 (이미지 기준)               |
| ---------- | -------------------- | -------------------------------- |
| lip        | 하단 중앙 타원       | cx=50%, cy=72%, rx=12%, ry=4%    |
| blush      | 양볼 타원 2개        | cx=30%/70%, cy=58%, rx=8%, ry=6% |
| eyeshadow  | 양눈 상부 타원 2개   | cx=35%/65%, cy=38%, rx=7%, ry=3% |
| foundation | 얼굴 전체 타원       | cx=50%, cy=50%, rx=25%, ry=35%   |
| hair       | 상단 영역 그래디언트 | y=0~40%, 하단 페이드             |

이 휴리스틱은 정면 셀피 기준으로 설계되었으며, 결과 품질은 "시뮬레이션 미리보기" 수준이다.

### Phase 2 계획 (향후)

ONNX Runtime + face detection 모델을 도입하여 서버에서도 정확한 얼굴 영역 검출:

- `@xenova/transformers` 또는 `onnxruntime-node`
- 웹 엔진 수준의 정밀도 달성

## Consequences

### 장점

- sharp 이미 설치되어 추가 의존성 0
- Thin Client 전략(ADR-086) 준수
- 모바일 코드 최소: API 호출 + 결과 표시
- 5개 카테고리 즉시 지원 (웹은 3개만 UI 있었음)

### 단점

- 서버 의존 (오프라인 미지원)
- 얼굴 랜드마크 없이 휴리스틱 영역 → Phase 1 품질 한계
- API 응답 시간 (이미지 전송 + 처리)

### 리스크 완화

- 타임아웃 5초 + 실패 시 원본 이미지 유지
- "시뮬레이션 미리보기" 라벨로 기대치 관리

---

**Version**: 1.0 | **Updated**: 2026-03-12
