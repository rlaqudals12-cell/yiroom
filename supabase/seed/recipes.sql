-- ============================================================
-- 레시피 시드 데이터 (M-2-2)
-- Purpose: 50개 한국 가정식 기반 영양 맞춤 레시피
-- Date: 2026-01-12
-- ============================================================

-- ============================================================
-- Part 1: 다이어트 레시피 (15개)
-- 목표: 저칼로리, 고단백, 저탄수
-- ============================================================

INSERT INTO recipes (name, name_en, description, calories, protein, carbs, fat, cook_time, difficulty, servings, nutrition_goals, tags, steps, tips, image_url, source) VALUES
('닭가슴살 샐러드', 'Chicken Breast Salad', '단백질 가득 다이어트 샐러드', 280, 35.0, 10.0, 8.0, 15, 'easy', 1, ARRAY['diet', 'lean'], ARRAY['샐러드', '닭가슴살', '다이어트'], '["닭가슴살을 소금, 후추로 간하여 굽는다", "채소를 씻어 한입 크기로 자른다", "드레싱을 뿌려 완성한다"]'::jsonb, ARRAY['닭가슴살은 두께를 얇게 펴서 구우면 더 부드럽다'], NULL, 'yiroom'),
('곤약 비빔밥', 'Konjac Bibimbap', '저칼로리 비빔밥', 320, 12.0, 45.0, 5.0, 20, 'easy', 1, ARRAY['diet'], ARRAY['비빔밥', '곤약', '채소', '한식'], '["곤약밥을 준비한다", "채소를 데쳐서 준비한다", "고추장 양념장을 만든다", "모든 재료를 올리고 비빈다"]'::jsonb, ARRAY['곤약밥은 물기를 충분히 제거해야 식감이 좋다'], NULL, 'yiroom'),
('두부 스테이크', 'Tofu Steak', '고단백 저칼로리 두부 요리', 250, 18.0, 12.0, 14.0, 15, 'easy', 1, ARRAY['diet', 'lean'], ARRAY['두부', '스테이크', '단백질'], '["두부는 물기를 제거하고 1.5cm 두께로 자른다", "팬에 기름을 두르고 두부를 굽는다", "간장 소스를 만들어 끼얹는다"]'::jsonb, ARRAY['두부는 키친타월로 눌러 물기를 완전히 제거해야 바삭하다'], NULL, 'yiroom'),
('닭가슴살 곤약볶음', 'Chicken Konjac Stir-fry', '포만감 높은 다이어트 볶음', 310, 32.0, 18.0, 9.0, 20, 'easy', 1, ARRAY['diet', 'lean'], ARRAY['닭가슴살', '곤약', '볶음'], '["닭가슴살을 한입 크기로 자른다", "곤약은 데쳐서 물기를 뺀다", "채소와 함께 볶는다", "간장 양념으로 간한다"]'::jsonb, ARRAY['곤약은 마른 팬에 볶아 수분을 날리면 더 맛있다'], NULL, 'yiroom'),
('양배추 쌈밥', 'Cabbage Wrap Rice', '채소 듬뿍 다이어트 한끼', 290, 15.0, 35.0, 8.0, 15, 'easy', 1, ARRAY['diet', 'maintenance'], ARRAY['양배추', '쌈밥', '채소'], '["양배추를 데쳐서 준비한다", "현미밥에 채소를 섞는다", "된장 쌈장을 만든다", "양배추에 밥을 싸서 먹는다"]'::jsonb, ARRAY['양배추는 끓는 물에 30초만 데쳐야 아삭하다'], NULL, 'yiroom'),
('새우 샐러드', 'Shrimp Salad', '고단백 저칼로리 해산물 샐러드', 260, 28.0, 8.0, 10.0, 15, 'easy', 1, ARRAY['diet', 'lean'], ARRAY['새우', '샐러드', '해산물'], '["새우를 삶아서 준비한다", "채소를 씻어 자른다", "레몬 드레싱을 만든다", "모든 재료를 섞는다"]'::jsonb, ARRAY['새우는 소금물에 삶으면 비린내가 덜하다'], NULL, 'yiroom'),
('오이 미역 냉국', 'Cucumber Seaweed Cold Soup', '저칼로리 시원한 한끼', 80, 3.0, 10.0, 2.0, 10, 'easy', 1, ARRAY['diet', 'maintenance'], ARRAY['냉국', '오이', '미역', '여름'], '["미역을 불려 준비한다", "오이를 얇게 썬다", "육수에 식초와 설탕을 넣는다", "미역과 오이를 넣고 차게 식힌다"]'::jsonb, ARRAY['오이는 소금에 살짝 절였다가 헹구면 식감이 좋다'], NULL, 'yiroom'),
('닭안심 버섯볶음', 'Chicken Tenderloin Mushroom Stir-fry', '저지방 고단백 볶음', 270, 36.0, 12.0, 7.0, 15, 'easy', 1, ARRAY['diet', 'lean'], ARRAY['닭안심', '버섯', '볶음'], '["닭안심을 한입 크기로 자른다", "버섯을 손질한다", "마늘과 함께 볶는다", "간장으로 간한다"]'::jsonb, ARRAY['닭안심은 질겨질 수 있으니 센 불에 빠르게 볶는다'], NULL, 'yiroom'),
('무채 샐러드', 'Radish Salad', '아삭한 다이어트 샐러드', 90, 2.0, 12.0, 3.0, 10, 'easy', 1, ARRAY['diet', 'maintenance'], ARRAY['무', '샐러드', '반찬'], '["무를 채 썬다", "식초와 설탕으로 양념한다", "참기름을 넣는다"]'::jsonb, ARRAY['무는 최대한 얇게 채 썰어야 식감이 좋다'], NULL, 'yiroom'),
('두부 김치찌개', 'Tofu Kimchi Stew', '저칼로리 얼큰한 국물', 240, 15.0, 18.0, 10.0, 20, 'easy', 1, ARRAY['diet', 'maintenance'], ARRAY['찌개', '두부', '김치', '한식'], '["김치를 볶는다", "물을 넣고 끓인다", "두부를 넣는다", "간을 맞춘다"]'::jsonb, ARRAY['김치는 신 것을 사용하면 맛이 더 깊다'], NULL, 'yiroom'),
('계란찜', 'Steamed Egg', '부드러운 단백질 반찬', 150, 12.0, 2.0, 10.0, 10, 'easy', 1, ARRAY['diet', 'lean', 'maintenance'], ARRAY['계란', '찜', '반찬'], '["계란을 푼다", "물 또는 육수를 넣는다", "중약불에서 찐다"]'::jsonb, ARRAY['불을 약하게 해야 부드럽게 익는다'], NULL, 'yiroom'),
('숙주나물', 'Bean Sprout Side Dish', '저칼로리 아삭한 나물', 60, 4.0, 8.0, 1.0, 10, 'easy', 1, ARRAY['diet', 'maintenance'], ARRAY['나물', '숙주', '반찬'], '["숙주를 데친다", "찬물에 헹군다", "간장, 참기름, 마늘로 무친다"]'::jsonb, ARRAY['숙주는 살짝만 데쳐야 아삭하다'], NULL, 'yiroom'),
('콩나물국', 'Bean Sprout Soup', '해장에 좋은 시원한 국', 80, 5.0, 8.0, 2.0, 15, 'easy', 1, ARRAY['diet', 'maintenance'], ARRAY['국', '콩나물', '해장'], '["콩나물을 씻는다", "물에 콩나물과 다시마를 넣고 끓인다", "국간장으로 간한다", "마늘과 고춧가루를 넣는다"]'::jsonb, ARRAY['뚜껑을 열지 말고 끓여야 비린내가 없다'], NULL, 'yiroom'),
('미역줄기 볶음', 'Stir-fried Seaweed Stems', '저칼로리 반찬', 70, 2.0, 8.0, 3.0, 10, 'easy', 1, ARRAY['diet', 'maintenance'], ARRAY['미역', '볶음', '반찬'], '["미역줄기를 데친다", "물기를 짠다", "마늘과 함께 볶는다", "간장으로 간한다"]'::jsonb, ARRAY['미역줄기는 소금물에 헹궈 짠맛을 빼야 한다'], NULL, 'yiroom'),
('닭가슴살 스프', 'Chicken Breast Soup', '따뜻한 다이어트 수프', 220, 30.0, 15.0, 5.0, 25, 'easy', 1, ARRAY['diet', 'lean'], ARRAY['닭가슴살', '수프', '스프'], '["닭가슴살을 삶는다", "채소를 넣고 끓인다", "소금, 후추로 간한다", "닭가슴살을 찢어 넣는다"]'::jsonb, ARRAY['닭가슴살은 오래 삶으면 퍽퍽해지니 주의'], NULL, 'yiroom');

