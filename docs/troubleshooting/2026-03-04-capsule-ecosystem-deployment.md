# 캡슐 에코시스템 배포 — GFSA 심사 중 자동 배포 사고 방지

> **날짜**: 2026-03-04
> **영향 파일**: Vercel 설정, supabase/migrations/
> **심각도**: 높음
> **상태**: ✅ 해결됨

---

## 1. 자동 배포 트리거 사고

### 증상

캡슐 에코시스템 74파일 커밋 후 `git push` 실행 → GFSA 심사 기간 중 Vercel 자동 배포가 트리거되어 프로덕션 변경 위험 발생.

### 원인

- Vercel의 "Deploy on Push" 기본 활성화 상태에서 main 브랜치 push
- GFSA 심사 기간 중 프로덕션 안정성 유지 필요성을 push 전에 고려하지 않음

### 해결

1. **즉시 롤백**: 이전 안정 배포로 복원

   ```bash
   npx vercel rollback yiroom-a4a0ged2h-xcs-projects-a437a0dd.vercel.app
   ```

2. **자동 배포 비활성화**: Vercel Settings → General → Ignored Build Step → "Don't build anything" 선택

3. **프로덕션 상태 확인**: `yiroom.vercel.app`이 이전 버전(`a4a0ged2h`)으로 정상 서빙 확인

### 영향 파일

- Vercel 프로젝트 설정 (Ignored Build Step)
- 프로덕션 배포는 롤백으로 무영향

### 교훈

- **심사/데모 기간에는 push 전 자동 배포 상태 확인 필수**
- Vercel Ignored Build Step → "Don't build anything"으로 안전하게 차단
- 롤백 명령어: `npx vercel rollback <deployment-url>`
- Git 연결 해제(Disconnect)보다 Ignored Build Step이 안전 (설정/환경변수 유지)

---

## 2. GFSA 심사 기간 운영 주의사항

### 금지 사항

| 작업                                    | 이유                    |
| --------------------------------------- | ----------------------- |
| Vercel 자동 배포 복원                   | 프로덕션 코드 변경 위험 |
| `supabase db push` (원격)               | 프로덕션 DB 스키마 변경 |
| `npx vercel --prod`                     | 수동 프로덕션 배포      |
| Vercel 환경변수 중 `NEXT_PUBLIC_*` 변경 | 클라이언트 번들 영향    |

### 안전한 작업

| 작업                                                  | 이유                                     |
| ----------------------------------------------------- | ---------------------------------------- |
| `git push`                                            | 자동 배포 꺼져 있으므로 코드만 원격 저장 |
| 서버 전용 환경변수 추가 (예: `SAFETY_ENCRYPTION_KEY`) | 현재 프로덕션 코드가 사용하지 않음       |
| 로컬 개발/테스트                                      | 프로덕션 무관                            |
| 문서 업데이트                                         | 코드 무관                                |

### GFSA 심사 후 복원 체크리스트

```
□ Vercel Settings → General → Ignored Build Step → "Automatic" 으로 변경
□ supabase db push 실행 (7테이블 생성)
□ 새 배포 트리거: npx vercel --prod 또는 git push 후 자동 배포
□ 배포 후 yiroom.vercel.app 동작 확인
□ 캡슐 API 엔드포인트 동작 확인 (/api/capsule/profile 등)
```

---

**Updated**: 2026-03-04
