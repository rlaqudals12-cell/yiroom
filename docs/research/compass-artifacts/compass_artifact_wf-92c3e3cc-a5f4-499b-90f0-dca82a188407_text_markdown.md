# COMBO-BODY-EXERCISE-R1.md
# 체형 분석 × 운동 추천 교차 시스템 설계 보고서

**Yiroom의 C-1(체형 분석) × W-1(운동 추천) 시스템**을 위한 N×M 교차 매칭 알고리즘은 체형 유형별 최적 운동 매칭, 근골격계 불균형 교정, 금기 운동 필터링을 통합해야 한다. ACSM과 NSCA 가이드라인에 기반한 과학적 프로토콜과 Size Korea 데이터를 반영한 한국인 맞춤 설계가 핵심이며, 이 보고서는 **6개 체형 유형 × 8개 운동 카테고리의 48개 조합**에 대한 호환성 매트릭스와 실시간 자세 분석 연동 아키텍처를 제시한다.

---

## 체형 분류 시스템(C-1) 설계 기반

### 3차원 체형 분류 체계

Yiroom의 C-1 시스템은 Heath-Carter 체질량 분석법을 기반으로 하되, 한국인 특성과 자세 분석을 통합한 **3차원 분류 체계**를 적용해야 한다.

**1차원: 체질량 유형(Somatotype)**
- **외배엽형(Ectomorph)**: 상대적 선형성, 낮은 체지방, 긴 사지
- **중배엽형(Mesomorph)**: 근골격 발달, 넓은 어깨, 좁은 허리
- **내배엽형(Endomorph)**: 상대적 둥근 체형, 높은 체지방, 넓은 골반
- **혼합형**: 외배엽-중배엽, 중배엽-내배엽 등 13가지 조합

Heath-Carter 체계에서 각 요소는 **1-7점 척도**로 평가되며, AI 이미지 분석으로 주요 신체 비율(어깨 너비/허리 둘레, 팔다리 길이 비율)을 추정하여 자동 분류가 가능하다.

**2차원: 지방 분포 유형**
- **Android형(사과형)**: 복부 중심 지방 축적, 허리-엉덩이 비율 남성 >1.0, 여성 >0.85
- **Gynoid형(배형)**: 엉덩이/허벅지 중심 지방 축적, 대사 위험 상대적 낮음

**3차원: 자세 유형**
| 자세 유형 | 특징 | 긴장된 근육 | 약화된 근육 |
|----------|------|------------|------------|
| **전만형(Lordotic)** | 골반 전방경사, 요추 과신전 | 장요근, 척추기립근 | 햄스트링, 복근 |
| **후만형(Kyphotic)** | 흉추 과굴곡, 둥근 어깨 | 대흉근, 상부승모근 | 능형근, 하부승모근 |
| **평편등(Flat-back)** | 골반 후방경사, 요추곡선 감소 | 복직근 | 장요근, 요부신전근 |
| **스웨이백(Sway-back)** | 골반 후방경사, 상복부 전방돌출 | 햄스트링, 상복부근 | 장요근, 내복사근 |

### 한국인 체형 특성 반영 (Size Korea 데이터)

Size Korea 제8차 조사(2020-2023) 데이터에 따르면, 한국인 체형은 서양인 대비 **전체적으로 작고 좁은 체형**이며, 특히 어깨 너비가 상대적으로 좁고 상지가 긴 특성을 보인다.

**핵심 인체 측정 차이점:**
- 한국 여성: 미국 여성 대비 모든 측정치가 작으나, 어깨 경사와 가랑이 길이는 유사
- 한국인 몸통: "동아시아 중간 범위이나 상지가 더 긴 특성"
- 표준 사이즈 55 여성: 가슴 83-85cm, 허리 66cm, 엉덩이 94cm

**현대 한국인 자세 문제 (연세대 연구, n=13,691):**
- 18-29세 청년층 **16.7%가 경추 후만증**, **45.5%가 일자목** 진단
- 하루 4시간 이상 스마트폰 사용자: 전방머리자세(FHP) 유의미 증가
- 성인 평균 좌식 시간: **8.3시간/일**
- 신체활동 부족률: 성인 54.4%, 청소년 **94.1%** (2020)

---

## C-1 × W-1 교차 추천 알고리즘

### 매트릭스 기반 추천 아키텍처

