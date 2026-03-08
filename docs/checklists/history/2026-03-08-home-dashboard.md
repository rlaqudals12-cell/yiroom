# UX 점검 이력 - 홈/대시보드

> **날짜**: 2026-03-08
> **화면 유형**: 홈/대시보드
> **모드**: 전체
> **대상 파일**: HomeStateActive, ActiveInsightCard, HomeAnalysisSummary, HomeDailyCapsuleWidget, HomeActivityBar, HomeRecentlyViewed, HomeGreeting, InternalizationWidget

---

## 점검 결과 요약

### 1차 점검 (dd45a733 이전)

**판정**: 24/36 통과 (8개 실패, 4개 경고)

주요 실패 항목:

- A1: 영어 raw value 노출 (ActiveInsightCard category)
- B2: 터치 44px 미달 (캡슐 체크, 분석 요약 버튼)
- C2: 에러 상태 없음 (HomeActivityBar)
- D7: 성장 감정 조건부 표시 (InternalizationWidget)
- E2: 분석 가치 서사 부재 (HomeAnalysisSummary CTA)
- E7: 이야기형 전달 없음 (HomeAnalysisSummary 완료 카드)
- G2: 빈 상태 없음 (HomeDailyCapsuleWidget)

### 2차 점검 (226e3b5f 후)

**판정**: 34/36 통과 (1개 실패, 1개 경고)

수정된 항목:

- B2: min-h-[44px] 적용 (dd45a733)
- C2: HomeActivityBar 에러 상태 UI (84174b7b)
- D7: 3단계 성장 메시지 상시 표시 (226e3b5f)
- E2: valueHint 추가로 분석 가치 전달 (226e3b5f)
- G2: 캡슐 빈 상태 안내 UI (226e3b5f)

남은 항목:

- E7: 이야기형 전달 (fail)

### 3차 점검 (1af9ef9d 후)

**판정**: 35/36 통과 (0개 실패, 1개 경고)

수정된 항목:

- E7: narrative 서브텍스트 추가 — 완료 카드에 맥락 설명 표시 (1af9ef9d)

남은 경고:

- E2: L2 가치 제공 — 수동 확인 필요 (warn 고정 항목)

---

## 커밋 이력

| 순서 | 커밋       | 내용                                   |
| ---- | ---------- | -------------------------------------- |
| 1    | `dd45a733` | 터치 영역 44px + 에러 상태 + 단위 표기 |
| 2    | `226e3b5f` | 성장 감정 + 빈 상태 + 분석 가치 서사   |
| 3    | `84174b7b` | HomeActivityBar 에러 상태 UI (KI-006)  |
| 4    | `1af9ef9d` | E7 이야기형 전달 narrative 추가        |

## 통과율 트렌드

```
1차: 24/36 = 67%
2차: 34/36 = 94%
3차: 35/36 = 97%
```

## 궁극의 형태 대비

**현재**: ~85%

- 정적 인사이트 → 실시간 AI 코칭 (향후)
- 분석 카드 → 트렌드 차트/변화 추적 (향후)
- 캡슐 위젯 → 시간대별 맞춤 루틴 (향후)
- ConnectionAwareness → 자립도 기반 UI 자동 간소화 (구현 중)

---

**Version**: 1.0 | **Created**: 2026-03-08
