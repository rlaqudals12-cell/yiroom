# 🗄️ Database 스키마 v6.1 (Phase K + 동기화 완료)

**버전**: v6.1 (K-1 gender_preference 추가)
**업데이트**: 2026년 2월 2일
**Auth**: Clerk (clerk_user_id 기반)
**Database**: Supabase (PostgreSQL 15+)
**차별화**: 퍼스널 컬러 + 성분 분석 + 제품 DB + 리뷰 시스템 + 운동/영양 + 헤어/정신건강

> ✅ **동기화 완료**: 이 문서는 `supabase/migrations/` 폴더의 마이그레이션과 동기화되었습니다.
> 총 **60+개 테이블** 문서화 완료 (2026-02-01 기준)

---

## 📊 테이블 구조 개요

```yaml
테이블 목록:
  Phase 1 (분석):
    1. users                        # Clerk 사용자 정보
    2. personal_color_assessments   # PC-1 퍼스널 컬러 ⭐
    3. skin_analyses                # S-1 피부 분석 (성분 분석 포함)
    4. body_analyses                # C-1 체형 분석 (PC 연동)

  Product DB v1:
    5. cosmetic_products            # 화장품 (500개)
    6. supplement_products          # 영양제 (200개)

  Product DB v2:
    7. workout_equipment            # 운동 기구 (50개)
    8. health_foods                 # 건강식품 (100개)
    9. product_price_history        # 가격 추적

  사용자 기능:
    10. user_wishlists              # 위시리스트 (2025-12-11)
    20. daily_checkins              # 일일 체크인 (2025-12-22)

  관리자:
    11. feature_flags               # 기능 플래그 (2025-12-11)
    12. admin_logs                  # 관리자 활동 로그 (2025-12-11)

  Phase 2 (영양):
    13. foods                       # 음식 DB
    14. nutrition_settings          # 영양 설정
    15. meal_records                # 식단 기록

  Phase G (리뷰/어필리에이트):
    16. product_reviews             # 제품 리뷰 (2025-12-19)
    17. review_helpful              # 리뷰 도움됨 (2025-12-19)
    18. ingredient_interactions     # 성분 상호작용 (2025-12-19)
    19. affiliate_clicks            # 어필리에이트 클릭 (2025-12-19)

  Phase H (게이미피케이션):
    21. user_levels                 # 사용자 레벨/XP (2025-12-24)
    22. user_badges                 # 사용자 뱃지 (2025-12-24)
    23. challenges                  # 챌린지 템플릿 (2025-12-24)
    24. challenge_participations    # 챌린지 참여 (2025-12-24)
    25. challenge_teams             # 팀 챌린지 (2025-12-26)
    26. team_members                # 팀 멤버 (2025-12-26)
    27. challenge_invites           # 챌린지 초대 (2025-12-26)
    28. wellness_scores             # 웰니스 점수 (2025-12-25)
    29. friendships                 # 친구 관계 (2025-12-25)
    30. leaderboard_cache           # 리더보드 캐시 (2025-12-25)

  Launch (운영):
    31. announcements               # 공지사항 (2025-12-26)
    32. announcement_reads          # 공지 읽음 표시 (2025-12-26)
    33. faqs                        # FAQ (2025-12-26)
    34. feedback                    # 사용자 피드백 (2025-12-26)

  알림 (Notifications):
    35. user_notification_settings  # 알림 설정 (2026-01-11)
    36. user_push_tokens            # 푸시 토큰 (2026-01-11)

  W-1 운동 모듈 (신규):
    37. workout_analyses            # 운동 분석 - 목표/유형/빈도
    38. workout_plans               # 주간 운동 계획
    39. workout_logs                # 일일 운동 기록
    40. workout_streaks             # 운동 연속 기록

  H-1 헤어 분석 (신규):
    41. hair_analyses               # 모발/두피 분석 결과

  M-1 정신건강 (신규):
    42. mental_health_logs          # 기분/스트레스/수면 트래킹

  F-4 제품함 (신규):
    43. user_product_shelf          # 스캔한 제품 관리

  어필리에이트 시스템 (신규):
    44. affiliate_products          # 어필리에이트 제품 DB

  피부 관리 (신규):
    45. skin_diary_entries          # 피부 일기

  영양 확장 (신규):
    46. nutrition_streaks           # 영양 연속 기록
    47. recipes                     # 레시피 DB
    48. recipe_ingredients          # 레시피 재료
    49. user_favorite_recipes       # 레시피 즐겨찾기

  메이크업/스타일 (신규):
    50. makeup_analyses             # 메이크업 분석
    51. user_size_history           # 신체 사이즈 기록
    52. user_shopping_preferences   # 쇼핑 선호도
    53. price_watches               # 가격 알림

  스마트 알림 (신규):
    54. smart_notifications         # 스마트 알림

관계도:
  users (1) ━━━━━ (N) personal_color_assessments
  users (1) ━━━━━ (N) skin_analyses
  users (1) ━━━━━ (N) body_analyses
  users (1) ━━━━━ (N) workout_analyses
  users (1) ━━━━━ (N) hair_analyses
  users (1) ━━━━━ (N) mental_health_logs
  users (1) ━━━━━ (N) skin_diary_entries

논리적 연동:
  personal_color_assessments.season → skin_analyses
  personal_color_assessments.season → body_analyses
  workout_analyses → workout_plans → workout_logs
  recipes → recipe_ingredients
```

---

## 1. users 테이블

### SQL 생성문

```sql
-- Clerk 사용자 정보 저장
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,  -- Clerk ID
  email TEXT,
  name TEXT,
  profile_image_url TEXT,
  gender_preference TEXT DEFAULT 'neutral'  -- K-1: male, female, neutral (콘텐츠 개인화)
    CHECK (gender_preference IN ('male', 'female', 'neutral')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_gender_preference ON users(gender_preference);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 코멘트
COMMENT ON TABLE users IS 'Clerk 사용자 기본 정보';
COMMENT ON COLUMN users.clerk_user_id IS 'Clerk에서 발급한 사용자 고유 ID';
```

### 필드 설명

```yaml
id: UUID
  - Supabase 내부 ID
  - PRIMARY KEY
  - 자동 생성

clerk_user_id: TEXT
  - Clerk 사용자 ID
  - UNIQUE NOT NULL
  - 모든 연결의 기준
  - 형식: "user_2abc123..."

email: TEXT
  - 사용자 이메일
  - Clerk에서 동기화

name: TEXT
  - 사용자 이름/닉네임

profile_image_url: TEXT
  - 프로필 이미지 URL

created_at: TIMESTAMPTZ
  - 계정 생성 시간

updated_at: TIMESTAMPTZ
  - 마지막 수정 시간
  - 트리거로 자동 업데이트
```

---

## 2. personal_color_assessments 테이블 ⭐

### SQL 생성문