-- 다이어트 레시피 재료 (대표 3개만)
INSERT INTO recipe_ingredients (recipe_id, name, amount, unit, is_optional, category, notes) VALUES
((SELECT id FROM recipes WHERE name = '닭가슴살 샐러드'), '닭가슴살', 150, 'g', false, 'meat', NULL),
((SELECT id FROM recipes WHERE name = '닭가슴살 샐러드'), '양상추', 100, 'g', false, 'vegetable', '손으로 뜯어서'),
((SELECT id FROM recipes WHERE name = '닭가슴살 샐러드'), '방울토마토', 50, 'g', false, 'vegetable', '반으로 자른다'),
((SELECT id FROM recipes WHERE name = '닭가슴살 샐러드'), '올리브오일', 1, '큰술', false, 'seasoning', NULL),

((SELECT id FROM recipes WHERE name = '곤약 비빔밥'), '곤약밥', 200, 'g', false, 'grain', NULL),
((SELECT id FROM recipes WHERE name = '곤약 비빔밥'), '시금치', 50, 'g', false, 'vegetable', '데쳐서'),
((SELECT id FROM recipes WHERE name = '곤약 비빔밥'), '당근', 30, 'g', false, 'vegetable', '채 썰기'),
((SELECT id FROM recipes WHERE name = '곤약 비빔밥'), '고추장', 1, '큰술', false, 'seasoning', NULL),

