# Next.js Dynamic Route Slug 충돌 — Capsule API

> **날짜**: 2026-03-07
> **심각도**: Critical (개발 서버 시작 불가)
> **해결 시간**: 10분

## 증상

```
Error: You cannot use different slug names for the same dynamic path ('domain' !== 'id').
```

개발 서버(`npm run dev`)가 시작 직후 크래시.

## 원인

`app/api/capsule/` 하위에 두 개의 dynamic route가 동일 레벨에 존재:

```
app/api/capsule/
├── [domain]/          # GET /api/capsule/[domain]
│   └── curate/
│       └── route.ts   # POST /api/capsule/[domain]/curate
├── [id]/              # 충돌! [domain] !== [id]
│   └── check/
│       └── route.ts   # PATCH /api/capsule/[id]/check
└── route.ts
```

Next.js App Router는 같은 디렉토리 레벨에서 서로 다른 slug 이름을 허용하지 않음.

## 해결

`[id]/check/` 구조를 `check/[id]/`로 재구성:

```
app/api/capsule/
├── [domain]/          # [domain] slug만 존재
│   └── curate/
├── check/
│   └── [id]/          # 별도 경로로 분리
│       └── route.ts
└── route.ts
```

### 수정 파일

1. `app/api/capsule/check/[id]/route.ts` — 신규 (기존 `[id]/check/route.ts`에서 이동)
2. `app/api/capsule/[id]/` — 삭제 (전체 디렉토리)
3. `app/(main)/home/_components/HomeDailyCapsuleWidget.tsx:76` — fetch URL 변경
   - Before: `/api/capsule/${capsule.id}/check`
   - After: `/api/capsule/check/${capsule.id}`

## 교훈

- Next.js App Router에서 같은 레벨의 dynamic segment는 반드시 동일한 slug 이름을 사용해야 함
- 새 dynamic route 추가 시 기존 route와 slug 이름 충돌 여부를 확인할 것
- API 구조 설계 시 `/resource/[id]/action` 대신 `/resource/action/[id]` 패턴이 slug 충돌을 방지

## 관련 문서

- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- ADR-069: 캡슐 에코시스템 아키텍처