```sql
-- PC-1 퍼스널 컬러 진단 결과 저장
CREATE TABLE personal_color_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,

  -- 문진 데이터
  questionnaire_answers JSONB NOT NULL,

  -- 이미지 정보
  face_image_url TEXT,

  -- 분석 결과
  season TEXT NOT NULL CHECK (season IN ('Spring', 'Summer', 'Autumn', 'Winter')),
  undertone TEXT CHECK (undertone IN ('Warm', 'Cool', 'Neutral')),
  confidence INT CHECK (confidence >= 0 AND confidence <= 100),

  -- 문진 점수
  season_scores JSONB,

  -- 이미지 분석 결과
  image_analysis JSONB,

  -- 추천 데이터
  best_colors JSONB,
  worst_colors JSONB,
  makeup_recommendations JSONB,
  fashion_recommendations JSONB,

  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_pc_assessments_clerk_user_id
  ON personal_color_assessments(clerk_user_id);
CREATE INDEX idx_pc_assessments_season
  ON personal_color_assessments(season);
CREATE INDEX idx_pc_assessments_created_at
  ON personal_color_assessments(created_at DESC);

-- 코멘트
COMMENT ON TABLE personal_color_assessments
  IS 'PC-1 퍼스널 컬러 진단 결과 (온보딩 필수, S-1/C-1 자동 활용)';
COMMENT ON COLUMN personal_color_assessments.questionnaire_answers
  IS '10개 문진 질문 답변 JSON';
COMMENT ON COLUMN personal_color_assessments.season
  IS '최종 계절 타입 (Spring/Summer/Autumn/Winter)';
COMMENT ON COLUMN personal_color_assessments.season_scores
  IS '각 계절별 점수 {spring: 85, summer: 60, ...}';
```

### JSONB 필드 구조

```yaml
questionnaire_answers: {
    'q1_vein_color': 'blue', # 손목 혈관
    'q2_jewelry': 'gold', # 금/은 장신구
    'q3_skin_tone': 'light', # 피부 톤
    'q4_hair_color': 'dark_brown', # 헤어 컬러
    'q5_eye_color': 'dark', # 눈동자 색
    'q6_flush': 'sometimes', # 홍조
    'q7_sun_reaction': 'burn', # 태양 반응
    'q8_lip_color': 'pink', # 입술 색
    'q9_preferred_colors': 'cool', # 선호 색상
    ? 'q10_gender_age' # 성별/나이
    : { 'gender': 'female', 'age_group': '20s' },
  }

season_scores: { 'spring': 65, 'summer': 88, 'autumn': 45, 'winter': 72 }

image_analysis:
  {
    'detected_undertone': 'cool',
    'skin_brightness': 75,
    'color_temperature': 'cool',
    'saturation_level': 'medium',
    'contrast_level': 'low',
  }

best_colors: ['#FFB6C1', '#E6E6FA', '#87CEEB', '#98FB98', '#FFCCE5']

worst_colors: ['#FF4500', '#FF8C00', '#FFD700', '#32CD32']

makeup_recommendations:
  {
    'foundation': '쿨톤 베이지 21호',
    'lipstick': ['로즈핑크', '라벤더핑크', '베리'],
    'eyeshadow': ['파스텔퍼플', '핑크브라운', '그레이'],
    'blush': ['로즈', '라벤더핑크'],
  }

fashion_recommendations:
  {
    'best_colors': ['파스텔블루', '라벤더', '민트', '로즈'],
    'avoid_colors': ['오렌지', '코랄', '머스타드'],
    'metals': '실버',
    'patterns': ['체크', '스트라이프'],
    'fabrics': ['실크', '시폰', '린넨'],
  }
```

---

## 3. skin_analyses 테이블

### SQL 생성문

```sql
-- S-1 피부 분석 결과 저장
CREATE TABLE skin_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,

  -- 이미지 정보
  image_url TEXT NOT NULL,

  -- 분석 결과 (7가지 지표)
  skin_type TEXT NOT NULL,
  hydration INT CHECK (hydration >= 0 AND hydration <= 100),
  oil_level INT CHECK (oil_level >= 0 AND oil_level <= 100),
  pores INT CHECK (pores >= 0 AND pores <= 100),
  pigmentation INT CHECK (pigmentation >= 0 AND pigmentation <= 100),
  wrinkles INT CHECK (wrinkles >= 0 AND wrinkles <= 100),
  sensitivity INT CHECK (sensitivity >= 0 AND sensitivity <= 100),

  -- 전체 점수
  overall_score INT CHECK (overall_score >= 0 AND overall_score <= 100),

  -- 추천 사항
  recommendations JSONB,
  products JSONB,

  -- 성분 분석 (화해 스타일) ⭐
  ingredient_warnings JSONB,

  -- 퍼스널 컬러 연동 ⭐
  personal_color_season TEXT,
  foundation_recommendation TEXT,

  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_skin_analyses_clerk_user_id
  ON skin_analyses(clerk_user_id);
CREATE INDEX idx_skin_analyses_created_at
  ON skin_analyses(created_at DESC);
CREATE INDEX idx_skin_analyses_skin_type
  ON skin_analyses(skin_type);
CREATE INDEX idx_skin_analyses_pc_season
  ON skin_analyses(personal_color_season);

-- 코멘트
COMMENT ON TABLE skin_analyses IS 'S-1 피부 분석 결과 (성분 분석 + PC 연동)';
COMMENT ON COLUMN skin_analyses.ingredient_warnings
  IS '성분 경고 정보 (화해 스타일)';
COMMENT ON COLUMN skin_analyses.personal_color_season
  IS '퍼스널 컬러 계절 (자동 조회)';
COMMENT ON COLUMN skin_analyses.foundation_recommendation
  IS '퍼스널 컬러 기반 파운데이션 추천';
```

### JSONB 필드 구조

```yaml
recommendations:
  {
    'insight': '수분 보충이 필요해요! 히알루론산 성분을 추천드려요.',
    'ingredients':
      [
        { 'name': '히알루론산', 'reason': '수분 보충' },
        { 'name': '나이아신아마이드', 'reason': '모공 개선' },
      ],
    'morning_routine': ['세안 → 토너 → 세럼 → 수분크림 → 선크림'],
    'evening_routine': ['클렌징 → 세안 → 토너 → 세럼 → 아이크림 → 수분크림'],
    'weekly_care': ['주 1-2회 각질 케어', '주 2-3회 시트 마스크'],
    'lifestyle_tips': ['물 2L 이상 섭취', '7시간 이상 수면'],
  }

products:
  {
    'cleanser': ['순한 폼클렌저', '젤 클렌저'],
    'toner': ['무알콜 토너', '하이드레이팅 토너'],
    'serum': ['히알루론산 세럼', '나이아신아마이드'],
    'moisturizer': ['수분크림', '젤크림'],
    'sunscreen': ['무기자차 선크림'],
    'specialCare': ['히알루론산 앰플', '비타민C 세럼'],
  }

ingredient_warnings:
  [
    {
      'ingredient': '알코올',
      'ingredientEn': 'Alcohol',
      'level': 'high',
      'ewgGrade': 6,
      'reason': '민감성 피부에 자극 유발 가능',
      'alternatives': ['알코올 프리 토너', '글리세린 기반 제품'],
      'category': '용매',
    },
    {
      'ingredient': '향료',
      'ingredientEn': 'Fragrance',
      'level': 'medium',
      'ewgGrade': 8,
      'reason': '알러지 반응 가능성',
      'alternatives': ['무향 제품'],
      'category': '향료',
    },
    {
      'ingredient': '파라벤',
      'ingredientEn': 'Paraben',
      'level': 'low',
      'ewgGrade': 4,
      'reason': '일부 민감 반응 보고',
      'alternatives': ['파라벤 프리 제품', '천연 방부제 제품'],
      'category': '방부제',
    },
  ]
```

