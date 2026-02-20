# GFSA Korea 2026 — 영문 지원서 초안

> **프로그램**: Google for Startups Accelerator: Korea (2026 Cohort)
> **마감**: March 2, 2026
> **킥오프**: April 2026 → 졸업: July 2026
> **지원 URL**: [startup.google.com/accelerator/korea](https://startup.google.com/programs/accelerator/korea/)
> **작성일**: 2026-02-20

---

## Company Information

| Field                    | Answer                                         |
| ------------------------ | ---------------------------------------------- |
| **Startup Name**         | Yiroom (이룸)                                  |
| **Website**              | https://yiroom.app _(도메인 확정 후 업데이트)_ |
| **Year Founded**         | 2025                                           |
| **Headquarters**         | Seoul, South Korea                             |
| **Number of Employees**  | 1 (Solo Technical Founder)                     |
| **Funding Stage**        | Pre-Seed, Self-funded                          |
| **Total Funding Raised** | $0 (Bootstrapped)                              |
| **Industry/Vertical**    | AI / Beauty Tech / Wellness                    |

---

## Product Description

### One-liner (한 줄 요약)

> Yiroom is an AI-powered personal beauty analysis platform that combines Google Gemini diagnostics with personalized product recommendations and wellness coaching.

### Short Description (2-3 sentences)

> Yiroom is the first full-funnel AI beauty analysis platform built in Korea. Using Google Gemini's multimodal AI, we provide expert-level personal color, skin, and body analysis — then connect users to personalized product recommendations, workout plans, and nutrition guidance. We're making the $300 offline personal color consultation accessible to everyone for free.

### Detailed Description (구글폼 "Describe your product" 필드)

> Yiroom ("이룸" — Korean for "achieving/becoming") is an AI-powered wellness platform that helps users understand themselves holistically through multi-dimensional beauty and health analysis.
>
> **The Problem:** In Korea, personal color diagnosis costs ₩100,000-300,000 ($75-$225) per session at offline studios, with limited availability outside Seoul. Skin and body analysis require separate expensive consultations. There's no unified platform that connects diagnosis to actionable recommendations.
>
> **Our Solution:** Yiroom provides 8 AI analysis modules — Personal Color (12-tone system), Skin Analysis (6-zone deep scan), Body Type Analysis, Hair Analysis, Makeup Styling, Oral Health Assessment, Workout Planning, and Nutrition Management — all powered by Google Gemini's Vision Language Model.
>
> **Key Innovation:** Unlike competitors that stop at diagnosis (Dressika) or product try-on (Perfect Corp), Yiroom delivers the complete journey: **Diagnose → Recommend → Purchase → Track → Improve**. Our AI coaching system provides ongoing personalized guidance based on accumulated analysis data.
>
> **Current Status:** MVP complete with 2,776 automated tests passing and all 8 modules achieving S-grade quality scores (95+/100). Bilingual (Korean/English) web app ready for launch.

---

## AI/ML Technology

### How does your product use AI/ML? (AI/ML 활용 방식)

> **Core AI Engine: Google Gemini 2.0 Flash (Vision Language Model)**
>
> We leverage Gemini's multimodal capabilities for real-time image analysis across 8 modules:
>
> 1. **Personal Color Analysis** — Face image → skin undertone extraction → 12-tone seasonal color classification → personalized color palette generation with best/worst colors
> 2. **Skin Analysis** — Selfie → 6-zone deep analysis (T-zone, U-zone, forehead, cheeks, chin, overall) → hydration, oiliness, sensitivity, wrinkle scoring → product ingredient matching
> 3. **Body Type Analysis** — Full-body image → 33 anatomical landmark detection → 5 body type classification → personalized workout recommendations
> 4. **AI Wellness Coach** — Context-aware conversational AI that synthesizes all analysis results to provide personalized beauty and wellness guidance
>
> **Technical Architecture:**
>
> - **Structured Output**: Zod schema validation ensures consistent, type-safe AI responses
> - **Mock Fallback System**: 3-second timeout → 2 retries → deterministic mock data (zero-downtime guarantee)
> - **Confidence Scoring**: Each analysis includes AI confidence metrics with fallback transparency
> - **Privacy-First**: Images are processed in real-time and never stored permanently; all data is encrypted at rest via Supabase

### What technical challenge would you like Google's help with?

> **Challenge 1: Scaling Gemini VLM Inference for Real-Time Beauty Analysis**
>
> Our current architecture processes one analysis at a time with a 3-second timeout. As we scale to thousands of concurrent users, we need to optimize:
>
> - Batch inference strategies for Gemini API
> - Cost-efficient model serving (Gemini Flash vs Pro routing based on complexity)
> - Edge caching for repeated analysis patterns
>
> **Challenge 2: Fine-tuning for Korean Beauty Standards**
>
> Korean personal color diagnosis has unique requirements (12-tone system, K-beauty product matching) that differ from Western models. We want to explore:
>
> - Gemini fine-tuning with Korean beauty expert-annotated datasets
> - Vertex AI custom model training for skin tone classification
> - Domain-specific evaluation metrics for beauty analysis accuracy
>
> **Challenge 3: Multi-Modal Data Fusion**
>
> Combining insights from 8 analysis modules into coherent wellness recommendations requires:
>
> - Cross-module data synthesis (e.g., personal color + skin type → optimal foundation recommendation)
> - Temporal analysis (tracking changes over time)
> - Google Cloud infrastructure for scalable data pipeline

---

## Traction & Market

### Current Traction

> **Pre-Launch Status — Technical MVP Complete**
>
> - **2,776 automated tests passing** (unit, integration, component)
> - **8 AI analysis modules** at S-grade quality (95+/100 quality score)
> - **137 static pages** generated, production-ready PWA
> - **Bilingual support** (Korean/English) for global K-beauty audience
> - **Full offline capability** via Service Worker + Workbox caching
> - **Zero external funding** — entire platform built by solo technical founder
>
> While we haven't launched publicly yet, our technical foundation demonstrates:
>
> 1. Deep technical capability (2,776 tests = enterprise-grade quality)
> 2. Full product readiness (8 complete modules, not prototypes)
> 3. Capital efficiency (built with $0 external funding)

### TAM / SAM / SOM

> **TAM: $4.4 Billion** (2025)
>
> - Global AI in Beauty & Cosmetics market
> - Growing at 21% CAGR → $9.4B by 2029
> - Source: The Business Research Company, InsightAce Analytic
>
> **SAM: ~$800 Million** (2025)
>
> - AI beauty analysis in Korea + APAC + K-beauty export markets
> - APAC holds 23.54% of global AI beauty market
> - Korea leads APAC in beauty tech innovation and consumer adoption
>
> **SOM: $200K Year 1 → $1M Year 3**
>
> - Year 1: 50K downloads, 12.5K MAU, 375 premium subscribers + affiliate revenue
> - Year 3: 500K downloads, 100K MAU, 5K premium + expanded affiliate + B2B API
> - Revenue model: Freemium subscription ($4.99/mo) + affiliate commissions + B2B API licensing

### Competitive Advantage (경쟁 우위)

> **1. Full-Funnel Integration (풀퍼널 통합)**
> Only platform that covers Diagnose → Recommend → Purchase → Track → Improve. Competitors like Dressika (diagnosis only) or Perfect Corp (try-on only) serve single steps.
>
> **2. Google Gemini-Native Architecture**
> Built from day one on Google's latest multimodal AI. Not retrofitting AI onto legacy code — our entire analysis pipeline is Gemini-native with structured output validation.
>
> **3. 8-Module Comprehensive Analysis**
> Personal Color + Skin + Body + Hair + Makeup + Oral Health + Workout + Nutrition. No competitor offers this breadth of AI-powered analysis in a single platform.
>
> **4. K-Beauty Origin Advantage**
> Built in Seoul — the epicenter of the $12.5B K-beauty market. Native understanding of Korean beauty standards, 12-tone personal color system, and K-beauty product ecosystem.
>
> **5. Enterprise-Grade Technical Quality**
> 2,776 automated tests, TypeScript strict mode, S-grade quality across all modules. This level of engineering rigor is unusual for a pre-seed startup and demonstrates scalability readiness.

---

## Team

### Founder

> **[병민] — Solo Technical Founder & CEO**
>
> Full-stack engineer who single-handedly designed, built, and tested the entire Yiroom platform — 8 AI analysis modules, 2,776 automated tests, bilingual PWA — from concept to production-ready MVP in under 6 months.
>
> **Technical Stack Mastery:**
>
> - Frontend: Next.js 16, React 19, TypeScript (strict mode)
> - AI/ML: Google Gemini API, structured output, mock fallback architecture
> - Backend: Supabase (PostgreSQL + RLS), Clerk Auth
> - Mobile: Expo SDK 54, React Native
> - Infrastructure: Turborepo monorepo, Vitest (2,776 tests), PWA
>
> **LinkedIn:** _(URL 추가 필요)_

### Why a solo founder can execute this

> Building Yiroom solo wasn't a limitation — it was a strategic choice that enabled:
>
> 1. **Speed**: No coordination overhead → concept to MVP in 6 months
> 2. **Consistency**: Single architectural vision → S-grade quality across all modules
> 3. **Capital Efficiency**: $0 spent → proven ability to ship with minimal resources
>
> GFSA's mentoring, cloud credits, and Google network represent the optimal catalyst to transition from solo builder to team leader — hiring AI engineers and growth marketers to scale what's already built.

---

## Program Fit

### Why GFSA? (프로그램 적합성)

> **1. Google Cloud Credits ($350K)**
> Gemini API inference costs scale linearly with users. Cloud credits directly unlock our growth ceiling — each credit converts to ~X thousand AI analyses for real users.
>
> **2. Gemini Fine-Tuning Expertise**
> Google's AI experts can help us fine-tune Gemini for Korean beauty-specific use cases — improving accuracy from good (current) to expert-level.
>
> **3. Google Play Store Featuring**
> Our Expo-based mobile app is Play Store ready. Featured placement would dramatically accelerate user acquisition in Korea's mobile-first market.
>
> **4. Network & Mentoring**
> Transitioning from solo founder to startup CEO requires guidance on hiring, fundraising, and go-to-market strategy that Google's mentor network provides.

### Commitment (참여 서약)

> I commit to attending all 10 weeks of program sessions (April-July 2026), both remote and in-person in Korea. As the sole founder and technical lead, I will personally engage in all mentoring sessions, sprint projects, and demo day preparation.

---

## Appendix: Key Metrics Summary (한눈에 보기)

| Metric              | Value                                                      |
| ------------------- | ---------------------------------------------------------- |
| AI Analysis Modules | 8 (PC, Skin, Body, Hair, Makeup, Oral, Workout, Nutrition) |
| Automated Tests     | 2,776 passing                                              |
| Quality Score       | S-grade (95+/100) across all 8 modules                     |
| Tech Stack          | Next.js 16 + Gemini + Supabase + Clerk + Expo              |
| Languages           | Korean + English (bilingual)                               |
| PWA Score           | Installable, offline-capable                               |
| TAM                 | $4.4B (AI Beauty, 2025)                                    |
| SAM                 | $800M (Korea + APAC)                                       |
| SOM (Year 1)        | $200K                                                      |
| SOM (Year 3)        | $1M                                                        |
| Funding             | $0 (bootstrapped)                                          |
| Team Size           | 1 (solo technical founder)                                 |
| Time to MVP         | ~6 months                                                  |

---

## 사용 가이드

이 문서의 각 섹션을 구글폼 해당 필드에 복사-붙여넣기:

1. **Company 블록** → Company Information 표의 값들
2. **Product 블록** → Detailed Description 사용 (길이에 맞게 One-liner 또는 Short 사용)
3. **AI/ML 블록** → 기술 질문에 해당 섹션 사용
4. **Traction 블록** → 시장/트랙션 관련 질문에 사용
5. **Team 블록** → 팀/파운더 소개에 사용
6. **Program Fit** → "왜 GFSA?" 질문에 사용

### 제출 전 업데이트 필요 항목

- [ ] `https://yiroom.app` → 실제 라이브 URL (도메인 구매 후)
- [ ] 파운더 LinkedIn URL 추가
- [ ] 파운더 실명 추가 (현재 [병민] 플레이스홀더)
- [ ] Google Play 앱 링크 (모바일 출시 후, 선택)

---

**Version**: 1.0 | **Created**: 2026-02-20
**참조**: [시장 리서치](./2026-02-20-gfsa-market-research.md)
