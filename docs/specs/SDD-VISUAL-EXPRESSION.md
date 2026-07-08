# SDD: 표현 레이어 — AI 자연 보정 · 가상 착장 (ADR-113)

> **관련**: [ADR-113](../adr/ADR-113-visual-expression-layer.md) | [리서치](../research/claude-ai-research/2026-07-image-gen-tryon-beautify.md)

## 1. 모듈 구조 (P8)

```
lib/visual-expression/
├── index.ts          # 공개 API만
├── types.ts
├── internal/
│   ├── beautify.ts   # Gemini 이미지 편집 (자연 보정)
│   ├── tryon.ts      # FASHN.ai 어댑터
│   └── budget.ts     # 세션 생성 상한 가드
```

분석 모듈(lib/analysis, lib/gemini 분석 경로)에서 이 모듈을 import하는 것 금지(단방향 — 표현→진실 읽기만).

## 2. 자연 보정 (beautify)

```typescript
interface BeautifyInput {
  imageBase64: string; // 사용자 원본 (공유 흐름 전용)
}
interface BeautifyOutput {
  imageBase64: string; // 보정본
  aiEdited: true; // 상수 — 라벨 강제
  model: string;
}
async function beautifyForShare(input: BeautifyInput): Promise<BeautifyOutput>;
```

- 모델: Gemini 이미지 편집(환경변수 `GEMINI_IMAGE_MODEL`, 기본 `gemini-2.5-flash-image`), 기존 API 키 재사용.
- 프롬프트 고정(코드 상수): 피부 결·잡티·조명 정돈만. **"이목구비·얼굴형·체형을 변형하지 말 것" 명시**. 프롬프트 문자열 테스트로 고정.
- 실패 시: 원본 그대로 반환 + `aiEdited` 없음 (보정 실패를 숨기지 않음, Mock 보정 금지).
- API: `POST /api/visual/beautify` (인증 필수, rate limit 기존 패턴).

## 3. 가상 착장 (tryon — FASHN.ai 어댑터)

```typescript
interface TryonInput {
  modelImageBase64: string; // 사용자 전신/상반신
  garmentImageUrl: string; // 의류 이미지 (옷장/추천 코디)
  category: 'tops' | 'bottoms' | 'one-pieces';
}
interface TryonOutput {
  imageUrl: string;
  aiGenerated: true;
}
function isTryonAvailable(): boolean; // FASHN_API_KEY 존재 여부
async function generateTryon(input: TryonInput): Promise<TryonOutput>;
```

- `FASHN_API_KEY` 없으면 `isTryonAvailable()=false` → **표면 자체 비노출**(준비중 배너 금지).
- API: `POST /api/visual/tryon` (인증, 키 없으면 404).
- 폴링형 API(FASHN run→status) 래핑, 타임아웃 40초.

## 4. 비용 가드

- 세션(사용자·일 단위)당 보정+착장 합산 **5회** 상한 — 초과 시 안내 문구 반환. 카운트는 서버 메모리+DB 불요(간단히 rate limit 유틸 재사용 가능).

## 5. UI 표면 (One Canon)

- **보정 공유**: 기존 결과 공유 흐름(ShareThemePicker 계열)에 "내 사진으로 공유(자연 보정)" 옵션 1개 추가. 산출 이미지에 "AI 보정됨" 라벨 오버레이/문구 상시. 기존 익명 일러스트 공유 유지.
- **착장**: 체형 결과/옷장 코디 카드에 "입어보기" 버튼(키 있을 때만). 결과 모달에 "AI 생성 이미지" 라벨 + 저장/공유.

## 6. 테스트

- 프롬프트 고정(이목구비 변형 금지 문구 포함) / aiEdited 라벨 강제 / 키 부재 시 tryon 비노출·API 404 / 상한 가드 / 분석 모듈로의 역류 import 부재(경로 검사).
