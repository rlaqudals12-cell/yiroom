# BUNDLE-13: 경쟁 및 시장 분석

> 경쟁사, 시장 포지셔닝, 성장 전략 리서치

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| **Bundle ID** | BUNDLE-13 |
| **우선순위** | P1 |
| **예상 시간** | 2시간 |
| **도메인** | 시장/전략 |
| **포함 항목** | PROD-COMPETITOR, COMPANY-MARKET-POSITION, COMPANY-COMPETITIVE-MOAT, COMPANY-GROWTH-LEVER |

---

## 입력

### 참조 문서
- `docs/FIRST-PRINCIPLES.md` - 핵심 철학
- `docs/research/claude-ai-research/BIZ-MONETIZATION-R1.md` - 수익화 전략

### 선행 리서치
- BUNDLE-02: 수익화 및 비즈니스 모델

---

## 출력

### 생성할 파일

| 파일명 | 내용 |
|--------|------|
| `docs/research/claude-ai-research/PROD-COMPETITOR-R1.md` | 경쟁사 분석 |
| `docs/research/claude-ai-research/COMPANY-MARKET-POSITION-R1.md` | 시장 포지셔닝 |
| `docs/research/claude-ai-research/COMPANY-COMPETITIVE-MOAT-R1.md` | 경쟁 해자 |
| `docs/research/claude-ai-research/COMPANY-GROWTH-LEVER-R1.md` | 성장 레버 |

### 출력 형식
- `RESEARCH-OUTPUT-FORMAT.md` 준수
- 각 파일 1500-3000단어

---

## 프롬프트

### PROD-COMPETITOR

```
한국 AI 뷰티/웰니스 앱 경쟁 환경을 분석해주세요.

조사 범위:
1. 직접 경쟁사 분석
   - 화해 (Hwahae) - 성분 분석
   - 글로우픽 (Glowpick) - 리뷰 기반
   - 언니의 파우치 - 커뮤니티
   - 뷰티셀렉션 - 맞춤 추천
2. 간접 경쟁사 (피트니스, 헬스케어)
3. 글로벌 경쟁사 (Perfect Corp, Meitu)
4. 각 경쟁사 강점/약점
5. 시장 점유율 추정
6. 경쟁사 수익 모델

기대 결과:
- 경쟁사 매트릭스 (기능, 가격, 타겟)
- SWOT 분석
- 기능별 벤치마크
- 차별화 기회 식별
```

### COMPANY-MARKET-POSITION

```
이룸의 시장 포지셔닝 전략을 조사해주세요.

조사 범위:
1. 타겟 세그먼트 정의
2. 포지셔닝 맵 (가격-품질, 기능-편의성)
3. 가치 제안 차별화
4. 브랜드 포지셔닝
5. 시장 진입 전략
6. 니치 vs 매스마켓 접근

기대 결과:
- 타겟 페르소나 3-4개
- 포지셔닝 스테이트먼트
- 경쟁사 대비 포지셔닝 맵
- 시장 진입 단계별 전략
```

### COMPANY-COMPETITIVE-MOAT

```
이룸의 지속 가능한 경쟁 우위(해자)를 분석해주세요.

조사 범위:
1. 네트워크 효과 가능성
2. 데이터 해자 (사용자 분석 데이터)
3. 기술 해자 (알고리즘, 특허)
4. 브랜드 해자
5. 스위칭 비용
6. 규모의 경제

기대 결과:
- 잠재적 해자 목록 및 강도 평가
- 해자 구축 로드맵
- 해자 방어 전략
- 경쟁사 진입 장벽 분석
```

### COMPANY-GROWTH-LEVER

```
이룸의 핵심 성장 레버를 분석해주세요.

조사 범위:
1. 제품 주도 성장 (PLG) 전략
2. 핵심 성장 지표 (North Star Metric)
3. 바이럴 루프 설계
4. 확장 전략 (수직/수평)
5. 파트너십 기회
6. 국제화 가능성

기대 결과:
- 성장 레버 우선순위
- 단계별 성장 전략
- 핵심 지표 정의
- 성장 실험 아이디어 목록
```

---

## 의존성

```
선행: BUNDLE-02 (Biz)
후행: 없음
병렬: BUNDLE-10 (Finance), BUNDLE-03 (Acquisition)
```

---

## 검증

- [ ] 4개 파일 모두 생성됨
- [ ] 한국 시장 경쟁사 분석
- [ ] 실행 가능한 전략 제시
- [ ] 정량적 데이터 포함

---

**Version**: 1.0 | **Created**: 2026-01-18
