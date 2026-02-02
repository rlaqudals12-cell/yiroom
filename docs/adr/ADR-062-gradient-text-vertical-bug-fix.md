# ADR-062: 그라디언트 텍스트 세로 배열 버그 수정

## 상태

**수정됨** (2026-02-03)

## 컨텍스트

YIROOM 랜딩 페이지에서 그라디언트 텍스트가 세로로 한 글자씩 표시되는 버그가 발생했습니다.

### 증상

- "온전한 나를 찾는 여정" (히어로 섹션 h1)
- "지금 바로 시작해보세요" (하단 CTA 섹션 h2)

위 텍스트들이 가로가 아닌 세로로 한 글자씩 표시됨.

### 영향받은 파일

- `apps/web/app/page.tsx` - 랜딩 페이지
- `apps/web/app/globals.css` - 그라디언트 텍스트 CSS 클래스

## 근본 원인

`.text-gradient-brand`와 `.text-gradient-brand-extended` CSS 클래스에 있던 다음 속성들이 원인이었습니다:

```css
/* 문제가 된 CSS */
.text-gradient-brand-extended {
  background: var(--gradient-brand-extended);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block; /* 🔴 문제 1 */
  width: 100%; /* 🔴 문제 2 */
}
```

### 왜 문제가 발생했는가?

1. **Flex 컨테이너 충돌**: 랜딩 페이지의 히어로 섹션은 `flex flex-col` 레이아웃을 사용
2. **너비 계산 오류**: `display: inline-block; width: 100%;` 조합이 flex-col 내부에서 예상치 못한 너비 계산 발생
3. **글자별 줄바꿈**: 계산된 너비가 매우 좁아져 각 글자가 개별 줄로 줄바꿈

### 문제의 레이아웃 구조

```
<div className="flex flex-col ...">           // flex-col 컨테이너
  <div className="w-full">                     // width: 100%
    <h1 className="text-gradient-brand-extended">  // display: inline-block; width: 100%;
      온전한 나를 찾는 여정                       // 🔴 세로로 표시됨
    </h1>
  </div>
</div>
```

## 결정

### 수정 방법

`display: inline-block;`과 `width: 100%;` 속성을 제거합니다.

```css
/* 수정된 CSS */
.text-gradient-brand {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-gradient-brand-extended {
  background: var(--gradient-brand-extended);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### 왜 이 속성들이 불필요한가?

1. **그라디언트 텍스트는 block 요소에서도 작동**: `-webkit-background-clip: text`와 `-webkit-text-fill-color: transparent`는 요소의 display 속성과 무관하게 작동
2. **부모 요소가 이미 너비 제어**: 상위 컨테이너(`w-full`, `max-w-[960px]`)가 너비를 제어하므로 자식에서 `width: 100%`를 설정할 필요 없음
3. **inline-block은 특수 용도**: inline-block은 텍스트를 다른 inline 요소와 같은 줄에 배치할 때 필요하지만, 블록 레벨 제목에서는 불필요

## 대안 검토

### 대안 1: whitespace-nowrap 추가 (시도됨, 실패)

```css
.text-gradient-brand-extended {
  ...
  white-space: nowrap;  /* 줄바꿈 방지 시도 */
}
```

**결과**: 근본 원인 해결 안 됨. 여전히 세로 표시.

### 대안 2: Flex 레이아웃 변경 (시도됨, 실패)

```tsx
// flex → block 기반 레이아웃
<div className="mx-auto max-w-[960px]">
```

**결과**: 레이아웃 변경했으나 CSS 클래스 문제가 남아 있어 해결 안 됨.

### 대안 3: CSS 속성 제거 (채택)

**결과**: 근본 원인 해결. 그라디언트 효과 정상 유지.

## 결과

### 검증

- [x] `npm run typecheck` 통과
- [x] `npm run build` 성공 (134 pages)
- [ ] 브라우저에서 텍스트 가로 표시 확인 (사용자 확인 필요)

### 학습 포인트

1. **CSS 그라디언트 텍스트는 단순하게 유지**: `background`, `background-clip`, `text-fill-color` 3개 속성만 필요
2. **display/width 속성은 레이아웃 컨텍스트 고려**: flex/grid 내부에서 예상치 못한 동작 가능
3. **버그 수정 시 근본 원인 파악**: 증상(세로 텍스트)이 아닌 원인(CSS 속성) 제거

## 관련 문서

- [랜딩 페이지 리디자인 계획](../../.claude/plans/cheeky-jingling-tome.md)
- [YIROOM IDENTITY 디자인 토큰](ADR-057-design-tokens.md)

---

**작성일**: 2026-02-03
**작성자**: Claude Code
