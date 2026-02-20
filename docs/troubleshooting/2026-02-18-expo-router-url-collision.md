# Expo Router URL 충돌 — 챌린지 화면이 기본 화면으로 표시

> **날짜**: 2026-02-18
> **영향 파일**: `apps/mobile/app/index.tsx`, `apps/mobile/app/_layout.tsx`
> **심각도**: 높음
> **상태**: ✅ 해결됨

---

## 1. Expo Router 라우트 그룹 URL 충돌

### 증상

앱 실행 시 홈 화면(tabs) 대신 **챌린지 화면**이 기본으로 표시됨.
`_layout.tsx`에 `initialRouteName="(tabs)"` 설정해도 해결 안 됨.

### 원인

Expo Router의 파일 기반 라우팅에서 **라우트 그룹(parenthesized dirs)은 URL에 영향을 주지 않음**.

```
app/(tabs)/index.tsx       → URL: /
app/(challenges)/index.tsx → URL: /
app/(feed)/index.tsx       → URL: /
app/(closet)/index.tsx     → URL: /
app/(coach)/index.tsx      → URL: /
app/(reports)/index.tsx    → URL: /
```

6개 파일이 모두 URL `/`에 매핑됨. Expo Router는 **알파벳순으로 첫 번째 매칭**을 선택하므로:

- `(challenges)` < `(closet)` < `(coach)` < `(feed)` < `(reports)` < `(tabs)`
- `(challenges)`가 알파벳순 첫 번째 → 챌린지 화면이 기본값

### 왜 `initialRouteName`으로 해결 안 되는가

`initialRouteName`은 React Navigation의 Stack/Tabs 레벨 설정이며, Expo Router의 파일 기반 URL 해석과는 별개. URL `/` 요청 시 Expo Router가 파일 시스템을 스캔하여 매칭하는 과정에서 `initialRouteName`은 무시됨.

### 웹 버전과의 차이

```
# 웹 (Next.js) — 충돌 없음
app/(main)/home/page.tsx        → URL: /home
app/(main)/challenges/page.tsx  → URL: /challenges
app/(main)/feed/page.tsx        → URL: /feed

# 모바일 (Expo Router) — 충돌
app/(tabs)/index.tsx            → URL: /
app/(challenges)/index.tsx      → URL: /
```

웹은 각 기능이 **고유한 URL 경로**를 가지지만, 모바일은 여러 라우트 그룹이 `index.tsx`를 가지면 모두 `/`에 매핑됨.

### 해결

**`app/index.tsx` 루트 파일 생성** — URL `/`를 명시적으로 잡아 `(tabs)` 그룹으로 리다이렉트:

```tsx
// apps/mobile/app/index.tsx
import { Redirect } from 'expo-router';

export default function AppIndex() {
  return <Redirect href="/(tabs)" />;
}
```

**`_layout.tsx` 수정** — `initialRouteName`을 `"index"`로 변경:

```tsx
<Stack initialRouteName="index" screenOptions={{...}}>
  <Stack.Screen name="index" options={{ headerShown: false }} />
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  {/* ... 나머지 라우트 그룹 */}
</Stack>
```

### 영향 파일

- `apps/mobile/app/index.tsx` (신규 생성)
- `apps/mobile/app/_layout.tsx` (수정)

### 교훈

1. **Expo Router에서 라우트 그룹의 `index.tsx`는 모두 URL `/`에 매핑됨** — 알파벳순 첫 번째가 기본 화면
2. **`initialRouteName`은 URL 해석에 영향 없음** — React Navigation 레벨 설정일 뿐
3. **루트 `app/index.tsx`로 명시적 리다이렉트가 정석 해법** — Expo Router 공식 패턴
4. **웹(Next.js)과 모바일(Expo Router)의 라우팅 모델이 근본적으로 다름** — 웹 패턴을 그대로 옮기면 충돌 발생
5. **미등록 라우트 그룹도 자동 발견됨** — `_layout.tsx`에 `Stack.Screen`으로 등록 안 해도 Expo Router가 파일 시스템에서 자동 감지

### 관련 커밋

- `c0ac88f`: fix(mobile): 초기 라우트를 (tabs)로 명시 (부분 해결)
- `29b8c49`: fix(mobile): 루트 index.tsx 추가 — URL '/' 충돌 해결 (최종 해결)

---

**EAS 빌드 검증**:

- Build `52ffa88b`: `initialRouteName` 수정만 → 여전히 챌린지 화면 (실패)
- Build `c192bb87`: 루트 `index.tsx` 추가 → 온보딩 화면 표시 (성공, 신규 사용자이므로 정상)

---

## 2. Android 에뮬레이터 시계 불일치

### 증상

에뮬레이터에 표시되는 시간이 실제 시간과 다름 (예: 실제 3:30인데 1:26 표시).

### 원인

Android Studio AVD의 시스템 시계가 호스트 PC와 자동 동기화되지 않는 경우 발생.

### 해결

```
에뮬레이터 Settings → System → Date & Time → "Automatic date & time" 활성화
```

또는 adb 명령:

```bash
adb shell settings put global auto_time 1
```

### 교훈

- 에뮬레이터 시계는 기본적으로 호스트와 동기화되지만, 재시작/스냅샷 복원 시 어긋날 수 있음
- JWT 토큰 검증 등 시간 민감한 기능에서 문제 유발 가능 (Clerk Clock Skew 교훈 참조)

---

**Updated**: 2026-02-18