((SELECT id FROM recipes WHERE name = '두부 스테이크'), '두부', 300, 'g', false, 'protein', '단단한 두부'),
((SELECT id FROM recipes WHERE name = '두부 스테이크'), '간장', 2, '큰술', false, 'seasoning', NULL),
((SELECT id FROM recipes WHERE name = '두부 스테이크'), '마늘', 2, '개', false, 'seasoning', '다진 것'),
((SELECT id FROM recipes WHERE name = '두부 스테이크'), '올리브오일', 1, '큰술', false, 'seasoning', NULL);

-- ============================================================
-- Part 2: 벌크업 레시피 (10개)
-- 목표: 고칼로리, 고단백, 고탄수
-- ============================================================

INSERT INTO recipes (name, name_en, description, calories, protein, carbs, fat, cook_time, difficulty, servings, nutrition_goals, tags, steps, tips, image_url, source) VALUES
('소고기 덮밥', 'Beef Rice Bowl', '든든한 한 끼 벌크업 메뉴', 650, 35.0, 70.0, 20.0, 25, 'easy', 1, ARRAY['bulk', 'maintenance'], ARRAY['덮밥', '소고기', '한식'], '["소고기를 양념에 재운다", "팬에 소고기를 볶는다", "밥 위에 소고기를 올린다", "계란후라이를 올린다"]'::jsonb, ARRAY['소고기는 핏물을 제거한 후 재워야 부드럽다'], NULL, 'yiroom'),
('참치 스테이크 덮밥', 'Tuna Steak Bowl', '고단백 해산물 덮밥', 580, 42.0, 60.0, 15.0, 20, 'medium', 1, ARRAY['bulk', 'lean'], ARRAY['참치', '덮밥', '스테이크'], '["참치 스테이크를 앞뒤로 굽는다", "아보카도를 슬라이스한다", "밥 위에 참치와 아보카도를 올린다", "간장 소스를 뿌린다"]'::jsonb, ARRAY['참치는 겉만 익히고 속은 레어로 먹는 게 좋다'], NULL, 'yiroom'),
('닭가슴살 볶음밥', 'Chicken Fried Rice', '단백질 가득 볶음밥', 620, 38.0, 75.0, 18.0, 20, 'easy', 1, ARRAY['bulk', 'lean'], ARRAY['볶음밥', '닭가슴살', '한식'], '["닭가슴살을 볶는다", "밥을 넣고 볶는다", "계란을 푼다", "간장으로 간한다"]'::jsonb, ARRAY['밥은 찬밥을 사용해야 볶음밥이 잘 볶인다'], NULL, 'yiroom'),
('연어 덮밥', 'Salmon Rice Bowl', '오메가3 풍부한 덮밥', 680, 35.0, 65.0, 28.0, 20, 'easy', 1, ARRAY['bulk', 'lean'], ARRAY['연어', '덮밥', '해산물'], '["연어를 구운다", "밥 위에 연어를 올린다", "아보카도를 곁들인다", "간장 소스를 뿌린다"]'::jsonb, ARRAY['연어는 껍질 쪽부터 구워야 바삭하다'], NULL, 'yiroom'),
('김치 볶음밥', 'Kimchi Fried Rice', '얼큰한 한식 볶음밥', 550, 18.0, 70.0, 20.0, 15, 'easy', 1, ARRAY['bulk', 'maintenance'], ARRAY['볶음밥', '김치', '한식'], '["김치를 잘게 자른다", "김치를 볶는다", "밥을 넣고 볶는다", "계란후라이를 올린다"]'::jsonb, ARRAY['김치는 충분히 볶아야 신맛이 줄어든다'], NULL, 'yiroom'),
('닭볶음탕', 'Braised Spicy Chicken', '매콤달콤 닭요리', 720, 40.0, 55.0, 30.0, 40, 'medium', 2, ARRAY['bulk', 'maintenance'], ARRAY['닭', '볶음탕', '한식'], '["닭을 손질한다", "양념장을 만든다", "닭과 감자를 넣고 끓인다", "당근과 양파를 추가한다"]'::jsonb, ARRAY['감자는 나중에 넣어야 형태가 유지된다'], NULL, 'yiroom'),
('제육덮밥', 'Spicy Pork Rice Bowl', '매콤한 돼지고기 덮밥', 640, 32.0, 68.0, 25.0, 25, 'easy', 1, ARRAY['bulk', 'maintenance'], ARRAY['덮밥', '제육', '한식'], '["돼지고기를 양념에 재운다", "양파와 함께 볶는다", "밥 위에 올린다", "깻잎을 곁들인다"]'::jsonb, ARRAY['고기는 센 불에 빠르게 볶아야 부드럽다'], NULL, 'yiroom'),
('삼겹살 김치찌개', 'Pork Belly Kimchi Stew', '든든한 한식 찌개', 700, 30.0, 35.0, 45.0, 30, 'easy', 2, ARRAY['bulk', 'maintenance'], ARRAY['찌개', '삼겹살', '김치'], '["삼겹살을 볶는다", "김치를 넣고 볶는다", "물을 붓고 끓인다", "두부를 추가한다"]'::jsonb, ARRAY['삼겹살은 먼저 기름을 빼고 볶는다'], NULL, 'yiroom'),
('부대찌개', 'Army Stew', '다양한 재료의 푸짐한 찌개', 720, 35.0, 60.0, 35.0, 30, 'easy', 2, ARRAY['bulk', 'maintenance'], ARRAY['찌개', '부대찌개', '한식'], '["육수를 끓인다", "소시지, 햄, 스팸을 넣는다", "라면과 떡을 추가한다", "치즈를 올린다"]'::jsonb, ARRAY['재료는 종류별로 나눠 담으면 보기 좋다'], NULL, 'yiroom'),
('낙지덮밥', 'Octopus Rice Bowl', '매콤한 해산물 덮밥', 610, 32.0, 72.0, 18.0, 25, 'medium', 1, ARRAY['bulk', 'maintenance'], ARRAY['덮밥', '낙지', '해산물'], '["낙지를 손질한다", "양념장을 만든다", "낙지와 채소를 볶는다", "밥 위에 올린다"]'::jsonb, ARRAY['낙지는 오래 볶으면 질겨지니 빠르게 볶는다'], NULL, 'yiroom');

