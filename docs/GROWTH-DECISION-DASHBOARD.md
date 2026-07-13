# 성장 분기점 계기판 (Growth Decision Dashboard)

> 작성 2026-07-13. 목적: "부트스트랩 좋은 사업(경로 A)"에 남을지, "투자유치→팀→자산→엑싯(경로 B)"으로 전환할지를
> **감이 아니라 3개 지표로** 결정한다. 6~12개월 뒤 큰 분기 결정, 월 1회 점검.
> 근거: 재무 시뮬 + 확장 전략 세션(memory `strategy-and-financials-2026-07`). 엑싯은 자산(오디언스·데이터·엔진)을
> 사는 것이라, 아래 3개가 진짜여야 큰 엑싯이 성립한다(ModiFace/Instagram 논리).

---

## 결정 규칙 (한눈에)

| 지표                 | KILL (재검토)              | 좋음 (경로 A 유지) | GO (경로 B 검토)                      |
| -------------------- | -------------------------- | ------------------ | ------------------------------------- |
| ① 미국/글로벌 트래픽 | 글로벌 <10% or 트래픽 미미 | 글로벌 10~25%      | **미국 단독 >25~30%, 3개월 우상향**   |
| ② 리텐션 (D30)       | <3% (카테고리 바닥)        | 10~15%             | **>20%, 코호트가 시간이 지나도 유지** |
| ③ 엔진 재현성        | PC/피부 <70%               | 85%                | **>90%, 공개 가능한 실측치**          |

- **3개 다 GO** → 경로 B(투자유치·팀·자산 극대화·전략적 엑싯) 전환 검토. 재무 시뮬 S2/S3(엑싯 세후 ₩50~330억).
- **1~2개 GO** → 부트스트랩 유지하며 약한 지표 개선, 다음 분기 재평가.
- **② 리텐션 KILL** → 어떤 성장·수익화도 무의미(새는 러닝머신). 제품 근본 재검토 또는 kill.
- **① 트래픽 KILL** → 유통/홍보 채널 문제. 채널 재설계 또는 kill 결정.

> ⚠️ **kill 기준을 세우는 이유**: 통계적으로 가장 흔한 결과는 폐업(~60%)이다. 나쁜 지표에 몇 년을 빨려들지 않도록,
> "12~18개월 내 이 문턱 미달이면 재검토"를 **지금** 못박는다.

---

## ① 미국/글로벌 트래픽 — "살 만한 오디언스인가"

**왜**: 로레알·아모레가 사는 건 "미국 K뷰티 수요층". 한국 유저는 전략적 프리미엄이 낮다(잼페이스 유저는 아무나 못 산다).
미국 수출이 중국을 제친 K뷰티 구조 변화가 이 지표의 값을 결정한다.

**측정 (이미 배포됨 · 코드 0)**:

- **Vercel Analytics 대시보드 → Visitors → by Country.** `@vercel/analytics/next`가 layout.tsx에 배선돼 국가별 방문자·페이지뷰·디바이스가 자동 수집 중.
- 월별 "미국 방문자 수"와 "미국 비중(%)" 추세를 본다. 홍보(Product Hunt·Reddit) 직후 스파이크가 아니라 **베이스라인 우상향**인지가 핵심.

**임계**: 미국 단독 >25~30% + 3개월 연속 절대 방문자 증가 = GO. 글로벌 <10% = KILL(유통 실패).

---

## ② 리텐션 — "매일 열 이유가 진짜인가" (자산의 핵심)

**왜**: 뷰티 진단은 본질이 일회성(헬스/뷰티 D30 벤치마크 ~3%). 새는 오디언스는 자산이 아니다.
"매일 아침 브리핑=전속 뷰티팀" 재포지셔닝이 실제로 습관을 만드는지 **코호트 데이터로** 검증한다.

**측정 (신호 배선 완료 — `trackBriefingView`)**:

- 홈=브리핑 열람 시 `analytics_events`에 `event_name='briefing_view'` + `clerk_user_id` + `created_at` 기록(마운트당 1회).
- Supabase SQL Editor에서 코호트 리텐션 산출:

```sql
-- 가입 주(week) 코호트 대비 이후 주차 브리핑 재방문율
WITH signups AS (
  SELECT clerk_user_id, date_trunc('week', created_at) AS cohort_week
  FROM users
),
opens AS (
  SELECT DISTINCT clerk_user_id, date_trunc('week', created_at) AS active_week
  FROM analytics_events
  WHERE event_name = 'briefing_view'
)
SELECT s.cohort_week,
       COUNT(DISTINCT s.clerk_user_id) AS cohort_size,
       ROUND(100.0 * COUNT(DISTINCT o.clerk_user_id) FILTER (
         WHERE o.active_week = s.cohort_week + INTERVAL '4 week'
       ) / NULLIF(COUNT(DISTINCT s.clerk_user_id), 0), 1) AS w4_retention_pct
FROM signups s
LEFT JOIN opens o ON o.clerk_user_id = s.clerk_user_id
GROUP BY s.cohort_week ORDER BY s.cohort_week DESC;
```

- **보조(제로 코드)**: 기록이 쌓이기 전이라도, 활동 테이블 타임스탬프(`integrated_analysis_sessions`·`coach_chat_history`·`user_product_shelf` 등)의 `created_at`으로 "행동 리텐션"을 근사할 수 있다. 단 passive 열람(브리핑만 보는 습관)은 `briefing_view`가 정본.

**임계**: D30(=W4) >20% & 코호트가 시간이 지나도 붕괴 안 함 = GO. <3% = KILL.

---

## ③ 엔진 재현성 — "브랜드/인수자가 돈 내는 전제"

**왜**: ModiFace가 팔린 건 기술 신뢰. 재현성 없으면 "AI 진단"은 마케팅 문구일 뿐(Style DNA 평점 3.2의 원인=판정 불신).
경로 B의 세일즈 자료(로레알에 보여줄 숫자)가 이 값이다.

**측정 (하네스 이미 있음)**:

```bash
cd apps/web
# 같은 사진 N회 반복 → 퍼스널컬러·피부 판정 일치율
npx tsx --tsconfig tsconfig.json scripts/reproducibility-test.mts c:/tmp/repro-photos 5
# 모델 A/B(기본 vs lite) 판정·재현성·지연 비교
npx tsx --tsconfig tsconfig.json scripts/model-ab-test.mts c:/tmp/repro-photos 5
```

- 사진 폴더에 얼굴(및 `-wrist`·`-body`) 여러 장 넣고 실행. "동일 사진 반복, N콜, 정면 자연광 기준"을 조건으로 명시해 인용.

**임계**: PC/피부 재현율 >90% = GO(공개·세일즈 가능). <70% = KILL(판정 못 믿음).

---

## 케이던스

- **월 1회**: 세 지표 스냅샷(Vercel 대시보드 + 리텐션 SQL + 재현성 스크립트). 5분.
- **분기 1회**: GO/HOLD/KILL 판정 기록.
- **6~12개월**: 큰 분기 결정 — 경로 A(부트스트랩 유지) vs 경로 B(투자유치 전환). 셋 다 GO가 아니면 서두르지 않는다.

> 핵심: "사용자를 모은다"는 A·B 공통 전제라 지금 하는 일은 안 바뀐다. 오디언스가 이 **선택권**을 사주는 것이고,
> 그 선택을 감이 아니라 위 3지표로 내리는 게 이 계기판의 전부다.
