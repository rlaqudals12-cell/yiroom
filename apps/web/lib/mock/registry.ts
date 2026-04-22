/**
 * Mock Registry — 기존 mock 생성기들을 factory에 일괄 등록
 *
 * 이 파일을 import하면 모든 분석 모듈의 mock 생성기가 factory에 등록된다.
 * 기존 mock 파일은 수정하지 않으며, 단순히 import → registerMock 호출.
 */
import { registerMock } from './factory';

// S-1 피부 분석
import { generateMockAnalysisResult } from './skin-analysis';
registerMock('skin', generateMockAnalysisResult);

// S-2 피부 분석 v2
import { generateMockSkinAnalysisV2Result } from '@/lib/analysis/skin-v2';
registerMock('skin-v2', generateMockSkinAnalysisV2Result);

// PC-1 퍼스널컬러
import { generateMockPersonalColorResult } from './personal-color';
registerMock('personal-color', generateMockPersonalColorResult);

// C-1 체형
import { generateMockBodyAnalysis3 } from './body-analysis';
registerMock('body', generateMockBodyAnalysis3);

// H-1 헤어
import { generateMockHairAnalysisResult } from './hair-analysis';
registerMock('hair', generateMockHairAnalysisResult);

// M-1 메이크업
import { generateMockMakeupAnalysisResult } from './makeup-analysis';
registerMock('makeup', generateMockMakeupAnalysisResult);

// OH-1 구강건강 — 제거됨 (ADR-098)

// W-1 운동 추천
import { generateMockExerciseRecommendation } from './workout-analysis';
registerMock('workout', generateMockExerciseRecommendation);

// 자세 분석
import { generateMockPostureAnalysis } from './posture-analysis';
registerMock('posture', generateMockPostureAnalysis);

// 음식 분석
import { generateMockFoodAnalysis } from './food-analysis';
registerMock('food', generateMockFoodAnalysis);

// V2 분석 모듈 (최신 엔진)
// body-v2
import { generateMockBodyAnalysisResult } from '@/lib/analysis/body-v2/mock';
registerMock('body-v2', generateMockBodyAnalysisResult);

// personal-color-v2
import { generateMockResult as generateMockPCv2Result } from '@/lib/analysis/personal-color-v2/mock';
registerMock('personal-color-v2', generateMockPCv2Result);

// hair v2 (lib/analysis/hair/)
import { generateMockHairAnalysisResult as generateMockHairV2Result } from '@/lib/analysis/hair/mock';
registerMock('hair-v2', generateMockHairV2Result);