---

## 4. body_analyses 테이블

### SQL 생성문

```sql
-- C-1 체형 분석 결과 저장
CREATE TABLE body_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,

  -- 이미지 정보
  image_url TEXT NOT NULL,

  -- 기본 측정값
  height DECIMAL(5,2),
  weight DECIMAL(5,2),

  -- 분석 결과
  body_type TEXT NOT NULL,
  shoulder INT CHECK (shoulder >= 0 AND shoulder <= 100),
  waist INT CHECK (waist >= 0 AND waist <= 100),
  hip INT CHECK (hip >= 0 AND hip <= 100),
  ratio DECIMAL(3,2),

  -- 추천 사항
  strengths JSONB,
  improvements JSONB,
  style_recommendations JSONB,

  -- 퍼스널 컬러 연동 ⭐
  personal_color_season TEXT,
  color_recommendations JSONB,

  -- 목표 설정
  target_weight DECIMAL(5,2),
  target_date DATE,

  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_body_analyses_clerk_user_id
  ON body_analyses(clerk_user_id);
CREATE INDEX idx_body_analyses_created_at
  ON body_analyses(created_at DESC);
CREATE INDEX idx_body_analyses_body_type
  ON body_analyses(body_type);
CREATE INDEX idx_body_analyses_pc_season
  ON body_analyses(personal_color_season);

-- 코멘트
COMMENT ON TABLE body_analyses IS 'C-1 체형 분석 결과 (PC 연동)';
COMMENT ON COLUMN body_analyses.personal_color_season
  IS '퍼스널 컬러 계절 (자동 조회)';
COMMENT ON COLUMN body_analyses.color_recommendations
  IS '퍼스널 컬러 기반 코디 색상 추천';
```

### JSONB 필드 구조

```yaml
strengths: ['균형 잡힌 어깨-허리 비율', '허리 라인이 잘 드러남']

# improvements: 향후 확장 예정
#   ["하체 볼륨 보완", "어깨 라인 강조"]

style_recommendations:
  {
    'items':
      [
        { 'item': '핏한 상의 + 하이웨이스트', 'reason': '허리 라인을 강조해요' },
        { 'item': 'A라인 스커트', 'reason': '균형 잡힌 실루엣을 완성해요' },
        { 'item': '와이드 팬츠', 'reason': '세련된 느낌을 더해요' },
      ],
    'insight': '허리를 강조하는 벨트 코디가 당신의 체형을 더 돋보이게 해요',
    'colorTips': ['균형 잡힌 체형이므로 대부분의 색상 조합이 잘 어울려요'],
  }

color_recommendations:
  {
    'topColors': ['코랄', '피치', '민트', '라벤더'],
    'bottomColors': ['베이지', '화이트', '그레이'],
    'avoidColors': ['블랙 전체', '네이비 전체'],
    'bestCombinations':
      [
        { 'top': '코랄', 'bottom': '베이지' },
        { 'top': '민트', 'bottom': '화이트' },
        { 'top': '라벤더', 'bottom': '그레이' },
      ],
    'accessories': ['실버 주얼리', '파스텔 스카프'],
  }
```

---

## 🔐 Row Level Security (RLS)

> **마이그레이션**: `supabase/migrations/202512220100_phase1_rls_policies.sql`

### Phase 1 테이블 RLS 정책

```sql
-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_color_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE skin_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_analyses ENABLE ROW LEVEL SECURITY;

-- users 정책 (SELECT, UPDATE, INSERT)
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- personal_color_assessments 정책 (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Users can view own PC assessments"
  ON personal_color_assessments FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own PC assessments"
  ON personal_color_assessments FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own PC assessments"
  ON personal_color_assessments FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own PC assessments"
  ON personal_color_assessments FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- skin_analyses 정책 (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Users can view own skin analyses"
  ON skin_analyses FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own skin analyses"
  ON skin_analyses FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own skin analyses"
  ON skin_analyses FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own skin analyses"
  ON skin_analyses FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- body_analyses 정책 (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Users can view own body analyses"
  ON body_analyses FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own body analyses"
  ON body_analyses FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own body analyses"
  ON body_analyses FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own body analyses"
  ON body_analyses FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');
```

### 참고: current_setting 파라미터

- `current_setting('request.jwt.claims', true)`: 두 번째 파라미터 `true`는 설정이 없을 때 NULL 반환
- Clerk JWT의 `sub` 클레임에서 `clerk_user_id` 추출

---

## 📦 Storage 버킷 설정

```sql
-- Storage 버킷 생성 (Supabase Dashboard에서)
-- 1. personal-color-images (PC-1 얼굴 사진)
-- 2. skin-images (S-1 피부 사진)
-- 3. body-images (C-1 체형 사진)

-- 또는 SQL로:
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('personal-color-images', 'personal-color-images', true),
  ('skin-images', 'skin-images', true),
  ('body-images', 'body-images', true);

-- Storage RLS 정책
CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('personal-color-images', 'skin-images', 'body-images')
    AND (storage.foldername(name))[1] = current_setting('request.jwt.claims')::json->>'sub'
  );

CREATE POLICY "Users can view own images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id IN ('personal-color-images', 'skin-images', 'body-images')
    AND (storage.foldername(name))[1] = current_setting('request.jwt.claims')::json->>'sub'
  );
```

---

## 🔗 API 구현 예제

### 1. 퍼스널 컬러 저장

```typescript
// app/api/analyze/personal-color/route.ts
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { analyzePersonalColor } from '@/lib/gemini';

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { questionnaireAnswers, imageBase64 } = await req.json();

  // Gemini 분석
  const pcResult = await analyzePersonalColor(questionnaireAnswers, imageBase64);

  // 이미지 업로드
  const supabase = createClient();
  const fileName = `${userId}/${Date.now()}.jpg`;
  const { data: uploadData } = await supabase.storage
    .from('personal-color-images')
    .upload(fileName, imageBase64);

  // 결과 저장
  const { data, error } = await supabase
    .from('personal_color_assessments')
    .insert({
      clerk_user_id: userId,
      questionnaire_answers: questionnaireAnswers,
      face_image_url: uploadData?.path,
      season: pcResult.season,
      undertone: pcResult.undertone,
      confidence: pcResult.confidence,
      season_scores: pcResult.seasonScores,
      image_analysis: pcResult.imageAnalysis,
      best_colors: pcResult.bestColors,
      worst_colors: pcResult.worstColors,
      makeup_recommendations: pcResult.makeupRecommendations,
      fashion_recommendations: pcResult.fashionRecommendations,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
```

### 2. 피부 분석 저장 (PC 연동)