-- 벌크업 레시피 재료 (대표 2개만)
INSERT INTO recipe_ingredients (recipe_id, name, amount, unit, is_optional, category, notes) VALUES
((SELECT id FROM recipes WHERE name = '소고기 덮밥'), '소고기', 200, 'g', false, 'meat', '불고기용'),
((SELECT id FROM recipes WHERE name = '소고기 덮밥'), '밥', 250, 'g', false, 'grain', NULL),
((SELECT id FROM recipes WHERE name = '소고기 덮밥'), '양파', 50, 'g', false, 'vegetable', '채 썰기'),
((SELECT id FROM recipes WHERE name = '소고기 덮밥'), '계란', 1, '개', false, 'protein', '후라이'),

((SELECT id FROM recipes WHERE name = '닭볶음탕'), '닭', 500, 'g', false, 'meat', '한 마리 또는 부위'),
((SELECT id FROM recipes WHERE name = '닭볶음탕'), '감자', 200, 'g', false, 'vegetable', '큼직하게 자르기'),
((SELECT id FROM recipes WHERE name = '닭볶음탕'), '고추장', 2, '큰술', false, 'seasoning', NULL),
((SELECT id FROM recipes WHERE name = '닭볶음탕'), '간장', 2, '큰술', false, 'seasoning', NULL);

