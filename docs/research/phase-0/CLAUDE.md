# CLAUDE.md - 이룸(Yiroom) Claude Code 지침

> 용도: Claude Code / Cursor에서 구현 작업
> 설계/기획: Claude.ai에서 진행

## 빌드 명령어
```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm test             # 전체 테스트
npm run typecheck    # 타입 체크
npm run lint         # 린트
```

## 프로젝트 구조
```
apps/web/            # Next.js 웹앱
apps/mobile/         # Expo 모바일앱
packages/shared/     # 공유 패키지
supabase/            # DB 설정
```

## 코드 스타일
- TypeScript strict mode
- ES modules (import/export)
- 함수형 컴포넌트 + Hooks
- 한국어 WHY 주석

## 네이밍
- 컴포넌트: PascalCase (`UserProfile.tsx`)
- 함수/변수: camelCase (`getUserData`)
- 상수: UPPER_SNAKE (`MAX_RETRY`)

## 금지 사항
- node_modules/, dist/, .git/ 수정 금지
- 완료된 Phase 코드 수정 금지 (승인 필요)
- 대규모 리팩토링 금지
- UI 신조어 금지 (GMG → 목표 달성)

## 워크플로우
1. 변경 후 항상 `npm run typecheck`
2. 단일 테스트 우선 실행
3. PR 전 전체 테스트

## 현재 작업 (Phase N)
- 만 14세 확인 UI: `apps/web/app/(auth)/sign-up/`
- 연령 유틸: `lib/utils/age-verification.ts`
- DB: `supabase/migrations/`

## 테스트 현황
- 총 테스트: 2,776개 ✅
- 새 기능: 테스트 필수

## 참고 문서
- 설계: Claude.ai 세션 확인
- 스펙: `apps/web/specs/`