```typescript
// app/api/analyze/skin/route.ts
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeSkinImage, analyzeIngredients } from '@/lib/gemini';

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { imageBase64 } = await req.json();
  const supabase = createClient();

  // 퍼스널 컬러 조회 (자동 연동)
  const { data: pcData } = await supabase
    .from('personal_color_assessments')
    .select('season')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const personalColorSeason = pcData?.season;

  // Gemini 피부 분석 (PC 정보 포함)
  const skinResult = await analyzeSkinImage(imageBase64, personalColorSeason);

  // 성분 분석
  const ingredientResult = await analyzeIngredients(
    skinResult.recommendedProducts,
    skinResult.skinType,
    skinResult.sensitivity
  );

  // 이미지 업로드
  const fileName = `${userId}/${Date.now()}.jpg`;
  const { data: uploadData } = await supabase.storage
    .from('skin-images')
    .upload(fileName, imageBase64);

  // 결과 저장
  const { data, error } = await supabase
    .from('skin_analyses')
    .insert({
      clerk_user_id: userId,
      image_url: uploadData?.path,
      skin_type: skinResult.skinType,
      hydration: skinResult.hydration,
      oil_level: skinResult.oilLevel,
      pores: skinResult.pores,
      pigmentation: skinResult.pigmentation,
      wrinkles: skinResult.wrinkles,
      sensitivity: skinResult.sensitivity,
      overall_score: skinResult.overallScore,
      recommendations: skinResult.recommendations,
      products: skinResult.products,
      ingredient_warnings: ingredientResult.warnings,
      personal_color_season: personalColorSeason,
      foundation_recommendation: skinResult.foundationRecommendation,
    })
    .select()
    .single();

  return Response.json(data);
}
```

### 3. 통합 데이터 조회

```typescript
// app/api/user/integrated-data/route.ts
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();

  // 병렬 조회
  const [pcResult, skinResult, bodyResult] = await Promise.all([
    supabase
      .from('personal_color_assessments')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('skin_analyses')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('body_analyses')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  return Response.json({
    personalColor: pcResult.data,
    skinAnalyses: skinResult.data,
    bodyAnalyses: bodyResult.data,
  });
}
```

---

## ✅ 체크리스트

```yaml
Database 설정: □ Supabase 프로젝트 생성
  □ users 테이블 생성
  □ personal_color_assessments 테이블 생성
  □ skin_analyses 테이블 생성
  □ body_analyses 테이블 생성
  □ 모든 인덱스 생성
  □ updated_at 트리거 생성
  □ RLS 정책 설정

Storage 설정: □ personal-color-images 버킷
  □ skin-images 버킷
  □ body-images 버킷
  □ Storage RLS 정책

Clerk 연동: □ clerk_user_id 필드 확인
  □ API Route auth 체크
  □ 데이터 저장 테스트
  □ 데이터 조회 테스트

퍼스널 컬러 통합: □ PC 진단 저장
  □ S-1에서 PC 자동 조회
  □ C-1에서 PC 자동 조회
  □ 통합 추천 작동
```

---

## 5. cosmetic_products 테이블 (Product DB v1)

### SQL 생성문

```sql
-- 화장품 제품 테이블
CREATE TABLE cosmetic_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL, -- cleanser, toner, serum, moisturizer, sunscreen, mask, makeup
  subcategory TEXT,
  price_range TEXT CHECK (price_range IN ('budget', 'mid', 'premium')),
  price_krw INTEGER,
  skin_types TEXT[], -- dry, oily, combination, sensitive, normal
  concerns TEXT[], -- acne, aging, whitening, hydration, pore, redness
  key_ingredients TEXT[],
  avoid_ingredients TEXT[],
  personal_color_seasons TEXT[], -- Spring, Summer, Autumn, Winter
  target_age_groups TEXT[] DEFAULT ARRAY['20s', '30s']::TEXT[], -- 10s, 20s, 30s, 40s, 50s
  image_url TEXT,
  purchase_url TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS 정책

- **공개 읽기**: 모든 사용자가 활성화된 제품 조회 가능
- **쓰기**: Service Role만 가능 (관리자)

---

## 6. supplement_products 테이블 (Product DB v1)

### SQL 생성문

```sql
-- 영양제 제품 테이블
CREATE TABLE supplement_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL, -- vitamin, mineral, protein, omega, probiotic, collagen, other
  benefits TEXT[], -- skin, hair, energy, immunity, digestion, sleep, muscle, bone
  main_ingredients JSONB, -- [{name, amount, unit}]
  target_concerns TEXT[],
  price_krw INTEGER,
  dosage TEXT,
  serving_size INTEGER,
  total_servings INTEGER,
  image_url TEXT,
  purchase_url TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,
  warnings TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS 정책

- **공개 읽기**: 모든 사용자가 활성화된 제품 조회 가능
- **쓰기**: Service Role만 가능 (관리자)

---

## 7. workout_equipment 테이블 (Product DB v2)

### SQL 생성문

```sql
-- 운동 기구 제품 테이블
CREATE TABLE workout_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL, -- dumbbell, barbell, kettlebell, resistance_band, etc.
  subcategory TEXT,

  -- 가격 정보
  price_krw INTEGER,
  price_range TEXT, -- budget, mid, premium

  -- 제품 스펙
  weight_kg DECIMAL(5,2),
  weight_range TEXT, -- 조절식 범위 (예: "2-20kg")
  material TEXT,
  size TEXT,
  color_options TEXT[],

  -- 용도
  target_muscles TEXT[], -- chest, back, shoulders, arms, legs, core, full_body
  exercise_types TEXT[], -- strength, cardio, flexibility, balance, plyometric
  skill_level TEXT, -- beginner, intermediate, advanced, all
  use_location TEXT, -- home, gym, outdoor, all

  -- 메타데이터
  image_url TEXT,
  purchase_url TEXT,
  affiliate_url TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,

  -- 특징
  features TEXT[],
  pros TEXT[],
  cons TEXT[],

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 필드 설명

```yaml
category: TEXT (CHECK)
  - dumbbell, barbell, kettlebell, resistance_band
  - pull_up_bar, yoga_mat, foam_roller, jump_rope
  - ab_roller, bench, rack, cardio, accessory, wearable, other

target_muscles: TEXT[]
  - chest, back, shoulders, arms, legs, core, full_body

exercise_types: TEXT[]
  - strength, cardio, flexibility, balance, plyometric

skill_level: TEXT
  - beginner, intermediate, advanced, all

use_location: TEXT
  - home, gym, outdoor, all
```

### RLS 정책

- **공개 읽기**: 활성화된 제품만 조회 가능
- **쓰기**: Service Role만 가능 (관리자)

---

## 8. health_foods 테이블 (Product DB v2)

### SQL 생성문

```sql
-- 건강식품 제품 테이블
CREATE TABLE health_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL, -- protein_powder, protein_bar, bcaa, creatine, etc.
  subcategory TEXT, -- whey, casein, plant-based

  -- 가격 정보
  price_krw INTEGER,
  price_per_serving INTEGER,

  -- 영양 정보 (1회 섭취량 기준)
  serving_size TEXT,
  servings_per_container INTEGER,
  calories_per_serving INTEGER,
  protein_g DECIMAL(5,1),
  carbs_g DECIMAL(5,1),
  sugar_g DECIMAL(5,1),
  fat_g DECIMAL(5,1),
  fiber_g DECIMAL(5,1),
  sodium_mg INTEGER,
  additional_nutrients JSONB, -- [{name, amount, unit, daily_value_percent}]

  -- 특성
  flavor_options TEXT[],
  dietary_info TEXT[], -- vegan, gluten_free, lactose_free, keto, etc.
  allergens TEXT[],

  -- 용도
  benefits TEXT[], -- muscle_gain, weight_loss, energy, recovery, etc.
  best_time TEXT, -- pre_workout, post_workout, morning, anytime
  target_users TEXT[], -- athletes, beginners, weight_loss, muscle_gain

  -- 메타데이터
  image_url TEXT,
  purchase_url TEXT,
  affiliate_url TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,
  features TEXT[],
  taste_rating DECIMAL(2,1),
  mixability_rating DECIMAL(2,1),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 필드 설명