```
                        운동 카테고리 (W-1)
                    근력   유산소  유연성  HIIT  교정  기능성  코어  파워
체형 유형 (C-1)
외배엽형           [0.95   0.40   0.70   0.50  0.60  0.80   0.75  0.65]
중배엽형           [0.90   0.75   0.65   0.85  0.55  0.90   0.80  0.95]
내배엽형           [0.75   0.90   0.70   0.90  0.65  0.75   0.85  0.50]
전만형-외배엽      [0.85   0.40   0.75   0.45  0.95  0.70   0.90  0.55]
후만형-중배엽      [0.80   0.70   0.80   0.75  0.90  0.85   0.75  0.85]
...
```

### 다중 요소 점수 산출 공식

```javascript
calculateRecommendationScore(user, exercise) {
  // 1단계: 절대적 금기사항 확인 (배제 필터)
  if (hasContraindication(user.conditions, exercise)) return -1; // 금기
  if (!hasRequiredEquipment(user.equipment, exercise.requiredEquipment)) return 0;
  
  // 2단계: 가중 점수 계산
  const scores = {
    bodyTypeMatch: getBodyTypeCompatibility(user.somatotype, exercise) * 0.25,
    goalAlignment: getGoalEffectiveness(user.goals, exercise.effects) * 0.25,
    postureCorrection: getPostureBenefit(user.postureType, exercise) * 0.20,
    safetyScore: getSafetyRating(user.limitations, exercise) * 0.15,
    koreanAdaptation: getKoreanFitScore(user.anthropometrics, exercise) * 0.15
  };
  
  // 3단계: 문맥적 조정
  const fatigueMultiplier = getMuscleFatigueFactor(user.recentWorkouts, exercise.targetMuscles);
  const progressionBonus = getProgressionBonus(user.history, exercise);
  
  return Object.values(scores).reduce((a, b) => a + b, 0) * fatigueMultiplier + progressionBonus;
}
```

### 체형별 운동 프로그램 템플릿

**외배엽형 프로토콜 - 근비대 중심**
| 요소 | 권장사항 | 근거 |
|-----|---------|------|
| **빈도** | 주 3-4회, 전신 또는 상/하 분할 | 과훈련 방지, 자극 극대화 |
| **반복** | 6-12회 (비대 초점) | 근단백 합성 최적화 |
| **세트** | 운동당 3-5세트 | 적응 위한 높은 볼륨 필요 |
| **휴식** | 2-3분 이상 | 완전 회복으로 강도 유지 |
| **운동 선택** | 복합운동 우선 (스쿼트, 데드리프트, 프레스, 로우) | 더 큰 동화 반응 |
| **유산소** | 최소화 (≤주 2회 20분) | 근육 성장 위한 칼로리 보존 |

**중배엽형 프로토콜 - 균형 발달 중심**
| 요소 | 권장사항 | 근거 |
|-----|---------|------|
| **빈도** | 주 3-4회, 주기화 접근 | 다양한 자극에 잘 반응 |
| **반복** | 6-12회 (주기별 변화) | 광범위한 부하 방식 처리 가능 |
| **세트** | 근육군당 주 12-20세트 | 높은 볼륨 내성 |
| **휴식** | 1-3분 (목표에 따라) | 유연한 회복 능력 |
| **운동 선택** | 복합+고립 균형 | 종합적 발달 |
| **유산소** | 주 3-5회, 30-45분 | 체지방 관리, 심폐 건강 |

**내배엽형 프로토콜 - 대사 컨디셔닝 중심**
| 요소 | 권장사항 | 근거 |
|-----|---------|------|
| **빈도** | 주 3-4회, 서킷 또는 슈퍼세트 | 대사 촉진, 칼로리 소모 |
| **반복** | 10-15회 | 대사 스트레스, 칼로리 연소 |
| **세트** | 근육군당 주 15-25세트 | 대사 효과 위한 높은 볼륨 |
| **휴식** | 30-90초 | 심박수 상승 유지 |
| **운동 선택** | 복합운동, HIIT 통합 | 최대 칼로리 소비 |
| **유산소** | 주 3-4회 HIIT + 중강도 지속 | 지방 산화 최적화 |

---

## 근골격계 불균형 교정 운동 연계

### NASM 교정 운동 연속체 (CEx) 적용

**4단계 프로토콜: 억제 → 신장 → 활성화 → 통합**

이 프로토콜은 MediaPipe 자세 분석 결과와 직접 연동되어 자동으로 교정 운동을 처방한다.

**1단계 억제(Inhibit) - 과활성 근육 이완**
- 기법: 폼롤링/자가근막이완(SMR)
- 프로토콜: 가장 예민한 지점에서 **30-90초** 유지
- 도구: 폼롤러, 마사지볼, 타악기기

