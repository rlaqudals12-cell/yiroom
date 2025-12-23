-- Migration: 게이미피케이션 - 추가 배지
-- Purpose: 분석 완료 통합 배지 + special 카테고리 배지
-- Date: 2025-12-24
-- Feature: Phase H-1 게이미피케이션 (추가)

-- ============================================================
-- 추가 배지 시드 데이터
-- ============================================================

-- 분석 전체 완료 배지
INSERT INTO badges (code, name, description, icon, category, rarity, requirement, xp_reward, sort_order) VALUES
('analysis_all_complete', '분석 마스터', '퍼스널 컬러, 피부, 체형 분석을 모두 완료했어요!', '🎯', 'analysis', 'rare', '{"type": "complete", "domain": "analysis", "modules": ["personal-color", "skin", "body"]}', 50, 43)
ON CONFLICT (code) DO NOTHING;

-- 특별 배지 (special 카테고리)
INSERT INTO badges (code, name, description, icon, category, rarity, requirement, xp_reward, sort_order) VALUES
('early_adopter', '얼리 어답터', '이룸의 초기 사용자! 함께해주셔서 감사해요.', '🌟', 'special', 'epic', '{"type": "special", "condition": "early_adopter"}', 100, 50),
('wellness_week', '웰니스 위크', '일주일 동안 운동과 식단 모두 기록했어요!', '🌈', 'special', 'rare', '{"type": "combined", "domain": "all", "days": 7}', 75, 51)
ON CONFLICT (code) DO NOTHING;
