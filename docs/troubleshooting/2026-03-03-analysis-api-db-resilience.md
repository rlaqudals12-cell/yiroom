# 분석 API DB 저장 실패 시 응답 차단 이슈

> **날짜**: 2026-03-03
> **영향 파일**: 11개 분석 API 라우트 (v1 5개 + v2 4개 + 추가 2개)
> **심각도**: 높음 (GFSA 심사 배포에서 분석 완전 실패)
> **상태**: ✅ 해결됨

---

## 1. Vercel 환경변수 오염

### 증상

Vercel 프로덕션 배포(`yiroom.vercel.app`)에서 분석 기능이 Mock 모드로만 동작.

### 원인

Vercel 환경변수에 `\n` (개행 문자)이 붙어있었음:

- `FORCE_MOCK_AI="false\n"` → 문자열 비교 시 `"false\n" !== "true"` 이지만 예기치 않은 동작 가능
- `GOOGLE_GENERATIVE_AI_API_KEY="AIza...\n"` → API 키에 개행이 포함되어 인증 실패

### 해결

```bash
# 오염된 값 삭제
vercel env rm FORCE_MOCK_AI production
vercel env rm GOOGLE_GENERATIVE_AI_API_KEY production

# 깨끗한 값 추가 (printf로 개행 방지)
printf 'false' | vercel env add FORCE_MOCK_AI production
printf 'AIzaSy...' | vercel env add GOOGLE_GENERATIVE_AI_API_KEY production
```

### 교훈

- Vercel 환경변수 추가 시 **`printf`** 사용 (echo는 `\n` 추가)
- `vercel env ls` 후 값 길이가 예상보다 1바이트 크면 오염 의심

---

## 2. DB 저장 실패 시 분석 결과 차단 (핵심 이슈)

### 증상

Vercel 배포에서 AI 분석은 성공했으나 Supabase DB 저장이 실패하면 **500 에러**가 사용자에게 반환됨.
분석에 수 초~수십 초 걸린 결과가 DB 저장 실패 하나로 인해 완전히 유실.

### 재현 조건

1. `FORCE_MOCK_AI=false` (실제 AI 사용)
2. Gemini AI 분석 성공
3. Supabase DB `insert` 실패 (RLS, 네트워크, 스키마 불일치 등)
4. → 사용자에게 **분석 결과 미반환**, 500 에러

### 원인

#### 패턴 A: 내부 DB 에러 체크 (v1 라우트)

```typescript
// ❌ 문제: Real AI 성공 시 DB 에러로 500 반환
const { data, error } = await supabase.from('xxx_analyses').insert({...}).select().single();
if (error) {
  if (!usedMock) {
    return dbError('분석 결과 저장에 실패했습니다.', error.message);
    // ← AI 분석 결과 유실!
  }
}
```

#### 패턴 B: 외부 catch 가드 (v1 라우트)

```typescript
// ❌ 문제: Mock 모드에서만 합성 응답, Real AI에서는 throw
} catch (dbOperationError) {
  if (usedMock) {
    return NextResponse.json({ success: true, data: { id: syntheticId, ... } });
  }
  throw dbOperationError;  // ← Real AI 결과 유실!
}
```

#### 패턴 C: 내부 DB 에러 체크 (v2 라우트)

```typescript
// ❌ 문제: Fallback 아닌 경우 500 반환
if (error) {
  if (!usedFallback) {
    return dbError('분석 결과 저장에 실패했습니다.', error.message);
  }
}
```

### 해결

#### 원칙: "분석 결과는 절대 유실하지 않는다"

모든 분석 API에서 DB 저장 실패 시 **합성 ID로 결과를 반환**하도록 통일:

```typescript
// ✅ 수정: DB 실패 시에도 항상 분석 결과 반환
if (error) {
  console.error('[Module] Database insert error:', error);
  const syntheticId = crypto.randomUUID();
  return NextResponse.json({
    success: true,
    data: { id: syntheticId, clerk_user_id: userId, created_at: new Date().toISOString() },
    result,
    usedMock, // ← usedMock: true 하드코딩 제거, 실제 값 전달
    dbSaveFailed: true, // ← 클라이언트에서 인지 가능
    gamification: { badgeResults: [], xpAwarded: 0 },
  });
}
```

외부 catch에서도 동일:

```typescript
// ✅ 수정: if (usedMock) 가드 제거, 무조건 합성 응답
} catch (dbOperationError) {
  console.warn('[Module] DB operations failed, using synthetic response');
  const syntheticId = crypto.randomUUID();
  return NextResponse.json({
    success: true,
    data: { id: syntheticId, ... },
    result,
    usedMock,
    dbSaveFailed: true,
    gamification: { badgeResults: [], xpAwarded: 0 },
  });
}
```

### 영향 파일

#### v2 라우트 (패턴 A+C 수정)

| 파일                                         | 모듈 |
| -------------------------------------------- | ---- |
| `app/api/analyze/personal-color-v2/route.ts` | PC-2 |
| `app/api/analyze/skin-v2/route.ts`           | S-2  |
| `app/api/analyze/body-v2/route.ts`           | C-2  |
| `app/api/analyze/hair-v2/route.ts`           | H-2  |

#### v1 라우트 (패턴 A+B 수정)

| 파일                                      | 모듈 |
| ----------------------------------------- | ---- |
| `app/api/analyze/personal-color/route.ts` | PC-1 |
| `app/api/analyze/skin/route.ts`           | S-1  |
| `app/api/analyze/body/route.ts`           | C-1  |
| `app/api/analyze/hair/route.ts`           | H-1  |
| `app/api/analyze/makeup/route.ts`         | M-1  |
| `app/api/analyze/posture/route.ts`        | A-1  |

### 교훈

1. **AI 분석 결과 > DB 저장**: 비용이 높은 AI 분석 결과를 DB 실패 하나로 버리면 안 됨
2. **`usedMock` 가드 금지**: DB 실패 합성 응답은 Mock/Real 무관하게 적용해야 함
3. **`dbSaveFailed` 플래그**: 클라이언트에서 DB 저장 실패를 인지하고, 재시도 UI 제공 가능
4. **배포 전 DB 연결 검증**: Vercel 환경에서 Supabase 연결 상태를 health check로 확인

---

## 3. Vercel 빌드 캐시 파일 불일치

### 증상

로컬 `tsc --noEmit` 통과했으나 Vercel 빌드에서 타입 에러 발생.
로컬 파일과 Vercel에 올라간 파일의 내용이 다름.

### 원인

Vercel은 변경되지 않은 파일을 **이전 배포 캐시**에서 재사용함.
이전에 깨진 상태의 파일이 캐시되어 있으면, 로컬 수정이 반영되지 않음.

### 해결

```bash
# --force 옵션으로 캐시 없이 클린 빌드
vercel --prod --force
```

### 발견된 캐시 불일치 파일

| 파일                  | 로컬                                             | Vercel 캐시                                   |
| --------------------- | ------------------------------------------------ | --------------------------------------------- |
| `drape-palette.ts:18` | `type DrapeSeason = 'spring' \| 'summer' \| ...` | `type DrapeSeason = DrapeSeason;` (순환 참조) |
| `compare/page.tsx:22` | `import { selectByCondition } from ...`          | import 문 없음                                |

### 교훈

- Vercel 빌드 실패가 로컬과 다르면 **`--force`** 옵션으로 캐시 제거 시도
- 파일을 trivially 수정(주석 추가 등)해서 변경 감지를 강제하는 것도 가능

---

## 4. 추가 빌드 에러 수정 (기존 코드)

빌드 과정에서 발견된 기존 타입 에러:

| 파일                                | 에러                                 | 수정                                               |
| ----------------------------------- | ------------------------------------ | -------------------------------------------------- |
| `conditional-helpers.ts:160`        | 스프레드 결과 `Partial<T>` 할당 불가 | `mapping[type] ?? {}` 변수 분리 후 `as Partial<T>` |
| `WeeklyComparisonChart.tsx:160-161` | computed property에 `null` 사용 불가 | `if (x !== null)` 가드 추가                        |
| `WeeklyComparisonChart.tsx:172`     | `return (...)` 괄호 불일치           | `)` → `);` 수정                                    |

---

## 요약: 현재 분석 API 안전성

```
사용자 요청
  ↓
AI 분석 (Gemini → Claude → Mock)
  ↓ 성공
DB 저장 시도
  ├─ 성공 → 정상 응답 (data + result)
  └─ 실패 → 합성 응답 (syntheticId + result + dbSaveFailed: true)

→ 어떤 경우에도 분석 결과는 사용자에게 반환됨
```

---

**Updated**: 2026-03-03