```yaml
category: TEXT (CHECK)
  - protein_powder, protein_bar, meal_replacement
  - energy_drink, sports_drink, bcaa, creatine
  - pre_workout, post_workout, diet_food
  - healthy_snack, superfood, functional_food, other

dietary_info: TEXT[]
  - vegan, gluten_free, lactose_free
  - keto, sugar_free, organic

benefits: TEXT[]
  - muscle_gain, weight_loss, energy
  - recovery, endurance

target_users: TEXT[]
  - athletes, beginners, weight_loss, muscle_gain
```

### RLS 정책

- **공개 읽기**: 활성화된 제품만 조회 가능
- **쓰기**: Service Role만 가능 (관리자)

---

## 9. product_price_history 테이블 (가격 추적)

### SQL 생성문

```sql
-- 제품 가격 변동 히스토리
CREATE TABLE product_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type TEXT NOT NULL, -- cosmetic, supplement, workout_equipment, health_food
  product_id UUID NOT NULL,
  price_krw INTEGER NOT NULL,
  source TEXT, -- 가격 출처 (naver, coupang, oliveyoung, mock)
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 필드 설명

```yaml
product_type: TEXT (CHECK)
  - cosmetic: 화장품
  - supplement: 영양제
  - workout_equipment: 운동 기구
  - health_food: 건강식품

source: TEXT
  - naver: 네이버 쇼핑
  - coupang: 쿠팡
  - oliveyoung: 올리브영
  - mock: 테스트용
```

### RLS 정책

- **공개 읽기**: 모든 사용자 조회 가능
- **쓰기**: Service Role만 가능 (관리자)

---

## 10. N-1 영양 모듈 테이블 (Phase 2)

### 10.1 foods 테이블 (음식 DB)

```sql
CREATE TABLE foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL,
  serving_size TEXT DEFAULT '1인분',
  serving_grams INTEGER,
  calories INTEGER NOT NULL,
  protein DECIMAL(5,1),
  carbs DECIMAL(5,1),
  fat DECIMAL(5,1),
  fiber DECIMAL(5,1),
  sugar DECIMAL(5,1),
  sodium INTEGER,
  traffic_light TEXT CHECK (traffic_light IN ('green', 'yellow', 'red')),
  is_korean BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.2 nutrition_settings 테이블 (영양 설정)

```sql
CREATE TABLE nutrition_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  goal TEXT NOT NULL CHECK (goal IN ('weight_loss', 'maintain', 'muscle', 'skin', 'health')),
  bmr DECIMAL(6,1),
  tdee DECIMAL(6,1),
  daily_calorie_target INTEGER,
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  meal_style TEXT,
  cooking_skill TEXT,
  budget TEXT,
  allergies TEXT[] DEFAULT '{}',
  disliked_foods TEXT[] DEFAULT '{}',
  meal_count INTEGER DEFAULT 3,
  protein_target INTEGER,
  carbs_target INTEGER,
  fat_target INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.3 meal_records 테이블 (식단 기록)

```sql
CREATE TABLE meal_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_time TIME,
  record_type TEXT NOT NULL DEFAULT 'manual',
  foods JSONB NOT NULL DEFAULT '[]',
  total_calories INTEGER DEFAULT 0,
  total_protein DECIMAL(5,1) DEFAULT 0,
  total_carbs DECIMAL(5,1) DEFAULT 0,
  total_fat DECIMAL(5,1) DEFAULT 0,
  total_sodium INTEGER DEFAULT 0,
  total_sugar DECIMAL(5,1) DEFAULT 0,
  ai_recognized_food TEXT,
  ai_confidence TEXT,
  ai_raw_response JSONB,
  user_confirmed BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.4 water_records 테이블 (수분 섭취)

```sql
CREATE TABLE water_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  record_time TIME DEFAULT CURRENT_TIME,
  amount_ml INTEGER NOT NULL,
  drink_type TEXT DEFAULT 'water',
  hydration_factor DECIMAL(3,2) DEFAULT 1.0,
  effective_ml INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.5 기타 N-1 테이블

- **favorite_foods**: 즐겨찾기 음식
- **nutrition_streaks**: 식단 연속 기록
- **daily_nutrition_summary**: 일일 영양 요약
- **fasting_records**: 간헐적 단식 기록

> 상세 스키마: `apps/web/supabase/migrations/N1_combined_migration.sql` 참조

---

## 11. user_wishlists 테이블 (위시리스트)

```sql
CREATE TABLE user_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('cosmetic', 'supplement', 'workout_equipment', 'health_food')),
  product_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 중복 방지
  UNIQUE(clerk_user_id, product_type, product_id)
);

-- RLS: 본인 데이터만 접근 가능
CREATE POLICY "Users can view own wishlists" ON user_wishlists FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');
CREATE POLICY "Users can insert own wishlists" ON user_wishlists FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');
CREATE POLICY "Users can delete own wishlists" ON user_wishlists FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');
```

> 마이그레이션: `supabase/migrations/20251211_wishlist.sql`

---

## 12. feature_flags 테이블 (기능 플래그)

```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 플래그 (12개)
-- analysis_personal_color, analysis_skin, analysis_body
-- workout_module, nutrition_module, reports_module
-- product_recommendations, product_wishlist, ai_qa
-- ingredient_warning, price_crawler, share_results

-- RLS: 모든 사용자 읽기 가능, 관리자만 수정
CREATE POLICY "Anyone can read feature flags" ON feature_flags FOR SELECT USING (true);
CREATE POLICY "Service role can manage" ON feature_flags FOR ALL USING (auth.role() = 'service_role');
```

---

## 13. admin_logs 테이블 (관리자 로그)

```sql
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  action TEXT NOT NULL,          -- 'product.create', 'feature.toggle' 등
  target_type TEXT,              -- 'product', 'feature', 'user'
  target_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Service Role만 접근
CREATE POLICY "Service role only" ON admin_logs FOR ALL USING (auth.role() = 'service_role');
```

> 마이그레이션: `supabase/migrations/20251211_admin_features.sql`

---

## 14. product_reviews 테이블 (Phase G - Sprint 1)

```sql
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 제품 참조 (다형성)
  product_type TEXT NOT NULL CHECK (product_type IN ('cosmetic', 'supplement', 'equipment', 'healthfood')),
  product_id UUID NOT NULL,

  -- 리뷰 내용
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,

  -- 메타데이터
  helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 사용자당 제품별 1개 리뷰 제한
  UNIQUE(clerk_user_id, product_type, product_id)
);

-- RLS: 공개 읽기, 인증된 사용자 작성, 본인만 수정/삭제
```

> 마이그레이션: `supabase/migrations/202512190300_product_reviews.sql`

---

## 15. review_helpful 테이블 (Phase G - Sprint 1)

```sql
CREATE TABLE review_helpful (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 사용자당 리뷰별 1번만 도움됨 표시
  UNIQUE(review_id, clerk_user_id)
);

