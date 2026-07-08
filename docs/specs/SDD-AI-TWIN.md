# SDD: AI 트윈 (ADR-115)

> **관련**: [ADR-115](../adr/ADR-115-ai-twin.md) | [ADR-113](../adr/ADR-113-visual-expression-layer.md) | [리서치](../research/claude-ai-research/2026-07-ai-twin-fitting.md)

## 1. DB (마이그레이션 `20260710_user_twins.sql` — prod gap-apply 필수)

```sql
CREATE TABLE IF NOT EXISTS user_twins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  image_path TEXT NOT NULL,              -- Storage 경로 (비공개 버킷, 분석 이미지와 분리)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  source_meta JSONB,                     -- { bodyType, promptVersion } (원본 사진은 저장 안 함)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: 본인만 CRUD (구패턴 auth.jwt()->>'sub' — prod 정합)
-- 인덱스: (clerk_user_id, status)
```

사용자당 approved 트윈 1개 원칙(새 승인 시 기존 approved→rejected).

## 2. 엔진 `lib/visual-expression/twin/` (ADR-113 모듈 내)

```typescript
interface TwinGenerateInput {
  faceImageBase64: string;        // 셀카 (필수)
  bodyImageBase64?: string;       // 전신 (선택 — 있으면 체형 정합↑)
  bodyConstraint?: { bodyTypeLabel: string; ratios?: Record<string, number> }; // body_analyses 실측 주입
}
interface TwinRecord { id: string; imageUrl: string; status: 'pending'|'approved'|'rejected'; aiGenerated: true }

generateTwin(input): Promise<TwinRecord>        // 나노바나나(GEMINI_IMAGE_MODEL) — 풀바디 스튜디오 트윈 1장
approveTwin(id) / rejectTwin(id) / deleteTwin(id)  // 삭제 = Storage 파일 + 행
getApprovedTwin(userId): Promise<TwinRecord | null>
composeOnTwin(twinId, layer: { kind: 'outfit'; garmentImageUrl: string } ): Promise<{ imageUrl; aiGenerated: true }>
  // v1 결합 = outfit 1종. 매 호출 트윈 원본 참조 재주입(드리프트 억제). 결과는 저장 안 함(다운로드/공유용) — P4
```

- 트윈 생성 프롬프트(코드 상수): 참조 얼굴 충실 재현 + bodyConstraint 문장 주입 + "스튜디오 배경, 전신, 자연스러운 자세" + 미화 금지("이목구비를 실제와 다르게 만들지 마세요"). 프롬프트 버전 source_meta 기록.
- 비용 가드: ADR-113 `budget.ts` 일 5회 상한 **공유**(보정+착장+트윈 합산).
- Storage: 비공개 버킷/경로 `twins/{userId}/...` — 분석 이미지 경로와 분리. 서명 URL로 클라 전달.

## 3. API

- `POST /api/visual/twin` — 생성(인증·상한·zod·이미지 ≤10MB). 응답 TwinRecord(pending).
- `GET /api/visual/twin` — 내 트윈(approved 우선, 없으면 최신 pending).
- `PATCH /api/visual/twin/[id]` — { action: 'approve'|'reject' }.
- `DELETE /api/visual/twin/[id]` — 파일+행 삭제.
- `POST /api/visual/twin/compose` — { twinId, garmentImageUrl } → 착장 이미지(approved 트윈만).

## 4. UI (One Canon — 새 페이지 최소)

- **생성 플로우** `components/visual-expression/TwinStudio.tsx`(모달/시트): 안내("본인 사진만 사용해주세요" 고지 + Gemini 전송 고지) → 셀카 업로드(+전신 선택) → 생성 로딩(정직한 진행) → **승인 게이트**: "이게 나 맞나요?" [네, 저예요 / 다시 만들기 / 그만두기]. 승인 전 트윈은 다른 어떤 표면에도 미노출.
- **진입점**: [나] 탭 프로필 상단 "내 트윈"(없으면 만들기 CTA, 있으면 썸네일) — 승인된 트윈만 표시 + "AI 생성" 라벨.
- **입혀보기**: 옷장 아이템 상세(ItemDetailSheet)의 기존 TryonButton 옆/대체 — approved 트윈 있으면 "트윈에게 입혀보기"(트윈 경로), 없으면 기존 FASHN 버튼 로직 유지(키 게이팅). 결과 모달 "AI 생성 이미지" 라벨+다운로드.
- 삭제: [나] 탭 트윈 영역에서 삭제 가능.

## 5. 테스트

- 승인 전 미노출(핵심) / 프롬프트 상수 미화 금지 문구 / 상한 공유 / approved 1개 원칙 / 삭제 시 파일+행 / compose는 approved만 / API 인증·zod / 역류 import 0.

## 6. Mock/폴백

- GEMINI 키 없음/생성 실패: 정직한 에러("지금은 트윈을 만들 수 없어요") — 가짜 트윈 금지.
- FORCE_MOCK_AI=true(로컬): 고정 플레이스홀더 이미지 + status pending (개발용, aiGenerated 라벨 동일).
