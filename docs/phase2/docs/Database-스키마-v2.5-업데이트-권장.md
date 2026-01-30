# 📊 Database 스키마 v2.5 업데이트 권장사항

**작성일**: 2025-11-27  
**목적**: N-1/W-1 모듈 지원을 위한 기존 테이블 확장  
**상태**: [ ] 승인 대기 / [ ] 구현 완료

---

## 📋 개요

N-1 영양/식단 분석 모듈의 BMR(기초대사량)/TDEE(활동대사량) 계산을 위해 
기존 테이블에 추가 필드가 필요합니다.

```
BMR 공식 (Harris-Benedict):
  남성: BMR = 88.362 + (13.397 × 체중) + (4.799 × 키) - (5.677 × 나이)
  여성: BMR = 447.593 + (9.247 × 체중) + (3.098 × 키) - (4.330 × 나이)

필요한 데이터:
  - 성별 ← users.gender (신규)
  - 나이 ← users.birth_date (신규)
  - 키 ← body_analyses.height (신규)
  - 몸무게 ← body_analyses.weight (신규)
```

---

## 1. users 테이블 확장

### 1.1 추가 필드

```sql
-- users 테이블에 프로필 필드 추가
ALTER TABLE users ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'other'));
ALTER TABLE users ADD COLUMN birth_date DATE;

-- 코멘트
COMMENT ON COLUMN users.gender IS '성별 (male/female/other) - BMR 계산용';
COMMENT ON COLUMN users.birth_date IS '생년월일 - 나이 계산용';
```

### 1.2 변경 후 스키마

```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  profile_image_url TEXT,
  
  -- ⭐ v2.5 추가 필드
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  birth_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.3 영향 범위

| 모듈 | 용도 | 필수 여부 |
|------|------|----------|
| N-1 | BMR 계산 | 필수 |
| W-1 | 운동 강도 조절 | 권장 |
| C-1 | 체형 분석 정확도 | 선택 |
| S-1 | 피부 분석 | 선택 |

---

## 2. body_analyses 테이블 확장

### 2.1 추가 필드

```sql
-- body_analyses 테이블에 키/몸무게 추가
ALTER TABLE body_analyses ADD COLUMN height DECIMAL(5,1);  -- cm
ALTER TABLE body_analyses ADD COLUMN weight DECIMAL(5,1);  -- kg

-- 인덱스 추가 (최신 분석 조회용)
CREATE INDEX idx_body_analyses_user_latest 
  ON body_analyses(user_id, created_at DESC);

-- 코멘트
COMMENT ON COLUMN body_analyses.height IS '키 (cm) - 사용자 직접 입력';
COMMENT ON COLUMN body_analyses.weight IS '몸무게 (kg) - 사용자 직접 입력';
```

### 2.2 변경 후 스키마

```sql
CREATE TABLE body_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  
  -- 이미지 정보
  image_url TEXT NOT NULL,
  
  -- ⭐ v2.5 추가 필드
  height DECIMAL(5,1),  -- cm
  weight DECIMAL(5,1),  -- kg
  
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
  colors JSONB,
  
  -- 퍼스널 컬러 연동
  personal_color_season TEXT,
  color_recommendations JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 영향 범위

| 모듈 | 용도 | 필수 여부 |
|------|------|----------|
| N-1 | BMR 계산 (최신 체중) | 필수 |
| W-1 | 운동 강도/무게 추천 | 필수 |
| C-1 | 체형 비율 분석 | 권장 |

---

## 3. 데이터 흐름