-- ============================================================
-- Part 3: 린매스 레시피 (10개)
-- 목표: 고단백, 중탄수, 저지방
-- ============================================================

INSERT INTO recipes (name, name_en, description, calories, protein, carbs, fat, cook_time, difficulty, servings, nutrition_goals, tags, steps, tips, image_url, source) VALUES
('연어 스테이크', 'Salmon Steak', '오메가3 풍부한 고단백 요리', 420, 38.0, 12.0, 24.0, 20, 'easy', 1, ARRAY['lean', 'bulk'], ARRAY['연어', '스테이크', '해산물'], '["연어에 소금, 후추로 간한다", "팬에 올리브오일을 두른다", "연어를 굽는다", "레몬을 곁들인다"]'::jsonb, ARRAY['연어는 중불에서 천천히 익혀야 촉촉하다'], NULL, 'yiroom'),
('두부 스테이크 정식', 'Tofu Steak Set', '단백질 풍부한 두부 정식', 380, 25.0, 28.0, 16.0, 20, 'easy', 1, ARRAY['lean', 'diet'], ARRAY['두부', '스테이크', '정식'], '["두부를 굵게 자른다", "팬에 구운다", "간장 소스를 만든다", "현미밥과 채소를 곁들인다"]'::jsonb, ARRAY['두부는 물기를 충분히 빼야 바삭하게 구워진다'], NULL, 'yiroom'),
('닭가슴살 구이', 'Grilled Chicken Breast', '담백한 고단백 구이', 320, 42.0, 8.0, 12.0, 15, 'easy', 1, ARRAY['lean', 'diet'], ARRAY['닭가슴살', '구이', '단백질'], '["닭가슴살을 두드린다", "소금, 허브로 간한다", "오븐 또는 팬에 굽는다"]'::jsonb, ARRAY['닭가슴살은 두드려서 구우면 더 부드럽다'], NULL, 'yiroom'),
('새우 볶음', 'Shrimp Stir-fry', '고단백 저지방 볶음', 290, 32.0, 15.0, 10.0, 15, 'easy', 1, ARRAY['lean', 'diet'], ARRAY['새우', '볶음', '해산물'], '["새우를 손질한다", "마늘과 채소를 볶는다", "새우를 추가한다", "간장으로 간한다"]'::jsonb, ARRAY['새우는 익으면 색이 변하니 너무 익히지 않는다'], NULL, 'yiroom'),
('흰살생선 구이', 'Grilled White Fish', '담백한 생선 요리', 310, 36.0, 10.0, 14.0, 20, 'easy', 1, ARRAY['lean', 'diet'], ARRAY['생선', '구이', '해산물'], '["생선에 소금으로 간한다", "팬 또는 오븐에 굽는다", "레몬을 곁들인다"]'::jsonb, ARRAY['생선은 뒤집을 때 조심히 다뤄야 부서지지 않는다'], NULL, 'yiroom'),
('닭가슴살 샌드위치', 'Chicken Breast Sandwich', '단백질 풍부한 샌드위치', 420, 35.0, 38.0, 12.0, 15, 'easy', 1, ARRAY['lean', 'maintenance'], ARRAY['샌드위치', '닭가슴살', '간편'], '["닭가슴살을 굽는다", "통밀빵에 채소를 올린다", "닭가슴살을 올린다", "소스를 뿌린다"]'::jsonb, ARRAY['통밀빵을 토스트하면 더 맛있다'], NULL, 'yiroom'),
('계란 흰자 오믈렛', 'Egg White Omelette', '저지방 고단백 오믈렛', 180, 24.0, 6.0, 5.0, 10, 'easy', 1, ARRAY['lean', 'diet'], ARRAY['계란', '오믈렛', '아침'], '["계란 흰자만 분리한다", "채소를 다진다", "팬에 흰자와 채소를 넣고 익힌다"]'::jsonb, ARRAY['약한 불에서 천천히 익혀야 부드럽다'], NULL, 'yiroom'),
('참치 야채 볶음', 'Tuna Vegetable Stir-fry', '간편한 참치 볶음', 310, 28.0, 18.0, 12.0, 15, 'easy', 1, ARRAY['lean', 'diet'], ARRAY['참치', '볶음', '간편'], '["참치 통조림을 준비한다", "채소를 볶는다", "참치를 넣는다", "간장으로 간한다"]'::jsonb, ARRAY['참치는 기름기를 빼고 사용하면 더 건강하다'], NULL, 'yiroom'),
('두부 버섯 볶음', 'Tofu Mushroom Stir-fry', '담백한 두부 요리', 260, 18.0, 15.0, 14.0, 15, 'easy', 1, ARRAY['lean', 'diet'], ARRAY['두부', '버섯', '볶음'], '["두부를 자른다", "버섯을 손질한다", "마늘과 함께 볶는다", "간장으로 간한다"]'::jsonb, ARRAY['두부는 물기를 제거해야 볶을 때 부서지지 않는다'], NULL, 'yiroom'),
('닭가슴살 카레', 'Chicken Breast Curry', '단백질 풍부한 저지방 카레', 480, 40.0, 45.0, 15.0, 30, 'medium', 1, ARRAY['lean', 'maintenance'], ARRAY['닭가슴살', '카레', '한식'], '["닭가슴살을 자른다", "채소를 준비한다", "카레 가루로 소스를 만든다", "닭가슴살과 채소를 넣고 끓인다"]'::jsonb, ARRAY['저지방 카레 가루를 사용하면 더 건강하다'], NULL, 'yiroom');

