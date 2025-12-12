import { Server, Database, Cpu, HardDrive, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function AdminSystemPage() {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">시스템 관리</h2>
        <p className="text-gray-500 mt-1">시스템 상태 및 설정을 관리하세요.</p>
      </div>

      {/* 시스템 상태 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Server className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">서버 상태</p>
                <p className="text-lg font-semibold text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> 정상
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">데이터베이스</p>
                <p className="text-lg font-semibold text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> 연결됨
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Cpu className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">AI 서비스</p>
                <p className="text-lg font-semibold text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> 활성
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <HardDrive className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">스토리지</p>
                <p className="text-lg font-semibold text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> 정상
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 관리 메뉴 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/system/features">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-lg">Feature Flags</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">
                기능을 켜고 끌 수 있습니다. 문제가 발생한 기능을 빠르게
                비활성화하거나, 새 기능을 점진적으로 배포할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/system/crawler">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-lg">크롤러 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">
                가격 크롤러 상태를 확인하고 수동으로 실행할 수 있습니다.
                제품 가격을 최신 상태로 유지합니다.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 환경 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">환경 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Node.js</p>
              <p className="font-medium">{process.version}</p>
            </div>
            <div>
              <p className="text-gray-500">Next.js</p>
              <p className="font-medium">16.0.7</p>
            </div>
            <div>
              <p className="text-gray-500">환경</p>
              <p className="font-medium">
                {process.env.NODE_ENV === 'production' ? '프로덕션' : '개발'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">빌드</p>
              <p className="font-medium">{new Date().toLocaleDateString('ko-KR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
