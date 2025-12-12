/**
 * 음식 데이터베이스 (500종)
 * Task 1.4: 기본 음식 DB 시딩
 */

import rice from './rice.json';
import soup from './soup.json';
import side from './side.json';
import meat from './meat.json';
import seafood from './seafood.json';
import noodle from './noodle.json';
import bread from './bread.json';
import beverage from './beverage.json';
import fruit from './fruit.json';
import fastfood from './fastfood.json';

// JSON 데이터 타입 정의
export interface FoodData {
  id: string;
  name: string;
  nameEn: string;
  category: FoodCategory;
  servingSize: string;
  servingGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  trafficLight: TrafficLight;
  isKorean: boolean;
  tags: string[];
}

export type FoodCategory =
  | 'rice'
  | 'soup'
  | 'side'
  | 'meat'
  | 'seafood'
  | 'noodle'
  | 'bread'
  | 'beverage'
  | 'fruit'
  | 'fastfood';

export type TrafficLight = 'green' | 'yellow' | 'red';

// 카테고리별 음식 데이터
export const riceData = rice as FoodData[];
export const soupData = soup as FoodData[];
export const sideData = side as FoodData[];
export const meatData = meat as FoodData[];
export const seafoodData = seafood as FoodData[];
export const noodleData = noodle as FoodData[];
export const breadData = bread as FoodData[];
export const beverageData = beverage as FoodData[];
export const fruitData = fruit as FoodData[];
export const fastfoodData = fastfood as FoodData[];

// 전체 음식 데이터 (500종)
export const allFoods: FoodData[] = [
  ...riceData,
  ...soupData,
  ...sideData,
  ...meatData,
  ...seafoodData,
  ...noodleData,
  ...breadData,
  ...beverageData,
  ...fruitData,
  ...fastfoodData,
];

// 카테고리별 음식 개수
export const foodCounts = {
  rice: riceData.length,
  soup: soupData.length,
  side: sideData.length,
  meat: meatData.length,
  seafood: seafoodData.length,
  noodle: noodleData.length,
  bread: breadData.length,
  beverage: beverageData.length,
  fruit: fruitData.length,
  fastfood: fastfoodData.length,
  total: allFoods.length,
};

// 카테고리 한글명
export const categoryNames: Record<FoodCategory, string> = {
  rice: '밥류',
  soup: '국/찌개',
  side: '반찬',
  meat: '고기',
  seafood: '해산물',
  noodle: '면류',
  bread: '빵/디저트',
  beverage: '음료',
  fruit: '과일',
  fastfood: '패스트푸드',
};

// 신호등 색상 설명
export const trafficLightDescriptions: Record<TrafficLight, string> = {
  green: '저칼로리, 고영양 - 많이 먹어도 괜찮아요',
  yellow: '적당량 섭취 권장 - 균형 잡힌 선택이에요',
  red: '고칼로리, 저영양 - 가끔 먹는 게 좋아요',
};

// 음식 검색 유틸리티
export function searchFoods(query: string): FoodData[] {
  const lowerQuery = query.toLowerCase();
  return allFoods.filter(
    (food) =>
      food.name.toLowerCase().includes(lowerQuery) ||
      food.nameEn.toLowerCase().includes(lowerQuery) ||
      food.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

// 카테고리별 필터
export function getFoodsByCategory(category: FoodCategory): FoodData[] {
  return allFoods.filter((food) => food.category === category);
}

// 신호등별 필터
export function getFoodsByTrafficLight(light: TrafficLight): FoodData[] {
  return allFoods.filter((food) => food.trafficLight === light);
}

// ID로 음식 찾기
export function getFoodById(id: string): FoodData | undefined {
  return allFoods.find((food) => food.id === id);
}

export default allFoods;
