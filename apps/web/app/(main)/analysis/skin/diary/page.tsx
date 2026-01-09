'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Plus, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { SkinDiaryEntry, type DiaryEntry } from '@/components/analysis/skin-diary';

// 다이어리 목록 아이템 타입
interface DiaryListItem {
  id: string;
  entry_date: string;
  skin_condition: number;
  condition_notes: string | null;
  morning_routine_completed: boolean;
  evening_routine_completed: boolean;
  created_at: string;
}

// 주간 통계 타입
interface WeeklyStats {
  week_start: string;
  entries_count: number;
  avg_condition: number;
  avg_sleep_hours: number;
  avg_water_ml: number;
  avg_stress: number;
  morning_routine_count: number;
  evening_routine_count: number;
}

export default function SkinDiaryPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();

  // 상태
  const [activeTab, setActiveTab] = useState<'list' | 'stats' | 'entry'>('list');
  const [entries, setEntries] = useState<DiaryListItem[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [existingEntry, setExistingEntry] = useState<Partial<DiaryEntry> | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 다이어리 목록 로드
  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('skin_diary_entries')
        .select(
          'id, entry_date, skin_condition, condition_notes, morning_routine_completed, evening_routine_completed, created_at'
        )
        .order('entry_date', { ascending: false })
        .limit(30);

      if (err) throw err;
      setEntries(data || []);
    } catch (err) {
      console.error('[Diary] Load entries error:', err);
      setError('다이어리를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // 주간 통계 로드
  const loadStats = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('skin_diary_weekly_stats')
        .select('*')
        .order('week_start', { ascending: false })
        .limit(8);

      if (err) throw err;
      setWeeklyStats(data || []);
    } catch (err) {
      console.error('[Diary] Load stats error:', err);
    }
  }, [supabase]);

  // 초기 로드
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadEntries();
      loadStats();
    }
  }, [isLoaded, isSignedIn, loadEntries, loadStats]);

  // 특정 날짜 엔트리 로드
  const loadEntryForDate = useCallback(
    async (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      const { data } = await supabase
        .from('skin_diary_entries')
        .select('*')
        .eq('entry_date', dateStr)
        .maybeSingle();

      if (data) {
        setExistingEntry({
          skinCondition: data.skin_condition,
          conditionNotes: data.condition_notes || undefined,
          sleepHours: data.sleep_hours,
          sleepQuality: data.sleep_quality,
          waterIntakeMl: data.water_intake_ml,
          stressLevel: data.stress_level,
          weather: data.weather,
          outdoorHours: data.outdoor_hours,
          morningRoutineCompleted: data.morning_routine_completed,
          eveningRoutineCompleted: data.evening_routine_completed,
          specialTreatments: data.special_treatments || [],
        });
      } else {
        setExistingEntry(undefined);
      }
    },
    [supabase]
  );

  // 새 엔트리 작성
  const handleNewEntry = useCallback(() => {
    setSelectedDate(new Date());
    setExistingEntry(undefined);
    setActiveTab('entry');
  }, []);

  // 기존 엔트리 편집
  const handleEditEntry = useCallback(
    async (entry: DiaryListItem) => {
      const date = new Date(entry.entry_date);
      setSelectedDate(date);
      await loadEntryForDate(date);
      setActiveTab('entry');
    },
    [loadEntryForDate]
  );

  // 엔트리 저장
  const handleSaveEntry = useCallback(
    async (entry: DiaryEntry) => {
      try {
        setSaving(true);
        setError(null);

        const dateStr = selectedDate.toISOString().split('T')[0];

        const { error: err } = await supabase.from('skin_diary_entries').upsert(
          {
            entry_date: dateStr,
            skin_condition: entry.skinCondition,
            condition_notes: entry.conditionNotes || null,
            sleep_hours: entry.sleepHours,
            sleep_quality: entry.sleepQuality,
            water_intake_ml: entry.waterIntakeMl,
            stress_level: entry.stressLevel,
            weather: entry.weather || null,
            outdoor_hours: entry.outdoorHours,
            morning_routine_completed: entry.morningRoutineCompleted,
            evening_routine_completed: entry.eveningRoutineCompleted,
            special_treatments: entry.specialTreatments,
          },
          {
            onConflict: 'clerk_user_id,entry_date',
          }
        );

        if (err) throw err;

        // 목록 새로고침
        await loadEntries();
        await loadStats();
        setActiveTab('list');
      } catch (err) {
        console.error('[Diary] Save error:', err);
        setError('저장에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setSaving(false);
      }
    },
    [selectedDate, supabase, loadEntries, loadStats]
  );

  // 엔트리 작성 취소
  const handleCancelEntry = useCallback(() => {
    setActiveTab('list');
    setExistingEntry(undefined);
  }, []);

  // 로딩/인증 체크
  if (!isLoaded) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-muted flex items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-muted flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">로그인이 필요합니다.</p>
          <Button onClick={() => router.push('/sign-in')}>로그인</Button>
        </div>
      </main>
    );
  }

  // 컨디션 이모지
  const conditionEmoji = (condition: number) => {
    const emojis: Record<number, string> = {
      1: '😢',
      2: '😕',
      3: '😐',
      4: '🙂',
      5: '😊',
    };
    return emojis[condition] || '😐';
  };

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  return (
    <main className="min-h-[calc(100vh-80px)] bg-muted" data-testid="skin-diary-page">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* 헤더 */}
        <header className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">피부 다이어리</h1>
            <p className="text-sm text-muted-foreground">매일 피부 상태를 기록해보세요</p>
          </div>
          {activeTab !== 'entry' && (
            <Button size="sm" onClick={handleNewEntry}>
              <Plus className="w-4 h-4 mr-1" />
              기록하기
            </Button>
          )}
        </header>

        {/* 에러 메시지 */}
        {error && (
          <div
            className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* 탭 컨텐츠 */}
        {activeTab === 'entry' ? (
          <SkinDiaryEntry
            date={selectedDate}
            existingEntry={existingEntry}
            onSave={handleSaveEntry}
            onCancel={handleCancelEntry}
            isSaving={saving}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'stats')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="list" className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                기록
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                통계
              </TabsTrigger>
            </TabsList>

            {/* 기록 목록 */}
            <TabsContent value="list" className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">불러오는 중...</div>
              ) : entries.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground mb-4">
                      아직 기록이 없어요.
                      <br />
                      오늘의 피부 상태를 기록해보세요!
                    </p>
                    <Button onClick={handleNewEntry}>
                      <Plus className="w-4 h-4 mr-1" />첫 기록 작성하기
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                entries.map((entry) => (
                  <Card
                    key={entry.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleEditEntry(entry)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{conditionEmoji(entry.skin_condition)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{formatDate(entry.entry_date)}</div>
                          {entry.condition_notes && (
                            <p className="text-sm text-muted-foreground truncate">
                              {entry.condition_notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {entry.morning_routine_completed && (
                            <Badge variant="outline" className="text-xs">
                              아침
                            </Badge>
                          )}
                          {entry.evening_routine_completed && (
                            <Badge variant="outline" className="text-xs">
                              저녁
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* 통계 */}
            <TabsContent value="stats" className="space-y-4">
              {weeklyStats.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">기록이 쌓이면 통계를 볼 수 있어요.</p>
                  </CardContent>
                </Card>
              ) : (
                weeklyStats.map((stat) => (
                  <Card key={stat.week_start}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {new Date(stat.week_start).toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                        })}{' '}
                        주
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">평균 컨디션</span>
                          <div className="font-medium">{stat.avg_condition?.toFixed(1) || '-'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">평균 수면</span>
                          <div className="font-medium">
                            {stat.avg_sleep_hours?.toFixed(1) || '-'}시간
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">평균 수분</span>
                          <div className="font-medium">{stat.avg_water_ml || '-'}ml</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">기록 횟수</span>
                          <div className="font-medium">{stat.entries_count}일</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}
