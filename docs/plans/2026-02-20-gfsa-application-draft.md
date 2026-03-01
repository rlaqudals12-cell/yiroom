# GFSA Korea 2026 — 영문 지원서 초안

> **프로그램**: Google for Startups Accelerator: Korea (2026 Cohort)
> **마감**: March 2, 2026
> **킥오프**: April 2026 → 졸업: July 2026
> **지원 URL**: [startup.google.com/accelerator/korea](https://startup.google.com/programs/accelerator/korea/)
> **작성일**: 2026-02-20

---

## Company Information

| Field                    | Answer                      |
| ------------------------ | --------------------------- |
| **Startup Name**         | Yiroom (이룸)               |
| **Website**              | https://yiroom.vercel.app   |
| **Year Founded**         | 2026                        |
| **Headquarters**         | Seoul, South Korea          |
| **Number of Employees**  | 1 (Solo Technical Founder)  |
| **Funding Stage**        | Pre-Seed, Self-funded       |
| **Total Funding Raised** | $0 (Bootstrapped)           |
| **Industry/Vertical**    | AI / Beauty Tech / Wellness |

---

## Product Description

### One-liner (한 줄 요약)

> Yiroom is an AI-powered personal beauty analysis platform that combines Google Gemini diagnostics with personalized product recommendations and wellness coaching.

### Short Description (2-3 sentences)

> Yiroom is the first full-funnel AI beauty analysis platform built in Korea. Using Google Gemini's multimodal AI, we provide expert-level personal color, skin, and body analysis — then connect users to personalized product recommendations, workout plans, and nutrition guidance. We're making the $60-150 offline personal color consultation accessible to everyone for free.

### Detailed Description (구글폼 "Describe your product" 필드)

> Yiroom ("이룸" — Korean for "achieving/becoming") is an AI-powered wellness platform that helps users understand themselves holistically through multi-dimensional beauty and health analysis.
>
> **The Problem:** In Korea, personal color diagnosis costs ₩80,000-200,000 ($60-$150) per 60-90 minute session at offline studios, with 2-3 week booking wait times and limited availability outside Seoul. Skin and body analysis require separate expensive consultations. There's no unified platform that connects diagnosis to actionable recommendations.
>
> **User Impact:** Yiroom reduces the cost from ₩120,000 to ₩0 and the time from 60+ minutes + travel to under 30 seconds — while providing a richer, multi-dimensional analysis that a single offline consultant cannot match.
>
> **Our Solution:** Yiroom provides 8 AI analysis modules — Personal Color (12-tone system), Skin Analysis (7-zone deep scan), Body Type Analysis, Hair Analysis, Makeup Styling, Oral Health Assessment, Workout Planning, and Nutrition Management — all powered by Google Gemini's Vision Language Model.
>
> **Key Innovation:** Unlike competitors that specialize in color analysis and virtual try-on (Dressika) or AR try-on and B2B SDK (Perfect Corp), Yiroom delivers the complete journey: **Diagnose → Recommend → Purchase → Track → Improve**. Our AI coaching system provides ongoing personalized guidance based on accumulated analysis data.
>
> **Retention Loop:** Personal color is the hook, but skin changes seasonally, workouts need weekly updates, and nutrition is daily. Yiroom's 8 modules create natural re-engagement: a skin re-scan after switching moisturizers, a body re-analysis after 4 weeks of training, a nutrition check after each meal. The platform grows more valuable as it accumulates longitudinal data — building a personalized wellness timeline that users can't get elsewhere.
>
> **Why Now:** Three forces are converging: (1) Korea's personal color diagnosis trend has gone viral on social media — demand is surging but supply remains limited to expensive offline studios; (2) Google Gemini 3 Flash reached production-grade multimodal analysis in late 2025, enabling zero-shot vision-language inference accurate enough for real-time beauty diagnosis for the first time; (3) The $11.4B K-beauty export market has hundreds of products but zero personalized recommendation platforms — consumers are overwhelmed by choice with no guidance. Yiroom sits at this exact intersection.
>
> **Current Status:** MVP complete with 17,500+ automated tests passing and all 8 modules achieving S-grade quality scores (95+/100). Bilingual (Korean/English) web app live at [yiroom.vercel.app](https://yiroom.vercel.app), with a native mobile app (130+ components) in parallel development via Expo SDK 54.

---

## AI/ML Technology

### How does your product use AI/ML? (AI/ML 활용 방식)

> **Core AI Engine: Google Gemini 3 Flash (Vision Language Model)**
>
> We use Gemini 3 Flash as a zero-shot multimodal analyzer — sending structured prompts with inline images and parsing responses through strict Zod schema validation. This powers real-time image analysis across 8 modules:
>
> 1. **Personal Color Analysis** — Face image → skin undertone extraction → CIEDE2000-based 12-tone seasonal color classification → personalized color palette generation with best/worst colors
> 2. **Skin Analysis** — Selfie → 7-zone deep analysis (forehead, nose, left cheek, right cheek, chin, eye area, lip area) → hydration, oiliness, sensitivity, wrinkle scoring → product ingredient matching
> 3. **Body Type Analysis** — Full-body image → MediaPipe Pose 33 anatomical landmark detection → 5 body type classification → personalized workout recommendations
> 4. **AI Wellness Coach** — Context-aware conversational AI (streaming + RAG) that synthesizes all analysis results to provide personalized beauty and wellness guidance
>
> **Technical Architecture:**
>
> - **Structured Output**: Every Gemini response is validated through Zod schemas — ensuring type-safe, consistent AI outputs across all 8 modules
> - **Mock Fallback System**: 3–5 second timeout (varies by analysis complexity) → 2 retries → deterministic mock data (zero-downtime guarantee)
> - **Confidence Scoring**: Each analysis returns a 0–100 confidence score; fallback results are transparently labeled so users know when mock data is served
> - **Privacy-First**: Images are processed in real-time with a 7-day retention policy for photo reuse, then automatically purged; all data encrypted at rest via Supabase

### What technical challenge would you like Google's help with?

> **Challenge 1: Scaling Gemini VLM Inference (Google Cloud + Vertex AI)**
>
> Current: Single-request Gemini API calls with 3–5 second timeouts, deployed on Vercel. At 10K+ DAU, we estimate ~30K daily inference calls (~3 analyses per user per day), costing ~$150/day at Gemini 3 Flash pricing ($0.50/1M input, $3/1M output tokens). As we scale to 100K+ MAU and add Vertex AI fine-tuning workloads, inference costs become the dominant expense.
>
> What we need Google's help with:
>
> - **Vertex AI batch prediction** for non-real-time analyses (e.g., weekly skin trend reports) — estimated 50% cost reduction vs real-time calls
> - **Gemini 3 Flash vs 3.1 Pro routing** — currently we use Flash for all analyses; we want to implement tiered routing where Flash handles quick screenings and Pro handles detailed 7-zone skin analysis, leveraging `media_resolution` control for cost-quality optimization
> - **Cloud Run** for dedicated AI inference backend (separate from Vercel frontend), enabling autoscaling for traffic spikes (viral K-beauty content → sudden load)
> - **Prompt caching** (90% input discount for repeated system prompts) + **batch processing** for background analyses
>
> **Challenge 2: Fine-tuning Gemini for Korean Beauty Standards**
>
> Korean personal color diagnosis follows a unique 12-tone system that differs from Western 4-season models. Currently, Gemini 3 Flash performs zero-shot classification using our structured prompts + CIEDE2000 color-distance algorithm as a verification layer. While results are promising for common skin tones, accuracy drops for edge cases (e.g., distinguishing Soft Summer from Light Summer in Korean undertones). We lack a systematic accuracy benchmark — building one is a key goal.
>
> What we need Google's help with:
>
> - **Vertex AI fine-tuning** with Korean beauty expert-annotated images (we plan to build a labeled dataset of 5,000+ images by partnering with Seoul-based color consultants — partnership outreach begins upon program acceptance)
> - Custom evaluation pipeline on **BigQuery** — tracking accuracy metrics per skin tone category against expert diagnoses
> - Target: Build a rigorous benchmark first, then improve to 95%+ accuracy on Korean 12-tone classification
>
> **Challenge 3: Cross-Module AI Data Pipeline (BigQuery + Vertex AI)**
>
> Combining 8 analysis modules into personalized wellness recommendations requires temporal and cross-dimensional data fusion. Our current stack uses Supabase (PostgreSQL) for storage — we need Google Cloud's ML infrastructure to add intelligence on top.
>
> What we need Google's help with:
>
> - **BigQuery ML** for user pattern analysis — importing anonymized analysis data from Supabase into BigQuery for ML workloads (e.g., seasonal skin changes → product recommendation timing)
> - **Vertex AI Pipelines** for automated model retraining as user data grows
> - **Pub/Sub + Cloud Functions** for event-driven cross-module triggers (e.g., personal color result → automatic makeup palette update, skin change detected → product recommendation refresh)

---

## Traction & Market

### Current Traction

> **Pre-Launch Status — Technical MVP Complete**
>
> - **8 AI analysis modules** at S-grade quality — scored by automated 100-point rubric covering functionality, code quality, UX, test coverage, and documentation
> - **17,500+ automated tests passing** across web (15K+) and mobile (2.7K+)
> - **137 pages** production-ready PWA — **live at [yiroom.vercel.app](https://yiroom.vercel.app)**
> - **130+ mobile components** with Expo SDK 54 (React Native)
> - **Bilingual** (Korean/English), **offline-capable**, **zero external funding**
>
> **What we accomplished, and how:**
>
> 1. Built 8 production-ready AI analysis modules as measured by 17,500+ passing tests, achieving S-grade (95+/100) quality scores — by a solo technical founder in 80 days with $0 external funding
> 2. Shipped a complete bilingual web app (137 pages) + native mobile app (130+ components) — 2,800+ TypeScript files across the monorepo
> 3. Maintained an intense development velocity: **520+ commits** in 80 days (~6.5 commits/day), demonstrating sustained execution capability
> 4. Designed a zero-downtime architecture with 3-second timeout → 2 retries → mock fallback — ensuring 100% availability even during Gemini API outages
>
> **GitHub**: [github.com/rlaqudals12-cell/yiroom](https://github.com/rlaqudals12-cell/yiroom) (available for review)

### TAM / SAM / SOM

> **TAM: $4.4 Billion** (2025)
>
> - Global AI in Beauty & Cosmetics market
> - Growing at 21% CAGR → $9.4B by 2029
> - Source: The Business Research Company, InsightAce Analytic
>
> **SAM: ~$800 Million** (2025)
>
> - AI beauty analysis in Korea + K-beauty export target markets (US $2.2B, Japan $1.1B, 202 countries total)
> - Korea's cosmetics exports hit $11.4B in 2025 (record high, Korea Herald) — AI personalization demand within this export ecosystem defines our SAM
> - Derivation: ~18% of TAM ($4.4B × 0.18 ≈ $800M), reflecting Korea's outsized share in global beauty tech innovation and the K-beauty export ecosystem's AI personalization opportunity
> - Korea leads APAC in beauty tech innovation and consumer adoption
>
> **SOM: $200K Year 1 → $1M Year 3**
>
> - Year 1: 50K downloads, 12.5K MAU → Premium $22K (375 subs × $4.99/mo × 12) + Affiliate $178K (12.5K MAU × ~8% conversion × avg $15 commission/order × 12mo). Note: 8% affiliate conversion is achievable because product recommendations are directly linked to personal analysis results — high-intent traffic, not generic ads
> - Year 3: 500K downloads, 100K MAU → Premium $300K (5K subs) + Affiliate $500K + B2B API $200K
> - Revenue model: Freemium ($4.99/mo — benchmarked FaceApp $3.99, YouCam $5.99) + affiliate commissions (5-12% per K-beauty purchase) + B2B API licensing ($0.05/analysis call)

### Competitive Advantage (경쟁 우위)

> **1. Full-Funnel Integration (풀퍼널 통합)**
> Integrated platform covering Diagnose → Recommend → Purchase → Track → Improve. Dressika specializes in color analysis + virtual try-on; Perfect Corp focuses on AR try-on + B2B SDK — neither covers wellness holistically (workout, nutrition, oral health) nor provides long-term tracking and improvement loops based on analysis results.
>
> **2. Gemini-First AI Architecture**
> All 8 analysis modules are built on Gemini 3 Flash with structured Zod schema validation — not retrofitting AI onto legacy code. Currently deployed on Vercel (web) + Supabase (PostgreSQL), with architecture designed for migration to Cloud Run (AI inference) and Vertex AI (fine-tuning) as we scale. The codebase is Google AI-native from day one.
>
> **3. 8-Module Comprehensive Analysis**
> Personal Color + Skin + Body + Hair + Makeup + Oral Health + Workout + Nutrition. No competitor offers this breadth of AI-powered analysis in a single platform.
>
> **4. K-Beauty Origin Advantage**
> Built in Seoul — the epicenter of K-beauty ($11.4B exports in 2025, record high across 202 countries). Native understanding of Korean beauty standards, 12-tone personal color system, and K-beauty product ecosystem.
>
> **5. Enterprise-Grade Technical Quality**
> Full test suite (17K+), TypeScript strict mode, and automated quality scoring across all modules. This engineering rigor is rare for a pre-seed startup — our codebase is ready to scale from day one.
>
> **6. Defensibility Against Large Platforms**
> Naver, Snow, and Meitu add individual beauty features (e.g., AR filters, skin scores) but are structurally incentivized to keep users within their ecosystem — not to build cross-module wellness journeys. Yiroom's value compounds from longitudinal data across 8 modules; this requires a dedicated platform, not a feature inside a super-app.

---

## Team

### Founder

> **Byungmin Kim (김병민) — Solo Technical Founder & CEO**
>
> **Why Beauty Tech:**
> I personally paid ₩120,000 ($90) for a personal color diagnosis at a Seoul studio. The experience was eye-opening — but I realized most people can't afford it, and the results were a paper printout with no follow-up. I saw the same pattern across skin consultations, body analysis, and nutrition coaching: expensive one-time sessions with zero digital continuity. As a full-stack engineer who had been tracking Gemini's Vision Language Model capabilities, I recognized that multimodal AI had finally reached the point where it could democratize this expertise. Yiroom was born from this intersection — a personal pain point, an $11.4B export market with no integrated digital solution, and AI technology mature enough to deliver it.
>
> Full-stack engineer who single-handedly designed, built, and tested the entire Yiroom platform — 8 AI analysis modules, 17,500+ automated tests, bilingual PWA + native mobile app — from concept to production-ready MVP in just 80 days. I use Yiroom daily as my own wellness tracker — every product decision is driven by real usage, not hypothetical user needs.
>
> **Technical Stack Mastery:**
>
> - Frontend: Next.js 16, React 19, TypeScript (strict mode)
> - AI/ML: Google Gemini API, structured output, mock fallback architecture
> - Backend: Supabase (PostgreSQL + RLS), Clerk Auth
> - Mobile: Expo SDK 54, React Native (130+ components, 2,700+ tests)
> - Infrastructure: Turborepo monorepo, Vitest + Jest, PWA

### Why a solo founder can execute this

> Building Yiroom solo wasn't a limitation — it was a strategic choice that enabled:
>
> 1. **Speed**: No coordination overhead → concept to MVP in 80 days
> 2. **Consistency**: Single architectural vision → S-grade quality across all modules
> 3. **Capital Efficiency**: $0 spent → proven ability to ship with minimal resources
>
> GFSA's mentoring, cloud credits, and Google network represent the optimal catalyst to transition from solo builder to team leader. Concrete hiring plan post-GFSA: (1) AI/ML Engineer for Gemini fine-tuning and Vertex AI pipeline management — sourcing via Google Developer community and GFSA alumni network, (2) Growth Marketer with K-beauty community expertise for Naver/Instagram organic acquisition — sourcing via Seoul startup communities (Disquiet, wanted.co.kr). Initial budget: GFSA seed funding + early affiliate revenue. Target: 3-person team by Demo Day.

---

## Program Fit

### Why GFSA? (프로그램 적합성)

> **1. Google Cloud Credits ($350K) — Direct Revenue Unlock**
> Credits apply to all Google Cloud services we need: Gemini API inference (via Vertex AI), Vertex AI fine-tuning, BigQuery ML, Cloud Run, Cloud Storage, and Pub/Sub. At ~$0.005 per Gemini 3 Flash analysis, our projected cost at 100K MAU: Gemini inference ~$55K/yr + Vertex AI fine-tuning ~$20K/yr + Cloud Run/BigQuery ~$25K/yr − prompt caching savings ~$22K/yr = **~$78K/year net**. With $350K in credits over 2 years, we get 4+ years of AI infrastructure runway — converting credits directly to user growth without fundraising.
>
> **2. Vertex AI Fine-Tuning Expertise — Building a Korean Beauty AI Benchmark**
> Google's AI mentors can guide Gemini fine-tuning for Korean 12-tone color classification — a domain where no off-the-shelf model or benchmark exists. Building a rigorous evaluation dataset with Korean color consultants, then fine-tuning to 95%+ accuracy, is our core technical moat.
>
> **3. Google Play Store Featuring — Mobile-First Korea**
> Korea is the world's 4th largest mobile app market with one of the highest smartphone penetration rates globally. Our Expo-based app is Play Store ready. Featured placement in the Health & Beauty category could drive 50K+ downloads in the first month.
>
> **4. First Beauty Tech in GFSA Korea Alumni**
> Looking at GFSA Korea alumni (MINDliNG, Liner, ENERZAi, etc.), there is no beauty tech startup yet. Yiroom would be the first K-beauty AI company in the portfolio — filling a clear gap given Korea's $11.4B beauty export market.
>
> **5. Solo → Team Transition Mentoring**
> As a solo founder who has proven execution capability ($0 spent, 80-day MVP), the critical next step is building a team. Google's mentor network provides the hiring, fundraising, and GTM guidance needed for this transition.
>
> **6. Mutual Value for Google**
> Yiroom becomes a showcase for Gemini VLM capabilities in the $11.4B K-beauty market — a high-visibility consumer vertical. Our Korean 12-tone color classification benchmark would be the first domain-specific multimodal evaluation dataset for Korean beauty AI, contributing to Google's non-English AI research portfolio. As the first beauty tech in GFSA Korea alumni, Yiroom fills a portfolio gap aligned with Korea's largest export-competitive industry.

### Commitment & 10-Week Milestones (참여 서약 + 목표)

> I commit to attending all 10 weeks of program sessions (April-July 2026), both remote and in-person in Korea. As the sole founder and technical lead, I will personally engage in all mentoring sessions, sprint projects, and demo day preparation.
>
> **10-Week GFSA Milestones:**
>
> | Week | Milestone                                | Success Metric                                                           |
> | ---- | ---------------------------------------- | ------------------------------------------------------------------------ |
> | 1-2  | Google Play launch + Vertex AI setup     | App live on Play Store, Cloud project configured                         |
> | 3-4  | Gemini fine-tuning for Korean 12-tone    | Benchmark dataset built, baseline accuracy measured, fine-tuning started |
> | 5-6  | Organic growth via K-beauty communities  | 5K downloads, 1.5K MAU                                                   |
> | 7-8  | Affiliate partnerships + revenue model   | 2+ K-beauty brand partnerships signed                                    |
> | 9-10 | Demo Day preparation + Series Seed pitch | Investor deck ready, fine-tuned accuracy 95%+                            |
>
> **Go-to-Market:** Free personal color analysis as viral hook on Korean beauty communities (Naver Cafe, Everytime, Instagram Reels). Each analysis result includes a shareable color palette card — users naturally share their results, creating organic word-of-mouth. We target the massive demand for "퍼스널컬러" — consistently one of the top trending beauty search terms on Naver.
>
> **Risk Awareness & Mitigation:**
>
> - _AI cost scaling_: Prompt caching (90% input discount) + Flash/Pro tiered routing + Vertex AI batch processing — estimated 60% cost reduction vs naive API calls
> - _User acquisition_: Free personal color analysis as zero-CAC viral hook; if organic growth underperforms, pivot to micro-influencer partnerships funded by early affiliate revenue
> - _Accuracy targets_: Building a rigorous benchmark first (Weeks 3-4), then setting data-driven accuracy goals — 95% is a post-fine-tuning target, not a launch requirement

---

## Appendix: Key Metrics Summary (한눈에 보기)

| Metric              | Value                                                      |
| ------------------- | ---------------------------------------------------------- |
| AI Analysis Modules | 8 (PC, Skin, Body, Hair, Makeup, Oral, Workout, Nutrition) |
| Automated Tests     | 17,500+ passing (15,000+ Web + 2,700+ Mobile)              |
| Quality Score       | S-grade (95+/100) across all 8 modules                     |
| Tech Stack          | Next.js 16 + Gemini 3 Flash + Supabase + Clerk + Expo      |
| Mobile Components   | 130+ (Expo SDK 54, React Native)                           |
| Languages           | Korean + English (bilingual)                               |
| PWA Score           | Installable, offline-capable                               |
| Live URL            | https://yiroom.vercel.app                                  |
| TAM                 | $4.4B (AI Beauty, 2025)                                    |
| SAM                 | $800M (K-beauty export ecosystem)                          |
| SOM (Year 1)        | $200K                                                      |
| SOM (Year 3)        | $1M                                                        |
| Funding             | $0 (bootstrapped)                                          |
| Team Size           | 1 (solo technical founder)                                 |
| Git Commits         | 520+ in 80 days (6.5/day avg)                              |
| TypeScript Files    | 2,800+ across monorepo                                     |
| Time to MVP         | ~80 days (Dec 2025 → Mar 2026)                             |
| GitHub              | github.com/rlaqudals12-cell/yiroom                         |

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

- [x] `https://yiroom.vercel.app` → 라이브 URL 반영 완료
- [x] 파운더 실명 반영 완료 (Byungmin Kim)
- [x] 테스트 수 최신화 (17,500+ — Web 15,000+ / Mobile 2,700+)
- [x] 모바일 앱 정보 추가 (130+ components)
- [ ] Google Play 앱 링크 (모바일 출시 후, 선택)

---

**Version**: 5.8 | **Created**: 2026-02-20 | **Updated**: 2026-03-01 | 크레딧 배분 구체화, Google 상호 가치, 리스크 대응 계획 추가
**참조**: [시장 리서치](./2026-02-20-gfsa-market-research.md)
