/**
 * N-1 AI 음식 인식 카메라 화면
 * 카메라로 음식 촬영 → AI 분석 → 결과 표시 → 저장
 */
import { useUser } from '@clerk/clerk-expo';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

import {
  analyzeFood as analyzeFoodWithGemini,
  getConfidenceFeedback,
  type FoodAnalysisResult,
  type TrafficLight,
} from '../../../lib/gemini';
import { useClerkSupabaseClient } from '../../../lib/supabase';
import { cameraLogger, nutritionLogger } from '../../../lib/utils/logger';

// 식사 타입
const MEAL_TYPES = [
  { id: 'breakfast', label: '아침', icon: '🍳' },
  { id: 'lunch', label: '점심', icon: '🍱' },
  { id: 'dinner', label: '저녁', icon: '🍝' },
  { id: 'snack', label: '간식', icon: '🍪' },
];

// RecognizedFood 타입 - lib/gemini.ts의 FoodAnalysisResult['foods'][number]와 동일
interface RecognizedFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  trafficLight: TrafficLight;
  portion: number;
  confidence: number;
}

type ScreenState = 'camera' | 'analyzing' | 'result';

export default function FoodCameraScreen() {
  const { colors, status, module: moduleColors } = useTheme();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [screenState, setScreenState] = useState<ScreenState>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState('lunch');
  const [recognizedFoods, setRecognizedFoods] = useState<RecognizedFood[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 총 영양 정보 계산
  const totalNutrition = recognizedFoods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories * food.portion,
      protein: acc.protein + food.protein * food.portion,
      carbs: acc.carbs + food.carbs * food.portion,
      fat: acc.fat + food.fat * food.portion,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // 사진 촬영
  const handleCapture = async () => {
    if (!cameraRef.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo?.uri) {
        setCapturedImage(photo.uri);
        setScreenState('analyzing');
        await analyzeFood(photo.base64 || '');
      }
    } catch (error) {
      cameraLogger.error('Camera capture error:', error);
      Alert.alert('오류', '사진 촬영에 실패했습니다.');
    }
  };

  // 갤러리에서 선택
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedImage(result.assets[0].uri);
      setScreenState('analyzing');
      await analyzeFood(result.assets[0].base64 || '');
    }
  };

  // AI 인사이트 메시지 상태
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // AI 음식 분석 (Gemini API 연동 + Mock Fallback)
  const analyzeFood = async (imageBase64: string) => {
    try {
      // Gemini API 호출 (lib/gemini.ts에서 Mock Fallback 포함)
      const result: FoodAnalysisResult = await analyzeFoodWithGemini(imageBase64);

      // 결과를 RecognizedFood 형식으로 변환
      const recognizedFoods: RecognizedFood[] = result.foods.map((food) => ({
        id: food.id,
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        trafficLight: food.trafficLight,
        portion: food.portion,
        confidence: food.confidence,
      }));

      setRecognizedFoods(recognizedFoods);
      setAiInsight(result.insight || null);
      setScreenState('result');
    } catch (error) {
      nutritionLogger.error('Food analysis failed:', error);
      Alert.alert('분석 실패', '음식 분석에 실패했습니다. 다시 시도해주세요.');
      setScreenState('camera');
    }
  };

  // 수량 변경
  const handlePortionChange = (foodId: string, delta: number) => {
    Haptics.selectionAsync();
    setRecognizedFoods((prev) =>
      prev.map((food) =>
        food.id === foodId
          ? {
              ...food,
              portion: Math.max(0.5, Math.min(5, food.portion + delta)),
            }
          : food
      )
    );
  };

  // 음식 삭제
  const handleRemoveFood = (foodId: string) => {
    Haptics.selectionAsync();
    setRecognizedFoods((prev) => prev.filter((food) => food.id !== foodId));
  };

  // 저장
  const handleSave = async () => {
    if (!user?.id || recognizedFoods.length === 0) return;

    setIsSaving(true);

    try {
      const foods = recognizedFoods.map((food) => ({
        food_name: food.name,
        portion: food.portion,
        calories: food.calories * food.portion,
        protein: food.protein * food.portion,
        carbs: food.carbs * food.portion,
        fat: food.fat * food.portion,
        traffic_light: food.trafficLight,
        ai_confidence: food.confidence,
      }));

      const { error } = await supabase.from('meal_records').insert({
        clerk_user_id: user.id,
        meal_type: selectedMealType,
        meal_date: new Date().toISOString().split('T')[0],
        meal_time: new Date().toTimeString().split(' ')[0],
        record_type: 'photo',
        foods,
        total_calories: Math.round(totalNutrition.calories),
        total_protein: Math.round(totalNutrition.protein * 10) / 10,
        total_carbs: Math.round(totalNutrition.carbs * 10) / 10,
        total_fat: Math.round(totalNutrition.fat * 10) / 10,
        ai_recognized_food: recognizedFoods.map((f) => f.name).join(', '),
        ai_confidence:
          recognizedFoods.length > 0
            ? recognizedFoods[0].confidence > 0.8
              ? 'high'
              : recognizedFoods[0].confidence > 0.6
                ? 'medium'
                : 'low'
            : 'low',
        user_confirmed: true,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('완료', '식사가 기록되었습니다!', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (error) {
      nutritionLogger.error('Failed to save meal record:', error);
      Alert.alert('오류', '식사 기록 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 다시 촬영
  const handleRetake = () => {
    setCapturedImage(null);
    setRecognizedFoods([]);
    setAiInsight(null);
    setScreenState('camera');
  };

  // 스톱라이트 색상
  const getTrafficLightColor = (light: TrafficLight) => {
    switch (light) {
      case 'green':
        return '#22c55e';
      case 'yellow':
        return '#eab308';
      case 'red':
        return '#ef4444';
    }
  };

  const getTrafficLightEmoji = (light: TrafficLight) => {
    switch (light) {
      case 'green':
        return '🟢';
      case 'yellow':
        return '🟡';
      case 'red':
        return '🔴';
    }
  };

  // 권한 없음
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={status.success} />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={[styles.permissionText, { color: colors.foreground }]}>
            카메라 권한이 필요합니다
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: status.success }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>권한 허용</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 분석 중
  if (screenState === 'analyzing') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          {capturedImage && <Image source={{ uri: capturedImage }} style={styles.analyzingImage} />}
          <ActivityIndicator size="large" color={status.success} style={styles.analyzingSpinner} />
          <Text style={[styles.analyzingText, { color: colors.foreground }]}>
            AI가 음식을 분석하고 있어요...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 결과 화면
  if (screenState === 'result') {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <ScrollView
          style={[styles.resultScroll, { backgroundColor: colors.background }]}
          showsVerticalScrollIndicator={false}
        >
          {/* 촬영 이미지 */}
          {capturedImage && <Image source={{ uri: capturedImage }} style={styles.resultImage} />}

          {/* AI 인사이트 */}
          {aiInsight && (
            <View style={[styles.insightCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.insightText, { color: colors.mutedForeground }]}>
                {aiInsight}
              </Text>
            </View>
          )}

          {/* AI 인식 결과 */}
          <View style={styles.resultSection}>
            <Text style={[styles.resultTitle, { color: colors.foreground }]}>AI가 인식한 음식</Text>

            {recognizedFoods.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  음식을 인식하지 못했어요
                </Text>
                <TouchableOpacity
                  style={styles.searchLink}
                  onPress={() => router.push('/(nutrition)/search')}
                >
                  <Text style={[styles.searchLinkText, { color: status.success }]}>
                    검색으로 기록하기
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              recognizedFoods.map((food) => (
                <View key={food.id} style={[styles.foodCard, { backgroundColor: colors.card }]}>
                  <View style={styles.foodHeader}>
                    <Text style={styles.trafficLight}>
                      {getTrafficLightEmoji(food.trafficLight)}
                    </Text>
                    <View style={styles.foodInfo}>
                      <Text style={[styles.foodName, { color: colors.foreground }]}>
                        {food.name}
                      </Text>
                      <Text
                        style={[
                          styles.foodCalories,
                          { color: getTrafficLightColor(food.trafficLight) },
                        ]}
                      >
                        {Math.round(food.calories * food.portion)} kcal
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveFood(food.id)}>
                      <Text style={[styles.removeButton, { color: colors.mutedForeground }]}>
                        ✕
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.macros, { color: colors.mutedForeground }]}>
                    탄 {Math.round(food.carbs * food.portion)}g · 단{' '}
                    {Math.round(food.protein * food.portion)}g · 지{' '}
                    {Math.round(food.fat * food.portion)}g
                  </Text>

                  {/* 신뢰도 피드백 배지 */}
                  {(() => {
                    const feedback = getConfidenceFeedback(food.confidence);
                    return (
                      <View
                        style={[styles.confidenceBadge, { backgroundColor: feedback.color + '20' }]}
                      >
                        <Text style={[styles.confidenceBadgeText, { color: feedback.color }]}>
                          {feedback.message} ({Math.round(food.confidence * 100)}%)
                        </Text>
                      </View>
                    );
                  })()}

                  {/* 수량 조절 */}
                  <View style={styles.portionRow}>
                    <Text style={[styles.portionLabel, { color: colors.mutedForeground }]}>
                      수량:
                    </Text>
                    <View style={styles.portionControls}>
                      <TouchableOpacity
                        style={[styles.portionButton, { backgroundColor: colors.muted }]}
                        onPress={() => handlePortionChange(food.id, -0.5)}
                      >
                        <Text style={[styles.portionButtonText, { color: status.success }]}>−</Text>
                      </TouchableOpacity>
                      <Text style={[styles.portionValue, { color: colors.foreground }]}>
                        {food.portion}인분
                      </Text>
                      <TouchableOpacity
                        style={[styles.portionButton, { backgroundColor: colors.muted }]}
                        onPress={() => handlePortionChange(food.id, 0.5)}
                      >
                        <Text style={[styles.portionButtonText, { color: status.success }]}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}

            {/* 음식 추가 버튼 */}
            <TouchableOpacity
              style={[styles.addFoodButton, { borderColor: colors.border }]}
              onPress={() => router.push('/(nutrition)/search')}
            >
              <Text style={[styles.addFoodText, { color: colors.mutedForeground }]}>
                + 음식 추가하기
              </Text>
            </TouchableOpacity>
          </View>

          {/* 총 영양 정보 */}
          {recognizedFoods.length > 0 && (
            <View style={[styles.totalCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.totalCalories, { color: status.success }]}>
                총 {Math.round(totalNutrition.calories)} kcal
              </Text>
              <Text style={[styles.totalMacros, { color: colors.mutedForeground }]}>
                탄 {Math.round(totalNutrition.carbs)}g · 단 {Math.round(totalNutrition.protein)}g ·
                지 {Math.round(totalNutrition.fat)}g
              </Text>
            </View>
          )}
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={[styles.resultFooter, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.retakeButton, { borderColor: colors.border }]}
            onPress={handleRetake}
          >
            <Text style={[styles.retakeButtonText, { color: colors.foreground }]}>다시 촬영</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: status.success },
              (isSaving || recognizedFoods.length === 0) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={isSaving || recognizedFoods.length === 0}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>기록하기</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 카메라 화면
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          {/* 가이드 프레임 */}
          <View style={styles.guideFrame}>
            <View style={styles.guideBox}>
              <Text style={styles.guideText}>음식을 프레임 안에 맞춰주세요</Text>
            </View>
          </View>
        </CameraView>
      </View>

      {/* 식사 타입 선택 */}
      <View style={styles.mealTypeRow}>
        {MEAL_TYPES.map((meal) => (
          <TouchableOpacity
            key={meal.id}
            style={[
              styles.mealTypeChip,
              selectedMealType === meal.id && [
                styles.mealTypeChipSelected,
                { backgroundColor: status.success },
              ],
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedMealType(meal.id);
            }}
          >
            <Text style={styles.mealTypeIcon}>{meal.icon}</Text>
            <Text
              style={[
                styles.mealTypeLabel,
                selectedMealType === meal.id && styles.mealTypeLabelSelected,
              ]}
            >
              {meal.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 촬영 버튼 */}
      <View style={styles.cameraControls}>
        <TouchableOpacity style={styles.galleryButton} onPress={handlePickImage}>
          <Text style={styles.galleryButtonText}>갤러리</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push('/(nutrition)/search')}
        >
          <Text style={styles.searchButtonText}>검색</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  guideFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBox: {
    width: '80%',
    aspectRatio: 4 / 3,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mealTypeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#111',
  },
  mealTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#222',
    borderRadius: 20,
    gap: 4,
  },
  mealTypeChipSelected: {
    backgroundColor: '#22c55e',
  },
  mealTypeIcon: {
    fontSize: 16,
  },
  mealTypeLabel: {
    fontSize: 13,
    color: '#ccc',
  },
  mealTypeLabelSelected: {
    color: '#fff',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#111',
  },
  galleryButton: {
    width: 60,
    alignItems: 'center',
  },
  galleryButtonText: {
    color: '#ccc',
    fontSize: 14,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  searchButton: {
    width: 60,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#ccc',
    fontSize: 14,
  },
  analyzingImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 24,
  },
  analyzingSpinner: {
    marginBottom: 16,
  },
  analyzingText: {
    fontSize: 16,
  },
  resultScroll: {
    flex: 1,
  },
  resultImage: {
    width: '100%',
    height: 200,
  },
  insightCard: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
  resultSection: {
    padding: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 12,
  },
  searchLink: {
    padding: 8,
  },
  searchLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  foodCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trafficLight: {
    fontSize: 20,
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    fontSize: 18,
    padding: 4,
  },
  macros: {
    fontSize: 13,
    marginBottom: 8,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  confidenceBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  portionLabel: {
    fontSize: 13,
  },
  portionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  portionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portionButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  portionValue: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 50,
    textAlign: 'center',
  },
  addFoodButton: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addFoodText: {
    fontSize: 14,
  },
  totalCard: {
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  totalCalories: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  totalMacros: {
    fontSize: 14,
  },
  resultFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
  },
  retakeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
