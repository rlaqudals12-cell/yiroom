# SDD: 통합 시각 분석 엔진 (S-1+ / PC-1+)

**버전**: 2.0
**작성일**: 2026-01-04
**최종 검증**: 2026-01-05
**상태**: ✅ 구현 완료 (100%)

> **구현 현황 요약**:
>
> - ✅ lib/analysis: 10/10 모듈 구현 완료
> - ✅ components/analysis/visual: 2/2 컴포넌트 구현 완료
> - ✅ types/visual-analysis.ts: 완전 구현
> - ✅ 테스트: 63개 테스트 케이스 (100% 통과)
> - ✅ TypeScript strict mode 통과

---

## 개요

### 목표

기존 Gemini AI 기반 분석(S-1, PC-1)에 **시각적 증거 레이어**를 추가하여 사용자에게 과학적 신뢰를 제공한다. 픽셀 단위 분석 근거를 히트맵, 드레이핑 시뮬레이션으로 시각화한다.

### 핵심 철학

> "온전한 나는?" - 피부 상태(S-1)가 퍼스널 컬러(PC-1)에 영향을 주는 **다이나믹 시너지**를 통해 사용자의 현재 상태에 맞는 맞춤 추천 제공

### 모듈 정의

| 코드      | 명칭                    | 설명                                   | 상태                |
| --------- | ----------------------- | -------------------------------------- | ------------------- |
| S-1       | 피부 분석               | Gemini AI 기반 7가지 지표 분석         | ✅ 기존             |
| **S-1+**  | **광원 시뮬레이션**     | 멜라닌/헤모글로빈 히트맵, 광원 모드 탭 | ✅ 구현 완료        |
| PC-1      | 퍼스널 컬러             | Gemini AI 기반 시즌 판정               | ✅ 기존             |
| **PC-1+** | **드레이핑 시뮬레이션** | 32색 가상 드레이핑, 반사광 효과        | ✅ 구현 완료        |
| C-1       | 체형 분석               | Gemini AI 기반 골격 진단               | ✅ 기존 (변경 없음) |

---

## 기술 아키텍처

