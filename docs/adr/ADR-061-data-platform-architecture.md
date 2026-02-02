# ADR-061: 데이터 플랫폼 아키텍처

## 상태

**승인됨** (2026-02-01)

## 컨텍스트

이룸이 어필리에이트 앱에서 **데이터 기반 뷰티/웰니스 플랫폼**으로 성장하기 위해 데이터 자산 구축이 필요하다.

### 현재 상태

| 시스템 | 상태 | 활용도 |
|--------|------|--------|
| Analytics (`lib/analytics/`) | ✅ 구현됨 | 23가지 이벤트 타입 |
| Audit (`lib/audit/`) | ✅ 구현됨 | 18가지 감사 이벤트 |
| Products (`lib/products/`) | ✅ 구현됨 | 4개 카테고리, 3개 파트너 |
| Matching (`lib/products/matching.ts`) | ✅ 구현됨 | 분석 기반 점수 계산 |

### 해결해야 할 문제

1. **제품 ID 분산**: 동일 제품이 파트너별로 다른 ID 사용
2. **Attribution 부재**: 어떤 분석이 클릭/구매로 이어졌는지 추적 불가
3. **개인화 한계**: 분석 결과만으로 추천, 행동 기반 학습 없음
4. **브랜드 인사이트 부재**: 파트너에게 제공할 데이터 없음

## 결정

### 1. 3-Tier 데이터 플랫폼 아키텍처 채택

```
┌─────────────────────────────────────────────────────────────┐
│                    데이터 플랫폼 3-Tier                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tier 1: Event Collection Layer                             │
│  ├── 기존 analytics_events 확장                             │
│  ├── source_analysis_id 필드 추가                           │
│  └── product_master_id 필드 추가                            │
│                                                             │
│  Tier 2: Processing & Enrichment Layer                      │
│  ├── Product Master DB (ID 통합)                            │
│  ├── Attribution 계산                                       │
│  └── User Preference Learning                               │
│                                                             │
│  Tier 3: Serving & Insight Layer                            │
│  ├── Personalized Recommendations                           │
│  ├── Brand Dashboard                                        │
│  └── A/B Test Analytics                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Product Master DB 도입

```sql
CREATE TABLE product_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_sku TEXT UNIQUE NOT NULL,  -- YR-SKIN-00001

  -- 기본 정보
  name TEXT NOT NULL,
  brand TEXT,
  category product_category NOT NULL,

  -- 외부 ID 매핑 (JSONB로 유연성 확보)
  external_ids JSONB NOT NULL DEFAULT '{}',
  -- { "coupang": "123", "iherb": "ABC", "musinsa": "456" }

  -- 이룸 분석 연계 속성
  skin_types TEXT[],
  skin_concerns TEXT[],
  personal_colors TEXT[],
  body_types TEXT[],

  -- 통계
  total_views INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. Analytics Events 확장

```sql
ALTER TABLE analytics_events
  ADD COLUMN source_analysis_id UUID,
  ADD COLUMN source_analysis_type TEXT,
  ADD COLUMN product_master_id UUID,
  ADD COLUMN match_score INTEGER,
  ADD COLUMN recommendation_position INTEGER;
```

### 4. User Preferences Learned 테이블

```sql
CREATE TABLE user_preferences_learned (
  clerk_user_id TEXT PRIMARY KEY,
  brand_affinity JSONB DEFAULT '{}',
  category_affinity JSONB DEFAULT '{}',
  price_sensitivity DECIMAL DEFAULT 0.5,
  user_segment TEXT,
  confidence DECIMAL DEFAULT 0.0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## 대안 분석

### 대안 1: 외부 CDP 도입 (Segment, Amplitude)

| 장점 | 단점 |
|------|------|
| 빠른 구현 | 월 비용 $500+ |
| 검증된 솔루션 | 데이터 외부 저장 |
| 풍부한 기능 | 커스터마이징 한계 |

**기각 이유**: 비용, 데이터 소유권, 이룸 특화 기능 필요

### 대안 2: BigQuery/Snowflake 도입

| 장점 | 단점 |
|------|------|
| 대용량 분석 | 초기 설정 복잡 |
| SQL 친화적 | Supabase와 이중 관리 |
| 확장성 | 추가 비용 |

**기각 이유**: 현재 규모에서 과도한 투자, Supabase 충분

### 대안 3: Supabase 확장 (채택)

| 장점 | 단점 |
|------|------|
| 기존 인프라 활용 | Row 수 제한 (Pro 무제한) |
| 단일 데이터 소스 | 대규모 분석 한계 |
| 비용 효율 | 실시간 처리 한계 |
| RLS 통합 | - |

**채택 이유**: 현재 규모에 적합, 점진적 확장 가능, 비용 효율

## 구현 계획

### Phase 1: 기반 구축 (2주)

- [ ] Product Master 테이블 생성
- [ ] Analytics Events 컬럼 추가
- [ ] 기본 마이그레이션 스크립트

### Phase 2: Attribution 구현 (2주)

- [ ] 클릭 이벤트에 source_analysis_id 추가
- [ ] tracker.ts 수정
- [ ] Attribution 대시보드 MVP

### Phase 3: 선호도 학습 (3주)

- [ ] User Preferences 테이블 생성
- [ ] EMA 기반 업데이트 로직
- [ ] 추천 알고리즘 통합

### Phase 4: 브랜드 인사이트 (2주)

- [ ] 브랜드 대시보드 API
- [ ] 집계 쿼리 최적화
- [ ] 익명화 처리

## 리스크 및 완화

| 리스크 | 완화 방안 |
|--------|----------|
| 데이터 이관 복잡성 | 점진적 마이그레이션, 병행 운영 |
| 성능 저하 | 인덱스 최적화, 집계 테이블 |
| 프라이버시 이슈 | K-익명성, 데이터 보존 정책 |

## 성공 지표

| 지표 | 현재 | 목표 (6개월) |
|------|------|-------------|
| Attribution 커버리지 | 0% | 90% |
| 개인화 정확도 (CTR) | 2% | 5% |
| 브랜드 인사이트 제공 | 0개 | 3개 파트너 |

## 관련 문서

- [L-R1: 데이터 플랫폼 전략 리서치](../research/claude-ai-research/L-R1-data-platform-strategy.md)
- [L-R2: 국내 플랫폼 사례 분석](../research/claude-ai-research/L-R2-domestic-case-study.md)
- [원리: 데이터 플랫폼](../principles/data-platform.md)
- [ADR-029: 어필리에이트 통합](./ADR-029-affiliate-integration.md)
- [ADR-032: 스마트 매칭](./ADR-032-smart-matching.md)

---

**작성일**: 2026-02-01
**작성자**: Claude Code
**다음 검토일**: 2026-05-01
