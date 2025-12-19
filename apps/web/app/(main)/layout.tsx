import { ReactNode } from 'react';

// (main) 그룹 전체를 dynamic으로 설정
// Supabase/Clerk를 사용하는 페이지들은 빌드 시 prerendering 불가
export const dynamic = 'force-dynamic';

export default function MainLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
