# /deploy-check 명령어

배포 전 필수 체크리스트를 실행합니다.

## 실행 내용

### 1. 빌드 검증
```bash
npm run build
```
- 빌드 성공 여부
- 에러/경고 확인

### 2. 타입 체크
```bash
npm run typecheck
```
- TypeScript 에러 0개 확인

### 3. 린트 체크
```bash
npm run lint
```
- ESLint 에러 0개 확인

### 4. 테스트 실행
```bash
npm run test
```
- 모든 테스트 통과 확인
- 커버리지 70% 이상

### 5. 환경 변수 확인
- .env.local 필수 값 존재
- 프로덕션 환경 변수 설정

### 6. DB 마이그레이션
- 미적용 마이그레이션 확인
- RLS 정책 활성화

### 7. 성능 체크
- Lighthouse 점수 (90+ 목표)
- 번들 사이즈 (< 200KB)

## 출력 형식
```markdown
## 🚀 배포 체크리스트

| 항목 | 상태 | 비고 |
|------|------|------|
| 빌드 | ✅/❌ | |
| 타입체크 | ✅/❌ | |
| 린트 | ✅/❌ | |
| 테스트 | ✅/❌ | 커버리지 X% |
| 환경변수 | ✅/❌ | |
| DB 마이그레이션 | ✅/❌ | |
| 성능 | ✅/❌ | Lighthouse X |

### 배포 가능 여부: ✅ 가능 / ❌ 불가

### 필요 조치 (있을 경우)
- [조치 사항]
```

## 사용 예시
```
/deploy-check
/deploy-check --skip-tests
/deploy-check --verbose
```
