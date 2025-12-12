'use client';

import { Sparkles } from 'lucide-react';
import { WorkoutType } from '@/types/workout';

interface BodyTypeInsightProps {
  bodyType: string | null;
  workoutType: WorkoutType;
  concerns: string[];
}

// 체형별 운동 인사이트
const BODY_TYPE_INSIGHTS: Record<string, Record<WorkoutType, string>> = {
  X: {
    toner: '균형 잡힌 X자 체형을 유지하면서 더 탄탄하게 가꿔보세요.',
    builder: '상하체 균형이 좋은 X자 체형에 근육을 더하면 더욱 멋진 실루엣이 됩니다.',
    burner: '체지방을 줄이면서 X자 체형의 장점을 더 살려보세요.',
    mover: '균형 잡힌 체형으로 어떤 운동이든 잘 소화할 수 있어요.',
    flexer: '유연성을 키워 X자 체형의 아름다운 라인을 더 돋보이게 해보세요.',
  },
  H: {
    toner: 'H자 체형은 허리 라인을 만들면 더욱 예뻐져요.',
    builder: '어깨와 엉덩이 근육을 키워 입체적인 실루엣을 만들어보세요.',
    burner: '전체적으로 체지방을 줄이면서 라인을 만들어가요.',
    mover: '활동적인 운동으로 대사량을 높여보세요.',
    flexer: '코어 운동으로 허리 라인을 잡아보세요.',
  },
  A: {
    toner: '상체 운동에 집중하면 균형 잡힌 실루엣을 만들 수 있어요.',
    builder: '어깨와 등 근육을 키워 상하체 밸런스를 맞춰보세요.',
    burner: '하체 중심 유산소로 체지방을 효과적으로 태워요.',
    mover: '전신 운동으로 균형 있게 체력을 키워보세요.',
    flexer: '하체 스트레칭과 함께 상체 운동을 병행해보세요.',
  },
  V: {
    toner: '하체 운동으로 균형 잡힌 실루엣을 만들어보세요.',
    builder: '하체 근력을 강화해 상하체 밸런스를 맞춰요.',
    burner: '상체의 넓은 어깨를 살리면서 체지방을 관리해요.',
    mover: '다양한 유산소로 전신을 균형 있게 발달시켜요.',
    flexer: '하체 유연성을 키워 균형 잡힌 몸매를 만들어요.',
  },
  O: {
    toner: '전체적으로 탄탄하게 만들면서 라인을 잡아가요.',
    builder: '근육량을 늘려 기초대사량을 높여보세요.',
    burner: '유산소와 근력 운동을 병행해 체지방을 줄여요.',
    mover: '꾸준한 활동으로 체력과 건강을 함께 챙겨요.',
    flexer: '유연성 운동으로 부상 없이 안전하게 운동해요.',
  },
  I: {
    toner: '전체적으로 근육을 키워 볼륨감 있는 몸매를 만들어요.',
    builder: '근육량 증가에 가장 적합한 체형이에요!',
    burner: '근육을 유지하면서 체지방만 관리해요.',
    mover: '체력을 키우면서 건강한 체중을 유지해요.',
    flexer: '유연성과 함께 코어 강화에 집중해보세요.',
  },
  Y: {
    toner: '넓은 어깨를 살리면서 하체 라인을 탄탄하게 만들어요.',
    builder: '하체 근육을 키워 상하체 밸런스를 맞춰보세요.',
    burner: '상체의 장점을 살리면서 전체적인 체지방을 관리해요.',
    mover: '전신 운동으로 균형 있는 체력을 키워보세요.',
    flexer: '하체 스트레칭으로 유연성과 균형을 잡아가요.',
  },
  '8': {
    toner: '글래머러스한 8자 체형의 곡선을 더 탄탄하게 가꿔보세요.',
    builder: '허리 라인을 강조하면서 근육을 더해 건강한 실루엣을 만들어요.',
    burner: '8자 체형의 아름다운 곡선을 유지하면서 체지방을 관리해요.',
    mover: '활동적인 운동으로 대사량을 높이고 곡선을 살려요.',
    flexer: '코어와 엉덩이 유연성을 키워 더 아름다운 라인을 만들어요.',
  },
};

// 신체 고민별 추가 팁
const CONCERN_TIPS: Record<string, string> = {
  belly: '복부 운동을 꾸준히 하면 탄탄한 코어를 만들 수 있어요.',
  thigh: '하체 운동과 스트레칭을 병행하면 더 효과적이에요.',
  arm: '팔 운동은 가벼운 무게로 높은 횟수가 효과적이에요.',
  back: '등 운동은 자세 교정에도 도움이 돼요.',
  hip: '힙 운동으로 탄력 있는 라인을 만들어보세요.',
  shoulder: '어깨 운동으로 옷 핏이 달라져요.',
};

export default function BodyTypeInsight({
  bodyType,
  workoutType,
  concerns,
}: BodyTypeInsightProps) {
  // 체형 데이터가 없으면 기본 인사이트
  const insight = bodyType
    ? BODY_TYPE_INSIGHTS[bodyType]?.[workoutType] ||
      '당신의 체형에 맞는 운동을 시작해보세요!'
    : '체형 분석 결과를 기반으로 맞춤 운동을 추천해드려요.';

  // 첫 번째 고민에 대한 팁
  const concernTip = concerns.length > 0 ? CONCERN_TIPS[concerns[0]] : null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
      <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-3">
        <Sparkles className="w-5 h-5 text-indigo-500" />
        체형 맞춤 인사이트
      </h3>

      <p className="text-gray-700 leading-relaxed mb-4">{insight}</p>

      {concernTip && (
        <div className="bg-white/60 rounded-xl p-4">
          <p className="text-sm text-indigo-700">
            <span className="font-medium">💡 Tip:</span> {concernTip}
          </p>
        </div>
      )}
    </div>
  );
}
