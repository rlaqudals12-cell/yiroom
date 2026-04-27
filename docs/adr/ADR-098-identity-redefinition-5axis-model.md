# ADR-098: 이룸 정체성 재정의 — 5축 모델 확정 및 모듈 구조 정리

## 상태

`accepted`

## 날짜

2026-04-22

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"거울 + 옷장을 이해해주는 앱"

- 사용자는 얼굴 사진 1장 + 전신 사진 1장 + 자가 입력 2분으로
  자신의 시각적 정체성 5축(색/피부/체형/헤어/메이크업)을 완전히 파악한다
- 5축이 하나의 "나 프로필"로 통합되어 모든 추천(화장품/옷/헤어/제품)의
  단일 근거가 된다
- 경쟁사(Oh My Skin, Perfect Corp, 무신사)가 각자 커버하는 단편적 영역을
  이룸은 하나의 통합 경험으로 제공한다
```

### 물리적 한계

| 항목           | 한계                                                                 |
| -------------- | -------------------------------------------------------------------- |
| 2D 사진 한계   | 얼굴/체형의 3D 정보 추출 불가                                        |
| AI 정확도      | 전문가 90% 수준이 상한 (퍼스널컬러 진단사·피부과의사 합의율 대비)    |
| 인력           | 1인 개발, W-1/N-1 같은 추가 도메인 확장은 현실적으로 불가            |
| 수익 모델 궁합 | 어필리에이트 모델에 헬스/영양 앱은 부적합 (전문 앱은 구독 모델 기반) |

### 100점 기준

- 5축 모두가 **"쇼핑할 때 꺼내 쓸 수 있는 실행 가능한 결과"** 를 출력
- 온보딩 시간 **3분 이내** (얼굴+전신 사진 + 자가 입력)
- 5축이 하나의 프로필로 통합된 **"나 프로필"** 카드가 홈 상단 상시 노출
- 사용자가 "이룸은 무슨 앱이야?"에 **한 문장으로 답할 수 있음** ("내 시각 정체성을 이해해주는 앱")

### 현재 목표: 70%

- OH-1 제거 완료
- W-1/N-1 UI 숨김 (코드/DB 유지)
- C-1 결과가 "원칙 + 코디 3세트 + 옷장 조합 CTA" 구조로 재편
- M-1이 독립 분석이 아닌 "PC-1 + S-1 + 상황"의 실행 레이어로 명시
- "나 프로필" 통합 레이어는 Phase 1.5 (출시 후)로 연기

### 의도적 제외

| 제외 항목               | 이유                                                      | 재검토 시점                     |
| ----------------------- | --------------------------------------------------------- | ------------------------------- |
| OH-1 (구강건강) 재도입  | 뷰티 포지셔닝과 도메인 이질, 쇼핑 전환 없음               | 재도입 계획 없음                |
| W-1/N-1 UI 복원         | 전문 앱(삼성헬스/마이피트니스팔) 대비 경쟁력 부족         | MAU 10만+ 또는 동반자 단계 진입 |
| "나 프로필" 통합 레이어 | 5축 확정 후 자연스럽게 도입, 출시 직전 신규 작업은 리스크 | Phase 1.5 (출시 후 4~8주)       |
| 웹 인벤토리 등록 UI     | 모바일 완성, 웹은 범위 축소                               | Phase 1.5                       |

## 1. 맥락 (Context)

2026-04-22 기준 이룸의 상태:

- **8개+ 모듈이 병렬 구조**로 존재 (PC-1, S-1, C-1, W-1, N-1, R-1, H-1, M-1, OH-1, 기타 인프라)
- 각 모듈이 **독립 분석 결과**를 주지만, 결과가 "하나의 나"로 통합되지 않음
- 사용자 관점에서 **"이룸이 뭐하는 앱인지"** 가 한 문장으로 안 나옴
- CLAUDE.md의 슬로건 **"온전한 나를 찾는 여정"** 과 실제 사용자 경험 사이 괴리

### 제기된 문제 (2026-04-22 대화)

1. **OH-1(구강건강)은 실질 사용 빈도가 없음** — 뷰티 앱에서 이질적 도메인
2. **W-1(운동)/N-1(영양)은 전문 앱 대비 경쟁력 없음** — 삼성헬스/마이피트니스팔이 이미 잘 하고 있음
3. **각 분석이 독립적으로 나열되어 복잡함** — "하나의 나"로 수렴하지 않음
4. **C-1(체형)의 출력이 불명확** — W-1/N-1으로 개선하던 구도가 무너지면 "개선 불가능한 진단서"가 됨

### 3갈래 검토

| 갈래                  | 포지셔닝              | 경쟁사                   | 결론                                  |
| --------------------- | --------------------- | ------------------------ | ------------------------------------- |
| A. 얼굴 앱            | 뷰티 집중 (얼굴만)    | Oh My Skin, Perfect Corp | 직접 경쟁, 차별화 부족                |
| **B. 시각 정체성 앱** | 얼굴+체형+스타일 통합 | 없음 (해자 존재)         | **선택 — DNA와 일치, 쇼핑 전환 2배**  |
| C. 웰니스 통합        | 모든 영역             | 삼성헬스+올리브영+무신사 | 포지셔닝 희석, 모든 영역에서 2등 이하 |

## 2. 결정 (Decision)

### 2.1 갈래 B 확정

이룸을 **"시각적 정체성(Visual Identity) 5축 앱"** 으로 정체성 확정.

한 문장: **"거울 + 옷장을 이해해주는 앱 — 당신의 시각적 정체성 5축을 해석하고, 당장 실행할 수 있게 세상과 연결한다."**

### 2.2 5축 모델

| 축       | 모듈 | 역할                                                          | 입력                                       |
| -------- | ---- | ------------------------------------------------------------- | ------------------------------------------ |
| 색       | PC-1 | 나의 색 정체성 (언더톤/계절)                                  | 얼굴 사진 (1회 측정, 거의 불변)            |
| 피부     | S-1  | 나의 피부 상태                                                | 얼굴 사진 (주기적 재측정)                  |
| 체형     | C-1  | 나의 몸 비율 (**"개선"이 아닌 "이해와 표현"으로 재프레이밍**) | 전신 사진 + 자가 입력                      |
| 헤어     | H-1  | 얼굴형 기반 + 모발 타입/굵기/선호 (하이브리드)                | 얼굴 사진 + 자가 입력                      |
| 메이크업 | M-1  | **실행 레이어** (독립 분석 아님)                              | PC-1/S-1 결과 + 상황(데일리/오피스/데이트) |

### 2.3 OH-1 완전 제거

- Web: `app/(main)/analysis/oral-health/`, `app/api/analyze/oral-health/`, `components/analysis/oral-health/`, `lib/oral-health/`, `lib/analysis/oral-health/` 전부 삭제
- Mobile: `app/(analysis)/oral-health/`, `components/analysis/oral-health/`, `lib/oral-health/`, `lib/analysis/oral-health/` 전부 삭제
- DB: `oral_analyses`, `oral_insights` 테이블 drop 마이그레이션 작성 (출시 후 적용)
- 진입점: Navbar, Dashboard, 홈 위젯에서 OH 참조 제거

### 2.4 W-1/N-1 UI 숨김 (코드/DB 유지)

- `FEATURE_FLAGS.WELLNESS_PHASE2 = false` 플래그로 제어
- 홈 위젯(ActivityBar, StateGrowing, GrowingNextStep, CombinedStreakWidget), Navbar 드롭다운, BottomNav, Dashboard 카드, Record 페이지, Mobile 탭/설정/온보딩 모두 조건부 렌더링
- 코드/DB는 그대로 유지 → Phase 2 재도입 시 플래그만 true로 전환하면 복원

### 2.5 C-1 결과 페이지 리디자인

3섹션 구조로 재편:

```
[헤더]   "당신은 ○○ 체형입니다" (기존 유지)
[섹션 1] 스타일링 원칙 3~5개 (NEW — STYLING_PRINCIPLES 데이터 신규)
[섹션 2] 추천 코디 3세트 (기존 getOutfitExamples 재활용)
[섹션 3] 옷장 조합 CTA (Phase 1.5 준비중)
```

"추천 운동 버튼"은 제거 (W-1 숨김 연계).

### 2.6 단계적 실행 계획

Phase 0 (문서) → Phase 1 (OH-1 제거) → Phase 2 (W/N 숨김) → Phase 3 (C-1 리디자인) → Phase 4 (정리)

## 3. 대안 (Alternatives Considered)

| 대안                       | 장점                     | 단점                                | 제외 사유                           |
| -------------------------- | ------------------------ | ----------------------------------- | ----------------------------------- |
| 갈래 A (얼굴 앱)           | 온보딩 10초, 경쟁사 명확 | Oh My Skin과 직접 경쟁, 차별화 부족 | 쇼핑 전환 반쪽(화장품만), 시장 포화 |
| 갈래 C (웰니스 통합)       | 체류 시간 길음           | 모든 영역에서 2등, 포지셔닝 흐릿    | 인력 부족, 전문 앱 대비 경쟁력 없음 |
| OH-1 UI만 숨김             | 빠름 (30분)              | 기술 부채 남음, 검색/인덱싱에 노출  | 정체성 확정 시 완전 제거가 깔끔     |
| C-1 출력 현행 유지         | 작업 없음                | 사용자 "개선 불가능한 진단서" 인식  | 갈래 B 정체성과 정합성 없음         |
| "나 프로필" 통합 즉시 도입 | 이상적 UX 구현           | 출시 5주+ 지연, 리스크              | 출시 후 1.5에서 도입                |

## 4. 결과 (Consequences)

### 긍정적 결과

- **한 문장으로 표현 가능한 정체성** 확보 ("거울+옷장 이해")
- **경쟁사 없는 포지셔닝** (얼굴+체형+스타일 통합한 곳이 없음)
- **쇼핑 전환 시장 2배** (화장품 + 의류 어필리에이트)
- **C-1이 "개선"의 스트레스 없이 완결** — "체형 수용 + 표현"으로 재프레이밍
- 모듈 복잡도 감소 (8+개 → 핵심 5축 + 인프라)

### 부정적 결과

- W-1/N-1에 투자된 코드/테스트 자산이 UI에서 숨겨짐 (재활용 가능하나 당장은 미사용)
- 온보딩 시간 2~3분 (얼굴 앱 갈래보다 2~10배 길음)
- C-1 섹션 3(옷장)이 출시 시 "준비 중"으로 노출되어 약속/실현 간극 존재

### 리스크

- W-1/N-1 코드 유지 비용 (typecheck/테스트는 계속 돌아감)
- Phase 2 재도입 시 코드가 stale해져 있을 수 있음
- 5축 통합 레이어("나 프로필")가 출시 후 빠르게 도입되지 않으면 현재도 여전히 "병렬 분석 카드" 경험

## 5. 구현 가이드

### 5.1 파일 제거 명령 (Phase 1)

```bash
# Web
rm -rf apps/web/app/\(main\)/analysis/oral-health
rm -rf apps/web/app/api/analyze/oral-health
rm -rf apps/web/components/analysis/oral-health
rm -rf apps/web/lib/oral-health
rm -rf apps/web/lib/analysis/oral-health

