/**
 * 피부 존 타입 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  type ZoneId,
  type DetailedZoneId,
  type DetailedZoneMap,
  type DetailedZoneStatus,
  ZONE_TO_DETAILED_MAPPING,
  DETAILED_TO_ZONE_MAPPING,
  ZONE_LABELS,
  DETAILED_ZONE_LABELS,
  getZoneStatusLevel,
  getDetailedStatusLevel,
  aggregateToSixZones,
} from '@/types/skin-zones';

describe('skin-zones 타입 유틸리티', () => {
  describe('ZONE_TO_DETAILED_MAPPING', () => {
    it('6존을 12존으로 매핑한다', () => {
      expect(ZONE_TO_DETAILED_MAPPING.forehead).toHaveLength(3);
      expect(ZONE_TO_DETAILED_MAPPING.eyes).toHaveLength(2);
      expect(ZONE_TO_DETAILED_MAPPING.tZone).toHaveLength(2);
      expect(ZONE_TO_DETAILED_MAPPING.cheeks).toHaveLength(2);
      expect(ZONE_TO_DETAILED_MAPPING.uZone).toHaveLength(2);
      expect(ZONE_TO_DETAILED_MAPPING.chin).toHaveLength(1);
    });

    it('모든 12존이 매핑에 포함되어 있다', () => {
      const allDetailedZones = Object.values(ZONE_TO_DETAILED_MAPPING).flat();
      expect(allDetailedZones).toHaveLength(12);
    });
  });

  describe('DETAILED_TO_ZONE_MAPPING', () => {
    it('12존을 6존으로 역매핑한다', () => {
      expect(DETAILED_TO_ZONE_MAPPING.forehead_center).toBe('forehead');
      expect(DETAILED_TO_ZONE_MAPPING.eye_left).toBe('eyes');
      expect(DETAILED_TO_ZONE_MAPPING.nose_bridge).toBe('tZone');
      expect(DETAILED_TO_ZONE_MAPPING.cheek_left).toBe('cheeks');
      expect(DETAILED_TO_ZONE_MAPPING.chin_left).toBe('uZone');
      expect(DETAILED_TO_ZONE_MAPPING.chin_center).toBe('chin');
    });
  });

  describe('ZONE_LABELS', () => {
    it('6존 모두 한국어 라벨이 있다', () => {
      const zones: ZoneId[] = ['forehead', 'tZone', 'eyes', 'cheeks', 'uZone', 'chin'];
      zones.forEach((zone) => {
        expect(ZONE_LABELS[zone]).toBeDefined();
        expect(typeof ZONE_LABELS[zone]).toBe('string');
      });
    });
  });

  describe('DETAILED_ZONE_LABELS', () => {
    it('12존 모두 한국어 라벨이 있다', () => {
      const detailedZones: DetailedZoneId[] = [
        'forehead_center',
        'forehead_left',
        'forehead_right',
        'eye_left',
        'eye_right',
        'cheek_left',
        'cheek_right',
        'nose_bridge',
        'nose_tip',
        'chin_center',
        'chin_left',
        'chin_right',
      ];
      detailedZones.forEach((zone) => {
        expect(DETAILED_ZONE_LABELS[zone]).toBeDefined();
        expect(typeof DETAILED_ZONE_LABELS[zone]).toBe('string');
      });
    });
  });

  describe('getZoneStatusLevel', () => {
    it('점수를 3단계 상태로 변환한다', () => {
      expect(getZoneStatusLevel(100)).toBe('good');
      expect(getZoneStatusLevel(71)).toBe('good');
      expect(getZoneStatusLevel(70)).toBe('normal');
      expect(getZoneStatusLevel(41)).toBe('normal');
      expect(getZoneStatusLevel(40)).toBe('warning');
      expect(getZoneStatusLevel(0)).toBe('warning');
    });
  });

  describe('getDetailedStatusLevel', () => {
    it('점수를 5단계 상태로 변환한다', () => {
      expect(getDetailedStatusLevel(100)).toBe('excellent');
      expect(getDetailedStatusLevel(85)).toBe('excellent');
      expect(getDetailedStatusLevel(84)).toBe('good');
      expect(getDetailedStatusLevel(70)).toBe('good');
      expect(getDetailedStatusLevel(69)).toBe('normal');
      expect(getDetailedStatusLevel(50)).toBe('normal');
      expect(getDetailedStatusLevel(49)).toBe('warning');
      expect(getDetailedStatusLevel(30)).toBe('warning');
      expect(getDetailedStatusLevel(29)).toBe('critical');
      expect(getDetailedStatusLevel(0)).toBe('critical');
    });
  });

  describe('aggregateToSixZones', () => {
    it('12존 데이터를 6존으로 집계한다', () => {
      const mockDetailedZones: DetailedZoneMap = {
        forehead_center: createMockDetailedZoneStatus(80),
        forehead_left: createMockDetailedZoneStatus(70),
        forehead_right: createMockDetailedZoneStatus(90),
        eye_left: createMockDetailedZoneStatus(60),
        eye_right: createMockDetailedZoneStatus(50),
        cheek_left: createMockDetailedZoneStatus(75),
        cheek_right: createMockDetailedZoneStatus(85),
        nose_bridge: createMockDetailedZoneStatus(65),
        nose_tip: createMockDetailedZoneStatus(55),
        chin_center: createMockDetailedZoneStatus(70),
        chin_left: createMockDetailedZoneStatus(80),
        chin_right: createMockDetailedZoneStatus(80),
      };

      const result = aggregateToSixZones(mockDetailedZones);

      // 이마: (80 + 70 + 90) / 3 = 80
      expect(result.forehead.score).toBe(80);
      expect(result.forehead.status).toBe('good');
      expect(result.forehead.label).toBe('이마');

      // 눈가: (60 + 50) / 2 = 55
      expect(result.eyes.score).toBe(55);
      expect(result.eyes.status).toBe('normal');

      // T존: (65 + 55) / 2 = 60
      expect(result.tZone.score).toBe(60);
      expect(result.tZone.status).toBe('normal');

      // 볼: (75 + 85) / 2 = 80
      expect(result.cheeks.score).toBe(80);
      expect(result.cheeks.status).toBe('good');

      // U존: (80 + 80) / 2 = 80
      expect(result.uZone.score).toBe(80);
      expect(result.uZone.status).toBe('good');

      // 턱: 70
      expect(result.chin.score).toBe(70);
      expect(result.chin.status).toBe('normal');
    });

    it('우려사항을 중복 제거하여 집계한다', () => {
      const mockDetailedZones: DetailedZoneMap = {
        forehead_center: { ...createMockDetailedZoneStatus(70), concerns: ['모공', '유분'] },
        forehead_left: { ...createMockDetailedZoneStatus(70), concerns: ['모공'] },
        forehead_right: { ...createMockDetailedZoneStatus(70), concerns: ['트러블'] },
        eye_left: createMockDetailedZoneStatus(70),
        eye_right: createMockDetailedZoneStatus(70),
        cheek_left: createMockDetailedZoneStatus(70),
        cheek_right: createMockDetailedZoneStatus(70),
        nose_bridge: createMockDetailedZoneStatus(70),
        nose_tip: createMockDetailedZoneStatus(70),
        chin_center: createMockDetailedZoneStatus(70),
        chin_left: createMockDetailedZoneStatus(70),
        chin_right: createMockDetailedZoneStatus(70),
      };

      const result = aggregateToSixZones(mockDetailedZones);

      // 중복 제거: ['모공', '유분', '트러블'] (최대 3개)
      expect(result.forehead.concerns).toHaveLength(3);
      expect(result.forehead.concerns).toContain('모공');
      expect(result.forehead.concerns).toContain('유분');
      expect(result.forehead.concerns).toContain('트러블');
    });
  });
});

// 헬퍼 함수
function createMockDetailedZoneStatus(score: number): DetailedZoneStatus {
  return {
    zoneId: 'forehead_center',
    score,
    status: getDetailedStatusLevel(score),
    concerns: [],
    recommendations: [],
  };
}