-- RLS: 공개 읽기, 인증된 사용자 작성, 본인만 삭제
-- 트리거: helpful_count 자동 갱신
```

---

## 16. ingredient_interactions 테이블 (Phase G - Sprint 2)

```sql
CREATE TABLE ingredient_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 성분 쌍
  ingredient_a TEXT NOT NULL,
  ingredient_b TEXT NOT NULL,

  -- 상호작용 유형
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'contraindication',  -- 금기 (절대 같이 복용 X)
    'caution',           -- 주의 (의사 상담 권장)
    'synergy',           -- 시너지 (같이 먹으면 좋음)
    'timing'             -- 시간 분리 필요
  )),

  -- 심각도
  severity TEXT CHECK (severity IN ('high', 'medium', 'low')),

  -- 상세 정보
  description TEXT NOT NULL,
  recommendation TEXT,
  source TEXT,           -- 출처 (논문, FDA 등)

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(ingredient_a, ingredient_b, interaction_type)
);

-- RLS: 공개 읽기 전용 (service_role만 수정)
-- 초기 시드: 24개 상호작용 데이터
```

> 마이그레이션: `supabase/migrations/202512190200_ingredient_interactions.sql`

---

## 17. affiliate_clicks 테이블 (Phase G - Sprint 3)

```sql
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 사용자 (비로그인도 가능)
  clerk_user_id TEXT,

  -- 제품 정보
  product_type TEXT NOT NULL CHECK (product_type IN ('cosmetic', 'supplement', 'equipment', 'healthfood')),
  product_id UUID NOT NULL,

  -- 트래킹 정보
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,  -- 개인정보 보호를 위해 해시

  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: 모든 사용자 삽입 가능, 읽기는 service_role만
-- 뷰: affiliate_daily_stats (일별 통계)
```

> 마이그레이션: `supabase/migrations/202512190100_affiliate_system.sql`

---

## 18. daily_checkins 테이블 (일일 체크인)

일일 체크인 - "오늘의 나" 기분/에너지/피부 상태 기록

### SQL 생성문

```sql
CREATE TABLE daily_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

    -- 체크인 데이터
    mood TEXT NOT NULL CHECK (mood IN ('great', 'okay', 'bad')),
    energy TEXT NOT NULL CHECK (energy IN ('high', 'medium', 'low')),
    skin_condition TEXT NOT NULL CHECK (skin_condition IN ('great', 'okay', 'bad')),

    -- 추가 메모 (선택적)
    notes TEXT,

    -- 체크인 시간
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- 하루에 하나의 체크인만 허용
    UNIQUE(clerk_user_id, check_date)
);
```

### 필드 설명

```yaml
mood:
  - great: 좋아요 😊
  - okay: 보통이에요 😐
  - bad: 안 좋아요 😔

energy:
  - high: 활력 넘쳐요 ⚡
  - medium: 적당해요 🔋
  - low: 피곤해요 🪫

skin_condition:
  - great: 촉촉해요 ✨
  - okay: 괜찮아요 👌
  - bad: 건조/트러블 😣
```

> 마이그레이션: `supabase/migrations/202512220200_daily_checkins.sql`

---

## 19. user_notification_settings 테이블 (알림 설정)

사용자별 알림 설정 저장

### SQL 생성문

```sql
CREATE TABLE user_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,

  -- 전역 설정
  enabled BOOLEAN DEFAULT false,

  -- 운동 알림
  workout_reminder BOOLEAN DEFAULT true,
  workout_reminder_time TIME DEFAULT '09:00',
  streak_warning BOOLEAN DEFAULT true,

  -- 영양 알림
  nutrition_reminder BOOLEAN DEFAULT true,
  meal_reminder_breakfast TIME DEFAULT '08:30',
  meal_reminder_lunch TIME DEFAULT '12:30',
  meal_reminder_dinner TIME DEFAULT '18:30',
  water_reminder BOOLEAN DEFAULT true,
  water_reminder_interval INTEGER DEFAULT 2,  -- 시간 간격

  -- 소셜/성취 알림
  social_notifications BOOLEAN DEFAULT true,
  achievement_notifications BOOLEAN DEFAULT true,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_notification_settings_clerk_user_id
  ON user_notification_settings(clerk_user_id);

-- 코멘트
COMMENT ON TABLE user_notification_settings IS '사용자별 알림 설정';
COMMENT ON COLUMN user_notification_settings.water_reminder_interval IS '수분 섭취 알림 간격 (시간)';
```

### 필드 설명

```yaml
enabled: BOOLEAN
  - 전역 알림 ON/OFF
  - false일 경우 모든 알림 비활성화

workout_reminder: BOOLEAN
  - 운동 리마인더 활성화 여부

workout_reminder_time: TIME
  - 운동 리마인더 시간
  - 기본값: 09:00

streak_warning: BOOLEAN
  - 연속 기록 끊김 경고 알림

nutrition_reminder: BOOLEAN
  - 식사 리마인더 활성화 여부

meal_reminder_*: TIME
  - 아침/점심/저녁 리마인더 시간

water_reminder: BOOLEAN
  - 수분 섭취 리마인더 활성화 여부

water_reminder_interval: INTEGER
  - 수분 섭취 알림 간격 (시간 단위)
  - 기본값: 2 (2시간마다)

social_notifications: BOOLEAN
  - 친구 요청, 챌린지 초대 등 소셜 알림

achievement_notifications: BOOLEAN
  - 뱃지 획득, 레벨업 등 성취 알림
```

### RLS 정책

```sql
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification settings"
  ON user_notification_settings FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own notification settings"
  ON user_notification_settings FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own notification settings"
  ON user_notification_settings FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');
```

---

## 20. user_push_tokens 테이블 (푸시 토큰)

사용자 기기별 푸시 알림 토큰 저장

### SQL 생성문

```sql
CREATE TABLE user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 토큰 정보
  push_token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  device_name TEXT,

  -- 상태
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 사용자-토큰 조합 유니크
  UNIQUE (clerk_user_id, push_token)
);

-- 인덱스
CREATE INDEX idx_push_tokens_clerk_user_id
  ON user_push_tokens(clerk_user_id);
CREATE INDEX idx_push_tokens_is_active
  ON user_push_tokens(is_active) WHERE is_active = true;

-- 코멘트
COMMENT ON TABLE user_push_tokens IS '사용자 기기별 푸시 알림 토큰';
COMMENT ON COLUMN user_push_tokens.platform IS '플랫폼 (ios, android, web)';
COMMENT ON COLUMN user_push_tokens.is_active IS '토큰 활성 상태 (만료/로그아웃 시 false)';
```

### 필드 설명

```yaml
push_token: TEXT
  - Expo/FCM/APNs 푸시 토큰
  - Expo: ExponentPushToken[...]
  - FCM: 디바이스 토큰

platform: TEXT (CHECK)
  - ios: iOS 앱
  - android: Android 앱
  - web: 웹 푸시 (PWA)

device_name: TEXT
  - 기기 이름 (선택적)
  - 예: "iPhone 15 Pro", "Galaxy S24"

is_active: BOOLEAN
  - 토큰 활성 상태
  - 로그아웃/토큰 만료 시 false