# Mobile
rm -rf apps/mobile/app/\(analysis\)/oral-health
rm -rf apps/mobile/components/analysis/oral-health
rm -rf apps/mobile/lib/oral-health
rm -rf apps/mobile/lib/analysis/oral-health
```

### 5.2 FEATURE_FLAGS 구조 (Phase 2)

```typescript
// packages/shared/src/feature-flags.ts (신규 또는 기존 확장)
export const FEATURE_FLAGS = {
  WELLNESS_PHASE2: false, // W-1/N-1 UI 노출
  CLOSET_INTEGRATION: false, // C-1 섹션 3 옷장 조합 (Phase 1.5)
} as const;
```

사용 패턴:

```tsx
{
  FEATURE_FLAGS.WELLNESS_PHASE2 && <HomeActivityBar />;
}
```

### 5.3 STYLING_PRINCIPLES 데이터 구조 (Phase 3)

```typescript
// apps/web/lib/mock/body-analysis.ts 또는 별도 파일
export interface StylingPrinciple {
  title: string; // "허리 라인 강조하기"
  description: string; // 1~2문장 설명
  examples: string[]; // 구체 아이템 3~4개
  avoid?: string[]; // 피할 것 (선택)
}

export const STYLING_PRINCIPLES: Record<BodyType3, StylingPrinciple[]> = {
  S: [
    /* 역삼각형 3~5개 */
  ],
  W: [
    /* 삼각형 3~5개 */
  ],
  N: [
    /* 일자형 3~5개 */
  ],
};
```

## 6. 리서치 티켓 (선택)

```
[ADR-098-R1] "나 프로필" 통합 레이어 설계 (Phase 1.5)  [✅ resolved 2026-04-26]
────────────────────────────────────────
리서치 질문:
1. 5축 결과를 하나의 카드로 통합했을 때의 정보 밀도 한계는?
2. 축별 신뢰도가 다를 때 (예: S-1 고/C-1 저) 통합 카드에서 어떻게 처리?
3. 사용자가 통합 프로필을 공유하고 싶어할 때 UX 패턴은?

