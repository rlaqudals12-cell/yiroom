-- ===========================================
-- 성분 마스터 테이블 (화해 스타일 성분 분석)
-- Week 6: 성분 분석 시스템
-- ===========================================

-- 기존 테이블 삭제 (개발용)
DROP TABLE IF EXISTS public.ingredients;

-- ingredients 테이블 생성
CREATE TABLE public.ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 성분 정보
  name_ko VARCHAR(100) NOT NULL,       -- 한글명
  name_en VARCHAR(100),                 -- 영문명
  aliases TEXT[],                       -- 별칭 배열

  -- EWG 등급 (1-10, 낮을수록 안전)
  ewg_grade INTEGER CHECK (ewg_grade >= 1 AND ewg_grade <= 10),

  -- 피부 타입별 주의 레벨 (1-5, 높을수록 주의)
  warning_dry INTEGER DEFAULT 1 CHECK (warning_dry >= 1 AND warning_dry <= 5),
  warning_oily INTEGER DEFAULT 1 CHECK (warning_oily >= 1 AND warning_oily <= 5),
  warning_sensitive INTEGER DEFAULT 1 CHECK (warning_sensitive >= 1 AND warning_sensitive <= 5),
  warning_combination INTEGER DEFAULT 1 CHECK (warning_combination >= 1 AND warning_combination <= 5),

  -- 분류 및 설명
  category VARCHAR(50),                 -- 분류
  description TEXT,                     -- 성분 설명
  side_effects TEXT,                    -- 부작용/주의사항
  alternatives TEXT[],                  -- 대체 성분 목록

  -- 메타 정보
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_ingredients_name_ko ON public.ingredients(name_ko);
CREATE INDEX idx_ingredients_name_en ON public.ingredients(name_en);
CREATE INDEX idx_ingredients_category ON public.ingredients(category);
CREATE INDEX idx_ingredients_ewg_grade ON public.ingredients(ewg_grade);

-- 코멘트
COMMENT ON TABLE public.ingredients IS '성분 마스터 DB (화해 스타일 성분 분석)';
COMMENT ON COLUMN public.ingredients.ewg_grade IS 'EWG 등급 1-10 (낮을수록 안전)';
COMMENT ON COLUMN public.ingredients.warning_sensitive IS '민감성 피부 주의 레벨 1-5';

-- updated_at 자동 업데이트 트리거
-- (update_updated_at_column 함수가 없는 경우 생성)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON public.ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 권한 부여
ALTER TABLE public.ingredients OWNER TO postgres;
GRANT ALL ON TABLE public.ingredients TO anon;
GRANT ALL ON TABLE public.ingredients TO authenticated;
GRANT ALL ON TABLE public.ingredients TO service_role;

-- ===========================================
-- 20개 주요 주의 성분 시드 데이터
-- ===========================================

INSERT INTO public.ingredients (name_ko, name_en, aliases, ewg_grade, warning_sensitive, warning_dry, warning_oily, warning_combination, category, description, side_effects, alternatives) VALUES

-- 1. 알코올 계열
('변성알코올', 'Alcohol Denat', ARRAY['알코올', '에탄올', 'Denatured Alcohol'], 4, 5, 5, 2, 3, '용매',
 '화장품에서 가장 흔한 알코올 형태. 빠른 흡수와 청량감 제공.',
 '피부 건조, 장벽 손상, 민감성 증가',
 ARRAY['글리세린', '히알루론산', '부틸렌글라이콜']),

('SD알코올', 'SD Alcohol', ARRAY['SD Alcohol 40', '특수변성알코올'], 4, 5, 5, 2, 3, '용매',
 '특수 변성 알코올. 향료나 방부제로도 사용.',
 '건성/민감성 피부 자극',
 ARRAY['프로필렌글라이콜', '펜틸렌글라이콜']),

-- 2. 향료
('향료', 'Fragrance', ARRAY['Parfum', '프래그런스', '퍼퓸', '인공향료'], 8, 5, 3, 3, 3, '향료',
 '합성 향료 혼합물. 구체적 성분 미공개.',
 '알레르기, 두통, 피부 자극',
 ARRAY['에센셜오일', '무향 제품']),

('리날룰', 'Linalool', ARRAY['리날올'], 5, 4, 2, 2, 2, '향료',
 '라벤더 등에서 추출한 향료 성분.',
 '산화 시 알레르기 유발',
 ARRAY['토코페롤', '비타민E']),

-- 3. 방부제
('파라벤', 'Paraben', ARRAY['메틸파라벤', '에틸파라벤', '프로필파라벤', '부틸파라벤', 'Methylparaben', 'Ethylparaben'], 7, 4, 2, 2, 2, '방부제',
 '메틸/에틸/프로필/부틸파라벤 등.',
 '호르몬 교란 우려, 알레르기',
 ARRAY['페녹시에탄올', '벤조산나트륨']),

('페녹시에탄올', 'Phenoxyethanol', ARRAY['2-페녹시에탄올'], 4, 3, 2, 2, 2, '방부제',
 '파라벤 대체 방부제로 많이 사용.',
 '고농도 시 피부 자극',
 ARRAY['에틸헥실글리세린', '1,2-헥산디올']),

