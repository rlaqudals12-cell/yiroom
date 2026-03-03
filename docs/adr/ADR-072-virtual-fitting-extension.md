# ADR-072: 가상 피팅 L1-L2 확장 전략

## 상태

**제안** (2026-03-03)

## 컨텍스트

기존 SDD-VIRTUAL-TRY-ON-EXTENSION(v1.0)은 메이크업 립스틱 합성(L1)을 정의했으나,
캡슐 에코시스템에서는 헤어컬러, 패션 실루엣까지 확장이 필요하다.
현재 기존 PC-1 드레이핑 시뮬레이션의 Canvas 합성 기술을 재사용할 수 있다.

### 확장 범위

| 레벨      | 도메인               | 기술                    | 기존 자산         |
| --------- | -------------------- | ----------------------- | ----------------- |
| L1 (MVP)  | 메이크업 (립/블러셔) | Canvas 2D 합성          | PC-1 드레이핑     |
| L2        | 헤어컬러             | 세그멘테이션 + 오버레이 | 없음 (신규)       |
| L3 (향후) | 패션 실루엣          | 2.5D 렌더링             | C-1 체형 랜드마크 |
| L4 (향후) | 악세서리 AR          | WebXR/ARKit             | 없음              |

## 결정

### 1. L1: 메이크업 가상 시착 (기존 기술 활용)

```
기술: Canvas 2D + Mediapipe Face Mesh

입력: 사용자 얼굴 이미지 + 제품 색상 코드
처리:
  1. Mediapipe 랜드마크 48~67 (입술 윤곽) 추출
  2. 폴리곤 마스크 생성
  3. 블렌딩: output = original × (1 - α) + lipColor × α
  4. α = 0.6 (자연스러운 합성)
출력: 시착 적용된 이미지

재사용: lib/analysis/canvas-utils.ts → getConstrainedCanvasSize()
```

### 2. L2: 헤어컬러 시뮬레이션 (신규)

```
기술: TensorFlow.js 헤어 세그멘테이션 + HSL 시프트

입력: 사용자 얼굴 이미지 + 목표 헤어 색상
처리:
  1. SelfieSegmentation으로 헤어 영역 마스크
  2. 마스크 영역에 HSL 채널 시프트
  3. 경계 블러링 (feather 3px)
출력: 헤어컬러 변경된 이미지

의존: @mediapipe/selfie_segmentation (번들 ~2MB)
제약: 단색 오버레이만 (그라데이션/하이라이트 L3에서)
```

### 3. 캡슐 연동

```
시착 플로우:
  1. 사용자가 캡슐 추천 아이템 선택
  2. 아이템 타입에 따라 적절한 시착 엔진 호출
     - cosmetic → L1 (메이크업)
     - hair_color → L2 (헤어)
     - fashion → 향후 L3
  3. 시착 결과 표시 + "캡슐에 추가" CTA

인터페이스:
  VirtualFittingEngine<T extends FittableItem> {
    canFit(item: T): boolean;
    fit(image: string, item: T): Promise<FittingResult>;
    getRequiredLandmarks(item: T): LandmarkType[];
  }
```

### 4. 모바일 최적화

| 플랫폼      | 전략                                     | 성능 목표 |
| ----------- | ---------------------------------------- | --------- |
| 웹          | Canvas 2D + OffscreenCanvas              | < 500ms   |
| 모바일      | expo-image-manipulator + 서버사이드 합성 | < 1s      |
| 저사양 기기 | 서버사이드 전용                          | < 2s      |

## 대안

| 대안                   | 장점      | 단점                  | 기각 이유      |
| ---------------------- | --------- | --------------------- | -------------- |
| WebGL 3D 렌더링        | 고품질    | GPU 의존, 모바일 제한 | L1-L2에 과도   |
| 외부 AR SDK (8th Wall) | 빠른 구현 | 월 과금, 의존성       | 비용 부담      |
| 서버사이드 전용        | 기기 무관 | 지연 시간             | 실시간 UX 저하 |

## 결과

### 장점

- L1은 기존 PC-1 Canvas 기술 100% 재사용 (신규 코드 최소)
- VirtualFittingEngine\<T\> 제네릭으로 L3/L4 확장 용이
- 클라이언트 우선 + 서버 폴백으로 기기 커버리지 최대화

### 단점

- L2 헤어 세그멘테이션은 TensorFlow.js 의존 (번들 증가)
- 조명/각도에 따른 합성 품질 편차

## 관련 문서

- [SDD-VIRTUAL-TRY-ON-EXTENSION](../specs/SDD-VIRTUAL-TRY-ON-EXTENSION.md) — 기존 L1 스펙
- [원리: 이미지 처리](../principles/image-processing.md) — Canvas 합성 원리
- [ADR-069: 캡슐 아키텍처](./ADR-069-capsule-ecosystem-architecture.md) — CapsuleEngine 연동

---

**Version**: 1.0 | **Created**: 2026-03-03