**2단계 신장(Lengthen) - 단축된 근육 연장**
- 기법: 정적 스트레칭, PNF
- 프로토콜: **30초 이상**, 2세트씩
- 주의: "뻣뻣하게 느껴지는" 근육이 실제로는 늘어나 약화된 경우가 많음

**3단계 활성화(Activate) - 억제된 근육 자극**
- 기법: 고립 강화 운동
- 프로토콜: **12-20회**, 1-2세트, 느린 템포
- 초점: 정확한 폼 우선

**4단계 통합(Integrate) - 기능적 패턴 재교육**
- 기법: 다관절, 전신 움직임
- 프로토콜: **10-15회**, 1-2세트
- 진행: 저항 → 속도 → 운동면 → 지지면 변화

### 자세 유형별 교정 프로토콜 매트릭스

**상부교차증후군(Upper Cross Syndrome) 교정**
| 단계 | 대상 근육 | 운동 |
|-----|---------|------|
| 억제 | 대흉근/소흉근, 상부승모근, 광배근 | 폼롤: 흉추, 광배근, 흉근(볼/벽 이용) |
| 신장 | 동일 | 문틀 가슴 스트레칭, 상부승모근 스트레칭, 광배근 스트레칭 |
| 활성화 | 심부경추굴근, 하/중부승모근, 능형근, 전거근 | 턱 당기기, 프론 코브라, 프론 Y레이즈, 월 슬라이드 |
| 통합 | 전체 운동사슬 | 스쿼트 투 로우, 케이블 페이스풀, 오버헤드 프레싱 |

**하부교차증후군(Lower Cross Syndrome) 교정**
| 단계 | 대상 근육 | 운동 |
|-----|---------|------|
| 억제 | 장요근, TFL, 대퇴사두근, 내전근, 흉요부신전근 | 폼롤: 대퇴사두근, TFL/장경인대, 내전근, 장요근 |
| 신장 | 동일 | 무릎 꿇고 장요근 스트레칭, 대퇴사두근 스트레칭, 내전근 스트레칭 |
| 활성화 | 대둔근, 중둔근, 복횡근, 내복사근 | 글루트 브릿지, 클램쉘, 수핀 마칭, 데드버그 |
| 통합 | 전체 운동사슬 | 볼-월 스쿼트, 팔 오버헤드 런지, 싱글레그 RDL |

**전방머리자세(FHP) 교정 - 한국인 우선 적용**
| 단계 | 운동 |
|-----|------|
| 억제 | 폼롤: 흉추, 후두하근 자가마사지(볼), 상부승모근 |
| 신장 | 상부승모근 스트레칭, 흉쇄유돌근 스트레칭, 견갑거근 스트레칭, 가슴 스트레칭 |
| 활성화 | 턱 당기기(2주 이상), 밴드 저항 턱 당기기, 프론 코브라 |
| 통합 | 스쿼트 투 로우, 정렬 유지 오버헤드 프레싱, 월 엔젤 |

### 교정 기대 기간

| 상태 | 최소 기간 | 최적 기간 | 빈도 |
|-----|---------|---------|------|
| 전방머리자세 | 4주 | 6-10주 | 주 3회 |
| 둥근 어깨 | 4-6주 | 8-12주 | 주 3회 |
| 상부교차증후군 | 6주 | 8-12주 | 주 3-4회 |
| 하부교차증후군 | 6-8주 | 12주 | 주 3회 |
| 회내변형증후군 | 8-12주 | 12주 이상 | 주 3회 |

---

## 금기 운동 경고 시스템

### 4단계 위험 계층화 프레임워크

**TIER 1 - 녹색 (저위험)**
- 기준: 정기적 활동, 질환 없음, 증상 없음
- 조치: 의료 허가 불필요, 모든 강도 가능
- 모니터링: 표준 안전 인식

**TIER 2 - 황색 (중간 위험)**
- 기준: 비활동적, 질환 없음, 증상 없음
- 조치: 저-중강도 시작, 점진적 진행
- 모니터링: 강화된 증상 인식

**TIER 3 - 주황색 (상승 위험)**
- 기준: 알려진 질환, 무증상, 정기 운동자
- 조치: 저-중강도 OK; 고강도는 의료 허가 필요
- 모니터링: 정기 체크인, 진행 문서화

