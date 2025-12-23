'use client';

import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useEffect, useState } from 'react';
import UserProfile from './_components/UserProfile';
import TodayFocusWidget from './_components/TodayFocusWidget';
import WeeklyProgressSection from './_components/WeeklyProgressSection';
import AnalysisSection from './_components/AnalysisSection';

// 분석 결과 타입 정의
interface AnalysisSummary {
  id: string;
  type: 'personal-color' | 'skin' | 'body';
  createdAt: Date;
  summary: string;
  // 타입별 추가 데이터
  seasonType?: string; // PC-1
  skinScore?: number; // S-1
  bodyType?: string; // C-1
}

export default function DashboardPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPersonalColor, setHasPersonalColor] = useState(false);

  // 데이터베이스에서 분석 결과 가져오기
  useEffect(() => {
    async function fetchAnalyses() {
      if (!user?.id) return;

      try {
        // 퍼스널 컬러 분석 결과 가져오기
        const { data: pcData } = await supabase
          .from('personal_color_assessments')
          .select('id, season, created_at')
          .order('created_at', { ascending: false })
          .limit(1);

        // 피부 분석 결과 가져오기
        const { data: skinData } = await supabase
          .from('skin_analyses')
          .select('id, overall_score, created_at')
          .order('created_at', { ascending: false })
          .limit(1);

        // 체형 분석 결과 가져오기
        const { data: bodyData } = await supabase
          .from('body_analyses')
          .select('id, body_type, created_at')
          .order('created_at', { ascending: false })
          .limit(1);

        const results: AnalysisSummary[] = [];

        if (pcData && pcData.length > 0) {
          setHasPersonalColor(true);
          results.push({
            id: pcData[0].id,
            type: 'personal-color',
            createdAt: new Date(pcData[0].created_at),
            summary: getSeasonLabel(pcData[0].season),
            seasonType: pcData[0].season,
          });
        }

        if (skinData && skinData.length > 0) {
          results.push({
            id: skinData[0].id,
            type: 'skin',
            createdAt: new Date(skinData[0].created_at),
            summary: `피부 점수 ${skinData[0].overall_score}점`,
            skinScore: skinData[0].overall_score,
          });
        }

        if (bodyData && bodyData.length > 0) {
          results.push({
            id: bodyData[0].id,
            type: 'body',
            createdAt: new Date(bodyData[0].created_at),
            summary: getBodyTypeLabel(bodyData[0].body_type),
            bodyType: bodyData[0].body_type,
          });
        }

        setAnalyses(results);
      } catch (error) {
        console.error('Failed to fetch analyses:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isUserLoaded) {
      fetchAnalyses();
    }
  }, [user?.id, isUserLoaded, supabase]);

  // 로딩 상태
  if (!isUserLoaded || isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  // 비로그인 상태
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            로그인이 필요합니다
          </h2>
          <p className="text-muted-foreground">
            분석 결과를 확인하려면 먼저 로그인해주세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Zone 1: Hero Section */}
        <section className="space-y-4 mb-10">
          {/* 사용자 프로필 (축소) */}
          <UserProfile
            name={user.fullName || user.username || '사용자'}
            imageUrl={user.imageUrl}
          />

          {/* 오늘의 포커스 (스트릭 + 체크인 + 주간 요약) */}
          <TodayFocusWidget userId={user.id} />
        </section>

        {/* Zone 2: Activity Hub */}
        <section className="mb-10">
          <WeeklyProgressSection />
        </section>

        {/* Zone 3: Analysis Archive (Collapsible) */}
        <section>
          <AnalysisSection
            analyses={analyses}
            hasPersonalColor={hasPersonalColor}
          />
        </section>
      </div>
    </main>
  );
}

// 헬퍼 함수들
function getSeasonLabel(season: string): string {
  // DB 스키마: 'Spring', 'Summer', 'Autumn', 'Winter' (대문자 시작)
  const labels: Record<string, string> = {
    Spring: '봄 웜톤 🌸',
    Summer: '여름 쿨톤 🌊',
    Autumn: '가을 웜톤 🍂',
    Winter: '겨울 쿨톤 ❄️',
    // 소문자도 지원 (하위 호환)
    spring: '봄 웜톤 🌸',
    summer: '여름 쿨톤 🌊',
    autumn: '가을 웜톤 🍂',
    winter: '겨울 쿨톤 ❄️',
  };
  return labels[season] || season;
}

function getBodyTypeLabel(bodyType: string): string {
  const labels: Record<string, string> = {
    hourglass: '모래시계형',
    pear: '서양배형',
    apple: '사과형',
    rectangle: '직사각형',
    inverted_triangle: '역삼각형',
  };
  return labels[bodyType] || bodyType;
}
