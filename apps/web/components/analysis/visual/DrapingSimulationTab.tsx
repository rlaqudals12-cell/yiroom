'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DrapeResult, MetalType } from '@/types/visual-analysis';
import { analyzeDeviceCapability } from '@/lib/analysis/device-capability';
import { extractFaceLandmarks, createFaceMask } from '@/lib/analysis/face-landmark';
import { preloadFaceMesh } from '@/lib/analysis/mediapipe-loader';
import {
  generateSynergyInsight,
  generateSynergyFromGeminiResult,
  applyInsightToDraping,
} from '@/lib/analysis/synergy-insight';
import {
  generateMockPigmentAnalysis,
  generateMockDrapingResults,
} from '@/lib/mock/visual-analysis';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import DrapeColorPalette from './DrapeColorPalette';
import DrapeSimulator from './DrapeSimulator';
import SynergyInsightCard from './SynergyInsightCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface DrapingSimulationTabProps {
  /** 분석 이미지 URL */
  imageUrl: string;
  /** 피부 분석 ID (시너지 연동용) */
  skinAnalysisId?: string;
  /** 추가 클래스 */
  className?: string;
}

type AnalysisState = 'idle' | 'loading' | 'analyzing' | 'ready' | 'error';

/**
 * PC-1+ 드레이핑 시뮬레이션 탭 컴포넌트
 * - 퍼스널 컬러 결과 페이지에 탭으로 통합
 * - 드레이프 색상 팔레트
 * - 실시간 미리보기
 * - 시너지 인사이트
 */
export default function DrapingSimulationTab({
  imageUrl,
  skinAnalysisId,
  className,
}: DrapingSimulationTabProps) {
  const supabase = useClerkSupabaseClient();
  const [state, setState] = useState<AnalysisState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'palette' | 'simulator'>('palette');

  // 분석 결과
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [faceMask, setFaceMask] = useState<Uint8Array | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [metalType, setMetalType] = useState<MetalType>('gold');
  const [drapeResults, setDrapeResults] = useState<DrapeResult[]>([]);

  // 시너지 인사이트
  const [synergyInsight, setSynergyInsight] = useState<ReturnType<
    typeof generateSynergyInsight
  > | null>(null);

  // 기기 성능
  const deviceCapability = analyzeDeviceCapability();

  /**
   * 이미지 로드
   */
  const loadImage = useCallback((): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = imageUrl;
    });
  }, [imageUrl]);

  /**
   * 초기화 (이미지 로드 + 랜드마크 추출)
   */
  const initialize = useCallback(async () => {
    if (!imageUrl) return;

    setState('loading');
    setError(null);

    try {
      // 1. 이미지 로드
      const loadedImage = await loadImage();
      setImage(loadedImage);

      setState('analyzing');

      // 2. 랜드마크 추출
      const landmarkResult = await extractFaceLandmarks(loadedImage, {
        useMock: deviceCapability.tier === 'low',
      });

      if (!landmarkResult) {
        throw new Error('얼굴을 감지할 수 없습니다');
      }

      // 3. 얼굴 마스크 생성
      const mask = createFaceMask(
        landmarkResult.landmarks,
        loadedImage.naturalWidth || loadedImage.width,
        loadedImage.naturalHeight || loadedImage.height
      );
      setFaceMask(mask);

      // 4. 시너지 인사이트 생성
      let insight;

      if (skinAnalysisId) {
        // 실제 피부 분석 결과 조회
        const { data: skinAnalysis } = await supabase
          .from('skin_analyses')
          .select('hydration, oil_level, sensitivity, metrics')
          .eq('id', skinAnalysisId)
          .single();

        if (skinAnalysis) {
          // DB 데이터를 generateSynergyFromGeminiResult 형식으로 변환
          const skinMetrics: Array<{ id: string; value: number }> = [
            { id: 'hydration', value: skinAnalysis.hydration ?? 50 },
            { id: 'oiliness', value: skinAnalysis.oil_level ?? 50 },
            // sensitivity를 redness 대리값으로 사용 (피부 민감도 높으면 붉은기 경향)
            { id: 'redness', value: skinAnalysis.sensitivity ?? 50 },
          ];
          insight = generateSynergyFromGeminiResult(skinMetrics);
        }
      }

      // Fallback: 실제 데이터가 없으면 Mock 사용
      if (!insight) {
        const mockPigment = generateMockPigmentAnalysis();
        insight = generateSynergyInsight(mockPigment);
      }

      setSynergyInsight(insight);

      setState('ready');
    } catch (err) {
      console.error('[DrapingSimulationTab] 초기화 오류:', err);
      setError(err instanceof Error ? err.message : '초기화에 실패했습니다');
      setState('error');
    }
  }, [imageUrl, loadImage, deviceCapability.tier, skinAnalysisId, supabase]);

  /**
   * 드레이프 분석 완료 핸들러
   */
  const handleAnalysisComplete = useCallback(
    (results: DrapeResult[]) => {
      setDrapeResults(results);

      // 시너지 적용
      if (synergyInsight && results.length > 0) {
        const mockDraping = generateMockDrapingResults();
        const { adjustedBestColors } = applyInsightToDraping(mockDraping, synergyInsight);
        console.log('[DrapingSimulationTab] 시너지 적용 베스트:', adjustedBestColors);
      }
    },
    [synergyInsight]
  );

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    if (imageUrl && state === 'idle') {
      preloadFaceMesh();
      initialize();
    }
  }, [imageUrl, state, initialize]);

  // 로딩 상태
  if (state === 'loading' || state === 'analyzing') {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader>
          <CardTitle className="text-base">드레이핑 시뮬레이션</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="w-full aspect-[3/4] rounded-lg" />
          <Skeleton className="h-10 w-full" />
          <p className="text-sm text-center text-muted-foreground">
            {state === 'loading' ? '이미지 로드 중...' : '드레이핑 준비 중...'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // 에러 상태
  if (state === 'error') {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader>
          <CardTitle className="text-base">드레이핑 시뮬레이션</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error || '초기화에 실패했습니다'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 준비 완료
  if (state === 'ready' && image && faceMask) {
    return (
      <Card className={cn('overflow-hidden', className)} data-testid="draping-simulation-tab">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span>드레이핑 시뮬레이션</span>
            <span className="text-xs font-normal text-muted-foreground">
              ({deviceCapability.drapeColors}색 팔레트)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 시너지 인사이트 */}
          {synergyInsight && drapeResults.length > 0 && (
            <SynergyInsightCard
              insight={synergyInsight}
              bestColors={drapeResults.slice(0, 5)}
              className="mb-4"
            />
          )}

          {/* 탭 전환 */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'palette' | 'simulator')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="palette">색상 팔레트</TabsTrigger>
              <TabsTrigger value="simulator">시뮬레이터</TabsTrigger>
            </TabsList>

            <TabsContent value="palette" className="mt-4">
              <DrapeColorPalette
                deviceCapability={deviceCapability}
                selectedColor={selectedColor}
                onColorSelect={setSelectedColor}
                metalType={metalType}
                onMetalTypeChange={setMetalType}
              />
            </TabsContent>

            <TabsContent value="simulator" className="mt-4">
              <DrapeSimulator
                image={image}
                faceMask={faceMask}
                deviceCapability={deviceCapability}
                metalType={metalType}
                onAnalysisComplete={handleAnalysisComplete}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  return null;
}
