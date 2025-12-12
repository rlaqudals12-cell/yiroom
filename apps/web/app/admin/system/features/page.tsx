'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Search,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { FeatureFlag } from '@/lib/admin';

// Feature Flag 카테고리 (DB migration과 일치)
const CATEGORIES = {
  analysis: { label: '분석 기능', keys: ['analysis_personal_color', 'analysis_skin', 'analysis_body'] },
  module: { label: '모듈', keys: ['workout_module', 'nutrition_module', 'reports_module'] },
  product: { label: '제품', keys: ['product_recommendations', 'product_wishlist'] },
  ai: { label: 'AI 기능', keys: ['ai_qa', 'ingredient_warning'] },
  system: { label: '시스템', keys: ['price_crawler', 'share_results'] },
};

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // Feature Flags 로드
  const loadFlags = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/features');
      if (!response.ok) throw new Error('Failed to load feature flags');
      const data = await response.json();
      setFlags(data.flags);
    } catch (error) {
      toast.error('Feature Flags를 불러오는데 실패했습니다');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  // Feature Flag 토글
  const toggleFlag = async (key: string, enabled: boolean) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/features', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, enabled }),
        });

        if (!response.ok) throw new Error('Failed to toggle feature');

        setFlags((prev) =>
          prev.map((f) => (f.key === key ? { ...f, enabled } : f))
        );

        toast.success(`${enabled ? '활성화' : '비활성화'}되었습니다`);
      } catch (error) {
        toast.error('변경에 실패했습니다');
        console.error(error);
      }
    });
  };

  // 검색 필터링
  const filteredFlags = flags.filter(
    (flag) =>
      flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (flag.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  // 카테고리별 그룹화
  const getCategoryFlags = (categoryKeys: string[]) =>
    filteredFlags.filter((flag) => categoryKeys.includes(flag.key));

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feature Flags</h2>
          <p className="text-gray-500 mt-1">기능을 켜고 끌 수 있습니다.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadFlags}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="기능 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 경고 메시지 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">주의사항</p>
          <p className="mt-1">
            기능을 비활성화하면 해당 기능이 사용자에게 보이지 않습니다.
            실서비스에 영향을 줄 수 있으니 신중하게 변경해 주세요.
          </p>
        </div>
      </div>

      {/* 로딩 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-gray-200 rounded w-1/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-16 bg-gray-100 rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* 카테고리별 Feature Flags */
        <div className="space-y-6">
          {Object.entries(CATEGORIES).map(([categoryKey, category]) => {
            const categoryFlags = getCategoryFlags(category.keys);
            if (categoryFlags.length === 0) return null;

            return (
              <Card key={categoryKey}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.label}</CardTitle>
                  <CardDescription>
                    {categoryFlags.filter((f) => f.enabled).length} / {categoryFlags.length} 활성화
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryFlags.map((flag) => (
                      <FeatureFlagItem
                        key={flag.key}
                        flag={flag}
                        onToggle={toggleFlag}
                        isPending={isPending}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* 카테고리에 없는 항목 */}
          {(() => {
            const allCategoryKeys = Object.values(CATEGORIES).flatMap((c) => c.keys);
            const uncategorizedFlags = filteredFlags.filter(
              (f) => !allCategoryKeys.includes(f.key)
            );
            if (uncategorizedFlags.length === 0) return null;

            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">기타</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {uncategorizedFlags.map((flag) => (
                      <FeatureFlagItem
                        key={flag.key}
                        flag={flag}
                        onToggle={toggleFlag}
                        isPending={isPending}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      )}

      {/* 검색 결과 없음 */}
      {!loading && filteredFlags.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}

// Feature Flag 아이템 컴포넌트
function FeatureFlagItem({
  flag,
  onToggle,
  isPending,
}: {
  flag: FeatureFlag;
  onToggle: (key: string, enabled: boolean) => void;
  isPending: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
        flag.enabled
          ? 'bg-green-50 border-green-200'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{flag.name}</span>
          <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
            {flag.key}
          </code>
        </div>
        {flag.description && (
          <p className="text-sm text-gray-500 mt-1">{flag.description}</p>
        )}
      </div>
      <button
        onClick={() => onToggle(flag.key, !flag.enabled)}
        disabled={isPending}
        className={`flex-shrink-0 ml-4 p-2 rounded-lg transition-colors ${
          isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/50'
        }`}
        aria-label={flag.enabled ? '비활성화' : '활성화'}
      >
        {flag.enabled ? (
          <ToggleRight className="h-8 w-8 text-green-600" />
        ) : (
          <ToggleLeft className="h-8 w-8 text-gray-400" />
        )}
      </button>
    </div>
  );
}