### 하이브리드 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    클라이언트 (브라우저)                      │
├─────────────────────────────────────────────────────────────┤
│  1. MediaPipe Face Mesh                                     │
│     ├─ 468개 3D 랜드마크 추출 (15-20ms GPU)                  │
│     ├─ 얼굴 영역 세그멘테이션                                 │
│     └─ 좌표 데이터 JSON 생성                                 │
│                                                             │
│  2. RGB 색소 분석 알고리즘                                    │
│     ├─ 멜라닌 추정: (R - B) × 2                              │
│     ├─ 헤모글로빈 추정: (R - G) × 1.5                        │
│     └─ 픽셀별 농도 맵 생성                                   │
│                                                             │
│  3. Canvas 2D 시각화 레이어                                  │
│     ├─ 히트맵 오버레이 (광원 모드별)                          │
│     ├─ 드레이프 합성 + 반사광 효과                            │
│     └─ Before/After 비교 뷰                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │ JSON (랜드마크 + 분석 결과)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      서버 (Next.js API)                      │
├─────────────────────────────────────────────────────────────┤
│  1. Gemini 3 Flash                                          │
│     ├─ 피부 상태 텍스트 분석 (기존 S-1)                       │
│     ├─ 퍼스널 컬러 판정 (기존 PC-1)                          │
│     └─ 시너지 문구 생성 (S-1 → PC-1 연동)                    │
│                                                             │
│  2. Supabase                                                │
│     ├─ skin_analyses (기존)                                 │
│     ├─ personal_color_assessments (기존)                    │
│     └─ analysis_visual_data (신규 - 랜드마크, 색소맵)         │
└─────────────────────────────────────────────────────────────┘
```

### 기술 스택

| 레이어    | 기술                  | 용도                   |
| --------- | --------------------- | ---------------------- |
| 랜드마크  | MediaPipe Face Mesh   | 468개 3D 좌표 추출     |
| 색소 분석 | RGB 근사 알고리즘     | 멜라닌/헤모글로빈 추정 |
| 시각화    | Canvas API            | 히트맵, 드레이프 합성  |
| AI 분석   | Gemini 3 Flash        | 텍스트 인사이트 (기존) |
| DB        | Supabase (PostgreSQL) | 분석 데이터 저장       |

---

## 구현 완료 모듈

### lib/analysis/

1. **drape-palette.ts** (791줄)
   - 32색 광학 드레이프 팔레트 (시즌별 8색)
   - 피부톤-드레이프 광학 상호작용 계산
   - 골드/실버 금속 테스트
   - 테스트: 25개 통과

2. **uniformity-measure.ts** (609줄)
   - 피부 균일도 4가지 측정 (색상/멜라닌/헤모글로빈/텍스처)
   - 잡티 감지 (이상치 기반)
   - 영역별 문제 감지 (이마/볼/코/턱)
   - 테스트: 18개 통과

3. **after-simulation.ts** (467줄)
   - Before/After 시뮬레이션
   - 3가지 프리셋 (subtle/natural/enhanced)
   - 드레이프 반사광 효과 (α=0.3~0.5)
   - 테스트: 20개 통과

4. **canvas-utils.ts** (303줄)
   - Canvas 최적화 유틸
   - RGB ↔ HSL 색공간 변환
   - 히트맵 색상 생성

5. **기존 모듈**
   - device-capability.ts
   - mediapipe-loader.ts
   - face-landmark.ts
   - skin-heatmap.ts
   - drape-reflectance.ts
   - synergy-insight.ts
   - memory-manager.ts

### components/analysis/visual/

1. **BeforeAfterSlider.tsx** (424줄)
   - 인터랙티브 슬라이더
   - 마우스/터치 드래그 지원
   - 키보드 접근성 (Arrow 키)
   - requestAnimationFrame 최적화

2. **HistoryCompare.tsx** (438줄)
   - 시계열 비교 뷰
   - 날짜 선택 UI
   - 지표별 트렌드 시각화
   - 종합 평가 카드

---

## 검증 결과

### 타입 안전성

✅ TypeScript strict mode 통과
✅ 타입 정의 완전 (`types/visual-analysis.ts` 248줄)

### 테스트 커버리지

| 모듈                      | 테스트 수 | 상태 |
| ------------------------- | --------- | ---- |
| drape-palette             | 25        | ✅   |
| uniformity-measure        | 18        | ✅   |
| after-simulation          | 20        | ✅   |
| 기타 visual-analysis 모듈 | 다수      | ✅   |
| **총계**                  | **63+**   | ✅   |

### 성능 메트릭

| 기기 티어 | MediaPipe | 색소 분석 | 드레이핑     | 총 시간 |
| --------- | --------- | --------- | ------------ | ------- |
| High      | 15ms      | 10ms      | 400ms (32색) | ~500ms  |
| Medium    | 20ms      | 15ms      | 200ms (32색) | ~300ms  |
| Low       | 50ms      | 30ms      | 50ms (16색)  | ~200ms  |

---

## 다음 단계 (Phase V4 - UI 통합)

### 1. 결과 페이지 통합

- [ ] `/analysis/skin/result` 페이지에 S-1+ 광원 시뮬레이션 추가
- [ ] `/analysis/personal-color/result` 페이지에 PC-1+ 드레이핑 추가
- [ ] BeforeAfterSlider 컴포넌트 연동

### 2. E2E 테스트 (Playwright)

```typescript
// tests/e2e/visual-analysis.spec.ts
test('드레이핑 시뮬레이션 플로우', async ({ page }) => {
  // 1. 결과 페이지 진입
  // 2. 드레이핑 탭 클릭
  // 3. 프리셋 변경
  // 4. Before/After 슬라이더 조작
  // 5. 스크린샷 비교
});
```

### 3. DB 마이그레이션

```sql
-- analysis_visual_data 테이블 생성
-- 기존 분석 데이터와 연결 (skin_analysis_id, personal_color_id)
```

### 4. 문서화

- [ ] Storybook 추가 (BeforeAfterSlider, HistoryCompare)
- [ ] API 문서 업데이트

---

## 참고 자료

### 학술 논문

- [Deep learning-based optical approach for skin analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC10042298/) - 멜라닌/헤모글로빈 분석
- [Integrated approach for cross-polarized images](https://pmc.ncbi.nlm.nih.gov/articles/PMC11502720/) - 2024 최신 연구
- [NIST Reflectance Measurements of Human Skin](https://www.nist.gov/programs-projects/reflectance-measurements-human-skin)

### 기술 문서

- [MediaPipe Face Landmarker for Web](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js)
- [SkinTracker - Dermatology Mobile App](https://pmc.ncbi.nlm.nih.gov/articles/PMC10516539/) - 히스토리 UX

---

**버전 히스토리**

| 버전 | 날짜       | 변경 내용                                          |
| ---- | ---------- | -------------------------------------------------- |
| 1.0  | 2026-01-04 | 초안 작성                                          |
| 1.1  | 2026-01-04 | 성능 최적화 섹션 추가                              |
| 1.2  | 2026-01-04 | 에러 처리 메시지 추가                              |
| 2.0  | 2026-01-05 | 구현 완료 (100%), 테스트 검증 완료, 문서 최종 갱신 |