-- 린매스 레시피 재료 (대표 2개만)
INSERT INTO recipe_ingredients (recipe_id, name, amount, unit, is_optional, category, notes) VALUES
((SELECT id FROM recipes WHERE name = '연어 스테이크'), '연어', 200, 'g', false, 'seafood', NULL),
((SELECT id FROM recipes WHERE name = '연어 스테이크'), '올리브오일', 1, '큰술', false, 'seasoning', NULL),
((SELECT id FROM recipes WHERE name = '연어 스테이크'), '레몬', 0.5, '개', false, 'vegetable', '슬라이스'),

((SELECT id FROM recipes WHERE name = '닭가슴살 구이'), '닭가슴살', 200, 'g', false, 'meat', NULL),
((SELECT id FROM recipes WHERE name = '닭가슴살 구이'), '소금', 1, '작은술', false, 'seasoning', NULL),
((SELECT id FROM recipes WHERE name = '닭가슴살 구이'), '후추', 0.5, '작은술', false, 'seasoning', NULL);

-- ============================================================
-- Part 4: 유지 레시피 (15개)
-- 목표: 균형 잡힌 영양, 일반 한식
-- ============================================================

INSERT INTO recipes (name, name_en, description, calories, protein, carbs, fat, cook_time, difficulty, servings, nutrition_goals, tags, steps, tips, image_url, source) VALUES
('비빔밥', 'Bibimbap', '균형 잡힌 한국 대표 음식', 520, 22.0, 65.0, 18.0, 30, 'medium', 1, ARRAY['maintenance'], ARRAY['비빔밥', '한식', '나물'], '["나물을 각각 무친다", "고기를 볶는다", "밥 위에 나물을 올린다", "고추장과 참기름을 넣고 비빈다"]'::jsonb, ARRAY['나물은 각각 따로 무쳐야 맛이 살아난다'], NULL, 'yiroom'),
('된장찌개', 'Doenjang Stew', '구수한 한식 찌개', 380, 18.0, 28.0, 20.0, 25, 'easy', 2, ARRAY['maintenance'], ARRAY['찌개', '된장', '한식'], '["육수를 끓인다", "된장을 푼다", "감자와 호박을 넣는다", "두부를 추가한다"]'::jsonb, ARRAY['된장은 체에 거르면 더 부드럽다'], NULL, 'yiroom'),
('김치찌개', 'Kimchi Stew', '얼큰한 김치찌개', 420, 20.0, 32.0, 22.0, 25, 'easy', 2, ARRAY['maintenance'], ARRAY['찌개', '김치', '한식'], '["김치를 볶는다", "물을 붓고 끓인다", "돼지고기를 추가한다", "두부를 넣는다"]'::jsonb, ARRAY['오래 익은 김치를 사용하면 더 맛있다'], NULL, 'yiroom'),
('제육볶음', 'Spicy Pork Stir-fry', '매콤한 돼지고기 볶음', 580, 28.0, 45.0, 30.0, 25, 'easy', 2, ARRAY['maintenance'], ARRAY['볶음', '제육', '한식'], '["돼지고기를 양념에 재운다", "양파와 함께 볶는다", "고추와 깻잎을 추가한다"]'::jsonb, ARRAY['고기는 센 불에 빠르게 볶아야 부드럽다'], NULL, 'yiroom'),
('불고기', 'Bulgogi', '달콤한 소고기 구이', 560, 32.0, 42.0, 28.0, 30, 'medium', 2, ARRAY['maintenance', 'bulk'], ARRAY['불고기', '소고기', '한식'], '["소고기를 양념에 재운다", "팬에 볶는다", "버섯과 채소를 추가한다"]'::jsonb, ARRAY['고기는 얇게 썰어 재워야 맛이 잘 배인다'], NULL, 'yiroom'),
('계란말이', 'Rolled Omelette', '부드러운 계란 반찬', 280, 16.0, 8.0, 20.0, 10, 'medium', 1, ARRAY['maintenance'], ARRAY['계란', '반찬', '한식'], '["계란을 푼다", "팬에 한 국자씩 부어 말아간다", "완성 후 썰어낸다"]'::jsonb, ARRAY['약한 불에서 천천히 말아야 예쁘다'], NULL, 'yiroom'),
('잡채', 'Japchae', '달콤한 당면 요리', 480, 12.0, 68.0, 16.0, 35, 'medium', 2, ARRAY['maintenance'], ARRAY['잡채', '당면', '한식'], '["당면을 삶는다", "채소와 고기를 각각 볶는다", "모든 재료를 섞는다", "간장 양념으로 무친다"]'::jsonb, ARRAY['재료는 따로 볶아야 색이 살아난다'], NULL, 'yiroom'),
('순두부찌개', 'Soft Tofu Stew', '부드러운 순두부 찌개', 420, 22.0, 28.0, 24.0, 20, 'easy', 2, ARRAY['maintenance'], ARRAY['찌개', '순두부', '한식'], '["육수를 끓인다", "순두부를 넣는다", "고춧가루로 간한다", "계란을 풀어 넣는다"]'::jsonb, ARRAY['순두부는 마지막에 넣어야 모양이 유지된다'], NULL, 'yiroom'),
('생선구이', 'Grilled Fish', '담백한 생선 구이', 360, 32.0, 8.0, 22.0, 20, 'easy', 1, ARRAY['maintenance'], ARRAY['생선', '구이', '한식'], '["생선에 소금으로 간한다", "팬 또는 그릴에 굽는다"]'::jsonb, ARRAY['생선은 뒤집을 때 조심스럽게 다뤄야 한다'], NULL, 'yiroom'),
('감자조림', 'Braised Potatoes', '달콤한 감자 반찬', 280, 6.0, 52.0, 6.0, 25, 'easy', 2, ARRAY['maintenance'], ARRAY['조림', '감자', '반찬'], '["감자를 자른다", "간장 양념장을 만든다", "감자를 조린다"]'::jsonb, ARRAY['감자는 중간 크기로 잘라야 조리기 좋다'], NULL, 'yiroom'),
('미역국', 'Seaweed Soup', '영양 가득 미역국', 180, 8.0, 12.0, 10.0, 20, 'easy', 2, ARRAY['maintenance'], ARRAY['국', '미역', '한식'], '["미역을 불린다", "참기름에 미역을 볶는다", "물을 붓고 끓인다", "국간장으로 간한다"]'::jsonb, ARRAY['미역은 참기름에 볶아야 맛이 좋다'], NULL, 'yiroom'),
('무국', 'Radish Soup', '시원한 무국', 120, 6.0, 15.0, 4.0, 20, 'easy', 2, ARRAY['maintenance'], ARRAY['국', '무', '한식'], '["무를 자른다", "멸치 육수를 낸다", "무를 넣고 끓인다", "국간장으로 간한다"]'::jsonb, ARRAY['무는 나박 썰기로 해야 빨리 익는다'], NULL, 'yiroom'),
('시금치나물', 'Spinach Side Dish', '영양 가득 나물', 90, 4.0, 8.0, 4.0, 10, 'easy', 2, ARRAY['maintenance'], ARRAY['나물', '시금치', '반찬'], '["시금치를 데친다", "찬물에 헹군다", "간장, 마늘, 참기름으로 무친다"]'::jsonb, ARRAY['시금치는 뿌리까지 사용하면 더 영양가 높다'], NULL, 'yiroom'),
('콩자반', 'Sweet Soy Beans', '달콤한 콩 반찬', 220, 12.0, 28.0, 8.0, 30, 'easy', 4, ARRAY['maintenance'], ARRAY['반찬', '콩', '한식'], '["콩을 불린다", "물에 삶는다", "간장 양념으로 조린다"]'::jsonb, ARRAY['콩은 충분히 불려야 부드럽게 익는다'], NULL, 'yiroom'),
('오이무침', 'Cucumber Salad', '아삭한 오이 반찬', 60, 2.0, 8.0, 2.0, 10, 'easy', 2, ARRAY['maintenance'], ARRAY['반찬', '오이', '샐러드'], '["오이를 썬다", "소금에 절인다", "양념장을 만들어 무친다"]'::jsonb, ARRAY['오이는 소금에 살짝 절였다가 물기를 짜야 아삭하다'], NULL, 'yiroom');