('포름알데히드', 'Formaldehyde', ARRAY['포르말린', 'DMDM Hydantoin', '이미다졸리디닐우레아'], 10, 5, 5, 5, 5, '방부제',
 '강력한 방부제. 현재 사용 제한.',
 '발암물질, 심한 자극',
 ARRAY['천연 방부제', '로즈마리추출물']),

('MIT/CMIT', 'Methylisothiazolinone', ARRAY['메틸이소치아졸리논', 'MI', 'MCI', '이소치아졸리논'], 9, 5, 4, 4, 4, '방부제',
 '이소티아졸리논 계열 방부제.',
 '강한 알레르기, 접촉성 피부염',
 ARRAY['소르빅애시드', '벤조익애시드']),

-- 4. 계면활성제
('SLS', 'Sodium Lauryl Sulfate', ARRAY['소듐라우릴설페이트', '라우릴황산나트륨'], 5, 5, 5, 2, 4, '계면활성제',
 '강력한 세정력의 음이온 계면활성제.',
 '피부 장벽 손상, 건조, 자극',
 ARRAY['코코글루코사이드', '라우릴글루코사이드', '코코베타인']),

('SLES', 'Sodium Laureth Sulfate', ARRAY['소듐라우레스설페이트', '라우레스황산나트륨'], 3, 3, 4, 2, 3, '계면활성제',
 'SLS보다 순한 계면활성제.',
 '건성 피부에 건조 유발',
 ARRAY['코코글루코사이드', '데실글루코사이드']),

-- 5. 자외선 차단제
('옥시벤존', 'Oxybenzone', ARRAY['벤조페논-3', 'Benzophenone-3'], 8, 4, 3, 3, 3, '자외선차단',
 '화학적 자외선 차단 성분.',
 '호르몬 교란, 산호초 백화',
 ARRAY['징크옥사이드', '티타늄디옥사이드']),

('옥티녹세이트', 'Octinoxate', ARRAY['에틸헥실메톡시신나메이트', 'Ethylhexyl Methoxycinnamate'], 6, 3, 2, 2, 2, '자외선차단',
 'UVB 차단 성분.',
 '호르몬 교란 우려',
 ARRAY['징크옥사이드', '티노솔브']),

-- 6. 기타 주의 성분
('트리클로산', 'Triclosan', ARRAY['트리클로카반'], 7, 5, 3, 3, 3, '항균제',
 '항균 비누 등에 사용되던 성분.',
 '호르몬 교란, 내성균 유발',
 ARRAY['티트리오일', '살리실산']),

('미네랄오일', 'Mineral Oil', ARRAY['파라핀오일', '광물성오일', 'Paraffinum Liquidum'], 3, 2, 2, 5, 3, '오일',
 '석유에서 추출한 오일.',
 '모공 막힘, 지성 피부 트러블',
 ARRAY['호호바오일', '스쿠알란', '아르간오일']),

('실리콘', 'Dimethicone', ARRAY['디메치콘', '사이클로펜타실록산', 'Cyclomethicone'], 2, 2, 1, 4, 3, '실리콘',
 '피부 코팅, 부드러운 발림성.',
 '모공 막힘, 장기 사용 시 의존성',
 ARRAY['스쿠알란', '카프릴릭/카프릭트라이글리세라이드']),

('PEG', 'Polyethylene Glycol', ARRAY['PEG-100', 'PEG-40', '폴리에틸렌글라이콜'], 4, 3, 2, 2, 2, '유화제',
 '유화제 및 침투 촉진제.',
 '피부 장벽 약화',
 ARRAY['글리세릴스테아레이트', '세테아릴알코올']),

('탈크', 'Talc', ARRAY['활석', 'Talcum'], 4, 3, 3, 2, 2, '분말',
 '파우더류에 사용되는 광물 분말.',
 '석면 오염 우려, 흡입 주의',
 ARRAY['옥수수전분', '라이스파우더', '실리카']),

('레티놀', 'Retinol', ARRAY['비타민A', '레티닐팔미테이트', 'Retinyl Palmitate'], 5, 4, 3, 2, 3, '기능성',
 '비타민A 유도체. 강력한 안티에이징.',
 '초기 자극, 각질, 건조, 광과민',
 ARRAY['바쿠치올', '나이아신아마이드']),

('하이드로퀴논', 'Hydroquinone', ARRAY['하이드로퀴놀'], 8, 5, 4, 3, 4, '미백',
 '강력한 미백 성분.',
 '백반증, 자극, 장기사용 금지',
 ARRAY['알부틴', '비타민C', '나이아신아마이드']),

('AHA/BHA', 'Alpha/Beta Hydroxy Acid', ARRAY['글리콜산', '살리실산', '젖산', 'Glycolic Acid', 'Salicylic Acid', 'Lactic Acid'], 4, 4, 4, 2, 3, '각질제거',
 '글리콜산, 살리실산 등.',
 '자극, 건조, 광과민, 과사용 주의',
 ARRAY['PHA', '효소 각질제거제', '파파인']);
