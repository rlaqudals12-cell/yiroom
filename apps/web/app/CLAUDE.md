# 📱 app/CLAUDE.md - Next.js App Router 규칙

## 라우팅 구조
```
app/
├── (auth)/          # 인증 관련 (로그인, 회원가입)
├── (main)/          # 메인 기능 (로그인 필요)
│   ├── analysis/    # 분석 모듈
│   │   ├── color/   # PC-1 퍼스널 컬러
│   │   ├── skin/    # S-1 피부 분석
│   │   └── body/    # C-1 체형 분석
│   └── dashboard/   # 대시보드
└── api/             # API Routes
```

## 파일 컨벤션
```yaml
page.tsx:      # 페이지 컴포넌트 (필수)
layout.tsx:    # 레이아웃 (선택)
loading.tsx:   # 로딩 UI
error.tsx:     # 에러 UI
not-found.tsx: # 404 UI
```

## Server vs Client
```typescript
// Server Component (기본)
// - DB 직접 접근 가능
// - 민감한 로직 처리
export default async function Page() { }

// Client Component
'use client'
// - useState, useEffect 사용
// - 이벤트 핸들러
// - 브라우저 API
```

## 데이터 페칭
```typescript
// Server Component에서 직접 페칭
const data = await supabase.from('table').select()

// Client Component는 React Query 사용
const { data } = useQuery({ queryKey: [...], queryFn: ... })
```

## API Route 규칙
```typescript
// app/api/[경로]/route.ts
export async function GET(request: Request) { }
export async function POST(request: Request) { }

// 반드시 에러 핸들링 포함
// 응답은 NextResponse.json() 사용
```

## 주의사항
- ❌ pages/ 폴더 사용 금지 (App Router만)
- ❌ getServerSideProps 사용 금지
- ✅ 서버 컴포넌트 우선 사용
- ✅ 클라이언트 컴포넌트는 최소화