**TIER 4 - 적색 (고위험)**
- 기준: 증상 존재 또는 새로 진단된 질환
- 조치: 모든 운동 전 의료 허가 필수
- 모니터링: 의료 감독 권장

### 상태 × 운동 금기사항 매트릭스

| 상태 | 고충격 | 중량 저항 | 오버헤드 | 전방굴곡 | 신전 | 회전 |
|-----|-------|---------|---------|---------|-----|-----|
| 비만 (BMI 30+) | ❌ 금지 | ⚠️ 수정 | ✅ OK | ✅ OK | ✅ OK | ✅ OK |
| 고도비만 (BMI 40+) | ❌ 금지 | ⚠️ 수정 | ⚠️ 수정 | ✅ OK | ✅ OK | ⚠️ 수정 |
| 전만증 | ✅ OK | ⚠️ 수정 | ⚠️ 수정 | ✅ OK | ❌ 금지 | ✅ OK |
| 후만증 | ✅ OK | ⚠️ 수정 | ⚠️ 수정 | ❌ 금지 | ✅ 권장 | ⚠️ 수정 |
| 측만증 | ⚠️ 수정 | ⚠️ 수정 | ⚠️ 수정 | ⚠️ 수정 | ❌ 금지 | ⚠️ 수정 |
| 골관절염 | ❌ 금지 | ⚠️ 수정 | ✅ OK | ✅ OK | ✅ OK | ⚠️ 수정 |
| 골다공증 | ❌ 금지 | ⚠️ 수정 | ✅ OK | ❌ 금지 | ⚠️ 수정 | ⚠️ 수정 |
| 심장 질환 | ⚠️ 허가필요 | ⚠️ 허가필요 | ⚠️ 수정 | ✅ OK | ✅ OK | ✅ OK |

### 체형별 피해야 할 운동

**외배엽형 - 주의 운동:**
- 과도한 유산소 운동 (칼로리 손실로 근육 성장 방해)
- 매우 높은 반복 저항 운동 (에너지 소모 과다)
- 장시간 지구력 활동
- 권장: 복합 근력 운동 중심, 짧은 고강도 세션

**내배엽형 - 주의 운동:**
- 고충격 유산소 (관절 스트레스)
- 점프 운동 (박스 점프, 버피, 점프 스쿼트)
- 장거리 달리기 (피로 시 척추 붕괴)
- 권장: 저충격 유산소 (수영, 자전거, 걷기), 서킷 트레이닝

**중배엽형 - 주의 운동:**
- 과훈련 경향 주의 (빠른 적응으로 과도한 추진)
- 전면부만 집중하는 불균형 훈련
- 지구력 운동만 집중 (자연 강점 외 훈련)
- 권장: 균형 잡힌 훈련, 적절한 휴식, 유연성 포함

### 경고 메시지 템플릿

**운동 전 스크리닝 메시지:**
> "운동 프로그램 시작 전, 건강 스크리닝 설문을 완료해 주세요. 이는 더 안전하고 개인화된 추천을 위해 필요합니다. 알려진 건강 상태가 있거나 안전하게 운동할 수 있는지 확실하지 않은 경우, 먼저 의료 전문가와 상담하세요."

**운동 중 금기 경고:**
> "⚠️ 이 운동은 [척추 상태]가 있는 분에게 적합하지 않을 수 있습니다. 진단받은 척추 질환이 있다면 아래의 수정 버전을 사용하거나 건너뛰세요."

**고강도 운동 경고:**
> "⚠️ 고강도 운동입니다. 가슴 통증, 어지러움, 심한 호흡곤란, 비정상적 피로를 경험하면 즉시 중단하고 증상이 지속되면 의료 도움을 받으세요."

**즉시 중단 적색 신호:**
- 가슴 통증 또는 불편감
- 심한 호흡곤란
- 어지러움 또는 실신
- 메스꺼움
- 협응 상실
- 극심한 피로
- 혼란

---

## 운동 효과 예측 모델

### 예측 모델 아키텍처

**입력 특성:**
```json
{
  "user_features": {
    "somatotype": [4.2, 3.8, 2.1], // 내배엽, 중배엽, 외배엽 점수
    "body_fat_pct": 22.5,
    "fitness_level": "intermediate",
    "vo2max_estimate": 38.5,
    "training_age_months": 18,
    "recent_workouts": [...],
    "sleep_quality": 7.2,
    "stress_level": 4.5
  },
  "exercise_features": {
    "type": "compound_strength",
    "target_muscles": ["quadriceps", "glutes", "hamstrings"],
    "intensity": 0.75,
    "volume_load": 4500,
    "duration_minutes": 45
  }
}
```

