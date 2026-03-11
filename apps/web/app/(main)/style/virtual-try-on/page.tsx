'use client';

/**
 * 가상 메이크업 시뮬레이션 페이지
 * - 이미지 업로드 → 립스틱/블러셔 적용 → Before/After 비교
 */

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { BeforeAfterViewer } from '@/components/common/BeforeAfterViewer';
import {
  applyLipColor,
  applyBlush,
  applyHairColor,
  applyEyeshadow,
  applyFoundation,
  LIP_PRESETS,
  BLUSH_PRESETS,
  HAIR_PRESETS,
  EYESHADOW_PRESETS,
  FOUNDATION_PRESETS,
} from '@/lib/virtual-try-on';
import type { MakeupType, RgbaColor, MakeupResult } from '@/lib/virtual-try-on';

type Tab = 'lip' | 'blush' | 'hair-color' | 'eyeshadow' | 'foundation';

export default function VirtualTryOnPage(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('lip');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [result, setResult] = useState<MakeupResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<RgbaColor>(LIP_PRESETS[0].color);
  const [opacity, setOpacity] = useState(0.55);
  // 헤어 컬러용 HSL 타겟
  const [selectedHairHsl, setSelectedHairHsl] = useState(HAIR_PRESETS[0].targetHsl);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const getTabLabel = (): string => {
    if (tab === 'lip') return '립스틱 적용';
    if (tab === 'blush') return '블러셔 적용';
    if (tab === 'eyeshadow') return '아이섀도 적용';
    if (tab === 'foundation') return '파운데이션 적용';
    return '헤어 컬러 적용';
  };

  const getPresets = (): Array<{ name: string; color: RgbaColor }> => {
    if (tab === 'lip') return LIP_PRESETS;
    if (tab === 'blush') return BLUSH_PRESETS;
    if (tab === 'eyeshadow') return EYESHADOW_PRESETS;
    if (tab === 'foundation') return FOUNDATION_PRESETS;
    return []; // hair-color는 별도 프리셋 사용
  };

  // 탭 전환 시 색상 리셋
  const handleTabChange = (newTab: Tab): void => {
    setTab(newTab);
    if (newTab === 'hair-color') {
      setSelectedColor(HAIR_PRESETS[0].displayColor);
      setSelectedHairHsl(HAIR_PRESETS[0].targetHsl);
      setOpacity(0.6);
    } else if (newTab === 'eyeshadow') {
      setSelectedColor(EYESHADOW_PRESETS[0].color);
      setOpacity(0.4);
    } else if (newTab === 'foundation') {
      setSelectedColor(FOUNDATION_PRESETS[0].color);
      setOpacity(0.25);
    } else {
      setSelectedColor(newTab === 'lip' ? LIP_PRESETS[0].color : BLUSH_PRESETS[0].color);
      setOpacity(newTab === 'lip' ? 0.55 : 0.3);
    }
    setResult(null);
    setError(null);
  };

  // 이미지 업로드
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있어요.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setOriginalImage(ev.target?.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  // 시뮬레이션 실행
  const handleApply = useCallback(async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      // 이미지 로드
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('이미지 로드 실패'));
        img.src = originalImage;
      });
      imageRef.current = img;

      let makeupResult: MakeupResult;

      if (tab === 'hair-color') {
        const hairResult = await applyHairColor(img, {
          targetHsl: selectedHairHsl,
          intensity: opacity,
        });
        // MakeupResult 형식으로 변환 (BeforeAfterViewer 호환)
        makeupResult = {
          dataUrl: hairResult.dataUrl,
          config: { type: 'hair-color', color: selectedColor, opacity },
          processingTimeMs: hairResult.processingTimeMs,
        };
      } else if (tab === 'eyeshadow') {
        const eyeshadowResult = await applyEyeshadow(img, {
          color: selectedColor,
          opacity,
        });
        makeupResult = {
          dataUrl: eyeshadowResult.dataUrl,
          config: { type: 'eyeshadow', color: selectedColor, opacity },
          processingTimeMs: eyeshadowResult.processingTimeMs,
        };
      } else if (tab === 'foundation') {
        const foundationResult = await applyFoundation(img, {
          color: selectedColor,
          opacity,
        });
        makeupResult = {
          dataUrl: foundationResult.dataUrl,
          config: { type: 'foundation', color: selectedColor, opacity },
          processingTimeMs: foundationResult.processingTimeMs,
        };
      } else {
        const config = {
          type: tab as MakeupType,
          color: selectedColor,
          opacity,
        };
        makeupResult =
          tab === 'lip' ? await applyLipColor(img, config) : await applyBlush(img, config);
      }

      setResult(makeupResult);
    } catch (err) {
      const message = err instanceof Error ? err.message : '시뮬레이션 중 오류가 발생했어요.';
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage, tab, selectedColor, selectedHairHsl, opacity]);

  // 리셋
  const handleReset = (): void => {
    setOriginalImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div data-testid="virtual-try-on-page" className="min-h-screen pb-24">
      {/* 헤더 */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold">가상 스타일링</h1>
        <p className="text-sm text-muted-foreground mt-1">
          사진에 메이크업과 헤어 컬러를 가상으로 적용해 보세요
        </p>
      </div>

      {/* 탭 */}
      <div className="px-4 mb-4">
        <div className="flex gap-2">
          {(['lip', 'blush', 'eyeshadow', 'foundation', 'hair-color'] as Tab[]).map((t) => (
            <Button
              key={t}
              variant={tab === t ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTabChange(t)}
            >
              {t === 'lip' && '립스틱'}
              {t === 'blush' && '블러셔'}
              {t === 'eyeshadow' && '아이섀도'}
              {t === 'foundation' && '파운데이션'}
              {t === 'hair-color' && '헤어 컬러'}
            </Button>
          ))}
        </div>
      </div>

      {/* 이미지 업로드 / 결과 */}
      <div className="px-4 space-y-4">
        {!originalImage && (
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  정면 셀카를 업로드해주세요
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  사진 선택
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </CardContent>
          </Card>
        )}
        {originalImage && result && (
          <BeforeAfterViewer
            beforeImage={originalImage}
            afterImage={result.dataUrl}
            beforeLabel="원본"
            afterLabel={getTabLabel()}
          />
        )}
        {originalImage && !result && (
          <Card>
            <CardContent className="p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={originalImage} alt="업로드된 사진" className="w-full rounded-lg" />
            </CardContent>
          </Card>
        )}

        {/* 에러 */}
        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        {/* 색상 팔레트 */}
        {originalImage && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {tab === 'lip' && '립 컬러'}
                {tab === 'blush' && '블러셔 컬러'}
                {tab === 'eyeshadow' && '아이섀도 컬러'}
                {tab === 'foundation' && '파운데이션 셰이드'}
                {tab === 'hair-color' && '헤어 컬러'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 색상 프리셋 */}
              <div className="flex flex-wrap gap-2">
                {tab === 'hair-color'
                  ? HAIR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setSelectedColor(preset.displayColor);
                          setSelectedHairHsl(preset.targetHsl);
                        }}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-transform',
                          selectedColor === preset.displayColor
                            ? 'border-foreground scale-110'
                            : 'border-transparent'
                        )}
                        style={{
                          backgroundColor: `rgb(${preset.displayColor.r}, ${preset.displayColor.g}, ${preset.displayColor.b})`,
                        }}
                        title={preset.name}
                        aria-label={preset.name}
                      />
                    ))
                  : getPresets().map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setSelectedColor(preset.color)}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-transform',
                          selectedColor === preset.color
                            ? 'border-foreground scale-110'
                            : 'border-transparent'
                        )}
                        style={{
                          backgroundColor: `rgb(${preset.color.r}, ${preset.color.g}, ${preset.color.b})`,
                        }}
                        title={preset.name}
                        aria-label={preset.name}
                      />
                    ))}
              </div>

              {/* 강도 슬라이더 */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">강도</span>
                  <span className="font-medium">{Math.round(opacity * 100)}%</span>
                </div>
                <Slider
                  value={[opacity]}
                  onValueChange={([v]) => setOpacity(v)}
                  min={0.1}
                  max={0.8}
                  step={0.05}
                />
              </div>

              {/* 적용 버튼 */}
              <div className="flex gap-2">
                <Button onClick={handleApply} disabled={isProcessing} className="flex-1">
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    '적용하기'
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {/* 처리 시간 */}
              {result && (
                <p className="text-xs text-muted-foreground text-center">
                  처리 시간: {result.processingTimeMs}ms
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
