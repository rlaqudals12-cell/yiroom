# /create-feature 명령어

새 기능을 SDD 프로세스에 따라 생성합니다.

## 실행 내용

$ARGUMENTS 기능에 대해:

1. **Feature Spec 생성**
   - @specs/templates/FEATURE-SPEC-TEMPLATE.md 참조
   - specs/features/$ARGUMENTS-feature.md 생성

2. **Task 분해**
   - Feature를 구현 가능한 Task로 분해
   - specs/tasks/$ARGUMENTS-tasks.md 생성

3. **폴더 구조 생성**
   - app/(main)/[경로]/ 폴더 생성
   - 필요한 page.tsx, layout.tsx 스캐폴딩

4. **SCRATCHPAD.md 업데이트**
   - 새 기능 To-Do 항목 추가
   - 체크박스 형태로 작성

5. **확인 요청**
   - 생성된 스펙 요약 제시
   - 진행 승인 요청

## 사용 예시
```
/create-feature PC-1
/create-feature S-1-skin-analysis
/create-feature C-1-body-shape
```