**출력 예측:**
```json
{
  "predicted_calorie_burn": 385,
  "muscle_activation_score": {
    "quadriceps": 0.92,
    "glutes": 0.88,
    "hamstrings": 0.75
  },
  "recovery_hours_required": 48,
  "performance_trajectory": {
    "week_4": 1.08, // 8% 향상 예측
    "week_8": 1.15,
    "week_12": 1.22
  },
  "injury_risk_score": 0.12 // 0-1 척도
}
```

### 그래디언트 부스팅 + 신경망 하이브리드 모델

최근 연구에 따르면 생리학적 신호(HRV, 산소 소비, 근육 활성화)와 심리적 요인(정신력, 참여도)을 통합한 **하이브리드 모델이 R² = 0.90 정확도**를 달성한다.

**피드백 루프 통합:**
```
사용자 운동 수행 → 데이터 로깅 → 
  사용자 모델 업데이트 → 예측 재계산 → 
    추천 조정 → 다음 운동 수행
```

**추적 핵심 지표:**
- 운동 완료율
- 무게/반복 진행
- 사용자 보고 난이도 (RPE 1-10)
- 심박수 반응 vs 예측
- 준수 패턴

---

## 기술 구현 (Next.js/Supabase)

### 데이터베이스 스키마

```sql
-- 체형 × 운동 호환성 매트릭스
CREATE TABLE body_type_exercise_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  body_type VARCHAR(50) NOT NULL, -- 'ectomorph', 'mesomorph_endo', etc.
  posture_type VARCHAR(50), -- 'lordotic', 'kyphotic', etc.
  exercise_id UUID REFERENCES exercises(id),
  compatibility_score DECIMAL(3,2), -- 0.00 to 1.00
  effectiveness_score DECIMAL(3,2),
  safety_score DECIMAL(3,2),
  korean_adaptation_notes TEXT,
  contraindication_level INTEGER, -- 0=safe, 1=modify, 2=avoid
  UNIQUE(body_type, posture_type, exercise_id)
);

-- 교정 운동 프로토콜
CREATE TABLE corrective_protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  posture_dysfunction VARCHAR(50) NOT NULL,
  phase VARCHAR(20) NOT NULL, -- 'inhibit', 'lengthen', 'activate', 'integrate'
  exercise_id UUID REFERENCES exercises(id),
  target_muscles JSONB,
  duration_seconds INTEGER,
  sets INTEGER,
  reps INTEGER,
  sequence_order INTEGER,
  instructions_ko TEXT
);

-- 근육 피로 상태 추적
CREATE TABLE muscle_fatigue_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  muscle_group VARCHAR(50),
  fatigue_level DECIMAL(3,2), -- 0-1, 시간에 따라 감소
  last_trained TIMESTAMP,
  volume_load DECIMAL(10,2),
  recovery_hours_remaining INTEGER,
  UNIQUE(user_id, muscle_group)
);
```

### MediaPipe 자세 분석 연동

```typescript
// 자세 분석 → 교정 운동 자동 매핑
async function analyzePostureAndRecommend(landmarks: PoseLandmark[]) {
  // 1. 자세 지표 계산
  const metrics = {
    headForwardAngle: calculateCraniovertebralAngle(landmarks),
    shoulderRoundingIndex: calculateScapularIndex(landmarks),
    pelvicTilt: calculatePelvicTiltAngle(landmarks),
    thoracicKyphosis: calculateKyphosisAngle(landmarks)
  };
  
  // 2. 자세 유형 분류
  const postureClassification = classifyPosture(metrics);
  // 예: { type: 'upper_cross_syndrome', severity: 'moderate', confidence: 0.85 }
  
  // 3. 교정 프로토콜 조회
  const protocol = await supabase
    .from('corrective_protocols')
    .select('*')
    .eq('posture_dysfunction', postureClassification.type)
    .order('phase', 'sequence_order');
  
  // 4. 개인화된 교정 세션 생성
  return generateCorrectiveSession(protocol, postureClassification.severity);
}
```

### API 엔드포인트 설계

```typescript
// POST /api/recommendations/workout
interface WorkoutRequest {
  userId: string;
  duration: number;
  goals: string[];
  availableEquipment: string[];
  focusAreas?: string[];
  includeCorrectiveExercises: boolean;
}

interface WorkoutRecommendation {
  warmup: {
    correctiveExercises: CorrExercise[]; // 자세 기반 교정 운동
    dynamicStretches: Exercise[];
  };
  mainWorkout: {
    exercises: RecommendedExercise[];
    totalVolume: number;
    estimatedCalories: number;
  };
  cooldown: Exercise[];
  warnings: SafetyWarning[];
  koreanAdaptations: string[]; // 한국인 체형 특화 조정 사항
}
```

