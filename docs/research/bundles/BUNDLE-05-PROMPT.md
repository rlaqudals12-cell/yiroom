# BUNDLE-05: 플랫폼 전략 (웹/앱)

> 웹 vs 앱, PWA, 네이티브 전략 리서치

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| **Bundle ID** | BUNDLE-05 |
| **우선순위** | P0 (최우선) |
| **예상 시간** | 2시간 |
| **도메인** | 플랫폼/아키텍처 |
| **포함 항목** | PLATFORM-WEB-VS-APP, PLATFORM-PWA, PLATFORM-NATIVE, PLATFORM-CROSS |

---

## 입력

### 참조 문서
- `apps/web/` - 현재 웹 앱
- `apps/mobile/` - Expo 앱 (계획)
- `.claude/rules/mobile-patterns.md` - 모바일 패턴
- `docs/ARCHITECTURE.md` - 아키텍처 문서

### 선행 리서치
- 없음 (독립적)

---

## 출력

### 생성할 파일

| 파일명 | 내용 |
|--------|------|
| `docs/research/claude-ai-research/PLATFORM-WEB-VS-APP-R1.md` | 웹 vs 앱 전략 분석 |
| `docs/research/claude-ai-research/PLATFORM-PWA-R1.md` | PWA 구현 전략 |
| `docs/research/claude-ai-research/PLATFORM-NATIVE-R1.md` | 네이티브 앱 전략 |
| `docs/research/claude-ai-research/PLATFORM-CROSS-R1.md` | 크로스 플랫폼 전략 |

### 출력 형식
- `RESEARCH-OUTPUT-FORMAT.md` 준수
- 각 파일 1500-3000단어

---

## 프롬프트

### PLATFORM-WEB-VS-APP

```
AI 기반 뷰티 앱의 웹 vs 네이티브 앱 전략을 분석해주세요.

조사 범위:
1. 웹앱과 네이티브 앱의 장단점 비교
2. 사용자 행동 패턴 (뷰티 앱 사용 맥락)
3. 카메라/이미지 처리 기능별 플랫폼 제약
4. 푸시 알림 및 리텐션 비교
5. 개발/유지보수 비용 비교
6. 출시 속도 및 업데이트 전략

기대 결과:
- 이룸 플랫폼 전략 추천 (Web First vs App First)
- 기능별 플랫폼 적합성 매트릭스
- 단계별 플랫폼 확장 로드맵
- 한국 사용자 플랫폼 선호도 데이터
```

### PLATFORM-PWA

```
2026년 PWA (Progressive Web App) 구현 전략을 조사해주세요.

조사 범위:
1. PWA 현재 브라우저 지원 현황 (iOS Safari 제약)
2. Service Worker 및 오프라인 기능
3. 푸시 알림 구현 (Web Push)
4. 홈 화면 설치 유도 전략
5. 앱 스토어 등록 (TWA, PWABuilder)
6. PWA vs 하이브리드 앱 비교

기대 결과:
- 이룸 PWA 구현 체크리스트
- 오프라인 캐싱 전략 (분석 결과)
- iOS 제약 우회 방법
- PWA 전환 비용/이점 분석
```

### PLATFORM-NATIVE

```
React Native/Expo 기반 네이티브 앱 전략을 조사해주세요.

조사 범위:
1. Expo SDK 54 (2025-2026) 새 기능
2. 카메라 및 이미지 처리 API
3. 네이티브 모듈 통합 (Vision Camera)
4. 앱 스토어 심사 가이드라인
5. 성능 최적화 (New Architecture)
6. 빌드 및 배포 자동화 (EAS)

기대 결과:
- Expo 네이티브 앱 구현 로드맵
- 필수 네이티브 모듈 목록
- 앱 스토어 심사 체크리스트
- 웹-앱 코드 공유 전략
```

### PLATFORM-CROSS

```
웹과 모바일 앱 간 코드 공유 전략을 조사해주세요.

조사 범위:
1. 모노레포 구조 (Turborepo)
2. 공유 가능한 코드 범위 (타입, 로직, 훅)
3. 플랫폼별 UI 분리 전략
4. API 클라이언트 공유
5. 테스트 코드 공유
6. 디자인 시스템 통합 (Tailwind/NativeWind)

기대 결과:
- packages/shared 구조 설계
- 플랫폼별 컴포넌트 분리 가이드
- 코드 공유율 목표 및 측정 방법
- 모노레포 베스트 프랙티스
```

---

## 의존성

```
선행: 없음
후행: 없음 (독립적 결정 영역)
병렬: BUNDLE-01 (Tech), BUNDLE-02 (Biz), BUNDLE-11 (Legal)
```

---

## 검증

- [ ] 4개 파일 모두 생성됨
- [ ] 비용/이점 분석 포함
- [ ] 2026년 기술 트렌드 반영
- [ ] 이룸 모노레포 구조 고려

---

**Version**: 1.0 | **Created**: 2026-01-18
