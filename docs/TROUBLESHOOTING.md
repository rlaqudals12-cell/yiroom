# 이룸 오류 사전 (Troubleshooting Guide)

> 개발 중 발생할 수 있는 오류와 해결 방법을 쉽게 찾을 수 있는 가이드

## 📖 이 문서 사용법

1. **증상**으로 오류 찾기: 화면에서 본 현상으로 검색
2. **에러 메시지**로 찾기: 콘솔에 나온 빨간 글씨로 검색
3. **모듈별**로 찾기: PC-1, S-1 등 작업 중인 모듈로 검색

---

## 🔴 Critical 오류 (서비스 중단)

### ERR-001: "column does not exist" (컬럼 없음)

**증상**

- 분석 버튼을 누르면 화면이 멈춤
- 콘솔에 `500 Internal Server Error` 표시
- 데이터가 저장되지 않음

**에러 메시지 예시**

```
PostgresError: column "left_image_url" of relation "personal_color_assessments" does not exist
```

**원인 (쉬운 설명)**
코드에서 "left_image_url"이라는 칸(컬럼)에 데이터를 저장하려 했는데,
데이터베이스에 그 칸이 아직 만들어지지 않았습니다.

비유: 엑셀에 "이름" 열이 없는데, "이름" 열에 데이터를 넣으려고 한 상황

**해결 방법**

1. 마이그레이션 파일 생성 (컬럼 추가 명령)
   ```sql
   -- supabase/migrations/YYYYMMDD_add_column.sql
   ALTER TABLE personal_color_assessments
     ADD COLUMN IF NOT EXISTS left_image_url TEXT;
   ```
2. 마이그레이션 적용
   ```bash
   npx supabase db push
   ```
3. 서버 재시작

**예방법**

- API 코드 수정 전에 항상 마이그레이션 먼저 생성
- `.claude/rules/db-api-sync.md` 규칙 참조

---

### ERR-002: "relation does not exist" (테이블 없음)

**증상**

- 페이지 로딩 시 빈 화면
- 콘솔에 `500` 또는 `404` 에러

**에러 메시지 예시**

```
PostgresError: relation "face_analyses" does not exist
```

**원인 (쉬운 설명)**
코드에서 "face_analyses"라는 테이블(표)에서 데이터를 가져오려 했는데,
데이터베이스에 그 테이블 자체가 없습니다.

비유: "매출현황" 시트가 없는데, 그 시트를 열려고 한 상황

**해결 방법**

1. 테이블 생성 마이그레이션 작성
2. `npx supabase db push` 실행
3. 필요시 RLS 정책도 함께 생성

**예방법**

- 새 기능 개발 시 테이블 설계를 먼저 완료
- `docs/DATABASE-SCHEMA.md` 문서 확인

---

### ERR-003: "RLS policy violation" (권한 오류)

**증상**

- 데이터 조회/저장이 안 됨
- 로그인한 사용자인데도 "권한 없음" 표시

**에러 메시지 예시**

```
new row violates row-level security policy for table "skin_analyses"
```

**원인 (쉬운 설명)**
RLS(행 단위 보안)는 "자기 데이터만 볼 수 있다"는 규칙입니다.
이 규칙이 잘못 설정되었거나, 사용자 인증 정보가 제대로 전달되지 않았습니다.

비유: 아파트 출입 카드가 있는데, 보안 시스템이 카드를 인식 못하는 상황

**해결 방법**

1. RLS 정책 확인
   ```sql
   -- Supabase 대시보드 > Authentication > Policies
   -- 해당 테이블의 정책 확인
   ```
2. Supabase 클라이언트가 올바른지 확인
   - Client Component: `useClerkSupabaseClient()`
   - Server Component: `createClerkSupabaseClient()`
3. 인증 토큰이 전달되는지 확인

**예방법**

- 새 테이블 생성 시 RLS 정책 함께 작성
- `clerk_user_id` 기반 정책 사용

---

### ERR-004: "Port 3000 is in use" (포트 충돌)

**증상**

