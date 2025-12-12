# /qcode 명령어

계획된 작업을 빠르게 구현합니다.

## 실행 내용

승인된 계획에 대해:

1. **구현**
   - 계획대로 코드 작성
   - 기존 패턴 따르기

2. **자동 검증**
   ```bash
   npm run typecheck
   npm run lint
   npm run test -- --related
   npx prettier --write [변경 파일]
   ```

3. **결과 보고**
   ```markdown
   ## ✅ 구현 완료

   ### 변경된 파일
   - [파일 목록]

   ### 검증 결과
   - 타입체크: ✅/❌
   - 린트: ✅/❌
   - 테스트: ✅/❌
   - 포맷팅: ✅

   ### 다음 단계
   - [ ] 수동 테스트
   - [ ] /qcheck 실행
   - [ ] 커밋
   ```

## 자동 재시도
- 테스트 실패 시 최대 3회 자동 수정 시도
- 각 시도 후 재검증

## 사용 예시
```
/qcode
/qcode --auto-commit
/qcode --skip-tests
```
