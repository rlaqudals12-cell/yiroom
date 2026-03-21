# LVMH Innovation Award 2026 — Application Draft

> **프로그램**: LVMH Innovation Award @ VivaTech 2026
> **마감**: March 23, 2026
> **파이널리스트 발표**: April 6, 2026
> **최종 피칭**: June 17, 2026 (VivaTech, Paris)
> **지원 URL**: https://challenges-awards.vivatech.com/challenges/lvmh
> **카테고리**: Immersive Digital Experiences
> **작성일**: 2026-03-22

---

## Company Information

| Field                    | Answer                                           |
| ------------------------ | ------------------------------------------------ |
| **Startup Name**         | Yiroom (이룸)                                    |
| **Website**              | https://yiroom.vercel.app                        |
| **Year Founded**         | 2025                                             |
| **Headquarters**         | Seoul, South Korea                               |
| **Number of Employees**  | 1 (Solo Technical Founder)                       |
| **Funding Stage**        | Pre-Seed, Bootstrapped                           |
| **Total Funding Raised** | $0                                               |
| **Industry**             | AI / Beauty Tech / Immersive Digital Experiences |

---

## Category: Immersive Digital Experiences

> Why this category: Yiroom's AI-powered Virtual Try-On (lip, blush, hair color), real-time personal color analysis, and CIE Lab Delta-E color matching create immersive, personalized beauty experiences that luxury brands can embed into their digital channels.

---

## 1. One-Liner

> **Yiroom is an AI-powered beauty intelligence platform that enables luxury brands to offer hyper-personalized color matching, virtual try-on, and skin diagnostics — transforming how consumers discover and connect with products.**

---

## 2. Problem Statement

### For Luxury Brands (LVMH Maisons):

**The Personalization Gap in Luxury Beauty E-Commerce**

Luxury beauty brands invest billions in product development but face a critical disconnect in digital channels:

- **70% of online beauty purchases are returned** due to shade mismatch (McKinsey, 2025)
- **In-store color consultations don't scale** — a Sephora beauty advisor can serve ~20 customers/day; digital channels serve millions
- **Generic recommendation engines fail luxury customers** — they expect personalized, expert-level guidance, not "customers also bought"
- **K-Beauty's $11.4B export market lacks AI personalization** — hundreds of products, zero intelligent matching for global consumers

### The Opportunity:

A brand-embeddable AI that knows each customer's personal color palette, skin condition, and style preferences — delivering the in-store consultation experience at digital scale.

---

## 3. Solution

### Yiroom AI Beauty Intelligence — B2B API/SDK for Luxury Brands

Yiroom provides a white-label AI beauty intelligence engine that luxury brands can integrate into their digital experiences:

#### Module 1: AI Personal Color Analysis

- **12-tone seasonal color classification** using Google Gemini Vision Language Model
- CIE Lab color space analysis with CIEDE2000 perceptual distance
- Generates personalized color palette → maps to brand's product catalog
- **Use case**: Sephora online → "Discover your perfect shade" → instant AI analysis → matched to Dior, Fenty, Guerlain products

#### Module 2: Virtual Try-On (VTO) with Product Matching

- Real-time AR try-on for lip, blush, foundation, hair color
- **Lab Delta-E color matching**: Extracts dominant color from VTO result → finds nearest matching products in brand catalog (ΔE < 5 = perceptually identical)
- **Use case**: Customer tries lipstick shade → AI suggests 3 nearest Dior Addict shades → one-click purchase

#### Module 3: AI Skin Diagnostics

- 7-zone deep skin analysis (hydration, oiliness, sensitivity, wrinkles)
- Seasonal skin tracking — recommends product switches based on skin changes
- **Use case**: Guerlain Abeille Royale → "Analyze your skin" → personalized serum recommendation based on actual skin condition

#### Module 4: AI Review Intelligence

- Gemini-powered analysis of product reviews (sentiment, keywords, pros/cons)
- 24-hour cached results for performance
- **Use case**: Sephora product page → "AI Review Summary" → instant consumer insights

#### Module 5: Coupon & Promotion Engine

- Context-aware promotions (tied to analysis results)
- "Your personal color is Spring Warm → 15% off matching products this week"
- **Use case**: Personalized promotional campaigns based on beauty profile, not demographics

### Technical Architecture