산출물 (출시 전 사전 작성):
- 리서치: docs/research/profile-card-phase-1.5-research.md
- SDD 초안: docs/specs/SDD-PROFILE-CARD-PHASE-1.5.md
- (참고) 웹 옷장 등록 UI Phase 1.5: docs/specs/SDD-CLOSET-INVENTORY-WEB.md
```

## 7. 관련 문서

- [P1: 궁극의 형태](../ULTIMATE-FORM.md) — v2.0에서 5축 반영
- [제품 철학](../PRODUCT-PHILOSOPHY.md) — "온전한 나를 찾는 여정" 슬로건
- [제1원칙](../../.claude/rules/00-first-principles.md) — P0/P4 적용 (요구사항 의심, 단순화)
- [SDD-BODY-ANALYSIS](../specs/SDD-BODY-ANALYSIS-v2.md) — C-1 스펙 (v2.1 업데이트 예정)
- [ADR-054 (수익 모델 v2)](./ADR-054-monetization-v2.md) — 어필리에이트 모델과 정합성
- [ADR-096 (Expo 모노레포)](./ADR-096-expo-monorepo-entry-patch.md) — 최신 ADR 참조
- [SDD-PROFILE-CARD-PHASE-1.5](../specs/SDD-PROFILE-CARD-PHASE-1.5.md) — R1 산출물 (출시 후 4~8주 착수)
- [SDD-CLOSET-INVENTORY-WEB](../specs/SDD-CLOSET-INVENTORY-WEB.md) — 웹 옷장 등록 UI Phase 1.5 (CLOSET_INTEGRATION 활성화 경로)

---

**Author**: Claude Code + rlaqudals12
**Decision Maker**: rlaqudals12
**Reviewed by**: -
