/**
 * 한국 화장품 시드 데이터
 * - K-뷰티 인기 제품 30개+
 * - 실제 바코드 + 성분 정보
 * - Supabase global_products 테이블 시드용
 */

import type { GlobalProduct } from '@/types/scan';

// ============================================
// 스킨케어 제품
// ============================================

const SKINCARE_PRODUCTS: GlobalProduct[] = [
  // SOME BY MI
  {
    id: 'seed_sbm_1',
    barcode: '8809598453234',
    name: 'AHA BHA PHA 30 Days Miracle Toner',
    nameEn: 'AHA BHA PHA 30 Days Miracle Toner',
    brand: 'SOME BY MI',
    category: 'skincare',
    ingredients: [
      { order: 1, inciName: 'WATER', nameKo: '정제수', concentration: 'high' },
      { order: 2, inciName: 'BUTYLENE GLYCOL', nameKo: '부틸렌글라이콜', concentration: 'high' },
      {
        order: 3,
        inciName: 'DIPROPYLENE GLYCOL',
        nameKo: '다이프로필렌글라이콜',
        concentration: 'medium',
      },
      {
        order: 4,
        inciName: 'GLYCOLIC ACID',
        nameKo: '글리콜릭애씨드',
        concentration: 'low',
        purpose: ['exfoliating'],
      },
      {
        order: 5,
        inciName: 'SALICYLIC ACID',
        nameKo: '살리실릭애씨드',
        concentration: 'low',
        purpose: ['exfoliating'],
      },
      {
        order: 6,
        inciName: 'LACTOBIONIC ACID',
        nameKo: '락토바이오닉애씨드',
        concentration: 'low',
        purpose: ['exfoliating'],
      },
      {
        order: 7,
        inciName: 'NIACINAMIDE',
        nameKo: '나이아신아마이드',
        concentration: 'medium',
        purpose: ['brightening'],
      },
      {
        order: 8,
        inciName: 'MELALEUCA ALTERNIFOLIA LEAF EXTRACT',
        nameKo: '티트리잎추출물',
        concentration: 'low',
        purpose: ['soothing'],
      },
    ],
    keyIngredients: ['AHA', 'BHA', 'PHA', '나이아신아마이드'],
    ewgGrade: 3,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'seed_sbm_2',
    barcode: '8809598453081',
    name: 'Miracle Repair Serum',
    nameEn: 'AHA BHA PHA 30 Days Miracle Serum',
    brand: 'SOME BY MI',
    category: 'skincare',
    ingredients: [
      {
        order: 1,
        inciName: 'MELALEUCA ALTERNIFOLIA LEAF WATER',
        nameKo: '티트리잎수',
        concentration: 'high',
      },
      { order: 2, inciName: 'GLYCERIN', nameKo: '글리세린', concentration: 'high' },
      {
        order: 3,
        inciName: 'NIACINAMIDE',
        nameKo: '나이아신아마이드',
        concentration: 'medium',
        purpose: ['brightening'],
      },
      {
        order: 4,
        inciName: 'ADENOSINE',
        nameKo: '아데노신',
        concentration: 'low',
        purpose: ['anti_aging'],
      },
    ],
    keyIngredients: ['티트리', '나이아신아마이드', '아데노신'],
    ewgGrade: 2,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // COSRX
  {
    id: 'seed_cosrx_1',
    barcode: '8809530069233',
    name: 'Advanced Snail 96 Mucin Power Essence',
    nameEn: 'Advanced Snail 96 Mucin Power Essence',
    brand: 'COSRX',
    category: 'skincare',
    ingredients: [
      {
        order: 1,
        inciName: 'SNAIL SECRETION FILTRATE',
        nameKo: '달팽이분비물여과물',
        concentration: 'high',
        purpose: ['moisturizing', 'soothing'],
      },
      {
        order: 2,
        inciName: 'BETAINE',
        nameKo: '베타인',
        concentration: 'medium',
        purpose: ['moisturizing'],
      },
      { order: 3, inciName: 'BUTYLENE GLYCOL', nameKo: '부틸렌글라이콜', concentration: 'medium' },
      { order: 4, inciName: '1,2-HEXANEDIOL', nameKo: '1,2-헥산다이올', concentration: 'low' },
      {
        order: 5,
        inciName: 'SODIUM HYALURONATE',
        nameKo: '히알루론산나트륨',
        concentration: 'low',
        purpose: ['moisturizing'],
      },
      {
        order: 6,
        inciName: 'PANTHENOL',
        nameKo: '판테놀',
        concentration: 'low',
        purpose: ['soothing'],
      },
      { order: 7, inciName: 'ARGININE', nameKo: '아르지닌', concentration: 'low' },
      {
        order: 8,
        inciName: 'ALLANTOIN',
        nameKo: '알란토인',
        concentration: 'low',
        purpose: ['soothing'],
      },
    ],
    keyIngredients: ['달팽이점액', '히알루론산', '판테놀'],
    ewgGrade: 2,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'seed_cosrx_2',
    barcode: '8809530060152',
    name: 'Low pH Good Morning Gel Cleanser',
    nameEn: 'Low pH Good Morning Gel Cleanser',
    brand: 'COSRX',
    category: 'skincare',
    ingredients: [
      { order: 1, inciName: 'WATER', nameKo: '정제수', concentration: 'high' },
      {
        order: 2,
        inciName: 'COCAMIDOPROPYL BETAINE',
        nameKo: '코카미도프로필베타인',
        concentration: 'medium',
      },
      {
        order: 3,
        inciName: 'SODIUM LAUROYL METHYL ISETHIONATE',
        nameKo: '소듐라우로일메틸이세티오네이트',
        concentration: 'medium',
      },
      { order: 4, inciName: 'POLYSORBATE 20', nameKo: '폴리소르베이트20', concentration: 'low' },
      {
        order: 5,
        inciName: 'STYRAX JAPONICUS BRANCH/FRUIT/LEAF EXTRACT',
        nameKo: '쪽동백나무추출물',
        concentration: 'low',
      },
      { order: 6, inciName: 'BUTYLENE GLYCOL', nameKo: '부틸렌글라이콜', concentration: 'low' },
      {
        order: 7,
        inciName: 'SACCHAROMYCES FERMENT',
        nameKo: '사카로마이세스발효물',
        concentration: 'low',
      },
      {
        order: 8,
        inciName: 'MELALEUCA ALTERNIFOLIA LEAF OIL',
        nameKo: '티트리잎오일',
        concentration: 'low',
        purpose: ['soothing'],
      },
    ],
    keyIngredients: ['티트리', '약산성 pH'],
    ewgGrade: 2,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'seed_cosrx_3',
    barcode: '8809530060534',
    name: 'AHA 7 Whitehead Power Liquid',
    nameEn: 'AHA 7 Whitehead Power Liquid',
    brand: 'COSRX',
    category: 'skincare',
    ingredients: [
      {
        order: 1,
        inciName: 'PYRUS MALUS (APPLE) FRUIT WATER',
        nameKo: '사과수',
        concentration: 'high',
      },
      { order: 2, inciName: 'BUTYLENE GLYCOL', nameKo: '부틸렌글라이콜', concentration: 'medium' },
      {
        order: 3,
        inciName: 'GLYCOLIC ACID',
        nameKo: '글리콜릭애씨드',
        concentration: 'medium',
        purpose: ['exfoliating'],
      },
      {
        order: 4,
        inciName: 'NIACINAMIDE',
        nameKo: '나이아신아마이드',
        concentration: 'low',
        purpose: ['brightening'],
      },
      {
        order: 5,
        inciName: 'SODIUM HYALURONATE',
        nameKo: '히알루론산나트륨',
        concentration: 'low',
        purpose: ['moisturizing'],
      },
      {
        order: 6,
        inciName: 'PANTHENOL',
        nameKo: '판테놀',
        concentration: 'low',
        purpose: ['soothing'],
      },
    ],
    keyIngredients: ['AHA 7%', '글리콜릭애씨드', '나이아신아마이드'],
    ewgGrade: 4,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'seed_cosrx_4',
    barcode: '8809530060541',
    name: 'BHA Blackhead Power Liquid',
    nameEn: 'BHA Blackhead Power Liquid',
    brand: 'COSRX',
    category: 'skincare',
    ingredients: [
      {
        order: 1,
        inciName: 'SALIX ALBA (WILLOW) BARK WATER',
        nameKo: '버드나무껍질수',
        concentration: 'high',
      },
      { order: 2, inciName: 'BUTYLENE GLYCOL', nameKo: '부틸렌글라이콜', concentration: 'medium' },
      {
        order: 3,
        inciName: 'BETAINE SALICYLATE',
        nameKo: '베타인살리실레이트',
        concentration: 'medium',
        purpose: ['exfoliating'],
      },
      {
        order: 4,
        inciName: 'NIACINAMIDE',
        nameKo: '나이아신아마이드',
        concentration: 'low',
        purpose: ['brightening'],
      },
      {
        order: 5,
        inciName: 'SODIUM HYALURONATE',
        nameKo: '히알루론산나트륨',
        concentration: 'low',
        purpose: ['moisturizing'],
      },
      { order: 6, inciName: '1,2-HEXANEDIOL', nameKo: '1,2-헥산다이올', concentration: 'low' },
    ],
    keyIngredients: ['BHA 4%', '살리실산', '나이아신아마이드'],
    ewgGrade: 3,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Klairs
  {
    id: 'seed_klairs_1',
    barcode: '8809572890260',
    name: 'Supple Preparation Facial Toner',
    nameEn: 'Supple Preparation Facial Toner',
    brand: 'Dear, Klairs',
    category: 'skincare',
    ingredients: [
      { order: 1, inciName: 'WATER', nameKo: '정제수', concentration: 'high' },
      { order: 2, inciName: 'BUTYLENE GLYCOL', nameKo: '부틸렌글라이콜', concentration: 'high' },
      { order: 3, inciName: 'DIMETHYL SULFONE', nameKo: '다이메틸설폰', concentration: 'medium' },
      {
        order: 4,
        inciName: 'BETAINE',
        nameKo: '베타인',
        concentration: 'medium',
        purpose: ['moisturizing'],
      },
      {
        order: 5,
        inciName: 'CAPRYLIC/CAPRIC TRIGLYCERIDE',
        nameKo: '카프릴릭/카프릭트리글리세라이드',
        concentration: 'low',
      },
      { order: 6, inciName: 'NATTO GUM', nameKo: '낫토검', concentration: 'low' },
      {
        order: 7,
        inciName: 'SODIUM HYALURONATE',
        nameKo: '히알루론산나트륨',
        concentration: 'low',
        purpose: ['moisturizing'],
      },
      { order: 8, inciName: 'DISODIUM EDTA', nameKo: '다이소듐이디티에이', concentration: 'low' },
      {
        order: 9,
        inciName: 'CENTELLA ASIATICA EXTRACT',
        nameKo: '센텔라아시아티카추출물',
        concentration: 'low',
        purpose: ['soothing'],
      },
    ],
    keyIngredients: ['히알루론산', '베타인', '센텔라아시아티카'],
    ewgGrade: 2,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'seed_klairs_2',
    barcode: '8809572890659',
    name: 'Freshly Juiced Vitamin Drop',
    nameEn: 'Freshly Juiced Vitamin Drop',
    brand: 'Dear, Klairs',
    category: 'skincare',
    ingredients: [
      { order: 1, inciName: 'WATER', nameKo: '정제수', concentration: 'high' },
      { order: 2, inciName: 'PROPANEDIOL', nameKo: '프로판다이올', concentration: 'medium' },
      {
        order: 3,
        inciName: 'ASCORBIC ACID',
        nameKo: '아스코르빅애씨드',
        concentration: 'medium',
        purpose: ['brightening'],
      },
      {
        order: 4,
        inciName: 'SODIUM ASCORBYL PHOSPHATE',
        nameKo: '소듐아스코빌포스페이트',
        concentration: 'low',
        purpose: ['brightening'],
      },
      {
        order: 5,
        inciName: 'PRUNUS ARMENIACA KERNEL OIL',
        nameKo: '살구씨오일',
        concentration: 'low',
        purpose: ['moisturizing'],
      },
      {
        order: 6,
        inciName: 'HIPPOPHAE RHAMNOIDES FRUIT EXTRACT',
        nameKo: '비타민나무열매추출물',
        concentration: 'low',
      },
      {
        order: 7,
        inciName: 'PANTHENOL',
        nameKo: '판테놀',
        concentration: 'low',
        purpose: ['soothing'],
      },
      {
        order: 8,
        inciName: 'CENTELLA ASIATICA EXTRACT',
        nameKo: '센텔라아시아티카추출물',
        concentration: 'low',
        purpose: ['soothing'],
      },
    ],
    keyIngredients: ['비타민C 5%', '아스코르빅애씨드', '판테놀'],
    ewgGrade: 3,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // ISNTREE
  {
    id: 'seed_isntree_1',
    barcode: '8809340782018',
    name: 'Hyaluronic Acid Toner',
    nameEn: 'Hyaluronic Acid Toner',
    brand: 'ISNTREE',
    category: 'skincare',
    ingredients: [
      { order: 1, inciName: 'WATER', nameKo: '정제수', concentration: 'high' },
      { order: 2, inciName: 'BUTYLENE GLYCOL', nameKo: '부틸렌글라이콜', concentration: 'high' },
      {
        order: 3,
        inciName: 'GLYCERIN',
        nameKo: '글리세린',
        concentration: 'medium',
        purpose: ['moisturizing'],
      },
      {
        order: 4,
        inciName: 'SODIUM HYALURONATE',
        nameKo: '히알루론산나트륨',
        concentration: 'medium',
        purpose: ['moisturizing'],
      },
      {
        order: 5,
        inciName: 'HYDROLYZED HYALURONIC ACID',
        nameKo: '가수분해히알루론산',
        concentration: 'low',
        purpose: ['moisturizing'],
      },
      {
        order: 6,
        inciName: 'PANTHENOL',
        nameKo: '판테놀',
        concentration: 'low',
        purpose: ['soothing'],
      },
      {
        order: 7,
        inciName: 'ALLANTOIN',
        nameKo: '알란토인',
        concentration: 'low',
        purpose: ['soothing'],
      },
    ],
    keyIngredients: ['히알루론산', '판테놀', '알란토인'],
    ewgGrade: 1,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // 아이소이 (ISOI)
  {
    id: 'seed_isoi_1',
    barcode: '8809389031024',
    name: 'Bulgarian Rose Blemish Care Serum',
    nameEn: 'Bulgarian Rose Blemish Care Serum',
    brand: 'ISOI',
    category: 'skincare',
    ingredients: [
      {
        order: 1,
        inciName: 'ROSA DAMASCENA FLOWER WATER',
        nameKo: '다마스크장미꽃수',
        concentration: 'high',
        purpose: ['soothing'],
      },
      { order: 2, inciName: 'BUTYLENE GLYCOL', nameKo: '부틸렌글라이콜', concentration: 'medium' },
      {
        order: 3,
        inciName: 'NIACINAMIDE',
        nameKo: '나이아신아마이드',
        concentration: 'medium',
        purpose: ['brightening'],
      },
      {
        order: 4,
        inciName: 'ROSA DAMASCENA FLOWER OIL',
        nameKo: '다마스크장미꽃오일',
        concentration: 'low',
      },
      {
        order: 5,
        inciName: 'ADENOSINE',
        nameKo: '아데노신',
        concentration: 'low',
        purpose: ['anti_aging'],
      },
    ],
    keyIngredients: ['불가리안로즈', '나이아신아마이드', '아데노신'],
    ewgGrade: 2,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // 넘버즈인 (numbuzin)
  {
    id: 'seed_numbuzin_1',
    barcode: '8809661710029',
    name: 'No.3 Super Glowing Essence Toner',
    nameEn: 'No.3 Super Glowing Essence Toner',
    brand: 'numbuzin',
    category: 'skincare',
    ingredients: [
      {
        order: 1,
        inciName: 'GALACTOMYCES FERMENT FILTRATE',
        nameKo: '갈락토미세스발효여과물',
        concentration: 'high',
        purpose: ['brightening'],
      },
      {
        order: 2,
        inciName: 'GLYCERIN',
        nameKo: '글리세린',
        concentration: 'medium',
        purpose: ['moisturizing'],
      },
      {
        order: 3,
        inciName: 'NIACINAMIDE',
        nameKo: '나이아신아마이드',
        concentration: 'medium',
        purpose: ['brightening'],
      },
      {
        order: 4,
        inciName: 'BIFIDA FERMENT LYSATE',
        nameKo: '비피다발효용해물',
        concentration: 'low',
        purpose: ['anti_aging'],
      },
      {
        order: 5,
        inciName: 'SODIUM HYALURONATE',
        nameKo: '히알루론산나트륨',
        concentration: 'low',
        purpose: ['moisturizing'],
      },
    ],
    keyIngredients: ['갈락토미세스', '나이아신아마이드', '비피다'],
    ewgGrade: 2,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'seed_numbuzin_2',
    barcode: '8809661710340',
    name: 'No.5 Vitamin-Niacinamide Concentrated Pad',
    nameEn: 'No.5 Vitamin-Niacinamide Concentrated Pad',
    brand: 'numbuzin',
    category: 'skincare',
    ingredients: [
      { order: 1, inciName: 'WATER', nameKo: '정제수', concentration: 'high' },
      {
        order: 2,
        inciName: 'NIACINAMIDE',
        nameKo: '나이아신아마이드',
        concentration: 'high',
        purpose: ['brightening'],
      },
      {
        order: 3,
        inciName: 'GLYCERIN',
        nameKo: '글리세린',
        concentration: 'medium',
        purpose: ['moisturizing'],
      },
      {
        order: 4,
        inciName: 'ASCORBYL GLUCOSIDE',
        nameKo: '아스코빌글루코사이드',
        concentration: 'medium',
        purpose: ['brightening'],
      },
      {
        order: 5,
        inciName: 'TRANEXAMIC ACID',
        nameKo: '트라넥사믹애씨드',
        concentration: 'low',
        purpose: ['brightening'],
      },
    ],
    keyIngredients: ['나이아신아마이드 10%', '비타민C', '트라넥사믹애씨드'],
    ewgGrade: 2,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // 토리든 (Torriden)
  {
    id: 'seed_torriden_1',
    barcode: '8809784600171',
    name: 'DIVE-IN Low Molecule Hyaluronic Acid Serum',
    nameEn: 'DIVE-IN Low Molecule Hyaluronic Acid Serum',
    brand: 'Torriden',
    category: 'skincare',
    ingredients: [
      { order: 1, inciName: 'WATER', nameKo: '정제수', concentration: 'high' },
      {
        order: 2,
        inciName: 'SODIUM HYALURONATE',
        nameKo: '히알루론산나트륨',
        concentration: 'high',
        purpose: ['moisturizing'],
      },
      {
        order: 3,
        inciName: 'GLYCERIN',
        nameKo: '글리세린',
        concentration: 'medium',
        purpose: ['moisturizing'],
      },
      {
        order: 4,
        inciName: 'PANTHENOL',
        nameKo: '판테놀',
        concentration: 'medium',
        purpose: ['soothing'],
      },
      {
        order: 5,
        inciName: 'HYDROLYZED HYALURONIC ACID',
        nameKo: '가수분해히알루론산',
        concentration: 'low',
        purpose: ['moisturizing'],
      },
      {
        order: 6,
        inciName: 'HYALURONIC ACID',
        nameKo: '히알루론산',
        concentration: 'low',
        purpose: ['moisturizing'],
      },
      {
        order: 7,
        inciName: 'ALLANTOIN',
        nameKo: '알란토인',
        concentration: 'low',
        purpose: ['soothing'],
      },
    ],
    keyIngredients: ['5종 히알루론산', '판테놀', '알란토인'],
    ewgGrade: 1,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'seed_torriden_2',
    barcode: '8809784600188',
    name: 'DIVE-IN Low Molecule Hyaluronic Acid Toner',
    nameEn: 'DIVE-IN Low Molecule Hyaluronic Acid Toner',
    brand: 'Torriden',
    category: 'skincare',
    ingredients: [
      { order: 1, inciName: 'WATER', nameKo: '정제수', concentration: 'high' },
      { order: 2, inciName: 'PENTYLENE GLYCOL', nameKo: '펜틸렌글라이콜', concentration: 'medium' },
      {
        order: 3,
        inciName: 'SODIUM HYALURONATE',
        nameKo: '히알루론산나트륨',
        concentration: 'medium',
        purpose: ['moisturizing'],
      },
      {
        order: 4,
        inciName: 'PANTHENOL',
        nameKo: '판테놀',
        concentration: 'low',
        purpose: ['soothing'],
      },
      {
        order: 5,
        inciName: 'ALLANTOIN',
        nameKo: '알란토인',
        concentration: 'low',
        purpose: ['soothing'],
      },
    ],
    keyIngredients: ['5종 히알루론산', '판테놀'],
    ewgGrade: 1,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // 라운드랩 (Round Lab)
  {
    id: 'seed_roundlab_1',
    barcode: '8809721505618',
    name: '독도 토너',
    nameEn: 'Dokdo Toner',
    brand: 'Round Lab',
    category: 'skincare',
    ingredients: [
      {
        order: 1,
        inciName: 'DEEP SEA WATER',
        nameKo: '해양심층수',
        concentration: 'high',
        purpose: ['moisturizing'],
      },
      { order: 2, inciName: 'BUTYLENE GLYCOL', nameKo: '부틸렌글라이콜', concentration: 'medium' },
      {
        order: 3,
        inciName: 'GLYCERIN',
        nameKo: '글리세린',
        concentration: 'medium',
        purpose: ['moisturizing'],
      },
      {
        order: 4,
        inciName: 'SODIUM HYALURONATE',
        nameKo: '히알루론산나트륨',
        concentration: 'low',
        purpose: ['moisturizing'],
      },
      {
        order: 5,
        inciName: 'PANTHENOL',
        nameKo: '판테놀',
        concentration: 'low',
        purpose: ['soothing'],
      },
      {
        order: 6,
        inciName: 'BETAINE',
        nameKo: '베타인',
        concentration: 'low',
        purpose: ['moisturizing'],
      },
    ],
    keyIngredients: ['독도 해양심층수', '히알루론산', '판테놀'],
    ewgGrade: 1,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'seed_roundlab_2',
    barcode: '8809721505625',
    name: '독도 로션',
    nameEn: 'Dokdo Lotion',
    brand: 'Round Lab',
    category: 'skincare',
    ingredients: [
      {
        order: 1,
        inciName: 'DEEP SEA WATER',
        nameKo: '해양심층수',
        concentration: 'high',
        purpose: ['moisturizing'],
      },
      {
        order: 2,
        inciName: 'GLYCERIN',
        nameKo: '글리세린',
        concentration: 'medium',
        purpose: ['moisturizing'],
      },
      {
        order: 3,
        inciName: 'CAPRYLIC/CAPRIC TRIGLYCERIDE',
        nameKo: '카프릴릭/카프릭트리글리세라이드',
        concentration: 'medium',
      },
      {
        order: 4,
        inciName: 'SQUALANE',
        nameKo: '스쿠알란',
        concentration: 'low',
        purpose: ['moisturizing'],
      },
      {
        order: 5,
        inciName: 'SODIUM HYALURONATE',
        nameKo: '히알루론산나트륨',
        concentration: 'low',
        purpose: ['moisturizing'],
      },
    ],
    keyIngredients: ['독도 해양심층수', '스쿠알란', '히알루론산'],
    ewgGrade: 1,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // 메디힐 (MEDIHEAL)
  {
    id: 'seed_mediheal_1',
    barcode: '8809470126754',
    name: 'N.M.F 인텐시브 하이드레이팅 세럼',
    nameEn: 'N.M.F Intensive Hydrating Serum',
    brand: 'MEDIHEAL',
    category: 'skincare',
    ingredients: [
      { order: 1, inciName: 'WATER', nameKo: '정제수', concentration: 'high' },
      {
        order: 2,
        inciName: 'GLYCERIN',
        nameKo: '글리세린',
        concentration: 'high',
        purpose: ['moisturizing'],
      },
      {
        order: 3,
        inciName: 'SODIUM HYALURONATE',
        nameKo: '히알루론산나트륨',
        concentration: 'medium',
        purpose: ['moisturizing'],
      },
      {
        order: 4,
        inciName: 'TREHALOSE',
        nameKo: '트레할로스',
        concentration: 'medium',
        purpose: ['moisturizing'],
      },
      {
        order: 5,
        inciName: 'PANTHENOL',
        nameKo: '판테놀',
        concentration: 'low',
        purpose: ['soothing'],
      },
      {
        order: 6,
        inciName: 'ALLANTOIN',
        nameKo: '알란토인',
        concentration: 'low',
        purpose: ['soothing'],
      },
    ],
    keyIngredients: ['히알루론산', 'N.M.F', '판테놀'],
    ewgGrade: 1,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // 닥터지 (Dr.G)
  {
    id: 'seed_drg_1',
    barcode: '8806173572656',
    name: 'R.E.D Blemish Clear Soothing Cream',
    nameEn: 'R.E.D Blemish Clear Soothing Cream',
    brand: 'Dr.G',
    category: 'skincare',
    ingredients: [
      { order: 1, inciName: 'WATER', nameKo: '정제수', concentration: 'high' },
      {
        order: 2,
        inciName: 'GLYCERIN',
        nameKo: '글리세린',
        concentration: 'medium',
        purpose: ['moisturizing'],
      },
      {
        order: 3,
        inciName: 'CENTELLA ASIATICA EXTRACT',
        nameKo: '센텔라아시아티카추출물',
        concentration: 'medium',
        purpose: ['soothing'],
      },
      {
        order: 4,
        inciName: 'MADECASSOSIDE',
        nameKo: '마데카소사이드',
        concentration: 'low',
        purpose: ['soothing'],
      },
      {
        order: 5,
        inciName: 'PANTHENOL',
        nameKo: '판테놀',
        concentration: 'low',
        purpose: ['soothing'],
      },
      {
        order: 6,
        inciName: 'ALLANTOIN',
        nameKo: '알란토인',
        concentration: 'low',
        purpose: ['soothing'],
      },
    ],
    keyIngredients: ['센텔라아시아티카', '마데카소사이드', '판테놀'],
    ewgGrade: 2,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // 아이오페 (IOPE)
  {
    id: 'seed_iope_1',
    barcode: '8806390531015',
    name: '레티놀 엑스퍼트 0.1%',
    nameEn: 'Retinol Expert 0.1%',
    brand: 'IOPE',
    category: 'skincare',
    ingredients: [
      { order: 1, inciName: 'WATER', nameKo: '정제수', concentration: 'high' },
      {
        order: 2,
        inciName: 'CAPRYLIC/CAPRIC TRIGLYCERIDE',
        nameKo: '카프릴릭/카프릭트리글리세라이드',
        concentration: 'medium',
      },
      {
        order: 3,
        inciName: 'RETINOL',
        nameKo: '레티놀',
        concentration: 'low',
        purpose: ['anti_aging'],
      },
      {
        order: 4,
        inciName: 'NIACINAMIDE',
        nameKo: '나이아신아마이드',
        concentration: 'low',
        purpose: ['brightening'],
      },
      {
        order: 5,
        inciName: 'ADENOSINE',
        nameKo: '아데노신',
        concentration: 'low',
        purpose: ['anti_aging'],
      },
      {
        order: 6,
        inciName: 'TOCOPHERYL ACETATE',
        nameKo: '토코페릴아세테이트',
        concentration: 'low',
      },
    ],
    keyIngredients: ['레티놀 0.1%', '나이아신아마이드', '아데노신'],
    ewgGrade: 4,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// ============================================
// 선케어 제품
// ============================================

const SUNCARE_PRODUCTS: GlobalProduct[] = [
  // 이니스프리 (innisfree)
  {
    id: 'seed_innisfree_sun_1',
    barcode: '8809652590141',
    name: '데일리 UV 디펜스 선스크린',
    nameEn: 'Daily UV Defense Sunscreen SPF36',
    brand: 'innisfree',
    category: 'suncare',
    ingredients: [
      { order: 1, inciName: 'WATER', nameKo: '정제수', concentration: 'high' },
      {
        order: 2,
        inciName: 'ZINC OXIDE',
        nameKo: '징크옥사이드',
        concentration: 'medium',
        purpose: ['other'],
      },
      {
        order: 3,
        inciName: 'TITANIUM DIOXIDE',
        nameKo: '티타늄디옥사이드',
        concentration: 'medium',
        purpose: ['other'],
      },
      {
        order: 4,
        inciName: 'GLYCERIN',
        nameKo: '글리세린',
        concentration: 'low',
        purpose: ['moisturizing'],
      },
      { order: 5, inciName: 'BUTYLENE GLYCOL', nameKo: '부틸렌글라이콜', concentration: 'low' },
    ],
    keyIngredients: ['SPF36 PA++', '물리자외선차단'],
    ewgGrade: 2,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // 비오레 (Biore) - 일본 브랜드지만 한국에서 인기
  {
    id: 'seed_biore_1',
    barcode: '4901301363527',
    name: 'UV 아쿠아 리치 워터리 에센스',
    nameEn: 'UV Aqua Rich Watery Essence SPF50+',
    brand: 'Biore',
    category: 'suncare',
    ingredients: [
      { order: 1, inciName: 'WATER', nameKo: '정제수', concentration: 'high' },
      {
        order: 2,
        inciName: 'ETHYLHEXYL METHOXYCINNAMATE',
        nameKo: '에틸헥실메톡시신나메이트',
        concentration: 'medium',
        purpose: ['other'],
      },
      {
        order: 3,
        inciName: 'DIETHYLAMINO HYDROXYBENZOYL HEXYL BENZOATE',
        nameKo: '유비놀A플러스',
        concentration: 'medium',
        purpose: ['other'],
      },
      {
        order: 4,
        inciName: 'HYALURONIC ACID',
        nameKo: '히알루론산',
        concentration: 'low',
        purpose: ['moisturizing'],
      },
    ],
    keyIngredients: ['SPF50+ PA++++', '히알루론산'],
    ewgGrade: 4,
    originCountry: 'Japan',
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // 라운드랩 선케어
  {
    id: 'seed_roundlab_sun_1',
    barcode: '8809721505588',
    name: '자작나무 수분 선크림',
    nameEn: 'Birch Juice Moisturizing Sun Cream SPF50+',
    brand: 'Round Lab',
    category: 'suncare',
    ingredients: [
      { order: 1, inciName: 'BETULA ALBA JUICE', nameKo: '자작나무수액', concentration: 'high' },
      {
        order: 2,
        inciName: 'ZINC OXIDE',
        nameKo: '징크옥사이드',
        concentration: 'medium',
        purpose: ['other'],
      },
      {
        order: 3,
        inciName: 'GLYCERIN',
        nameKo: '글리세린',
        concentration: 'medium',
        purpose: ['moisturizing'],
      },
      {
        order: 4,
        inciName: 'NIACINAMIDE',
        nameKo: '나이아신아마이드',
        concentration: 'low',
        purpose: ['brightening'],
      },
      {
        order: 5,
        inciName: 'CENTELLA ASIATICA EXTRACT',
        nameKo: '센텔라아시아티카추출물',
        concentration: 'low',
        purpose: ['soothing'],
      },
    ],
    keyIngredients: ['SPF50+ PA++++', '자작나무수액', '센텔라'],
    ewgGrade: 2,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// ============================================
// 메이크업 제품
// ============================================

const MAKEUP_PRODUCTS: GlobalProduct[] = [
  // 롬앤 (rom&nd)
  {
    id: 'seed_romand_1',
    barcode: '8809625249038',
    name: '쥬시 래스팅 틴트',
    nameEn: 'Juicy Lasting Tint',
    brand: 'rom&nd',
    category: 'makeup',
    ingredients: [
      { order: 1, inciName: 'POLYBUTENE', nameKo: '폴리부텐', concentration: 'high' },
      {
        order: 2,
        inciName: 'DIISOSTEARYL MALATE',
        nameKo: '다이아이소스테아릴말레이트',
        concentration: 'medium',
      },
      {
        order: 3,
        inciName: 'HYDROGENATED POLY(C6-14 OLEFIN)',
        nameKo: '하이드로제네이티드폴리',
        concentration: 'medium',
      },
      {
        order: 4,
        inciName: 'ETHYLHEXYL PALMITATE',
        nameKo: '에틸헥실팔미테이트',
        concentration: 'low',
      },
      {
        order: 5,
        inciName: 'SQUALANE',
        nameKo: '스쿠알란',
        concentration: 'low',
        purpose: ['moisturizing'],
      },
    ],
    keyIngredients: ['스쿠알란', '쥬시 글로우'],
    ewgGrade: 3,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'seed_romand_2',
    barcode: '8809625249120',
    name: '블러 퍼지 틴트',
    nameEn: 'Blur Fudge Tint',
    brand: 'rom&nd',
    category: 'makeup',
    ingredients: [
      { order: 1, inciName: 'DIMETHICONE', nameKo: '다이메티콘', concentration: 'high' },
      { order: 2, inciName: 'ISODODECANE', nameKo: '아이소도데칸', concentration: 'medium' },
      { order: 3, inciName: 'SILICA', nameKo: '실리카', concentration: 'medium' },
      {
        order: 4,
        inciName: 'POLYGLYCERYL-2 DIISOSTEARATE',
        nameKo: '폴리글리세릴-2디이소스테아레이트',
        concentration: 'low',
      },
    ],
    keyIngredients: ['소프트 매트', '블러'],
    ewgGrade: 2,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // 페리페라 (PERIPERA)
  {
    id: 'seed_peripera_1',
    barcode: '8809581470316',
    name: '잉크 더 에어리 벨벳',
    nameEn: 'Ink The Airy Velvet',
    brand: 'PERIPERA',
    category: 'makeup',
    ingredients: [
      { order: 1, inciName: 'DIMETHICONE', nameKo: '다이메티콘', concentration: 'high' },
      {
        order: 2,
        inciName: 'CYCLOPENTASILOXANE',
        nameKo: '사이클로펜타실록산',
        concentration: 'medium',
      },
      { order: 3, inciName: 'ISODODECANE', nameKo: '아이소도데칸', concentration: 'medium' },
      {
        order: 4,
        inciName: 'SYNTHETIC FLUORPHLOGOPITE',
        nameKo: '합성플루오르플로고파이트',
        concentration: 'low',
      },
    ],
    keyIngredients: ['에어리 텍스처', '벨벳 피니시'],
    ewgGrade: 2,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // 클리오 (CLIO)
  {
    id: 'seed_clio_1',
    barcode: '8809647390268',
    name: '킬커버 파운웨어 쿠션',
    nameEn: 'Kill Cover Foun-Wear Cushion SPF50+',
    brand: 'CLIO',
    category: 'makeup',
    ingredients: [
      { order: 1, inciName: 'WATER', nameKo: '정제수', concentration: 'high' },
      {
        order: 2,
        inciName: 'CYCLOPENTASILOXANE',
        nameKo: '사이클로펜타실록산',
        concentration: 'medium',
      },
      {
        order: 3,
        inciName: 'TITANIUM DIOXIDE',
        nameKo: '티타늄디옥사이드',
        concentration: 'medium',
        purpose: ['other'],
      },
      {
        order: 4,
        inciName: 'ETHYLHEXYL METHOXYCINNAMATE',
        nameKo: '에틸헥실메톡시신나메이트',
        concentration: 'low',
        purpose: ['other'],
      },
      {
        order: 5,
        inciName: 'NIACINAMIDE',
        nameKo: '나이아신아마이드',
        concentration: 'low',
        purpose: ['brightening'],
      },
    ],
    keyIngredients: ['SPF50+ PA+++', '풀커버', '지속력'],
    ewgGrade: 3,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // 에뛰드 (ETUDE)
  {
    id: 'seed_etude_1',
    barcode: '8806382640122',
    name: '픽싱 틴트',
    nameEn: 'Fixing Tint',
    brand: 'ETUDE',
    category: 'makeup',
    ingredients: [
      { order: 1, inciName: 'DIMETHICONE', nameKo: '다이메티콘', concentration: 'high' },
      { order: 2, inciName: 'ISODODECANE', nameKo: '아이소도데칸', concentration: 'medium' },
      {
        order: 3,
        inciName: 'TRIMETHYLSILOXYSILICATE',
        nameKo: '트리메틸실록시실리케이트',
        concentration: 'medium',
      },
      { order: 4, inciName: 'CAPRYLYL METHICONE', nameKo: '카프릴릴메티콘', concentration: 'low' },
    ],
    keyIngredients: ['12시간 지속', '색상 고정'],
    ewgGrade: 2,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// ============================================
// 헤어케어 제품
// ============================================

const HAIRCARE_PRODUCTS: GlobalProduct[] = [
  // 아모레퍼시픽 미장센
  {
    id: 'seed_miseenscene_1',
    barcode: '8801042785212',
    name: '퍼펙트 세럼 오리지널',
    nameEn: 'Perfect Serum Original',
    brand: 'mise en scène',
    category: 'haircare',
    ingredients: [
      { order: 1, inciName: 'CYCLOMETHICONE', nameKo: '사이클로메티콘', concentration: 'high' },
      { order: 2, inciName: 'DIMETHICONE', nameKo: '다이메티콘', concentration: 'medium' },
      {
        order: 3,
        inciName: 'ARGANIA SPINOSA KERNEL OIL',
        nameKo: '아르간오일',
        concentration: 'low',
        purpose: ['moisturizing'],
      },
      {
        order: 4,
        inciName: 'CAMELLIA JAPONICA SEED OIL',
        nameKo: '동백오일',
        concentration: 'low',
        purpose: ['moisturizing'],
      },
    ],
    keyIngredients: ['아르간오일', '동백오일', '7가지 오일'],
    ewgGrade: 3,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // 라보에이치 (Labo-H)
  {
    id: 'seed_laboh_1',
    barcode: '8809803531018',
    name: '탈모 케어 샴푸',
    nameEn: 'Hair Loss Care Shampoo',
    brand: 'Labo-H',
    category: 'haircare',
    ingredients: [
      { order: 1, inciName: 'WATER', nameKo: '정제수', concentration: 'high' },
      {
        order: 2,
        inciName: 'SODIUM LAURETH SULFATE',
        nameKo: '소듐라우레스설페이트',
        concentration: 'medium',
      },
      { order: 3, inciName: 'BIOTIN', nameKo: '비오틴', concentration: 'low', purpose: ['other'] },
      { order: 4, inciName: 'NIACINAMIDE', nameKo: '나이아신아마이드', concentration: 'low' },
      {
        order: 5,
        inciName: 'CAFFEINE',
        nameKo: '카페인',
        concentration: 'low',
        purpose: ['other'],
      },
    ],
    keyIngredients: ['비오틴', '카페인', '탈모 케어'],
    ewgGrade: 3,
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // 모로칸오일 (Moroccanoil)
  {
    id: 'seed_moroccanoil_1',
    barcode: '7290013627537',
    name: '트리트먼트 오일',
    nameEn: 'Moroccanoil Treatment',
    brand: 'Moroccanoil',
    category: 'haircare',
    ingredients: [
      { order: 1, inciName: 'CYCLOMETHICONE', nameKo: '사이클로메티콘', concentration: 'high' },
      { order: 2, inciName: 'DIMETHICONE', nameKo: '다이메티콘', concentration: 'medium' },
      {
        order: 3,
        inciName: 'ARGANIA SPINOSA KERNEL OIL',
        nameKo: '아르간오일',
        concentration: 'medium',
        purpose: ['moisturizing'],
      },
      {
        order: 4,
        inciName: 'LINUM USITATISSIMUM SEED EXTRACT',
        nameKo: '아마씨추출물',
        concentration: 'low',
      },
    ],
    keyIngredients: ['아르간오일', '실크 피니시'],
    ewgGrade: 3,
    originCountry: 'Israel',
    dataSource: 'manual',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// ============================================
// 통합 Export
// ============================================

/**
 * 전체 한국 제품 시드 데이터
 */
export const KOREAN_PRODUCTS_SEED: GlobalProduct[] = [
  ...SKINCARE_PRODUCTS,
  ...SUNCARE_PRODUCTS,
  ...MAKEUP_PRODUCTS,
  ...HAIRCARE_PRODUCTS,
];

/**
 * 바코드로 제품 검색 (Mock용)
 */
export function findProductByBarcode(barcode: string): GlobalProduct | undefined {
  return KOREAN_PRODUCTS_SEED.find((p) => p.barcode === barcode);
}

/**
 * 브랜드별 제품 그룹화
 */
export function getProductsByBrand(): Record<string, GlobalProduct[]> {
  return KOREAN_PRODUCTS_SEED.reduce(
    (acc, product) => {
      const brand = product.brand;
      if (!acc[brand]) {
        acc[brand] = [];
      }
      acc[brand].push(product);
      return acc;
    },
    {} as Record<string, GlobalProduct[]>
  );
}

/**
 * 카테고리별 제품 그룹화
 */
export function getProductsByCategory(): Record<string, GlobalProduct[]> {
  return KOREAN_PRODUCTS_SEED.reduce(
    (acc, product) => {
      const category = product.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    },
    {} as Record<string, GlobalProduct[]>
  );
}

/**
 * 성분으로 제품 검색
 */
export function searchProductsByIngredient(ingredientName: string): GlobalProduct[] {
  const upper = ingredientName.toUpperCase();
  return KOREAN_PRODUCTS_SEED.filter((product) =>
    product.ingredients?.some(
      (ing) => ing.inciName.includes(upper) || ing.nameKo?.includes(ingredientName)
    )
  );
}

/**
 * 제품 개수 통계
 */
export const SEED_STATS = {
  total: KOREAN_PRODUCTS_SEED.length,
  skincare: SKINCARE_PRODUCTS.length,
  suncare: SUNCARE_PRODUCTS.length,
  makeup: MAKEUP_PRODUCTS.length,
  haircare: HAIRCARE_PRODUCTS.length,
};