```
┌─────────────────────────────────────────────────────────────┐
│                      사용자 프로필                           │
├─────────────────────────────────────────────────────────────┤
│  users 테이블                                               │
│  ├─ gender: 성별                                           │
│  └─ birth_date: 생년월일 → 나이 계산                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      체형 분석 (C-1)                         │
├─────────────────────────────────────────────────────────────┤
│  body_analyses 테이블                                       │
│  ├─ height: 키 (cm)                                        │
│  └─ weight: 몸무게 (kg)                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   BMR/TDEE 계산 (N-1)                       │
├─────────────────────────────────────────────────────────────┤
│  계산 공식:                                                 │
│  BMR = 기초대사량 (성별, 나이, 키, 체중)                      │
│  TDEE = BMR × 활동계수 (nutrition_settings.activity_level)  │
│  목표 칼로리 = TDEE ± 조정값 (목표에 따라)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 마이그레이션 전략

### 4.1 단계별 실행

```sql
-- Step 1: users 테이블 확장 (중단 없음)
ALTER TABLE users ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'other'));
ALTER TABLE users ADD COLUMN birth_date DATE;

-- Step 2: body_analyses 테이블 확장 (중단 없음)
ALTER TABLE body_analyses ADD COLUMN height DECIMAL(5,1);
ALTER TABLE body_analyses ADD COLUMN weight DECIMAL(5,1);

-- Step 3: 인덱스 추가 (중단 없음)
CREATE INDEX idx_body_analyses_user_latest 
  ON body_analyses(user_id, created_at DESC);

-- Step 4: 코멘트 추가
COMMENT ON COLUMN users.gender IS '성별 (male/female/other) - BMR 계산용';
COMMENT ON COLUMN users.birth_date IS '생년월일 - 나이 계산용';
COMMENT ON COLUMN body_analyses.height IS '키 (cm) - 사용자 직접 입력';
COMMENT ON COLUMN body_analyses.weight IS '몸무게 (kg) - 사용자 직접 입력';
```

### 4.2 기존 데이터 처리

```yaml
기존 사용자:
  - gender, birth_date: NULL 허용
  - 다음 로그인 시 프로필 완성 유도
  - N-1 온보딩에서 입력 요청

기존 체형 분석:
  - height, weight: NULL 허용
  - 새 분석 시 필수 입력
  - N-1에서 C-1 분석 없으면 직접 입력 가능
```

---

## 5. 코드 변경 필요 사항

### 5.1 C-1 체형 분석 모듈

```typescript
// 체형 분석 시 키/몸무게 입력 추가 필요
interface BodyAnalysisInput {
  imageUrl: string;
  height: number;  // ⭐ 추가
  weight: number;  // ⭐ 추가
}
```

### 5.2 N-1 영양 분석 모듈

```typescript
// BMR 계산 시 데이터 조회
async function getUserProfile(userId: string) {
  // users에서 gender, birth_date 조회
  const user = await supabase
    .from('users')
    .select('gender, birth_date')
    .eq('id', userId)
    .single();
  
  // body_analyses에서 최신 height, weight 조회
  const body = await supabase
    .from('body_analyses')
    .select('height, weight')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return { ...user.data, ...body.data };
}
```

---

## 6. 검증 체크리스트

```yaml
마이그레이션 전:
  - [ ] 기존 데이터 백업
  - [ ] 테스트 환경에서 검증

마이그레이션 후:
  - [ ] users 테이블 필드 확인
  - [ ] body_analyses 테이블 필드 확인
  - [ ] 인덱스 생성 확인
  - [ ] 기존 기능 정상 동작 확인

기능 테스트:
  - [ ] C-1 체형 분석 시 키/몸무게 입력 가능
  - [ ] N-1 BMR 계산 정상 동작
  - [ ] 프로필 없는 경우 적절한 안내 표시
```

---

## 📎 관련 문서

> ⚠️ **참고**: 아래 문서들은 레거시 아카이브로 이동되었습니다.
> 최신 스펙은 [docs/specs/](../../specs/) 폴더를 참조하세요.

- N-1 기능 스펙 → [SDD-N1-NUTRITION.md](../../specs/SDD-N1-NUTRITION.md)
- W-1 기능 스펙 → [SDD-W1-WORKOUT.md](../../specs/SDD-W1-WORKOUT.md)
- Database 스키마 → [DATABASE-SCHEMA.md](../../DATABASE-SCHEMA.md)
