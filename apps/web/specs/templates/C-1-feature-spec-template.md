# 📋 C-1 Feature Spec Template
## AI 체형 분석 & 스타일링 추천 시스템

**모듈 ID**: C-1  
**작성일**: [작성일 입력]  
**작성자**: [작성자 입력]  
**상태**: [ ] Draft / [ ] Review / [ ] Approved / [ ] Implemented

---

## 1. 개요 (Overview)

### 1.1 목적
```yaml
핵심 목적:
  AI 기반 정밀 체형 분석을 통해
  퍼스널 컬러와 결합한 맞춤 스타일링 제공

기대 효과:
  - 체형 분류 정확도: 85% 이상
  - 스타일 만족도: 80% 이상
  - 쇼핑 전환율: 20%
```

### 1.2 사용자 스토리
```gherkin
Feature: AI 체형 분석
  As a 옷 고르기 어려워하는 10대 후반~30대 초반 사용자
  I want to 내 체형을 정확히 알고
  So that 나에게 잘 어울리는 스타일을 찾을 수 있다

Scenario: 체형 진단 및 스타일링
  Given 사용자가 전신 사진을 업로드했을 때
  When AI가 체형을 분석하면
  Then 체형 타입과 퍼스널 컬러 기반 스타일링을 추천한다
```

---

## 2. 기능 명세 (Functional Requirements)

### 2.1 체형 분류 시스템
```yaml
여성 체형 (5가지):
  1. 스트레이트 (I형):
     - 어깨, 허리, 힙 비율 유사
     - 추천: 실루엣 만들기
  
  2. 트라이앵글 (A형):
     - 힙 > 어깨
     - 추천: 상체 볼륨 강조
  
  3. 인버티드 (Y형):
     - 어깨 > 힙
     - 추천: 하체 볼륨 추가
  
  4. 아워글라스 (X형):
     - 허리 < 어깨 = 힙
     - 추천: 실루엣 강조
  
  5. 애플 (O형):
     - 허리 > 어깨, 힙
     - 추천: 수직 라인 강조

남성 체형 (추후 확장):
  - 삼각형 / 역삼각형 / 직사각형 / 타원형
```

### 2.2 측정 포인트
```yaml
자동 측정 (AI):
  - 어깨 너비
  - 가슴 둘레
  - 허리 둘레
  - 힙 둘레
  - 신장 추정
  - 다리 길이 비율

수동 입력 (선택):
  - 정확한 신장
  - 체중
  - 평소 사이즈
  - 선호 핏
```

### 2.3 퍼스널 컬러 통합
```yaml
체형 + 컬러 매칭:
  스트레이트 + 봄웜톤:
    - 파스텔 원피스
    - 플레어 스커트
    - 밝은 액세서리
  
  트라이앵글 + 여름쿨톤:
    - 오프숄더 상의
    - 스트레이트 팬츠
    - 시원한 색감
  
  [모든 조합에 대한 추천]
```

---

## 3. 스타일링 추천 시스템

### 3.1 추천 카테고리
```yaml
상황별 스타일링:
  1. 데일리룩:
     - 출근룩 (오피스)
     - 캠퍼스룩 (대학생)
     - 홈웨어
  
  2. 특별한 날:
     - 데이트룩
     - 면접룩
     - 파티룩
  
  3. 계절별:
     - 봄/가을 레이어드
     - 여름 쿨링
     - 겨울 보온

아이템별 추천:
  - 상의: 3-5개
  - 하의: 3-5개
  - 아우터: 2-3개
  - 액세서리: 3-5개
```

### 3.2 브랜드 매칭
```yaml
가격대별:
  저가 (1-3만원):
    - 스파오, 탑텐, 에잇세컨즈
  
  중가 (3-10만원):
    - 자라, COS, 유니클로
  
  고가 (10만원+):
    - 마시모두띠, 테오리, COS

스타일별:
  미니멀: COS, 유니클로
  페미닌: 미쏘, 플라스틱아일랜드
  캐주얼: 무신사 스탠다드
  스트릿: 커버낫, 무신사
```

---

## 4. UI/UX 명세

### 4.1 촬영 가이드
```yaml
사진 촬영:
  필수 사진:
    - 정면 전신 (팔 벌린 자세)
    - 측면 전신
  
  촬영 가이드:
    - 몸에 붙는 옷 권장
    - 전신 거울 활용
    - 격자 가이드라인 제공
    - 자동 타이머 기능

AR 측정 (선택):
  - 실시간 측정
  - 3D 아바타 생성
```

### 4.2 결과 화면
```yaml
체형 분석 결과:
  1. 체형 타입:
     - 일러스트 비교
     - 연예인 예시
     - 특징 설명
  
  2. 신체 비율:
     - 8등신 비교
     - 황금 비율 분석
     - 강점/보완점
  
  3. 스타일 가이드:
     - Do's & Don'ts
     - 추천 실루엣
     - 피해야 할 스타일

코디 추천:
  - 룩북 형태 (스와이프)
  - 아이템별 쇼핑 링크
  - 저장/공유 기능
```

---

## 5. 데이터 스키마

