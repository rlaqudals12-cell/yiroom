# /sisyphus 명령어

어댑티브 시지푸스 오케스트레이터를 실행합니다.

## 사용법

```
/sisyphus $ARGUMENTS
/sisyphus --analyze $ARGUMENTS  # 복잡도 분석만
/sisyphus --debug $ARGUMENTS    # 디버그 모드
```

$ARGUMENTS에 작업 설명을 입력합니다.

## 실행 단계

### 1. 복잡도 분석

작업을 분석하여 적절한 실행 전략을 결정합니다.

```
[복잡도 분석 결과]
├─ 영향 파일: 3개
├─ 변경 유형: 새 컴포넌트 추가
├─ 의존성: 1단계
├─ 리스크: 없음
├─ 총점: 45점
└─ 전략: single (Haiku)
```

### 2. 에이전트 실행

전략에 따라 적절한 에이전트를 실행합니다.

- **direct**: 오케스트레이션 없이 직접 실행
- **single**: 단일 에이전트 (code-quality)
- **standard**: 병렬 에이전트 (spec + code + test)
- **full**: 전체 파이프라인

### 3. 결과 통합

모든 에이전트 결과를 통합하여 보고합니다.

## 예시

### 단순 작업

```
/sisyphus Button 컴포넌트에 disabled 스타일 추가

→ 복잡도: 25점 (direct)
→ 오케스트레이션 없이 직접 실행
```

### 중간 복잡도

```
/sisyphus UserProfile 페이지 리팩토링

→ 복잡도: 55점 (standard)
→ spec-reviewer + code-quality + test-writer 병렬 실행
```

### 높은 복잡도

```
/sisyphus 인증 시스템 JWT에서 Session으로 마이그레이션

→ 복잡도: 85점 (full)
→ 전체 에이전트 파이프라인 + Opus 판단
```

## 자동 재시도

실패 시 자동으로 상위 모델로 승격:

1. Haiku → Sonnet
2. Sonnet → Opus
3. Opus 실패 → 수동 개입 요청
