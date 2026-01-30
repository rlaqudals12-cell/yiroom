# 01. 기술 스택

> version: 1.0
> last_updated: 2026-01-14
> source: v2.2 섹션 4

---

## 🔧 핵심 기술 스택

| 분야 | 기술 | 버전/비고 |
|------|------|----------|
| **Frontend** | Next.js + React + TypeScript + Tailwind CSS | 16 / 19 / 5.x / v4 |
| **Auth** | Clerk | clerk_user_id 기반 |
| **Database** | Supabase (PostgreSQL) | 15+, RLS 필수 |
| **AI** | Google Gemini | 3 Flash (Mock Fallback 필수) |
| **Testing** | Vitest + Playwright | 2,776개 테스트 |
| **오케스트레이터** | 시지푸스 | OPUS 4.5 전용 (고난이도) |
| **이슈 트래킹** | .beads | JSONL 기반 |

---

## 📱 모바일

| 분야 | 기술 |
|------|------|
| Framework | Expo (React Native) |
| Router | Expo Router |
| 배포 | EAS Build |

---

## ☁️ 인프라

| 분야 | 기술 |
|------|------|
| 웹 호스팅 | Vercel |
| DB | Supabase |
| Storage | Supabase Storage |
| Functions | Supabase Edge Functions |

---

## 🔐 보안

- RLS (Row Level Security) 필수
- clerk_user_id 기반 인증
- 민감정보 암호화

---

## 📦 주요 패키지

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "@clerk/nextjs": "latest",
    "@supabase/supabase-js": "latest",
    "@google/generative-ai": "latest"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vitest": "latest",
    "playwright": "latest",
    "tailwindcss": "^4.0.0"
  }
}
```

---

## ⚠️ 기술 선택 원칙

1. **변경 제안 전**: 기존 선택 사유 확인 필수
2. **새 기술 도입**: 제1원리 질문 ("우리 문제를 해결하는 가장 단순한 방법인가?")
3. **Mock 필수**: 모든 외부 API는 Mock Fallback 구현