```
Brand's App/Website
    ↓ API Call
Yiroom AI Engine (Cloud)
    ├── Gemini 3 Flash (VLM Analysis)
    ├── CIE Lab Color Matching (Delta-E)
    ├── Zod Schema Validation (Type-Safe Output)
    └── Mock Fallback (Zero-Downtime Guarantee)
    ↓ JSON Response
Brand's UI (White-Label Components Available)
```

---

## 4. Why LVMH?

### Direct Value to LVMH Maisons

| Maison                | Yiroom Application                                                  | Business Impact                             |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------- |
| **Sephora**           | In-app personal color analysis → product matching across all brands | Reduce shade-mismatch returns, increase AOV |
| **Dior Beauty**       | VTO + Delta-E matching → "Find your Dior shade"                     | Digital clienteling at scale                |
| **Fenty Beauty**      | 40+ foundation shades → AI skin analysis finds perfect match        | Solve the #1 customer pain point            |
| **Guerlain**          | Seasonal skin tracking → personalized skincare routine              | Subscription/replenishment revenue          |
| **Louis Vuitton**     | Personal color analysis → accessory/clothing color recommendations  | Cross-category personalization              |
| **Benefit Cosmetics** | Brow + lip color matching using personal color palette              | Upsell through color harmony                |

### Why Now:

1. **Gemini 3 Flash** reached production-grade multimodal analysis — enabling real-time beauty AI for the first time
2. **K-Beauty export market ($11.4B)** demands AI personalization — brands need technology to match products to diverse global skin tones
3. **Post-COVID digital luxury** — consumers expect in-store consultation quality in digital channels

---

## 5. Traction & Technical Proof

### Pre-Launch Technical MVP — Enterprise-Grade Quality

| Metric                    | Value                                                                  |
| ------------------------- | ---------------------------------------------------------------------- |
| **AI Analysis Modules**   | 8 (Personal Color, Skin, Body, Hair, Makeup, Oral, Workout, Nutrition) |
| **Automated Tests**       | 23,063 passing (18,917 Web + 4,146 Mobile)                             |
| **Quality Score**         | S-grade (95+/100) across all 8 modules                                 |
| **CIE Lab Color Engine**  | Delta-E 2000 perceptual matching, RGB→Lab conversion                   |
| **Virtual Try-On**        | Lip, Blush, Foundation, Hair — real-time AR                            |
| **Image Quality (CIE-1)** | Laplacian variance sharpness detection for reliable AI input           |
| **Tech Stack**            | Next.js 16 + Google Gemini 3 Flash + Supabase + TypeScript             |
| **Mobile App**            | 253+ components, Expo SDK 54, 131 routes                               |
| **Development Speed**     | Concept to production-ready in ~90 days by solo founder                |
| **Live Demo**             | https://yiroom.vercel.app                                              |

### B2B-Ready Architecture

- **API-first design**: All analysis modules accessible via RESTful API
- **White-label components**: Embeddable UI widgets for brand customization
- **Zero-downtime guarantee**: 3s timeout → 2 retries → mock fallback
- **GDPR compliant**: 7-day image retention, PII masking, audit logging
- **Multi-language**: Korean + English (expandable)

---

## 6. Team

### Byungmin Kim (김병민) — Solo Technical Founder & CEO

**Background**: Full-stack engineer who single-handedly designed, built, and tested the entire Yiroom platform — 8 AI analysis modules, 23,063 automated tests, bilingual PWA + native mobile app — from concept to production in 90 days with $0 funding.

**Why Beauty Tech**: I personally paid ₩120,000 ($90) for a personal color diagnosis at a Seoul studio. The experience was transformative — but I realized this expertise could be democratized through AI, and more importantly, made available to brands as an intelligent layer in their digital experiences.

**Technical Mastery**:

- AI/ML: Google Gemini API, CIE Lab color science, structured output validation
- Frontend: Next.js 16, React 19, TypeScript (strict mode)
- Mobile: Expo SDK 54, React Native (253+ components)
- Backend: Supabase (PostgreSQL + RLS), Clerk Auth
- Quality: 23,063 automated tests, S-grade quality across all modules

### Why a solo founder can build this:

1. **Speed**: No coordination overhead → concept to MVP in 90 days
2. **Consistency**: Single architectural vision → enterprise-grade quality
3. **Capital Efficiency**: $0 spent → proven ability to ship with minimal resources
4. **Ready for team**: GFSA Korea 2026 accepted (pending) — hiring plan for AI/ML engineer + growth marketer

---

## 7. Business Model (B2B for LVMH)

