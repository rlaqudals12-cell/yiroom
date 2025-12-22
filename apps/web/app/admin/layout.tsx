import { redirect } from 'next/navigation';
import Image from 'next/image';
import { isAdmin, getAdminInfo } from '@/lib/admin';
import { AdminSidebar } from './_components/AdminSidebar';

// Admin 페이지 전체를 dynamic으로 설정 - 빌드 시 prerendering 방지
export const dynamic = 'force-dynamic';

export const metadata = {
  title: '관리자 - 이룸',
  description: '이룸 관리자 대시보드',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 관리자 권한 체크
  const admin = await isAdmin();
  if (!admin) {
    redirect('/');
  }

  const adminInfo = await getAdminInfo();

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 사이드바 */}
      <AdminSidebar />

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col">
        {/* 헤더 */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">관리자 대시보드</h1>
          <div className="flex items-center gap-3">
            {adminInfo?.imageUrl && (
              <Image
                src={adminInfo.imageUrl}
                alt={adminInfo.name || '관리자'}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
                unoptimized
              />
            )}
            <div className="text-sm">
              <p className="font-medium text-gray-800">{adminInfo?.name || '관리자'}</p>
              <p className="text-gray-500 text-xs">{adminInfo?.email}</p>
            </div>
          </div>
        </header>

        {/* 페이지 콘텐츠 */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
