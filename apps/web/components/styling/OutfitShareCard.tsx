'use client';

/**
 * Phase J P3-D: 코디 공유용 카드
 * 이미지로 변환되어 공유되는 레이아웃
 */

import { forwardRef } from 'react';
import type { FullOutfit } from '@/types/styling';
import type { SeasonType } from '@/lib/mock/personal-color';
import { OUTFIT_OCCASION_LABELS, METAL_TONE_LABELS } from '@/types/styling';

interface OutfitShareCardProps {
  outfit: FullOutfit;
  seasonType: SeasonType;
}

// 시즌 라벨
const SEASON_LABELS: Record<SeasonType, string> = {
  spring: '봄 웜톤',
  summer: '여름 쿨톤',
  autumn: '가을 웜톤',
  winter: '겨울 쿨톤',
};

// 시즌 그라데이션 색상
const SEASON_GRADIENTS: Record<SeasonType, string> = {
  spring: 'linear-gradient(135deg, #FFE4B5 0%, #FFD700 100%)',
  summer: 'linear-gradient(135deg, #E0FFFF 0%, #87CEEB 100%)',
  autumn: 'linear-gradient(135deg, #DEB887 0%, #D2691E 100%)',
  winter: 'linear-gradient(135deg, #E6E6FA 0%, #4169E1 100%)',
};

/**
 * 공유용 코디 카드 (이미지 변환용)
 */
const OutfitShareCard = forwardRef<HTMLDivElement, OutfitShareCardProps>(
  ({ outfit, seasonType }, ref) => {
    const { clothing, accessory, makeup, occasion, tip } = outfit;

    return (
      <div
        ref={ref}
        style={{
          width: 400,
          padding: 24,
          background: '#ffffff',
          borderRadius: 16,
          fontFamily: 'Pretendard, -apple-system, sans-serif',
        }}
        data-testid="outfit-share-card"
      >
        {/* 헤더 */}
        <div
          style={{
            background: SEASON_GRADIENTS[seasonType],
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>
                {SEASON_LABELS[seasonType]}
              </div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                {OUTFIT_OCCASION_LABELS[occasion]} 코디
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#888',
                background: 'rgba(255,255,255,0.7)',
                padding: '4px 8px',
                borderRadius: 6,
              }}
            >
              이룸 스타일링
            </div>
          </div>
        </div>

        {/* 의상 섹션 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12 }}>
            의상 조합
          </div>
          <div
            style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 24 }}
          >
            {/* 상의 */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 60,
                  height: 50,
                  backgroundColor: clothing.colors.top.hex,
                  borderRadius: '12px 12px 4px 4px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  margin: '0 auto',
                }}
              />
              <div style={{ fontSize: 10, color: '#888', marginTop: 6 }}>상의</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#333' }}>
                {clothing.colors.top.name}
              </div>
            </div>
            {/* 하의 */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 48,
                  height: 70,
                  backgroundColor: clothing.colors.bottom.hex,
                  borderRadius: '4px 4px 12px 12px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  margin: '0 auto',
                }}
              />
              <div style={{ fontSize: 10, color: '#888', marginTop: 6 }}>하의</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#333' }}>
                {clothing.colors.bottom.name}
              </div>
            </div>
          </div>
        </div>

        {/* 악세서리 & 메이크업 */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          {/* 악세서리 */}
          <div style={{ flex: 1, background: '#f8f8f8', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 8 }}>
              악세서리
            </div>
            <div style={{ fontSize: 11, color: '#666' }}>
              {METAL_TONE_LABELS[accessory.metalTone]}
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              {accessory.items.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: item.gemstone?.hex || '#C0C0C0',
                    border: '1px solid rgba(0,0,0,0.1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* 메이크업 */}
          <div style={{ flex: 1, background: '#f8f8f8', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 8 }}>
              메이크업
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    backgroundColor: makeup.lipstick.hex,
                    border: '1px solid rgba(0,0,0,0.1)',
                  }}
                />
                <div style={{ fontSize: 9, color: '#888', marginTop: 4 }}>립</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: makeup.blusher.hex,
                    border: '1px solid rgba(0,0,0,0.1)',
                  }}
                />
                <div style={{ fontSize: 9, color: '#888', marginTop: 4 }}>블러셔</div>
              </div>
            </div>
          </div>
        </div>

        {/* 팁 */}
        <div
          style={{
            background: 'linear-gradient(90deg, #f0f0ff 0%, #fff0f5 100%)',
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{tip}</div>
        </div>

        {/* 푸터 */}
        <div style={{ textAlign: 'center', fontSize: 10, color: '#aaa' }}>
          이룸 - 나를 위한 AI 스타일링
        </div>
      </div>
    );
  }
);

OutfitShareCard.displayName = 'OutfitShareCard';

export default OutfitShareCard;
