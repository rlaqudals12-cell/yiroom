# 🔴 Complex Task 프롬프트 템플릿

> **복잡도**: 높음  
> **Claude Mode**: Think Hard → Plan → Implement  
> **예상 반복**: 3회+  
> **TDD**: 테스트 먼저 작성 (필수)

---

## 기본 프롬프트

```
Task [ID]를 구현해야 합니다.

Think hard about:
1. [고려사항 1]
2. [고려사항 2]
3. [고려사항 3]
4. [고려사항 4]

⚠️ TDD: 테스트 코드 먼저 작성 → 구현 → 반복 검증

파일: [파일 경로]

요구사항:
- [상세 요구사항]

수락 기준:
Given: [조건]
When: [행동]
Then: [결과]

기존 패턴 참고:
- [참고 파일 1]
- [참고 파일 2]
```

---

## 예시: AI 프롬프트 작성

```
Task 3.2: 운동 타입 분류 AI 프롬프트를 작성해주세요.

Think hard about:
1. 체형별 운동 추천 로직
2. 목표와 고민 조합에 따른 분류
3. JSON 응답 강제 방법
4. 한국어 설명 품질
5. 엣지 케이스 (데이터 누락 시)

⚠️ TDD: 테스트 코드 먼저 작성 → 구현 → 반복 검증

파일: lib/gemini/prompts/workoutType.ts

프롬프트 구조:
- 역할: 피트니스 전문가
- 입력 데이터 설명 (체형, 목표, 고민, 기구)
- 출력 형식 지정 (JSON)
- 분류 기준 가이드라인

응답 형식:
{
  "type": "strength" | "cardio" | "balance",
  "reason": "한국어 설명",
  "focusPoints": ["포인트1", "포인트2"]
}

기존 패턴 참고:
- lib/gemini/prompts/skinAnalysis.ts
- lib/gemini/prompts/bodyAnalysis.ts

테스트:
- 다양한 입력 조합으로 응답 품질 검증
- JSON 파싱 에러 핸들링
```

---

## 예시: AI API 통합

```
Task 2.5: 음식 AI 분석 API를 구현해야 합니다.

Think hard about:
1. Gemini Vision API 최적 프롬프트
2. 이미지 전처리 필요성 (리사이즈, 압축)
3. 응답 파싱 및 검증
4. 에러 핸들링 (인식 실패, API 오류, 타임아웃)
5. 캐싱 전략 (동일 이미지 재분석 방지)
6. 성능 최적화 (3초 이내 응답)

⚠️ TDD: 테스트 코드 먼저 작성 → 구현 → 반복 검증

파일: app/api/nutrition/analyze/route.ts

요구사항:
- POST 요청 (multipart/form-data)
- 이미지 → Gemini Vision API
- 음식명 + 영양정보 JSON 반환
- 3초 타임아웃

기존 패턴 참고:
- app/api/skin/analyze/route.ts
- lib/gemini/client.ts
```

---

## 반복 개선 체크리스트

- [ ] 1차: 기본 구현 (Happy Path)
- [ ] 2차: 엣지 케이스 + 에러 핸들링
- [ ] 3차: 성능 최적화 + 리팩토링
- [ ] (선택) 4차: 추가 개선

---

## 팁

- "Think hard about" 키워드로 Extended Thinking 활성화
- 복잡한 로직은 단계별로 분리
- 테스트 주도 개발 필수
- 3회 이상 반복으로 품질 확보
- 기존 코드 패턴 참고 (일관성 유지)