### 5.1 Database Schema
```sql
-- body_analyses 테이블
CREATE TABLE body_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  
  -- 체형 데이터
  body_type VARCHAR(20), -- STRAIGHT, TRIANGLE, etc.
  shoulder_width DECIMAL(5,2),
  bust_size DECIMAL(5,2),
  waist_size DECIMAL(5,2),
  hip_size DECIMAL(5,2),
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  
  -- 비율 분석
  shoulder_hip_ratio DECIMAL(3,2),
  waist_hip_ratio DECIMAL(3,2),
  leg_body_ratio DECIMAL(3,2),
  
  -- AI 데이터
  confidence_score DECIMAL(5,2),
  raw_measurements JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- styling_recommendations 테이블
CREATE TABLE styling_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body_analysis_id UUID REFERENCES body_analyses(id),
  personal_color_id UUID REFERENCES personal_colors(id),
  
  occasion VARCHAR(50), -- DAILY, DATE, OFFICE
  season VARCHAR(20),
  
  -- 추천 아이템
  top_items JSONB,
  bottom_items JSONB,
  outer_items JSONB,
  accessories JSONB,
  
  -- 스타일링 정보
  style_concept TEXT,
  color_palette JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- user_wardrobes 테이블 (추후 확장)
CREATE TABLE user_wardrobes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  
  item_category VARCHAR(50),
  brand VARCHAR(100),
  color VARCHAR(50),
  size VARCHAR(20),
  purchase_date DATE,
  frequency_worn INTEGER DEFAULT 0,
  
  image_url TEXT,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. AI 처리 파이프라인

### 6.1 이미지 분석
```python
def analyze_body_shape(image):
    # 1. 포즈 감지 (Mediapipe)
    keypoints = detect_pose(image)
    
    # 2. 측정점 추출
    measurements = extract_measurements(keypoints)
    
    # 3. 비율 계산
    ratios = calculate_ratios(measurements)
    
    # 4. 체형 분류
    body_type = classify_body_type(ratios)
    
    # 5. 신뢰도 평가
    confidence = evaluate_confidence(keypoints, measurements)
    
    return {
        'body_type': body_type,
        'measurements': measurements,
        'confidence': confidence
    }
```

### 6.2 스타일 매칭
```python
def generate_styling(body_type, personal_color, occasion):
    # 1. 체형별 기본 규칙
    base_rules = get_body_type_rules(body_type)
    
    # 2. 컬러 팔레트 결합
    color_palette = merge_color_rules(personal_color)
    
    # 3. 상황별 필터링
    occasion_filter = get_occasion_requirements(occasion)
    
    # 4. 아이템 매칭
    items = match_items(base_rules, color_palette, occasion_filter)
    
    # 5. 코디 조합
    outfits = create_outfit_combinations(items)
    
    return rank_outfits(outfits)
```

---

## 7. 외부 연동

### 7.1 패션 플랫폼
```yaml
무신사:
  - 상품 정보 API
  - 재고 확인
  - 사이즈 정보
  
29CM:
  - 브랜드 정보
  - 스타일 큐레이션
  
W컨셉:
  - 디자이너 브랜드
  - 시즌 트렌드
```

### 7.2 AI Services
```yaml
Gemini 3 Pro:
  - 포즈 추정
  - 의류 인식
  - 스타일 분석

MediaPipe:
  - 신체 랜드마크
  - 3D 포즈 추정
```

---

## 8. 성공 지표

### 8.1 정확도 지표
```yaml
체형 분류:
  - 전문가 평가 일치율: 85%
  - 사용자 동의율: 90%

스타일 추천:
  - 만족도: 4.0/5.0 이상
  - 재추천 요청률: < 20%
```

### 8.2 비즈니스 지표
```yaml
사용자:
  - 월 재방문율: 60%
  - 평균 체류 시간: 10분

수익:
  - 쇼핑 클릭률: 40%
  - 구매 전환율: 20%
  - 제휴 수수료: 월 1000만원
```

---

## 9. 테스트 시나리오

### 9.1 다양성 테스트
```yaml
체형 다양성:
  - 각 체형별 100명
  - 다양한 신장 (150-180cm)
  - 다양한 체중

문화적 다양성:
  - 한국인 체형 특성
  - 서구 체형 대응
  - 아시아 각국 특성
```

### 9.2 엣지 케이스
```yaml
특수 상황:
  - 임산부 체형
  - 수술 후 체형 변화
  - 극단적 비율
  
기술적 한계:
  - 헐렁한 옷 착용
  - 앉은 자세
  - 부분 가림
```

---

## 10. 로드맵

### Phase 1 (Week 3-4)
- [ ] UI/UX 구현
- [ ] 기본 체형 분류
- [ ] Mock 추천

### Phase 2 (Week 5-6)
- [ ] AI 연동
- [ ] 퍼스널 컬러 통합
- [ ] 실제 제품 매칭

### Phase 3 (Week 7-8)
- [ ] 쇼핑 플랫폼 연동
- [ ] AR 기능 (선택)
- [ ] 성능 최적화

---

## 체크리스트

### 기획 단계
- [ ] 패션 전문가 자문
- [ ] 체형 데이터 수집
- [ ] 브랜드 제휴 협의
- [ ] UX 리서치

### 개발 단계
- [ ] 포즈 추정 정확도 테스트
- [ ] 스타일 매칭 알고리즘 검증
- [ ] API 연동 테스트

### 출시 준비
- [ ] 베타 테스터 모집
- [ ] A/B 테스트
- [ ] 제휴사 최종 점검

---

## 📝 특별 고려사항

### 한국 시장 특화
```yaml
체형 특성:
  - 한국인 평균 비율 반영
  - 사이즈 표기 (55, 66, 77)
  
트렌드:
  - K-패션 스타일
  - 계절별 유행
  - 연령별 선호도
```

### 확장 가능성
```yaml
미래 기능:
  - 가상 피팅
  - 옷장 관리
  - 중고 거래 연동
  - 스타일 커뮤니티
```

---

**다음 단계**: Task 분해 → Development 명세 → 구현 → 테스트
