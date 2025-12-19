# Yiroom 전체 모듈 통합 가이드

**버전**: 1.0  
**작성일**: 2024년 12월  
**목적**: 5개 모듈(PC-1, S-1, C-1, W-1, N-1) 통합 및 개발 가이드

---

## 목차

1. [W-1 통합 JSON 스키마](#1-w-1-통합-json-스키마)
2. [모듈 연동 가이드](#2-모듈-연동-가이드)
3. [Yiroom 차별화 전략서](#3-yiroom-차별화-전략서)
4. [Claude Code 연동 가이드](#4-claude-code-연동-가이드)
5. [개발 우선순위 및 로드맵](#5-개발-우선순위-및-로드맵)

---

## 1. W-1 통합 JSON 스키마

### 1.1 운동 데이터 통합 스키마

W-1 모듈은 **필라테스(25개)**, **요가(20개)**, **스트레칭(25개)** 총 **70개 운동**을 포함합니다.

```json
{
  "W1_Exercise_Schema": {
    "exercise_id": {
      "type": "string",
      "pattern": "^(PIL|YOG|STR)-[A-Z0-9]{2,4}-\\d{3}$",
      "description": "운동 고유 ID (PIL: 필라테스, YOG: 요가, STR: 스트레칭)",
      "examples": ["PIL-HUN-001", "YOG-WAR-001", "STR-N01"]
    },
    "name": {
      "kr": "string (한국어명)",
      "en": "string (영어명)",
      "sanskrit": "string | null (요가 산스크리트명)"
    },
    "category": {
      "type": "enum",
      "values": ["pilates", "yoga", "stretching"]
    },
    "subcategory": {
      "pilates": ["mat_beginner", "mat_intermediate", "mat_advanced", "reformer"],
      "yoga": ["standing", "seated", "supine", "prone", "inversion", "balance"],
      "stretching": ["neck", "shoulder", "chest", "lower_back", "hip", "thigh", "calf", "full_body"]
    },
    "difficulty": {
      "type": "integer",
      "min": 1,
      "max": 5,
      "description": "1: 초급, 2: 초중급, 3: 중급, 4: 중고급, 5: 고급"
    },
    "met_value": {
      "type": "number",
      "min": 2.0,
      "max": 6.0,
      "description": "Compendium of Physical Activities 기준 MET 값"
    },
    "duration": {
      "default_seconds": "integer",
      "reps": "integer | null",
      "sets": "integer | null",
      "hold_seconds": "integer | null (스트레칭용)"
    },
    "target_muscles": {
      "primary": ["string"],
      "secondary": ["string"]
    },
    "instructions": {
      "steps": ["string (단계별 설명)"],
      "breathing": {
        "inhale": "string",
        "exhale": "string"
      },
      "alignment_cues": ["string (정렬 포인트)"]
    },
    "variations": {
      "easier": {
        "description": "string",
        "modifications": ["string"]
      },
      "harder": {
        "description": "string",
        "modifications": ["string"]
      },
      "senior": {
        "description": "string",
        "modifications": ["string"],
        "support_required": "boolean"
      },
      "teen": {
        "description": "string",
        "modifications": ["string"]
      }
    },
    "contraindications": {
      "absolute": ["string (절대 금기)"],
      "relative": ["string (상대 금기)"],
      "age_specific": {
        "teen": ["string"],
        "senior": ["string"]
      }
    },
    "body_type_emphasis": {
      "X": { "priority": "integer 1-5", "note": "string" },
      "A": { "priority": "integer 1-5", "note": "string" },
      "Y": { "priority": "integer 1-5", "note": "string" },
      "H": { "priority": "integer 1-5", "note": "string" },
      "O": { "priority": "integer 1-5", "note": "string" }
    },
    "equipment": {
      "required": ["string"],
      "optional": ["string"]
    },
    "tags": ["string"],
    "media": {
      "image_url": "string | null",
      "video_url": "string | null",
      "thumbnail_url": "string | null"
    },
    "related_exercises": ["exercise_id"],
    "source": {
      "database": "string",
      "last_updated": "ISO 8601 date"
    }
  }
}
```

### 1.2 루틴 데이터 스키마

```json
{
  "W1_Routine_Schema": {
    "routine_id": {
      "type": "string",
      "pattern": "^RTN-(PIL|YOG|STR|MIX)-[A-Z0-9]{3,6}$"
    },
    "name": {
      "kr": "string",
      "en": "string"
    },
    "category": {
      "type": "enum",
      "values": ["pilates", "yoga", "stretching", "mixed"]
    },
    "duration_minutes": {
      "type": "integer",
      "values": [5, 10, 15, 20, 30, 45, 60]
    },
    "difficulty": {
      "type": "enum",
      "values": ["beginner", "intermediate", "advanced", "all_levels"]
    },
    "target_audience": {
      "age_groups": ["teen", "young_adult", "middle_age", "senior"],
      "body_types": ["X", "A", "Y", "H", "O"],
      "goals": ["weight_loss", "muscle_gain", "flexibility", "stress_relief", "posture", "recovery"]
    },
    "scenario": {
      "type": "enum",
      "values": [
        "morning_wakeup",
        "office_break",
        "bedtime_relaxation",
        "post_workout",
        "menstrual_relief",
        "senior_joint_care",
        "desk_worker",
        "athlete_recovery"
      ]
    },
    "structure": {
      "warmup": {
        "exercises": ["exercise_id"],
        "duration_minutes": "integer"
      },
      "main": {
        "exercises": ["exercise_id"],
        "duration_minutes": "integer"
      },
      "cooldown": {
        "exercises": ["exercise_id"],
        "duration_minutes": "integer"
      }
    },
    "estimated_calories": {
      "formula": "MET_avg × weight_kg × (duration_minutes / 60)",
      "example_60kg": "integer"
    },
    "music_bpm_range": {
      "min": "integer",
      "max": "integer"
    },
    "instructor_notes": "string"
  }
}
```

### 1.3 사용자 운동 기록 스키마

```json
{
  "W1_User_Workout_Log": {
    "log_id": "string (UUID)",
    "user_id": "string (사용자 ID)",
    "timestamp": "ISO 8601 datetime",
    "workout_type": {
      "category": "pilates | yoga | stretching | mixed",
      "routine_id": "string | null (루틴 사용 시)",
      "custom": "boolean"
    },
    "exercises_completed": [
      {
        "exercise_id": "string",
        "duration_seconds": "integer",
        "reps_completed": "integer | null",
        "sets_completed": "integer | null",
        "difficulty_used": "easier | standard | harder",
        "skipped": "boolean",
        "notes": "string | null"
      }
    ],
    "metrics": {
      "total_duration_minutes": "integer",
      "calories_burned": "integer",
      "avg_met": "number",
      "heart_rate_avg": "integer | null",
      "heart_rate_max": "integer | null"
    },
    "user_feedback": {
      "difficulty_rating": "1-5 integer",
      "enjoyment_rating": "1-5 integer",
      "pain_reported": "boolean",
      "pain_location": "string | null",
      "notes": "string | null"
    },
    "connected_modules": {
      "C1_body_type": "string | null",
      "N1_pre_workout_meal": "boolean",
      "N1_post_workout_meal": "boolean"
    }
  }
}
```

### 1.4 칼로리 계산 함수 (통합)

```javascript
/**
 * W-1 모듈 통합 칼로리 계산
 * @param {string} category - 운동 카테고리 ('pilates', 'yoga', 'stretching')
 * @param {number} metValue - MET 값
 * @param {number} weightKg - 체중 (kg)
 * @param {number} durationMinutes - 운동 시간 (분)
 * @returns {object} 칼로리 정보
 */
function calculateW1Calories(category, metValue, weightKg, durationMinutes) {
  const durationHours = durationMinutes / 60;
  const baseCalories = metValue * weightKg * durationHours;
  
  // 카테고리별 보정 계수 (EPOC 등 고려)
  const categoryMultiplier = {
    pilates: 1.05,      // 코어 활성화로 인한 추가 소모
    yoga: 1.0,          // 기본값
    stretching: 0.95    // 저강도
  };
  
  const adjustedCalories = baseCalories * (categoryMultiplier[category] || 1.0);
  
  return {
    raw_calories: Math.round(baseCalories),
    adjusted_calories: Math.round(adjustedCalories),
    met_value: metValue,
    duration_minutes: durationMinutes,
    category: category
  };
}

// 예시
calculateW1Calories('pilates', 3.0, 60, 45);
// { raw_calories: 135, adjusted_calories: 142, met_value: 3, duration_minutes: 45, category: 'pilates' }
```

### 1.5 체형별 운동 추천 통합 매트릭스

```json
{
  "W1_Body_Type_Recommendations": {
    "X": {
      "name_kr": "모래시계형",
      "goal": "균형 유지 및 전신 토닝",
      "pilates_priority": ["The Hundred", "Roll Up", "Swimming", "Side Kick Series", "Teaser"],
      "yoga_priority": ["Warrior I", "Warrior II", "Tree Pose", "Triangle", "Boat Pose"],
      "stretching_priority": ["ST-F01", "ST-F03", "ST-H01", "ST-C02"],
      "macro_ratio": "30/40/30 (P/C/F)",
      "recommended_routine_type": "balanced_full_body"
    },
    "A": {
      "name_kr": "삼각형 (하체 발달형)",
      "goal": "상체 강화, 하체 스트레칭",
      "pilates_priority": ["Push Up", "Leg Pull Back", "Single Leg Stretch", "Swimming"],
      "yoga_priority": ["Plank", "Chaturanga", "Dolphin", "Upward Dog"],
      "stretching_priority": ["ST-H01", "ST-H02", "ST-T01", "ST-T03"],
      "macro_ratio": "35/35/30 (P/C/F) - 단백질 강조",
      "recommended_routine_type": "upper_body_focus"
    },
    "Y": {
      "name_kr": "역삼각형 (상체 발달형)",
      "goal": "하체 강화, 상체 스트레칭",
      "pilates_priority": ["Side Kick Series", "Shoulder Bridge", "Single Leg Kick"],
      "yoga_priority": ["Warrior Series", "Chair Pose", "Goddess Pose", "Pigeon"],
      "stretching_priority": ["ST-S01", "ST-S02", "ST-C01", "ST-H02"],
      "macro_ratio": "30/40/30 (P/C/F)",
      "recommended_routine_type": "lower_body_focus"
    },
    "H": {
      "name_kr": "직사각형 (일자형)",
      "goal": "허리 라인 정의, 코어 강화",
      "pilates_priority": ["Criss Cross", "Oblique Roll Back", "Side Bend", "Mermaid"],
      "yoga_priority": ["Revolved Triangle", "Side Angle", "Half Moon"],
      "stretching_priority": ["ST-F04", "ST-L02", "ST-C02", "ST-C03"],
      "macro_ratio": "35/35/30 (P/C/F)",
      "recommended_routine_type": "core_oblique_focus"
    },
    "O": {
      "name_kr": "타원형 (복부 비만형)",
      "goal": "코어 강화, 대사 촉진",
      "pilates_priority": ["The Hundred", "Single Leg Stretch", "Double Leg Stretch", "Criss Cross", "Roll Up"],
      "yoga_priority": ["Boat Pose", "Plank", "Chair Pose", "Warrior III"],
      "stretching_priority": ["ST-L01", "ST-L03", "ST-H01", "ST-F01"],
      "macro_ratio": "35/25/40 (P/C/F) - 저탄수화물",
      "recommended_routine_type": "core_cardio_focus",
      "special_note": "관절 보호 필수, 저충격 운동 우선"
    }
  }
}
```

---

## 2. 모듈 연동 가이드

### 2.1 모듈 간 데이터 흐름도

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Yiroom Core Platform                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│    PC-1       │           │     S-1       │           │     C-1       │
│ 퍼스널 컬러   │◄─────────►│   피부 분석   │◄─────────►│   체형 분석   │
│               │           │               │           │               │
│ • 4계절 타입  │           │ • 피부 타입   │           │ • X/A/Y/H/O   │
│ • 16타입 세분 │           │ • 피부 고민   │           │ • 신체 측정   │
│ • 컬러 팔레트 │           │ • 성분 분석   │           │ • 목표 체형   │
└───────┬───────┘           └───────┬───────┘           └───────┬───────┘
        │                           │                           │
        │   ┌───────────────────────┼───────────────────────┐   │
        │   │                       │                       │   │
        │   │                       ▼                       │   │
        │   │               ┌───────────────┐               │   │
        │   └──────────────►│     W-1       │◄──────────────┘   │
        │                   │  운동/피트니스 │                   │
        │                   │               │                   │
        │                   │ • 필라테스    │                   │
        │                   │ • 요가        │                   │
        │                   │ • 스트레칭    │                   │
        │                   └───────┬───────┘                   │
        │                           │                           │
        │                           ▼                           │
        │                   ┌───────────────┐                   │
        └──────────────────►│     N-1       │◄──────────────────┘
                            │     영양      │
                            │               │
                            │ • 칼로리 계산 │
                            │ • 매크로 추천 │
                            │ • 식단 플랜   │
                            └───────────────┘
```

### 2.2 모듈별 연동 데이터 정의

#### PC-1 → S-1 연동

| PC-1 출력 | S-1 활용 | 적용 예시 |
|----------|---------|----------|
| skin_undertone (warm/cool/neutral) | 화장품 색조 추천 필터 | 웜톤 → 피치/코랄 계열 블러셔 추천 |
| season_type (spring/summer/autumn/winter) | 피부톤 맞춤 스킨케어 | 가을 웜톤 → 골드 톤 하이라이터 |
| contrast_level (high/medium/low) | 메이크업 강도 추천 | 하이 콘트라스트 → 선명한 립 컬러 |

#### PC-1 → N-1 연동

| PC-1 출력 | N-1 활용 | 적용 예시 |
|----------|---------|----------|
| season_type | 계절별 추천 식품 컬러 | 봄 타입 → 밝은 색상의 과일/채소 강조 |
| mood_palette | 기분 기반 식단 추천 | 에너지 컬러 → 활력 주는 식품 |

#### S-1 → N-1 연동

| S-1 출력 | N-1 활용 | 적용 예시 |
|----------|---------|----------|
| skin_concerns (acne, dryness, aging) | 피부 개선 영양소 추천 | 건조함 → 오메가-3, 비타민 E 강조 |
| hydration_level | 수분 섭취 목표 조정 | 낮은 수분 → 일일 수분 목표 +500ml |
| inflammation_markers | 항염증 식품 추천 | 높은 염증 → 오메가-3, 강황 추천 |

#### C-1 → W-1 연동

| C-1 출력 | W-1 활용 | 적용 예시 |
|----------|---------|----------|
| body_type (X/A/Y/H/O) | 체형별 운동 추천 | A형 → 상체 강화 필라테스 우선 |
| target_areas | 부위별 운동 집중 | 복부 → 코어 집중 루틴 |
| flexibility_score | 스트레칭 강도 조정 | 낮은 유연성 → 쉬운 변형 기본 |
| posture_issues | 교정 운동 추천 | 라운드 숄더 → 흉추 스트레칭 추가 |

#### C-1 → N-1 연동

| C-1 출력 | N-1 활용 | 적용 예시 |
|----------|---------|----------|
| body_type | 매크로 비율 자동 설정 | O형 → 35/25/40 (저탄수화물) |
| body_fat_percentage | 칼로리 목표 계산 | Katch-McArdle 공식 적용 |
| lean_mass | 단백질 권장량 계산 | 제지방량 × 2.2g |
| metabolic_type | 대사 특성 반영 | 느린 대사 → 칼로리 조정 |

#### W-1 → N-1 연동

| W-1 출력 | N-1 활용 | 적용 예시 |
|----------|---------|----------|
| workout_type | 운동 전후 영양 추천 | 근력 운동 → 단백질 타이밍 알림 |
| calories_burned | 칼로리 목표 동적 조정 | 350kcal 소모 → 식단 칼로리 조정 |
| workout_time | 영양 타이밍 알림 | 저녁 7시 운동 → 5시 가벼운 식사 알림 |
| muscle_groups_worked | 회복 영양소 추천 | 하체 운동 → 글루타민, BCAA |

### 2.3 통합 사용자 프로필 스키마

```json
{
  "Yiroom_User_Profile": {
    "user_id": "string (UUID)",
    "created_at": "ISO 8601 datetime",
    "updated_at": "ISO 8601 datetime",
    
    "demographics": {
      "age": "integer",
      "age_group": "teen | young_adult | middle_age | senior",
      "gender": "male | female | other",
      "height_cm": "number",
      "weight_kg": "number",
      "activity_level": "sedentary | lightly_active | moderately_active | very_active | extremely_active"
    },
    
    "PC1_personal_color": {
      "completed": "boolean",
      "season_type": "spring | summer | autumn | winter",
      "sub_type": "string (16타입 중 하나)",
      "undertone": "warm | cool | neutral",
      "contrast_level": "high | medium | low",
      "best_colors": ["hex color codes"],
      "avoid_colors": ["hex color codes"],
      "analysis_date": "ISO 8601 date"
    },
    
    "S1_skin_analysis": {
      "completed": "boolean",
      "skin_type": "dry | oily | combination | normal | sensitive",
      "concerns": ["acne", "wrinkles", "pigmentation", "dryness", "redness"],
      "hydration_level": "1-10 integer",
      "sensitivity_level": "low | medium | high",
      "recommended_ingredients": ["string"],
      "avoid_ingredients": ["string"],
      "analysis_date": "ISO 8601 date"
    },
    
    "C1_body_analysis": {
      "completed": "boolean",
      "body_type": "X | A | Y | H | O",
      "measurements": {
        "bust_cm": "number",
        "waist_cm": "number",
        "hip_cm": "number",
        "shoulder_cm": "number"
      },
      "body_fat_percentage": "number | null",
      "lean_mass_kg": "number | null",
      "posture_issues": ["forward_head", "rounded_shoulders", "anterior_pelvic_tilt", "flat_back"],
      "flexibility_score": "1-10 integer",
      "target_body_type": "X | A | Y | H | O | null",
      "analysis_date": "ISO 8601 date"
    },
    
    "W1_fitness_profile": {
      "experience_level": "beginner | intermediate | advanced",
      "preferred_activities": ["pilates", "yoga", "stretching"],
      "workout_frequency_per_week": "integer 1-7",
      "preferred_duration_minutes": "integer",
      "injuries_conditions": ["string"],
      "goals": ["weight_loss", "muscle_gain", "flexibility", "stress_relief", "posture"],
      "equipment_available": ["mat", "reformer", "resistance_band", "yoga_block", "foam_roller"]
    },
    
    "N1_nutrition_profile": {
      "dietary_goal": "weight_loss | muscle_gain | maintenance | health_improvement",
      "calculated_values": {
        "bmr": "integer",
        "tdee": "integer",
        "target_calories": "integer",
        "macro_ratio": {
          "protein_percent": "integer",
          "carbs_percent": "integer",
          "fat_percent": "integer"
        }
      },
      "restrictions": {
        "allergies": ["string"],
        "intolerances": ["lactose", "gluten"],
        "dietary_preference": "omnivore | vegetarian | vegan | pescatarian",
        "medical_conditions": ["diabetes", "hypertension", "kidney_disease"]
      },
      "requires_professional_consultation": "boolean",
      "consultation_reasons": ["string"]
    },
    
    "settings": {
      "language": "ko | en | ja",
      "units": "metric | imperial",
      "notifications": {
        "workout_reminders": "boolean",
        "meal_reminders": "boolean",
        "hydration_reminders": "boolean",
        "weekly_summary": "boolean"
      },
      "privacy": {
        "share_progress": "boolean",
        "anonymous_data_collection": "boolean"
      }
    }
  }
}
```

### 2.4 모듈 간 API 엔드포인트 설계

```
# PC-1 퍼스널 컬러
POST   /api/v1/pc1/analyze          # 퍼스널 컬러 분석 요청
GET    /api/v1/pc1/result/{user_id} # 분석 결과 조회
GET    /api/v1/pc1/palette/{user_id}# 컬러 팔레트 조회

# S-1 피부 분석
POST   /api/v1/s1/analyze           # 피부 분석 요청
GET    /api/v1/s1/result/{user_id}  # 분석 결과 조회
GET    /api/v1/s1/products/{user_id}# 추천 제품 조회

# C-1 체형 분석
POST   /api/v1/c1/analyze           # 체형 분석 요청
GET    /api/v1/c1/result/{user_id}  # 분석 결과 조회
GET    /api/v1/c1/recommendations/{user_id} # 체형별 추천 조회

# W-1 운동/피트니스
GET    /api/v1/w1/exercises         # 전체 운동 목록
GET    /api/v1/w1/exercises/{id}    # 운동 상세 정보
GET    /api/v1/w1/routines          # 루틴 목록
GET    /api/v1/w1/routines/{id}     # 루틴 상세 정보
POST   /api/v1/w1/routines/generate # 맞춤 루틴 생성
POST   /api/v1/w1/workouts/log      # 운동 기록 저장
GET    /api/v1/w1/workouts/history/{user_id} # 운동 기록 조회
GET    /api/v1/w1/recommendations/{user_id}  # 체형 기반 운동 추천

# N-1 영양
GET    /api/v1/n1/foods             # 음식 검색
GET    /api/v1/n1/foods/{id}        # 음식 상세 정보
POST   /api/v1/n1/meals/log         # 식단 기록 저장
GET    /api/v1/n1/meals/history/{user_id} # 식단 기록 조회
GET    /api/v1/n1/recommendations/{user_id} # 맞춤 영양 추천
GET    /api/v1/n1/macros/{user_id}  # 매크로 목표 조회
POST   /api/v1/n1/plan/generate     # 식단 계획 생성

# 통합
GET    /api/v1/user/profile/{user_id}     # 통합 프로필 조회
PUT    /api/v1/user/profile/{user_id}     # 프로필 업데이트
GET    /api/v1/dashboard/{user_id}        # 대시보드 데이터
GET    /api/v1/insights/{user_id}         # AI 인사이트
```

---

## 3. Yiroom 차별화 전략서

### 3.1 경쟁 환경 요약

| 모듈 | 주요 경쟁사 | 시장 상황 |
|------|-----------|----------|
| PC-1 | 잼페이스, Dressika, Style DNA | 단일 기능 앱 다수, 통합 없음 |
| S-1 | 화해, Perfect Corp, @cosme | 성분 OR AI 진단, 둘 다 강한 앱 없음 |
| C-1 | 무신사(수동), ZOZOSUIT($199) | 한국에 AI 바디 스캔 앱 부재 |
| W-1 | 짐워크, Nike TC, Peloton | 체형 기반 추천 앱 없음 |
| N-1 | 다이어트신, Noom, Asken | 한국 시장 리더 부재 |

### 3.2 핵심 차별화 포인트

```
┌─────────────────────────────────────────────────────────────┐
│                    Yiroom 차별화 전략                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣ 세계 최초 5개 모듈 통합 플랫폼                          │
│     • 경쟁사: 최대 2개 모듈 통합 (잼페이스: PC+피부)        │
│     • Yiroom: PC + 피부 + 체형 + 운동 + 영양 완전 통합      │
│                                                             │
│  2️⃣ 퍼스널 컬러 기반 웰니스                                 │
│     • 경쟁사: 퍼스널 컬러 = 패션/메이크업만                 │
│     • Yiroom: 퍼스널 컬러 → 피부 → 체형 → 운동 → 영양 연결 │
│                                                             │
│  3️⃣ 한국 최초 AI 바디 스캔 + 운동 추천                     │
│     • 경쟁사: 무신사(수동 입력), ZOZOSUIT($199 하드웨어)    │
│     • Yiroom: 사진 기반 AI 체형 분석 + 맞춤 운동            │
│                                                             │
│  4️⃣ 접근 가능한 프리미엄                                    │
│     • 경쟁사: Noom $209/년, MacroFactor $72/년              │
│     • Yiroom: ₩9,900-19,900/월 (Asken 수준 가격대)         │
│                                                             │
│  5️⃣ K-뷰티/K-웰니스 글로벌 게이트웨이                       │
│     • Day 1 한/영/일 지원                                   │
│     • 한국 식품 76,000+ DB                                  │
│     • K-뷰티 성분 분석 특화                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 모듈별 벤치마크 및 차별화

| 모듈 | 벤치마크 | 벤치마킹 포인트 | Yiroom 차별화 |
|------|---------|---------------|--------------|
| PC-1 | Style DNA | Gen AI 챗봇, 쇼핑 연동 | 16타입 세분화 + 웰니스 연결 |
| S-1 | 화해 + 잼페이스 | 화해(성분) + 잼페이스(AI) | 두 강점 결합 + 영양-피부 상관분석 |
| C-1 | 3DLOOK | 2장 사진 96% 정확도 | 한국 최초 + 패션 플랫폼 B2B |
| W-1 | 짐워크 | AI 무게 추천, 깔끔 UI | 체형별 맞춤 + 필라테스/요가 통합 |
| N-1 | Asken | AI 영양사, 저렴한 가격 | 한국 음식 특화 + 적응형 알고리즘 |

### 3.4 포지셔닝 매트릭스

```
                    높은 가격
                        │
                        │   Noom ($209/년)
                        │       ●
    단일 기능 ──────────┼────────────────── 통합 플랫폼
                        │
         잼페이스 ●     │           ★ Yiroom (₩120,000/년)
         (무료)         │              [블루오션]
                        │
                        │   Asken (¥3,600/년)
                        │       ●
                    낮은 가격
```

### 3.5 타겟 세그먼트 전략

| 세그먼트 | 페르소나 | 우선 모듈 | 핵심 가치 |
|---------|---------|----------|----------|
| MZ 뷰티족 | 25세 여성, K-뷰티 관심 | PC-1 → S-1 | 나에게 맞는 컬러와 제품 발견 |
| 다이어터 | 32세 직장인, 체중 관리 | N-1 → W-1 | 칼로리 계산 없이 쉬운 관리 |
| 피트니스 초보 | 28세 여성, 홈트 시작 | W-1 → C-1 | 내 체형에 맞는 운동 루틴 |
| 글로벌 K-뷰티팬 | 일본/미국 20대 | PC-1 → S-1 | 한국식 뷰티 노하우 접근 |

---

## 4. Claude Code 연동 가이드

### 4.1 프로젝트 구조

```
yiroom/
├── frontend/                    # Next.js 16 + React 19
│   ├── app/
│   │   ├── (auth)/             # 인증 관련 라우트
│   │   ├── (main)/             # 메인 앱 라우트
│   │   │   ├── dashboard/
│   │   │   ├── pc1/            # 퍼스널 컬러
│   │   │   ├── s1/             # 피부 분석
│   │   │   ├── c1/             # 체형 분석
│   │   │   ├── w1/             # 운동
│   │   │   │   ├── pilates/
│   │   │   │   ├── yoga/
│   │   │   │   ├── stretching/
│   │   │   │   └── routines/
│   │   │   └── n1/             # 영양
│   │   ├── api/                # API Routes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                 # 공통 UI 컴포넌트
│   │   ├── pc1/
│   │   ├── s1/
│   │   ├── c1/
│   │   ├── w1/
│   │   └── n1/
│   ├── lib/
│   │   ├── supabase/           # Supabase 클라이언트
│   │   ├── gemini/             # Gemini AI 연동
│   │   └── utils/
│   └── types/
│       └── index.ts            # TypeScript 타입 정의
│
├── database/                    # Supabase 스키마
│   ├── migrations/
│   ├── seeds/
│   │   ├── w1_exercises.sql    # 운동 데이터 시드
│   │   ├── n1_foods.sql        # 음식 데이터 시드
│   │   └── routines.sql
│   └── schema.sql
│
├── data/                        # 정적 데이터
│   ├── w1/
│   │   ├── pilates.json
│   │   ├── yoga.json
│   │   └── stretching.json
│   ├── n1/
│   │   └── korean_foods.json
│   └── body_types.json
│
└── docs/                        # 문서
    ├── api-reference.md
    ├── module-integration.md
    └── deployment.md
```

### 4.2 Supabase 테이블 스키마

```sql
-- 사용자 프로필
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  age INTEGER,
  gender TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  activity_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PC-1 퍼스널 컬러 결과
CREATE TABLE pc1_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  season_type TEXT,
  sub_type TEXT,
  undertone TEXT,
  contrast_level TEXT,
  best_colors JSONB,
  avoid_colors JSONB,
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- S-1 피부 분석 결과
CREATE TABLE s1_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  skin_type TEXT,
  concerns JSONB,
  hydration_level INTEGER,
  sensitivity_level TEXT,
  recommended_ingredients JSONB,
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- C-1 체형 분석 결과
CREATE TABLE c1_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  body_type TEXT CHECK (body_type IN ('X', 'A', 'Y', 'H', 'O')),
  measurements JSONB,
  body_fat_percentage NUMERIC,
  lean_mass_kg NUMERIC,
  posture_issues JSONB,
  flexibility_score INTEGER,
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- W-1 운동 데이터
CREATE TABLE w1_exercises (
  id TEXT PRIMARY KEY,
  name_kr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT CHECK (category IN ('pilates', 'yoga', 'stretching')),
  subcategory TEXT,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  met_value NUMERIC,
  duration_default INTEGER,
  target_primary JSONB,
  target_secondary JSONB,
  instructions JSONB,
  variations JSONB,
  contraindications JSONB,
  body_type_emphasis JSONB,
  equipment JSONB,
  tags JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- W-1 루틴 데이터
CREATE TABLE w1_routines (
  id TEXT PRIMARY KEY,
  name_kr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT,
  duration_minutes INTEGER,
  difficulty TEXT,
  target_audience JSONB,
  scenario TEXT,
  structure JSONB,
  estimated_calories_60kg INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- W-1 운동 기록
CREATE TABLE w1_workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  routine_id TEXT REFERENCES w1_routines(id),
  exercises_completed JSONB,
  total_duration_minutes INTEGER,
  calories_burned INTEGER,
  difficulty_rating INTEGER,
  enjoyment_rating INTEGER,
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- N-1 음식 데이터
CREATE TABLE n1_foods (
  id TEXT PRIMARY KEY,
  name_kr TEXT NOT NULL,
  name_en TEXT,
  calories INTEGER,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  fiber_g NUMERIC,
  sodium_mg INTEGER,
  serving_size JSONB,
  gi_index JSONB,
  allergens JSONB,
  dietary_flags JSONB,
  source_database TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- N-1 영양 프로필
CREATE TABLE n1_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  dietary_goal TEXT,
  bmr INTEGER,
  tdee INTEGER,
  target_calories INTEGER,
  macro_ratio JSONB,
  allergies JSONB,
  intolerances JSONB,
  dietary_preference TEXT,
  medical_conditions JSONB,
  requires_consultation BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- N-1 식단 기록
CREATE TABLE n1_meal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  meal_type TEXT,
  foods JSONB,
  total_calories INTEGER,
  total_macros JSONB,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_workout_logs_user ON w1_workout_logs(user_id);
CREATE INDEX idx_meal_logs_user ON n1_meal_logs(user_id);
CREATE INDEX idx_exercises_category ON w1_exercises(category);
CREATE INDEX idx_foods_name ON n1_foods USING GIN (to_tsvector('korean', name_kr));
```

### 4.3 TypeScript 타입 정의

```typescript
// types/index.ts

// 공통
export type AgeGroup = 'teen' | 'young_adult' | 'middle_age' | 'senior';
export type BodyType = 'X' | 'A' | 'Y' | 'H' | 'O';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';

// PC-1
export interface PC1Result {
  seasonType: 'spring' | 'summer' | 'autumn' | 'winter';
  subType: string;
  undertone: 'warm' | 'cool' | 'neutral';
  contrastLevel: 'high' | 'medium' | 'low';
  bestColors: string[];
  avoidColors: string[];
}

// S-1
export interface S1Result {
  skinType: 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';
  concerns: string[];
  hydrationLevel: number;
  sensitivityLevel: 'low' | 'medium' | 'high';
  recommendedIngredients: string[];
  avoidIngredients: string[];
}

// C-1
export interface C1Result {
  bodyType: BodyType;
  measurements: {
    bustCm: number;
    waistCm: number;
    hipCm: number;
    shoulderCm: number;
  };
  bodyFatPercentage?: number;
  leanMassKg?: number;
  postureIssues: string[];
  flexibilityScore: number;
}

// W-1
export type ExerciseCategory = 'pilates' | 'yoga' | 'stretching';

export interface W1Exercise {
  id: string;
  nameKr: string;
  nameEn: string;
  nameSanskrit?: string;
  category: ExerciseCategory;
  subcategory: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  metValue: number;
  duration: {
    defaultSeconds: number;
    reps?: number;
    sets?: number;
    holdSeconds?: number;
  };
  targetMuscles: {
    primary: string[];
    secondary: string[];
  };
  instructions: {
    steps: string[];
    breathing: {
      inhale: string;
      exhale: string;
    };
    alignmentCues: string[];
  };
  variations: {
    easier: { description: string; modifications: string[] };
    harder: { description: string; modifications: string[] };
    senior?: { description: string; modifications: string[]; supportRequired: boolean };
    teen?: { description: string; modifications: string[] };
  };
  contraindications: {
    absolute: string[];
    relative: string[];
    ageSpecific?: {
      teen?: string[];
      senior?: string[];
    };
  };
  bodyTypeEmphasis: Record<BodyType, { priority: number; note: string }>;
  equipment: {
    required: string[];
    optional: string[];
  };
  tags: string[];
}

export interface W1Routine {
  id: string;
  nameKr: string;
  nameEn: string;
  category: ExerciseCategory | 'mixed';
  durationMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
  targetAudience: {
    ageGroups: AgeGroup[];
    bodyTypes: BodyType[];
    goals: string[];
  };
  scenario: string;
  structure: {
    warmup: { exercises: string[]; durationMinutes: number };
    main: { exercises: string[]; durationMinutes: number };
    cooldown: { exercises: string[]; durationMinutes: number };
  };
  estimatedCalories60kg: number;
}

export interface W1WorkoutLog {
  id: string;
  userId: string;
  routineId?: string;
  exercisesCompleted: Array<{
    exerciseId: string;
    durationSeconds: number;
    repsCompleted?: number;
    setsCompleted?: number;
    difficultyUsed: 'easier' | 'standard' | 'harder';
    skipped: boolean;
  }>;
  metrics: {
    totalDurationMinutes: number;
    caloriesBurned: number;
    avgMet: number;
  };
  feedback: {
    difficultyRating: number;
    enjoymentRating: number;
    painReported: boolean;
    painLocation?: string;
    notes?: string;
  };
  loggedAt: string;
}

// N-1
export interface N1Food {
  id: string;
  nameKr: string;
  nameEn?: string;
  calories: number;
  macros: {
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    sugarG: number;
    sodiumMg: number;
  };
  servingSize: {
    amount: number;
    unit: string;
    grams: number;
  };
  allergens: string[];
  dietaryFlags: string[];
  giIndex?: { value: number; category: 'low' | 'medium' | 'high' };
}

export interface N1Profile {
  userId: string;
  dietaryGoal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'health_improvement';
  calculatedValues: {
    bmr: number;
    tdee: number;
    targetCalories: number;
    macroRatio: {
      proteinPercent: number;
      carbsPercent: number;
      fatPercent: number;
    };
  };
  restrictions: {
    allergies: string[];
    intolerances: string[];
    dietaryPreference: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian';
    medicalConditions: string[];
  };
  requiresProfessionalConsultation: boolean;
  consultationReasons: string[];
}

// 통합 사용자 프로필
export interface YiroomUserProfile {
  userId: string;
  demographics: {
    age: number;
    ageGroup: AgeGroup;
    gender: 'male' | 'female' | 'other';
    heightCm: number;
    weightKg: number;
    activityLevel: ActivityLevel;
  };
  pc1Result?: PC1Result;
  s1Result?: S1Result;
  c1Result?: C1Result;
  w1Profile: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    preferredActivities: ExerciseCategory[];
    workoutFrequencyPerWeek: number;
    goals: string[];
  };
  n1Profile?: N1Profile;
}
```

### 4.4 개발 시작 체크리스트

```markdown
## Phase 1 개발 체크리스트

### 환경 설정
- [ ] Next.js 16 프로젝트 생성
- [ ] Supabase 프로젝트 설정
- [ ] Clerk 인증 연동
- [ ] Gemini AI API 키 설정
- [ ] 환경 변수 구성 (.env.local)

### 데이터베이스
- [ ] Supabase 테이블 생성 (schema.sql)
- [ ] RLS (Row Level Security) 정책 설정
- [ ] W-1 운동 데이터 시드 (70개 운동)
- [ ] N-1 음식 데이터 시드 (한국 음식 우선)

### PC-1 모듈
- [ ] 사진 업로드 컴포넌트
- [ ] Gemini Vision API 연동
- [ ] 결과 표시 UI
- [ ] 컬러 팔레트 저장

### S-1 모듈
- [ ] 피부 사진 분석 UI
- [ ] 피부 타입 분류 로직
- [ ] 성분 DB 연동
- [ ] 추천 결과 표시

### C-1 모듈
- [ ] 체형 사진 업로드
- [ ] AI 체형 분석 로직
- [ ] 측정값 계산
- [ ] 체형별 추천 연동

### W-1 모듈
- [ ] 운동 목록 UI
- [ ] 운동 상세 페이지
- [ ] 루틴 생성기
- [ ] 운동 기록 저장
- [ ] 칼로리 계산기

### N-1 모듈
- [ ] 음식 검색 UI
- [ ] 식단 기록 UI
- [ ] 칼로리/매크로 대시보드
- [ ] 맞춤 추천 로직

### 통합
- [ ] 대시보드 페이지
- [ ] 모듈 간 데이터 연동
- [ ] 프로필 페이지
- [ ] 설정 페이지
```

---

## 5. 개발 우선순위 및 로드맵

### 5.1 MVP (Phase 1) - 8주

**목표**: 핵심 기능 출시, 초기 사용자 확보

| 주차 | 작업 | 결과물 |
|------|-----|--------|
| 1-2 | 인프라 + PC-1 | 퍼스널 컬러 분석 작동 |
| 3-4 | S-1 + C-1 | 피부/체형 분석 작동 |
| 5-6 | W-1 | 운동 추천 + 기록 |
| 7-8 | N-1 + 통합 | 영양 추적 + 대시보드 |

### 5.2 Growth (Phase 2) - 4주

**목표**: 기능 강화, 리텐션 개선

- 게이미피케이션 (뱃지, 스트릭, 챌린지)
- 소셜 기능 (친구, 공유)
- 프리미엄 콘텐츠 (영상 가이드)
- 알림 시스템 개선

### 5.3 Scale (Phase 3) - 8주

**목표**: 글로벌 확장, B2B

- 일본어/영어 지원
- 일본 음식 DB 추가
- B2B API 개발
- 패션 플랫폼 파트너십

---

## 부록: 리소스 요약

### 완성된 문서

| 문서 | 크기 | 내용 |
|------|-----|------|
| yiroom-w1-pilates-guide.md | 28KB | 25개 운동, JSON 스키마 |
| yiroom-w1-yoga-guide.md | 31KB | 20개 포즈, 태양경배 |
| yiroom-w1-stretching-guide.md | 43KB | 25개 스트레칭, 연령별 |
| N-1 영양 가이드 (artifact) | ~50KB | 매크로/미량 영양소, 체형별 |
| 경쟁사 분석 (artifact) | ~40KB | 5개 모듈 30+ 앱 분석 |
| **본 통합 가이드** | ~45KB | 스키마, 연동, 전략 |

### 주요 데이터

- 운동 데이터: **70개** (필라테스 25 + 요가 20 + 스트레칭 25)
- 한국 음식 DB: **76,000+** (MFDS 기준)
- 체형 타입: **5개** (X, A, Y, H, O)
- 연령 그룹: **4개** (10대, 20-30대, 40-50대, 60대+)
- 목표 유형: **4개** (감량, 증량, 유지, 건강)

---

*본 문서는 Yiroom 플랫폼 개발의 핵심 참조 자료입니다.*
*최종 업데이트: 2024년 12월*