- `npm run dev` 실행 시 서버가 시작되지 않음
- "이미 사용 중인 포트" 메시지

**에러 메시지 예시**

```
Error: Port 3000 is in use by process 12345
```

**원인 (쉬운 설명)**
이전에 실행한 서버가 제대로 종료되지 않고 남아있어서,
새 서버가 같은 자리(포트 3000)를 사용하지 못하는 상황입니다.

비유: 주차장 자리가 하나인데, 이전 차가 안 빠져서 새 차가 못 들어가는 상황

**해결 방법**

```bash
# Windows
taskkill /F /PID 12345

# 또는 모든 Node 프로세스 종료
taskkill /F /IM node.exe

# 또는 자동 해결 스크립트
cd apps/web
npm run dev:reset
```

**예방법**

- 서버 종료 시 `Ctrl+C` 두 번 누르기
- `npm run preflight`로 사전 검사

---

## 🟠 Moderate 오류 (기능 저하)

### ERR-005: "Hydration mismatch" (화면 깜빡임)

**증상**

- 페이지 로딩 시 화면이 깜빡이거나 레이아웃이 바뀜
- 콘솔에 "Hydration" 관련 경고

**원인 (쉬운 설명)**
서버에서 그린 화면과 브라우저에서 그린 화면이 다를 때 발생합니다.
React가 "어? 내가 예상한 것과 다르네?" 하고 혼란스러워하는 상황입니다.

**해결 방법**

- 서버/클라이언트에서 다른 값을 보여주는 코드 확인
- `useEffect` 내에서 클라이언트 전용 로직 실행
- `dynamic(() => ..., { ssr: false })` 사용

---

### ERR-006: "Cannot read property of undefined" (값 없음)

**증상**

- 화면 일부가 안 보이거나 에러 표시
- 콘솔에 "undefined" 또는 "null" 관련 에러

**원인 (쉬운 설명)**
데이터가 아직 로딩되지 않았는데, 그 데이터의 내용을 읽으려고 했습니다.

비유: 택배가 아직 안 왔는데, 박스를 열려고 한 상황

**해결 방법**

```tsx
// 나쁜 예
{
  user.name;
}

// 좋은 예 (값이 없을 수 있음을 고려)
{
  user?.name || '이름 없음';
}
```

---

### ERR-007: "Gemini API error" (AI 분석 실패)

**증상**

- 분석 버튼 누른 후 오래 기다려도 결과 안 나옴
- "분석에 실패했습니다" 메시지

**원인 (쉬운 설명)**
AI 분석 서비스(Gemini)에 문제가 생겼습니다.
네트워크 문제이거나, API 사용량 제한에 걸렸을 수 있습니다.

**해결 방법**

- 자동으로 Mock(가짜) 데이터로 대체됨
- 잠시 후 다시 시도
- `.env.local`의 API 키 확인

**예방법**

- 모든 AI 호출에 Mock Fallback 패턴 적용
  ```typescript
  try {
    return await analyzeWithGemini(input);
  } catch {
    return generateMockResult(input);
  }
  ```

---

### ERR-008: "CORS error" (교차 출처 오류)

**증상**

- 외부 API 호출 시 "blocked by CORS policy" 메시지
- 네트워크 탭에서 요청이 실패로 표시

**원인 (쉬운 설명)**
브라우저 보안 정책으로, 다른 도메인의 데이터를 직접 가져올 수 없습니다.

비유: 다른 나라에서 물건을 직접 가져오려면 세관을 통과해야 하는 것과 비슷

**해결 방법**

- API Route를 통해 서버에서 요청
- 해당 서비스의 CORS 설정 확인

---

## 🟡 Low 오류 (불편함)

### ERR-009: 다크모드에서 텍스트 안 보임

**증상**

- 다크모드 전환 시 글씨가 배경과 비슷한 색으로 보임

**원인**
하드코딩된 색상(`text-gray-800`)이 다크모드를 고려하지 않음

**해결 방법**