last_used_at: TIMESTAMPTZ
  - 마지막 푸시 발송 시간
  - 비활성 토큰 정리에 활용
```

### RLS 정책

```sql
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push tokens"
  ON user_push_tokens FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own push tokens"
  ON user_push_tokens FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own push tokens"
  ON user_push_tokens FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own push tokens"
  ON user_push_tokens FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');
```

---

## 21. workout_analyses 테이블 (W-1 운동 분석)

사용자의 운동 목표, 유형, 빈도 분석 결과

### SQL 생성문

```sql
CREATE TABLE workout_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  body_analysis_id UUID,
  personal_color_id UUID,
  workout_type TEXT,
  workout_type_reason TEXT,
  workout_type_confidence DECIMAL(3,2),
  goals TEXT[] DEFAULT '{}',
  concerns TEXT[] DEFAULT '{}',
  frequency TEXT,
  location TEXT,
  equipment TEXT[] DEFAULT '{}',
  injuries TEXT[] DEFAULT '{}',
  target_weight DECIMAL(5,2),
  target_date DATE,
  specific_goal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_analyses_user ON workout_analyses(user_id);
ALTER TABLE workout_analyses ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE workout_analyses IS 'W-1 운동 분석 - 사용자 운동 목표 및 분석';
```

---

## 22. workout_plans 테이블 (주간 운동 계획)

주간 운동 플랜 저장

### SQL 생성문

```sql
CREATE TABLE workout_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  analysis_id UUID REFERENCES workout_analyses(id) ON DELETE SET NULL,
  week_start_date DATE NOT NULL,
  week_number INTEGER DEFAULT 1,
  daily_plans JSONB NOT NULL DEFAULT '[]',
  total_workout_days INTEGER DEFAULT 0,
  total_estimated_minutes INTEGER DEFAULT 0,
  total_estimated_calories INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_plans_user ON workout_plans(user_id);
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE workout_plans IS 'W-1 운동 플랜 - 주간 운동 계획';
```

---

## 23. workout_logs 테이블 (일일 운동 기록)

일일 운동 수행 기록

### SQL 생성문

```sql
CREATE TABLE workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ,
  actual_duration INTEGER,
  actual_calories INTEGER,
  exercise_logs JSONB NOT NULL DEFAULT '[]',
  total_volume INTEGER DEFAULT 0,
  perceived_effort INTEGER CHECK (perceived_effort >= 1 AND perceived_effort <= 10),
  notes TEXT,
  mood TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_logs_user_date ON workout_logs(user_id, workout_date);
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE workout_logs IS 'W-1 운동 기록 - 일일 운동 로그';
```

---

## 24. workout_streaks 테이블 (운동 연속 기록)

사용자별 운동 연속 기록 (스트릭)

### SQL 생성문

```sql
CREATE TABLE workout_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_workout_date DATE,
  total_workouts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_streaks_user ON workout_streaks(user_id);
ALTER TABLE workout_streaks ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE workout_streaks IS 'W-1 운동 스트릭 - 연속 운동 기록';
```

---

## 25. hair_analyses 테이블 (H-1 헤어 분석)

모발 및 두피 분석 결과

### SQL 생성문

```sql
CREATE TABLE hair_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  image_url TEXT,

  -- 모발 타입
  hair_type TEXT CHECK (hair_type IN ('straight', 'wavy', 'curly', 'coily')),
  hair_thickness TEXT CHECK (hair_thickness IN ('fine', 'medium', 'thick')),
  scalp_type TEXT CHECK (scalp_type IN ('dry', 'normal', 'oily', 'sensitive')),

  -- 분석 지표 (0-100)
  hydration SMALLINT CHECK (hydration >= 0 AND hydration <= 100),
  scalp_health SMALLINT CHECK (scalp_health >= 0 AND scalp_health <= 100),
  damage_level SMALLINT CHECK (damage_level >= 0 AND damage_level <= 100),
  density SMALLINT CHECK (density >= 0 AND density <= 100),
  elasticity SMALLINT CHECK (elasticity >= 0 AND elasticity <= 100),
  shine SMALLINT CHECK (shine >= 0 AND shine <= 100),

  -- 종합 점수
  overall_score SMALLINT CHECK (overall_score >= 0 AND overall_score <= 100),

  -- 고민 및 추천 (JSON)
  concerns JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hair_analyses_clerk_user_id ON hair_analyses(clerk_user_id);
ALTER TABLE hair_analyses ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE hair_analyses IS 'H-1 헤어 분석 결과 저장';
COMMENT ON COLUMN hair_analyses.hair_type IS '모발 타입 (직모, 웨이브, 곱슬, 강한 곱슬)';
COMMENT ON COLUMN hair_analyses.scalp_type IS '두피 타입 (건성, 중성, 지성, 민감성)';
```

---

## 26. mental_health_logs 테이블 (M-1 정신건강)

일일 정신건강 체크인 (기분, 스트레스, 수면)

### SQL 생성문

```sql
CREATE TABLE mental_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  log_date DATE NOT NULL,
  mood_score SMALLINT CHECK (mood_score BETWEEN 1 AND 5),
  stress_level SMALLINT CHECK (stress_level BETWEEN 1 AND 10),
  sleep_hours DECIMAL(3,1) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  sleep_quality SMALLINT CHECK (sleep_quality BETWEEN 1 AND 5),
  energy_level SMALLINT CHECK (energy_level BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 동일 사용자/날짜 중복 방지
  UNIQUE (clerk_user_id, log_date)
);

CREATE INDEX idx_mental_health_logs_user ON mental_health_logs(clerk_user_id);
CREATE INDEX idx_mental_health_logs_user_date ON mental_health_logs(clerk_user_id, log_date);
ALTER TABLE mental_health_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE mental_health_logs IS 'M-1 정신건강 트래킹 - 일일 체크인 기록';
```

---

## 27. user_product_shelf 테이블 (F-4 제품함)

사용자가 스캔하거나 등록한 제품 관리

### SQL 생성문

```sql
CREATE TABLE user_product_shelf (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,

  -- 제품 정보
  product_id UUID,
  product_name TEXT NOT NULL,
  product_brand TEXT,
  product_barcode TEXT,
  product_image_url TEXT,
  product_ingredients JSONB DEFAULT '[]',

  -- 스캔 정보
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  scan_method TEXT CHECK (scan_method IN ('barcode', 'ocr', 'search', 'manual')),

  -- 분석 결과
  compatibility_score INTEGER CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  analysis_result JSONB,

  -- 사용자 관리
  status TEXT NOT NULL DEFAULT 'owned' CHECK (status IN ('owned', 'wishlist', 'used_up', 'archived')),
  user_note TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),

  -- 날짜 관리
  purchased_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_product_shelf_user ON user_product_shelf(clerk_user_id);
CREATE INDEX idx_user_product_shelf_barcode ON user_product_shelf(product_barcode);
ALTER TABLE user_product_shelf ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE user_product_shelf IS '사용자 제품함 - 스캔한 제품 관리';
COMMENT ON COLUMN user_product_shelf.scan_method IS 'barcode: 바코드, ocr: 성분 OCR, search: 검색, manual: 수동 입력';
COMMENT ON COLUMN user_product_shelf.status IS 'owned: 보유, wishlist: 위시, used_up: 다 씀, archived: 보관';
```

---

## 28. affiliate_products 테이블 (어필리에이트 제품)

어필리에이트 파트너 제품 DB

### SQL 생성문

```sql
CREATE TABLE affiliate_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_url TEXT NOT NULL,
  image_url TEXT,
  price_krw INTEGER,
  commission_rate DECIMAL(5,2),
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliate_products_partner ON affiliate_products(partner_id);
ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 허용
CREATE POLICY "Anyone can view affiliate products" ON affiliate_products FOR SELECT USING (true);