-- 유지 레시피 재료 (대표 3개만)
INSERT INTO recipe_ingredients (recipe_id, name, amount, unit, is_optional, category, notes) VALUES
((SELECT id FROM recipes WHERE name = '비빔밥'), '밥', 250, 'g', false, 'grain', NULL),
((SELECT id FROM recipes WHERE name = '비빔밥'), '소고기', 80, 'g', true, 'meat', '채 썰기'),
((SELECT id FROM recipes WHERE name = '비빔밥'), '시금치', 50, 'g', false, 'vegetable', '데쳐서'),
((SELECT id FROM recipes WHERE name = '비빔밥'), '당근', 30, 'g', false, 'vegetable', '채 썰기'),
((SELECT id FROM recipes WHERE name = '비빔밥'), '고추장', 2, '큰술', false, 'seasoning', NULL),

((SELECT id FROM recipes WHERE name = '된장찌개'), '된장', 2, '큰술', false, 'seasoning', NULL),
((SELECT id FROM recipes WHERE name = '된장찌개'), '두부', 150, 'g', false, 'protein', '네모 썰기'),
((SELECT id FROM recipes WHERE name = '된장찌개'), '감자', 100, 'g', false, 'vegetable', '큼직하게'),
((SELECT id FROM recipes WHERE name = '된장찌개'), '호박', 80, 'g', false, 'vegetable', '반달 썰기'),