```tsx
// 나쁜 예
<p className="text-gray-800">텍스트</p>

// 좋은 예 (테마 인식)
<p className="text-foreground">텍스트</p>
```

---

### ERR-010: 이미지 업로드 후 미리보기 안 됨

**증상**

- 이미지 선택 후 미리보기 영역이 빈 상태

**원인**
이미지 URL 생성 방식 문제 또는 상태 업데이트 타이밍 문제

**해결 방법**

```typescript
// FileReader로 미리보기 생성
const reader = new FileReader();
reader.onload = (e) => setPreview(e.target?.result as string);
reader.readAsDataURL(file);
```

---

## 🔧 모듈별 오류

### PC-1 (퍼스널 컬러 분석)

| 오류                   | 증상                                  | 해결                                             |
| ---------------------- | ------------------------------------- | ------------------------------------------------ |
| 손목 이미지 저장 안 됨 | 분석은 되는데 손목 사진이 결과에 없음 | `wrist_image_url` 컬럼 마이그레이션 적용         |
| 다각도 분석 실패       | 여러 장 업로드해도 한 장만 분석됨     | `images_count`, `analysis_reliability` 컬럼 확인 |
| 드레이핑 탭 안 보임    | PC-1 완료해도 S-1에 탭 안 나옴        | `cross-module.ts` 연동 함수 확인                 |

### S-1 (피부 분석)

| 오류                 | 증상                         | 해결                                                 |
| -------------------- | ---------------------------- | ---------------------------------------------------- |
| 점수가 항상 85점     | 어떤 사진이든 같은 점수      | AI Fallback Mock 데이터 사용 중 - Gemini API 키 확인 |
| 피부 고민 저장 안 됨 | 선택한 고민이 다음에 안 나옴 | `concerns` JSONB 컬럼 확인                           |

### C-1 (체형 분석)

| 오류                | 증상                             | 해결                       |
| ------------------- | -------------------------------- | -------------------------- |
| 체형 타입 한글 깨짐 | "hourglass" 대신 "???" 표시      | 한글 매핑 객체 확인        |
| 전신 사진 검증 실패 | 전신 사진인데 "전신이 아님" 표시 | AI 검증 프롬프트 조정 필요 |

### W-1 (운동)

| 오류            | 증상                            | 해결                                 |
| --------------- | ------------------------------- | ------------------------------------ |
| 스트릭 초기화됨 | 어제 운동했는데 연속 기록 0으로 | `workout_streaks` 테이블 타임존 확인 |
| 운동 기록 중복  | 같은 운동이 두 번 저장됨        | 버튼 중복 클릭 방지 로직 추가        |

### N-1 (영양)

| 오류                   | 증상                    | 해결                             |
| ---------------------- | ----------------------- | -------------------------------- |
| 물 섭취량 동기화 안 됨 | 웹/앱 간 데이터 다름    | `water_records` 실시간 구독 확인 |
| 음식 인식 실패         | 사진 찍어도 "인식 불가" | 조명/각도 안내 UI 추가 필요      |

---

## 🛠️ 디버깅 도구

### 빠른 진단 명령어

```bash
# 서버 상태 확인
curl -sI http://localhost:3000/home | head -5

# 포트 사용 확인
netstat -ano | findstr ":3000"

# TypeScript 오류 확인
cd apps/web && npx tsc --noEmit

# 전체 테스트 실행
npm run test

# 캐시 완전 삭제
rm -rf apps/web/.next
```

### Supabase 디버깅

```bash
# 로컬 Supabase 상태
npx supabase status

# 마이그레이션 상태
npx supabase db diff

# 테이블 목록 확인
npx supabase db dump --schema public
```

---

## 📞 도움 요청

위 방법으로 해결되지 않으면:

1. **에러 메시지 전체** 복사
2. **어떤 작업 중** 발생했는지 기록
3. **재현 방법** 정리
4. GitHub Issue 또는 팀 채널에 공유

---

**Version**: 1.0 | **Updated**: 2026-01-15 | **Maintainer**: 이룸 개발팀