| Revenue Stream           | Pricing                             | Target                  |
| ------------------------ | ----------------------------------- | ----------------------- |
| **API Licensing**        | $0.03-0.10 per analysis call        | Sephora, brand websites |
| **SDK Integration**      | $5K-50K/month per brand             | Dior, Fenty, Guerlain   |
| **White-Label Platform** | Custom pricing                      | Multi-brand retailers   |
| **Data Insights**        | Aggregated color/skin trend reports | LVMH R&D                |

### Unit Economics (Projected)

- Cost per Gemini analysis: ~$0.005
- API price per analysis: $0.05 (avg)
- **Gross margin: ~90%**
- At 1M monthly API calls (single brand): $50K MRR / $600K ARR

---

## 8. Market

| Metric               | Value                                                    |
| -------------------- | -------------------------------------------------------- |
| **TAM**              | $4.4B — Global AI in Beauty & Cosmetics (2025), 21% CAGR |
| **SAM**              | $800M — AI beauty analysis in K-Beauty ecosystem         |
| **SOM (Year 1)**     | $200K — API licensing + affiliate                        |
| **SOM (Year 3)**     | $1M — Multi-brand API + SDK                              |
| **K-Beauty Exports** | $11.4B (2025, record high)                               |

---

## 9. Competitive Advantage for LVMH

| vs. Competitor               | Yiroom Advantage                                                               |
| ---------------------------- | ------------------------------------------------------------------------------ |
| **Perfect Corp** (B2B AR)    | Yiroom adds AI diagnostics + color science, not just AR overlay                |
| **ModiFace** (L'Oréal owned) | Brand-neutral, multi-brand compatible (LVMH needs non-L'Oréal solution)        |
| **Meitu/Snow**               | Consumer photo apps, not B2B embeddable                                        |
| **In-house development**     | 90-day MVP vs. 12-18 months internal build; 23K tests prove production quality |

### Key Differentiator for LVMH:

> **ModiFace is owned by L'Oréal — LVMH's direct competitor.** Yiroom offers LVMH an independent, best-in-class AI beauty intelligence engine with no competitor conflicts.

---

## 10. What We Need from LVMH

1. **Pilot opportunity** with one Maison (ideal: Sephora or Dior Beauty)
2. **Maison des Startups LVMH** — 10 months of mentoring at Station F
3. **Access to brand product catalogs** for color matching integration
4. **VivaTech visibility** for B2B customer acquisition
5. **Guidance on luxury market positioning** — adapting K-Beauty AI for global luxury consumers

---

## 11. Milestones if Selected

| Timeline         | Milestone                                                             |
| ---------------- | --------------------------------------------------------------------- |
| **Apr 2026**     | Finalist notification → Begin API documentation for brand integration |
| **May 2026**     | Pilot proposal to 1 LVMH Maison (Sephora preferred)                   |
| **Jun 2026**     | VivaTech demo → Live API demo with brand's product catalog            |
| **Jul-Sep 2026** | POC with pilot Maison → Integration testing                           |
| **Oct-Dec 2026** | Production deployment → First revenue                                 |
| **2027**         | Expand to 3+ Maisons → $500K+ ARR                                     |

---

## Appendix: Key Numbers at a Glance

```
23,063  automated tests passing
8       AI analysis modules (S-grade quality)
253+    mobile components
90      days from concept to production
$0      external funding raised
$11.4B  K-Beauty export market (2025)
$4.4B   AI Beauty market (21% CAGR)
90%     projected gross margin on API
```

---

## 제출 가이드

VivaTech Challenge 플랫폼에서 다음 필드에 매핑:

1. **Company overview** → Section 1-2 (One-liner + Problem)
2. **Solution description** → Section 3 (Solution)
3. **Why LVMH** → Section 4
4. **Traction** → Section 5
5. **Team** → Section 6
6. **Business model** → Section 7
7. **Market** → Section 8

### 핵심 프레이밍 전략:

```
GFSA 지원서: "Yiroom은 B2C 뷰티 앱, Google Gemini로 개인 분석"
LVMH 지원서: "Yiroom은 B2B AI 엔진, 럭셔리 브랜드에 개인화 기술 제공"

같은 기술, 다른 프레이밍:
- B2C: 소비자가 직접 앱에서 분석
- B2B: 브랜드가 Yiroom API를 자사 앱에 내장
```

---

**Version**: 1.0 | **Created**: 2026-03-22
**참조**: [GFSA 지원서](./2026-02-20-gfsa-application-draft.md) | [시장 리서치](./2026-02-20-gfsa-market-research.md)
