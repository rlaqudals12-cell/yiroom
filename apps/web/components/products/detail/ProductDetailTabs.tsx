'use client';

import { ExternalLink, ShoppingCart } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  ProductType,
  AnyProduct,
  CosmeticProduct,
  SupplementProduct,
  WorkoutEquipment,
  HealthFood,
} from '@/types/product';

interface ProductDetailTabsProps {
  product: AnyProduct;
  productType: ProductType;
}

/**
 * 화장품 상세 탭
 */
function CosmeticTabs({ product }: { product: CosmeticProduct }) {
  return (
    <Tabs defaultValue="detail" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="detail">상세</TabsTrigger>
        <TabsTrigger value="ingredients">성분</TabsTrigger>
        <TabsTrigger value="purchase">구매</TabsTrigger>
      </TabsList>

      <TabsContent value="detail" className="space-y-4">
        {/* 피부 타입 */}
        {product.skinTypes && product.skinTypes.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">추천 피부 타입</h3>
            <div className="flex flex-wrap gap-1.5">
              {product.skinTypes.map((type) => (
                <Badge key={type} variant="secondary">
                  {type === 'dry' && '건성'}
                  {type === 'oily' && '지성'}
                  {type === 'combination' && '복합성'}
                  {type === 'sensitive' && '민감성'}
                  {type === 'normal' && '정상'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 피부 고민 */}
        {product.concerns && product.concerns.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">피부 고민</h3>
            <div className="flex flex-wrap gap-1.5">
              {product.concerns.map((concern) => (
                <Badge key={concern} variant="outline">
                  {concern === 'acne' && '여드름'}
                  {concern === 'aging' && '노화'}
                  {concern === 'whitening' && '미백'}
                  {concern === 'hydration' && '수분'}
                  {concern === 'pore' && '모공'}
                  {concern === 'redness' && '홍조'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 퍼스널 컬러 */}
        {product.personalColorSeasons && product.personalColorSeasons.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">추천 퍼스널 컬러</h3>
            <div className="flex flex-wrap gap-1.5">
              {product.personalColorSeasons.map((season) => (
                <Badge key={season} variant="secondary">
                  {season}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 카테고리 */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">카테고리</h3>
          <Badge variant="outline">{product.category}</Badge>
          {product.subcategory && (
            <Badge variant="outline" className="ml-1">
              {product.subcategory}
            </Badge>
          )}
        </div>
      </TabsContent>

      <TabsContent value="ingredients" className="space-y-4">
        {/* 주요 성분 */}
        {product.keyIngredients && product.keyIngredients.length > 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">주요 성분</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {product.keyIngredients.map((ingredient) => (
                  <li key={ingredient}>{ingredient}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">성분 정보가 없습니다.</p>
        )}

        {/* 주의 성분 */}
        {product.avoidIngredients && product.avoidIngredients.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-orange-700">주의 성분</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm text-orange-700">
                {product.avoidIngredients.map((ingredient) => (
                  <li key={ingredient}>{ingredient}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="purchase" className="space-y-4">
        <PurchaseTab product={product} />
      </TabsContent>
    </Tabs>
  );
}

/**
 * 영양제 상세 탭
 */
function SupplementTabs({ product }: { product: SupplementProduct }) {
  return (
    <Tabs defaultValue="detail" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="detail">상세</TabsTrigger>
        <TabsTrigger value="ingredients">성분</TabsTrigger>
        <TabsTrigger value="purchase">구매</TabsTrigger>
      </TabsList>

      <TabsContent value="detail" className="space-y-4">
        {/* 효능 */}
        {product.benefits && product.benefits.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">효능</h3>
            <div className="flex flex-wrap gap-1.5">
              {product.benefits.map((benefit) => (
                <Badge key={benefit} variant="secondary">
                  {benefit === 'skin' && '피부'}
                  {benefit === 'hair' && '모발'}
                  {benefit === 'energy' && '에너지'}
                  {benefit === 'immunity' && '면역'}
                  {benefit === 'digestion' && '소화'}
                  {benefit === 'sleep' && '수면'}
                  {benefit === 'muscle' && '근육'}
                  {benefit === 'bone' && '뼈'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 복용법 */}
        {product.dosage && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">복용법</h3>
            <p className="text-sm">{product.dosage}</p>
          </div>
        )}

        {/* 제공량 */}
        {product.totalServings && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">총 제공량</h3>
            <p className="text-sm">{product.totalServings}회분</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="ingredients" className="space-y-4">
        {/* 주요 성분 */}
        {product.mainIngredients && product.mainIngredients.length > 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">주요 성분</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm">
                {product.mainIngredients.map((ingredient) => (
                  <li key={ingredient.name} className="flex justify-between">
                    <span>{ingredient.name}</span>
                    <span className="text-muted-foreground">
                      {ingredient.amount}
                      {ingredient.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">성분 정보가 없습니다.</p>
        )}

        {/* 주의사항 */}
        {product.warnings && product.warnings.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-orange-700">주의사항</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm text-orange-700">
                {product.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="purchase" className="space-y-4">
        <PurchaseTab product={product} />
      </TabsContent>
    </Tabs>
  );
}

/**
 * 운동 기구 상세 탭
 */
function EquipmentTabs({ product }: { product: WorkoutEquipment }) {
  return (
    <Tabs defaultValue="detail" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="detail">상세</TabsTrigger>
        <TabsTrigger value="specs">사양</TabsTrigger>
        <TabsTrigger value="purchase">구매</TabsTrigger>
      </TabsList>

      <TabsContent value="detail" className="space-y-4">
        {/* 타겟 근육 */}
        {product.targetMuscles && product.targetMuscles.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">타겟 근육</h3>
            <div className="flex flex-wrap gap-1.5">
              {product.targetMuscles.map((muscle) => (
                <Badge key={muscle} variant="secondary">
                  {muscle === 'chest' && '가슴'}
                  {muscle === 'back' && '등'}
                  {muscle === 'shoulders' && '어깨'}
                  {muscle === 'arms' && '팔'}
                  {muscle === 'legs' && '다리'}
                  {muscle === 'core' && '코어'}
                  {muscle === 'full_body' && '전신'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 운동 타입 */}
        {product.exerciseTypes && product.exerciseTypes.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">운동 타입</h3>
            <div className="flex flex-wrap gap-1.5">
              {product.exerciseTypes.map((type) => (
                <Badge key={type} variant="outline">
                  {type === 'strength' && '근력'}
                  {type === 'cardio' && '유산소'}
                  {type === 'flexibility' && '유연성'}
                  {type === 'balance' && '균형'}
                  {type === 'plyometric' && '플라이오메트릭'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 장단점 */}
        {(product.pros || product.cons) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {product.pros && product.pros.length > 0 && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-green-700">장점</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-inside list-disc space-y-1 text-sm text-green-700">
                    {product.pros.map((pro, index) => (
                      <li key={index}>{pro}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {product.cons && product.cons.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-red-700">단점</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
                    {product.cons.map((con, index) => (
                      <li key={index}>{con}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="specs" className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">제품 사양</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              {product.material && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">재질</dt>
                  <dd>{product.material}</dd>
                </div>
              )}
              {product.weightKg && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">무게</dt>
                  <dd>{product.weightKg}kg</dd>
                </div>
              )}
              {product.weightRange && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">무게 범위</dt>
                  <dd>{product.weightRange}</dd>
                </div>
              )}
              {product.size && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">크기</dt>
                  <dd>{product.size}</dd>
                </div>
              )}
              {product.skillLevel && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">난이도</dt>
                  <dd>
                    {product.skillLevel === 'beginner' && '초급'}
                    {product.skillLevel === 'intermediate' && '중급'}
                    {product.skillLevel === 'advanced' && '고급'}
                    {product.skillLevel === 'all' && '전체'}
                  </dd>
                </div>
              )}
              {product.useLocation && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">사용 장소</dt>
                  <dd>
                    {product.useLocation === 'home' && '홈'}
                    {product.useLocation === 'gym' && '헬스장'}
                    {product.useLocation === 'outdoor' && '야외'}
                    {product.useLocation === 'all' && '전체'}
                  </dd>
                </div>
              )}
              {product.colorOptions && product.colorOptions.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">색상</dt>
                  <dd>{product.colorOptions.join(', ')}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* 특징 */}
        {product.features && product.features.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">특징</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {product.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="purchase" className="space-y-4">
        <PurchaseTab product={product} />
      </TabsContent>
    </Tabs>
  );
}

/**
 * 건강식품 상세 탭
 */
function HealthFoodTabs({ product }: { product: HealthFood }) {
  return (
    <Tabs defaultValue="detail" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="detail">상세</TabsTrigger>
        <TabsTrigger value="nutrition">영양정보</TabsTrigger>
        <TabsTrigger value="purchase">구매</TabsTrigger>
      </TabsList>

      <TabsContent value="detail" className="space-y-4">
        {/* 효능 */}
        {product.benefits && product.benefits.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">효능</h3>
            <div className="flex flex-wrap gap-1.5">
              {product.benefits.map((benefit) => (
                <Badge key={benefit} variant="secondary">
                  {benefit === 'muscle_gain' && '근육 증가'}
                  {benefit === 'weight_loss' && '체중 감량'}
                  {benefit === 'energy' && '에너지'}
                  {benefit === 'recovery' && '회복'}
                  {benefit === 'endurance' && '지구력'}
                  {benefit === 'hydration' && '수분 공급'}
                  {benefit === 'focus' && '집중력'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 식이 정보 */}
        {product.dietaryInfo && product.dietaryInfo.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">식이 정보</h3>
            <div className="flex flex-wrap gap-1.5">
              {product.dietaryInfo.map((info) => (
                <Badge key={info} variant="outline">
                  {info === 'vegan' && '비건'}
                  {info === 'vegetarian' && '채식'}
                  {info === 'gluten_free' && '글루텐프리'}
                  {info === 'lactose_free' && '유당프리'}
                  {info === 'keto' && '키토'}
                  {info === 'sugar_free' && '무설탕'}
                  {info === 'organic' && '유기농'}
                  {info === 'non_gmo' && 'Non-GMO'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 맛 옵션 */}
        {product.flavorOptions && product.flavorOptions.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">맛 옵션</h3>
            <div className="flex flex-wrap gap-1.5">
              {product.flavorOptions.map((flavor) => (
                <Badge key={flavor} variant="outline">
                  {flavor}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 알레르기 정보 */}
        {product.allergens && product.allergens.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-orange-700">알레르기 유발 성분</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {product.allergens.map((allergen) => (
                  <Badge key={allergen} variant="destructive">
                    {allergen}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="nutrition" className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">영양 정보</CardTitle>
            {product.servingSize && (
              <p className="text-sm text-muted-foreground">1회 제공량: {product.servingSize}</p>
            )}
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {product.caloriesPerServing !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">칼로리</dt>
                  <dd className="font-medium">{product.caloriesPerServing}kcal</dd>
                </div>
              )}
              {product.proteinG !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">단백질</dt>
                  <dd className="font-medium">{product.proteinG}g</dd>
                </div>
              )}
              {product.carbsG !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">탄수화물</dt>
                  <dd className="font-medium">{product.carbsG}g</dd>
                </div>
              )}
              {product.sugarG !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">당류</dt>
                  <dd className="font-medium">{product.sugarG}g</dd>
                </div>
              )}
              {product.fatG !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">지방</dt>
                  <dd className="font-medium">{product.fatG}g</dd>
                </div>
              )}
              {product.fiberG !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">식이섬유</dt>
                  <dd className="font-medium">{product.fiberG}g</dd>
                </div>
              )}
              {product.sodiumMg !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">나트륨</dt>
                  <dd className="font-medium">{product.sodiumMg}mg</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* 추가 영양소 */}
        {product.additionalNutrients && product.additionalNutrients.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">추가 영양 성분</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm">
                {product.additionalNutrients.map((nutrient) => (
                  <li key={nutrient.name} className="flex justify-between">
                    <span>{nutrient.name}</span>
                    <span className="text-muted-foreground">
                      {nutrient.amount}
                      {nutrient.unit}
                      {nutrient.dailyValuePercent && (
                        <span className="ml-1">({nutrient.dailyValuePercent}%)</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="purchase" className="space-y-4">
        <PurchaseTab product={product} />
      </TabsContent>
    </Tabs>
  );
}

/**
 * 구매 탭 (공통)
 */
function PurchaseTab({ product }: { product: AnyProduct }) {
  const purchaseUrl = 'purchaseUrl' in product ? product.purchaseUrl : undefined;
  const affiliateUrl = 'affiliateUrl' in product ? product.affiliateUrl : undefined;
  const finalUrl = purchaseUrl || affiliateUrl;

  if (!finalUrl) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">구매 링크 정보가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <Button asChild size="lg" className="w-full">
              <a href={finalUrl} target="_blank" rel="noopener noreferrer">
                <ShoppingCart className="mr-2 h-4 w-4" />
                구매하기
              </a>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <a href={finalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                상세 페이지 보기
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        외부 쇼핑몰로 이동합니다. 가격 및 재고는 판매처에서 확인해 주세요.
      </p>
    </div>
  );
}

/**
 * 제품 상세 탭 컴포넌트
 * - 제품 타입에 따라 적절한 탭 구조 렌더링
 */
export function ProductDetailTabs({ product, productType }: ProductDetailTabsProps) {
  switch (productType) {
    case 'cosmetic':
      return <CosmeticTabs product={product as CosmeticProduct} />;
    case 'supplement':
      return <SupplementTabs product={product as SupplementProduct} />;
    case 'workout_equipment':
      return <EquipmentTabs product={product as WorkoutEquipment} />;
    case 'health_food':
      return <HealthFoodTabs product={product as HealthFood} />;
    default:
      return null;
  }
}
