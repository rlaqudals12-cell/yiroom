# ADR-079: Gemini SDK 마이그레이션 (@google/generative-ai → @google/genai)

## 상태

accepted

## 날짜

2026-03-08

## 맥락 (Context)

`@google/generative-ai` v0.24.1이 2025년 11월 deprecated되었다. 공식 후속 SDK인 `@google/genai`로 전환이 필요하다.

현재 영향 범위:

- 12개 소스 파일, 30+ `getGenerativeModel` 호출
- 2개 스트리밍 파일 (`generateContentStream`)
- 3개 테스트 파일 (mock 패턴)

GFSA(Google for Startups Accelerator) 지원 중이며, Google SDK 최신 버전 사용은 심사에 긍정적이다.

## 결정 (Decision)

**Thin Adapter Layer** 패턴으로 전체 마이그레이션을 수행한다.

### 핵심 변경점

| 항목        | Old (`@google/generative-ai`)                  | New (`@google/genai`)                                  |
| ----------- | ---------------------------------------------- | ------------------------------------------------------ |
| Import      | `GoogleGenerativeAI`                           | `GoogleGenAI`                                          |
| 초기화      | `new GoogleGenerativeAI(apiKey)`               | `new GoogleGenAI({ apiKey })`                          |
| 모델 호출   | `genAI.getGenerativeModel().generateContent()` | `ai.models.generateContent({model, contents, config})` |
| 응답 텍스트 | `response.text()` (메서드)                     | `response.text` (프로퍼티)                             |
| 스트리밍    | `result.stream` 이터레이터                     | 응답 자체가 이터레이터                                 |
| 안전 설정   | `HarmCategory` enum                            | `"HARM_CATEGORY_X"` 문자열                             |
| 설정        | `generationConfig` on model                    | `config` on call                                       |

### 전략: Adapter Layer

`lib/gemini/client.ts`에 어댑터를 생성하여:

1. 새 SDK 초기화를 중앙 관리
2. `response.text` 프로퍼티 접근을 내부에서 처리
3. 소비자 코드는 어댑터의 간단한 인터페이스만 사용
4. 롤백 시 어댑터 내부만 교체 (1파일)

## 대안 (Alternatives)

| 대안                    | 장점        | 단점                           | 제외 사유   |
| ----------------------- | ----------- | ------------------------------ | ----------- |
| deprecated SDK 유지     | 변경 0      | 보안/지원 중단, GFSA 불리      | DEPRECATED  |
| 직접 치환 (어댑터 없이) | 추상화 없음 | 32개 response.text() 누락 위험 | ERROR_PRONE |
| 전체 리팩토링 병행      | 구조 개선   | 범위 확대, 위험 증가           | SCOPE_CREEP |

## 구현 순서

```
Stage 0: ADR + SDK 설치 (양 SDK 공존)
Stage 1: Adapter layer + 테스트
Stage 2: Low-risk 파일 4개
Stage 3: Medium-risk 파일 4개
Stage 4: Streaming 파일 2개
Stage 5: Core 엔진 2개
Stage 6: 테스트 mock 3개
Stage 7: 구 SDK 제거
```

각 Stage 후 `typecheck + lint + test` 검증.

## 결과 (Consequences)

### 긍정적

- 지원되는 SDK 사용 (보안 패치, 버그 수정)
- 향후 구조화된 출력, Context Caching 등 새 기능 활용 가능
- GFSA 심사에 최신 Google SDK 사용 어필

### 부정적

- 14개 파일 수정 (단기 위험)
- 테스트 mock 전체 업데이트 필요

### 리스크 완화

- 양 SDK 공존으로 점진적 전환
- `FORCE_MOCK_AI=true`로 즉시 바이패스
- git revert로 개별 Stage 롤백 가능

## 관련 문서

- [ADR-003: AI 모델 선택](ADR-003-ai-model-selection.md)
- [ADR-007: Mock Fallback 전략](ADR-007-mock-fallback-strategy.md)
- [ADR-027: Coach AI 스트리밍](ADR-027-coach-ai-streaming.md)
- [원리: AI 추론](../principles/ai-inference.md)

---

**Version**: 1.0 | **Author**: Claude Code