COMMENT ON TABLE affiliate_products IS '어필리에이트 제품 DB';
```

---

## 29. skin_diary_entries 테이블 (피부 일기)

일일 피부 상태 기록

### SQL 생성문

```sql
CREATE TABLE skin_diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  skin_condition INTEGER CHECK (skin_condition >= 1 AND skin_condition <= 5),
  hydration_level INTEGER CHECK (hydration_level >= 1 AND hydration_level <= 5),
  oiliness_level INTEGER CHECK (oiliness_level >= 1 AND oiliness_level <= 5),
  concerns TEXT[] DEFAULT '{}',
  products_used TEXT[] DEFAULT '{}',
  notes TEXT,
  image_url TEXT,
  weather TEXT,
  sleep_hours DECIMAL(3,1),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skin_diary_user_date ON skin_diary_entries(clerk_user_id, entry_date);
ALTER TABLE skin_diary_entries ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE skin_diary_entries IS '피부 일기 - 일일 피부 상태 트래킹';
```

---

## 30. nutrition_streaks 테이블 (영양 연속 기록)

식단 기록 연속 유지 정보

### SQL 생성문

```sql
CREATE TABLE nutrition_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_record_date DATE,
  total_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nutrition_streaks_user ON nutrition_streaks(clerk_user_id);
ALTER TABLE nutrition_streaks ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE nutrition_streaks IS '영양 연속 기록 스트릭';
```

---

## 31. recipes 테이블 (레시피 DB)

영양 맞춤 레시피 메인 테이블

### SQL 생성문

```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 정보
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,

  -- 영양 정보
  calories INTEGER,
  protein DECIMAL(5,1),
  carbs DECIMAL(5,1),
  fat DECIMAL(5,1),

  -- 메타데이터
  cook_time INTEGER,  -- 조리 시간 (분)
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  servings INTEGER DEFAULT 1,

  -- 태그 및 목표
  nutrition_goals TEXT[],  -- ['diet', 'bulk', 'lean', 'maintenance']
  tags TEXT[],  -- 검색용 태그

  -- 조리법
  steps JSONB NOT NULL,  -- JSON 배열 형식
  tips TEXT[],

  -- 미디어
  image_url TEXT,
  source TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipes_nutrition_goals ON recipes USING GIN (nutrition_goals);
CREATE INDEX idx_recipes_tags ON recipes USING GIN (tags);
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 허용
CREATE POLICY "Anyone can view recipes" ON recipes FOR SELECT USING (true);

COMMENT ON TABLE recipes IS '레시피 메인 테이블 - 100+ 영양 맞춤 레시피';
COMMENT ON COLUMN recipes.nutrition_goals IS '영양 목표: diet, bulk, lean, maintenance';
COMMENT ON COLUMN recipes.difficulty IS '난이도: easy, medium, hard';
```

---

## 32. recipe_ingredients 테이블 (레시피 재료)

레시피별 필요 재료

### SQL 생성문

```sql
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2),
  unit TEXT,
  is_optional BOOLEAN DEFAULT FALSE,
  category TEXT,  -- vegetable, meat, seafood, dairy, grain, seasoning
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view recipe ingredients" ON recipe_ingredients FOR SELECT USING (true);

COMMENT ON TABLE recipe_ingredients IS '레시피 재료 목록';
COMMENT ON COLUMN recipe_ingredients.category IS '재료 분류: vegetable, meat, seafood 등';
```

---

## 33. user_favorite_recipes 테이블 (레시피 즐겨찾기)

사용자별 레시피 북마크

### SQL 생성문

```sql
CREATE TABLE user_favorite_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (clerk_user_id, recipe_id)
);

CREATE INDEX idx_user_favorite_recipes_user ON user_favorite_recipes(clerk_user_id);
ALTER TABLE user_favorite_recipes ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE user_favorite_recipes IS '사용자 즐겨찾기 레시피';
```

---

## 34. makeup_analyses 테이블 (메이크업 분석)

퍼스널컬러 기반 메이크업 추천

### SQL 생성문

```sql
CREATE TABLE makeup_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  personal_color_id UUID,
  skin_analysis_id UUID,
  makeup_style TEXT,
  color_recommendations JSONB DEFAULT '{}',
  product_recommendations JSONB DEFAULT '{}',
  tips TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_makeup_analyses_user ON makeup_analyses(clerk_user_id);
ALTER TABLE makeup_analyses ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE makeup_analyses IS '메이크업 분석 - PC 기반 색상/제품 추천';
```

---

## 35. user_size_history 테이블 (신체 사이즈 기록)

신체 치수 변화 이력

### SQL 생성문

```sql
CREATE TABLE user_size_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  recorded_date DATE DEFAULT CURRENT_DATE,
  height_cm DECIMAL(5,1),
  weight_kg DECIMAL(5,1),
  chest_cm DECIMAL(5,1),
  waist_cm DECIMAL(5,1),
  hip_cm DECIMAL(5,1),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_size_history_user ON user_size_history(clerk_user_id);
ALTER TABLE user_size_history ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE user_size_history IS '신체 사이즈 기록 - 변화 추적';
```

---

## 36. user_shopping_preferences 테이블 (쇼핑 선호도)

사용자별 쇼핑 취향 저장

### SQL 생성문

```sql
CREATE TABLE user_shopping_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  budget_range TEXT,
  preferred_brands TEXT[] DEFAULT '{}',
  avoided_brands TEXT[] DEFAULT '{}',
  preferred_stores TEXT[] DEFAULT '{}',
  style_preferences TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_shopping_preferences ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE user_shopping_preferences IS '쇼핑 선호도 - 예산/브랜드/스타일';
```

---

## 37. price_watches 테이블 (가격 알림)

제품 가격 변동 알림 설정

### SQL 생성문

```sql
CREATE TABLE price_watches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  product_type TEXT NOT NULL,
  product_id UUID,
  product_name TEXT NOT NULL,
  target_price INTEGER,
  current_price INTEGER,
  is_active BOOLEAN DEFAULT true,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_watches_user ON price_watches(clerk_user_id);
ALTER TABLE price_watches ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE price_watches IS '가격 알림 - 목표가 도달 시 알림';
```

---

## 38. smart_notifications 테이블 (스마트 알림)

사용자별 스마트 알림 발송 내역

### SQL 생성문

```sql
CREATE TABLE smart_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_smart_notifications_user ON smart_notifications(clerk_user_id, is_read);
ALTER TABLE smart_notifications ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE smart_notifications IS '스마트 알림 - 개인화된 알림 내역';
```

---

**버전**: v6.0 (마이그레이션 동기화 완료)
**최종 업데이트**: 2026년 2월 1일
**상태**: Phase 1 + Phase 2 + Phase G + Phase H + W-1 + H-1 + M-1 + K 동기화 완료 ✅
