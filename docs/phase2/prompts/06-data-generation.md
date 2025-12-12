# 📊 Data Generation 프롬프트 템플릿

> JSON 데이터, Mock 데이터, 시드 데이터 생성용  
> **Claude Mode**: Auto-accept 권장 (`Shift+Tab`)

---

## 기본 프롬프트

```
[데이터 종류] JSON 파일을 생성해주세요.

파일: [파일 경로]
형식: [타입 파일 참조]
개수: [N개]

카테고리:
- [카테고리 1]: N개
- [카테고리 2]: N개

각 항목에 [필수 정보] 포함.
```

---

## 예시: 운동 DB 생성

```
상체 운동 DB JSON 파일을 생성해주세요.

파일: data/exercises/upper-body.json
형식: types/exercise.ts의 Exercise 타입 참조
개수: 50개

카테고리 분포:
- 가슴: 12개
- 어깨: 12개
- 등: 12개
- 팔: 14개

각 운동에 포함:
- id: 고유 ID (ub-001 형식)
- name: 한국어 이름
- nameEn: 영어 이름
- category: 카테고리
- bodyParts: 자극 부위[]
- equipment: 필요 기구
- difficulty: 난이도 (1-5)
- instructions: 동작 설명 (3-5단계)
- tips: 호흡법/주의사항
- calories: 10분당 소모 칼로리

실제 운동 이름과 정확한 동작 설명 사용.
```

---

## 예시: 음식 DB 생성

```
한국 음식 DB JSON 파일을 생성해주세요.

파일: data/foods/korean-foods.json
형식: types/food.ts의 Food 타입 참조
개수: 100개

카테고리 분포:
- 밥류: 20개
- 국/찌개: 20개
- 반찬: 30개
- 면류: 15개
- 간식: 15개

각 음식에 포함:
- id: 고유 ID
- name: 음식명
- category: 카테고리
- portion: 1인분 기준량 (g)
- calories: 칼로리
- protein: 단백질 (g)
- carbs: 탄수화물 (g)
- fat: 지방 (g)
- fiber: 식이섬유 (g)
- sodium: 나트륨 (mg)
- trafficLight: green/yellow/red

영양정보는 실제 데이터 기반으로 작성.
```

---

## 예시: 연예인 체형 DB

```
한국 연예인 체형 정보 JSON을 생성해주세요.

파일: data/celebrities/korean-celebrities.json
개수: 20명

각 항목에 포함:
- id: 고유 ID
- name: 이름
- profession: 직업 (배우/가수/모델)
- bodyType: 체형 (H/A/O/X/I)
- height: 키 (cm, 공개된 정보)
- workoutStyle: 대표 운동 스타일
- quote: 운동/건강 관련 명언 (실제 인터뷰 기반)

실제 공개된 정보만 사용.
비공개 정보는 null 처리.
```

---

## 예시: Mock API 응답

```
운동 추천 API Mock 응답을 생성해주세요.

파일: __mocks__/workout-recommendations.json

시나리오별 응답:
1. H형 체형 + 근력 강화 목표
2. A형 체형 + 체중 감량 목표
3. O형 체형 + 밸런스 개선 목표

각 응답에 포함:
- workoutType: strength/cardio/balance
- reason: 추천 이유
- exercises: 추천 운동 5개
- weeklyPlan: 주간 플랜
```

---

## 검증 명령어

```bash
# JSON 유효성 검사
npx jsonlint [파일 경로]

# 개수 확인
jq '. | length' [파일 경로]

# 필드 존재 확인
jq '.[0] | keys' [파일 경로]
```

---

## 팁

- Auto-accept 모드로 빠른 생성
- 타입 파일 참조로 형식 일관성
- 실제 데이터 기반 요청
- 생성 후 jsonlint로 검증
- 카테고리 분포 명시로 균형 유지