---

## 한국인 체형 맞춤 운동 최적화

### 장비 및 운동 수정 권장사항

**장비 조정:**
- 좌석 높이: 더 낮은 설정 필요 (한국인 비율에 맞게)
- 그립 크기: 더 작은 그립 둘레 권장
- 레그프레스/익스텐션: 짧은 사지 길이로 좌석 더 가깝게
- 바벨 길이: 좁은 어깨 너비에 맞게 짧은 바 또는 조절 가능 장비 고려
- 벤치 높이: 적절한 발 배치를 위해 낮은 벤치 필요 가능

**운동 수정:**
- 프레스 운동에서 좁은 그립 너비 고려
- 발목 가동성 제한 시 스쿼트에서 발뒤꿈치 높이기 (플레이트 사용)
- 좌식 관련 경직 해소 위해 힙 힌지 패턴 우선
- 비대칭 해결 위해 일측성 운동 포함

### 한국인 우선 교정 프로그램

한국인 생활양식 특성(장시간 좌식, 스마트폰 사용)을 고려한 **우선순위 교정 프로그램:**

1. **턱 당기기 및 목 강화** (전방머리자세 해소)
2. **흉추 신전 운동** (캣-카우, 폼롤러 신전)
3. **견갑골 후인 운동** (밴드 풀어파트, 로우)
4. **장요근 스트레칭** (반무릎 꿇기 스트레칭)
5. **코어 안정성** (데드버그, 버드독, 플랭크)

### 한국 피트니스 문화 통합

**"오운완" (오늘 운동 완료) 문화 반영:**
- 일일 달성 가능한 운동 목표 강조
- 소셜 미디어 공유 기능 통합
- 커뮤니티 기반 피트니스 동기부여
- 증거 사진/영상 기록 기능

**시간 효율적 프로그래밍:**
- HIIT 및 서킷 스타일 훈련 (45분 클래스 인기)
- 사전 구성된 구조화 운동 (결정 피로 감소)
- 직장인 위한 아침/점심 운동 옵션
- 하이브리드 홈/짐 모델

---

## 구현 로드맵

### Phase 1: 기반 (MVP)
1. 운동 데이터베이스 + body_type_exercise_scores 매트릭스 구축
2. 가중 점수 기반 규칙 기반 추천 엔진 구현
3. 기본 사용자 프로파일링 (체형, 목표, 피트니스 레벨, 장비)
4. 매트릭스 조회 기반 간단한 운동 생성

### Phase 2: 지능화
1. 운동 로깅 및 선호도 추적 추가
2. 근육 피로 추적 및 회복 인식 스케줄링 구현
3. 기본 폼 피드백을 위한 MediaPipe 통합 (클라이언트 측)
4. 점진적 과부하 로직 추가

### Phase 3: 고급 개인화
1. 사용자 운동 데이터로 협업 필터링 모델 훈련
2. 잠재 요인 발견을 위한 텐서 분해 구현
3. 운동 효과 예측 모델 추가
4. 지속적 모델 개선을 위한 피드백 루프 구축

---

## 핵심 결론

Yiroom의 C-1 × W-1 교차 시스템은 단순한 체형-운동 매칭을 넘어 **자세 분석 연동, 실시간 안전 필터링, 한국인 특화 적응**을 통합한 종합 플랫폼이어야 한다. ACSM/NSCA 가이드라인의 과학적 근거와 NASM 교정 운동 프로토콜을 기반으로 하되, Size Korea 데이터와 현대 한국인의 라이프스타일 특성(장시간 좌식, 스마트폰 사용으로 인한 자세 문제)을 반영해야 한다.

**핵심 차별화 요소:**
- MediaPipe 기반 실시간 자세 분석 → 자동 교정 운동 처방
- 4단계 위험 계층화로 안전한 운동 추천
- 한국인 인체 측정 데이터 기반 장비/운동 조정
- "오운완" 문화와 K-뷰티 웰니스 트렌드 통합

이 시스템은 사용자의 체형 유형, 자세 상태, 피트니스 목표, 제한 사항을 종합적으로 고려하여 안전하고 효과적인 **개인화된 운동 경험**을 제공할 수 있다.