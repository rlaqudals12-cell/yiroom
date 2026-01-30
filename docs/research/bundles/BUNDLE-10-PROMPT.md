# BUNDLE-10: 스타트업 재무/투자

> 펀드레이징, 재무 모델링, 캐시플로우 리서치

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| **Bundle ID** | BUNDLE-10 |
| **우선순위** | P1 |
| **예상 시간** | 2시간 |
| **도메인** | 재무/투자 |
| **포함 항목** | FIN-FUNDRAISING, FIN-MODELING, FIN-CASHFLOW, COMPANY-EXIT-STRATEGY |

---

## 입력

### 참조 문서
- `docs/research/claude-ai-research/BIZ-MONETIZATION-R1.md` - 수익화 전략
- `docs/research/claude-ai-research/OPS-COST-MODEL-R1.md` - 비용 모델

### 선행 리서치
- BUNDLE-02: 수익화 및 비즈니스 모델

---

## 출력

### 생성할 파일

| 파일명 | 내용 |
|--------|------|
| `docs/research/claude-ai-research/FIN-FUNDRAISING-R1.md` | 펀드레이징 전략 |
| `docs/research/claude-ai-research/FIN-MODELING-R1.md` | 재무 모델링 |
| `docs/research/claude-ai-research/FIN-CASHFLOW-R1.md` | 캐시플로우 관리 |
| `docs/research/claude-ai-research/COMPANY-EXIT-STRATEGY-R1.md` | 엑싯 전략 |

### 출력 형식
- `RESEARCH-OUTPUT-FORMAT.md` 준수
- 각 파일 1500-3000단어

---

## 프롬프트

### FIN-FUNDRAISING

```
AI 뷰티 스타트업의 펀드레이징 전략을 조사해주세요.

조사 범위:
1. 시드/시리즈 A 투자 유치 전략
2. 한국 VC 생태계 (뷰티테크 투자사)
3. 투자 피치덱 구성
4. 밸류에이션 방법론
5. 텀시트 협상 포인트
6. 투자자 네트워킹 전략

기대 결과:
- 단계별 펀드레이징 로드맵
- 피치덱 템플릿 구조
- 한국 뷰티테크 투자자 리스트
- 밸류에이션 벤치마크
```

### FIN-MODELING

```
AI 기반 앱 스타트업의 재무 모델링을 조사해주세요.

조사 범위:
1. 수익 예측 모델 (구독, 제휴, 광고)
2. 비용 구조 분석
3. Unit Economics (CAC, LTV, LTV/CAC)
4. 손익분기점 분석
5. 시나리오 분석 (베이스, 낙관, 비관)
6. 투자자용 재무제표 작성

기대 결과:
- 3년 재무 예측 템플릿
- Unit Economics 계산 시트
- 시나리오별 마일스톤
- 투자자 보고 양식
```

### FIN-CASHFLOW

```
초기 스타트업의 캐시플로우 관리 전략을 조사해주세요.

조사 범위:
1. 런웨이 (Runway) 계산 및 관리
2. 현금 흐름 예측
3. 비용 절감 전략
4. 수금 관리 (구독, B2B)
5. 비상 현금 확보 방안
6. 파운더 급여 및 지분 희석

기대 결과:
- 캐시플로우 관리 대시보드
- 런웨이 연장 전략
- 비용 우선순위 프레임워크
- 현금 위기 대응 플레이북
```

### COMPANY-EXIT-STRATEGY

```
AI 뷰티 스타트업의 엑싯 전략을 조사해주세요.

조사 범위:
1. 엑싯 옵션 (M&A, IPO, 세컨더리)
2. 잠재 인수자 프로필 (뷰티 대기업, 플랫폼)
3. 엑싯 멀티플 벤치마크
4. M&A 프로세스 이해
5. 투자자 엑싯 기대 관리
6. 한국 뷰티테크 M&A 사례

기대 결과:
- 엑싯 옵션 비교 분석
- 잠재 인수자 목록
- 엑싯 준비 체크리스트
- 타임라인 예측
```

---

## 의존성

```
선행: BUNDLE-02 (Biz)
후행: 없음
병렬: BUNDLE-13 (Competition), BUNDLE-12 (Team)
```

---

## 검증

- [ ] 4개 파일 모두 생성됨
- [ ] 한국 시장 특화 정보 포함
- [ ] 구체적인 재무 템플릿 제공
- [ ] 실현 가능한 전략 제시

---

**Version**: 1.0 | **Created**: 2026-01-18