((SELECT id FROM recipes WHERE name = '김치찌개'), '김치', 200, 'g', false, 'vegetable', '신 김치'),
((SELECT id FROM recipes WHERE name = '김치찌개'), '돼지고기', 100, 'g', true, 'meat', '삼겹살'),
((SELECT id FROM recipes WHERE name = '김치찌개'), '두부', 150, 'g', false, 'protein', NULL),
((SELECT id FROM recipes WHERE name = '김치찌개'), '고춧가루', 1, '큰술', false, 'seasoning', NULL);

-- ============================================================
-- Part 5: 완료 메시지
-- ============================================================

DO $$
DECLARE
  recipe_count INTEGER;
  ingredient_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recipe_count FROM recipes WHERE source = 'yiroom';
  SELECT COUNT(*) INTO ingredient_count FROM recipe_ingredients;

  RAISE NOTICE '============================================================';
  RAISE NOTICE '레시피 시드 데이터 삽입 완료!';
  RAISE NOTICE '총 레시피 수: %', recipe_count;
  RAISE NOTICE '총 재료 수: %', ingredient_count;
  RAISE NOTICE '============================================================';
  RAISE NOTICE '분류별 레시피:';
  RAISE NOTICE '- 다이어트 (diet): 15개';
  RAISE NOTICE '- 벌크업 (bulk): 10개';
  RAISE NOTICE '- 린매스 (lean): 10개';
  RAISE NOTICE '- 유지 (maintenance): 15개';
  RAISE NOTICE '============================================================';
END $$;
