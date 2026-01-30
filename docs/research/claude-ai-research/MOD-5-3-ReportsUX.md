# MOD-5-3: Reports UX 트렌드 (2025-2026)

리포트 UX는 **스크롤 내러티브 + 카드 기반 모듈화**로 진화하고 있다. PDF 생성은 **백그라운드 + 프로그레스 인디케이터**가 표준이 되었으며, 공유 기능은 **미리보기 카드(OG) + 딥링크**가 필수다. 인쇄 최적화는 **@media print CSS + 프린트 스타일시트 분리**, 데이터 내보내기는 **다양한 포맷(CSV, JSON, Excel) 선택권**, 인터랙티브 리포트는 **D3.js/Chart.js 기반 드릴다운 차트**가 핵심 트렌드다.

---

## 1. 핵심 요약

- **레이아웃**: 모바일 퍼스트 + 카드 기반 모듈화 + 스크롤 스토리텔링이 지배적
- **PDF 생성**: 클라이언트 사이드 생성(@react-pdf) 또는 서버 사이드(Puppeteer/wkhtmltopdf)의 하이브리드 전략
- **공유**: OG 메타태그 + 동적 이미지 생성(og:image) + 딥링크/유니버설 링크 필수
- **인쇄**: CSS @media print + 페이지 브레이크 제어 + 배경색/이미지 처리
- **내보내기**: 다중 포맷 지원(PDF, CSV, Excel, JSON) + 부분 선택 내보내기
- **인터랙티브**: 호버 툴팁 + 드릴다운 + 필터링 가능한 시각화 컴포넌트

---

## 2. 상세 내용

### 2.1 레이아웃 패턴

#### 2.1.1 카드 기반 모듈화

2025-2026년 리포트 레이아웃의 핵심은 **카드 기반 모듈화 시스템**이다. Notion, Linear, Figma 등 선도적인 SaaS 제품들이 보여주듯, 정보를 독립적인 카드 단위로 구성하여 **스캔 가능성(scannability)**을 극대화한다.

```
┌──────────────────────────────────────────────────────────────┐
│  [헤더: 사용자 이름 + 분석 날짜 + 공유 버튼]                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐            │
│  │  🎨 퍼스널컬러      │  │  📊 점수 요약       │            │
│  │  Spring Warm       │  │  ━━━━━━━━ 85점     │            │
│  │  [상세 보기 →]     │  │  [트렌드 차트]      │            │
│  └─────────────────────┘  └─────────────────────┘            │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  📋 상세 분석 결과                                    │   │
│  │  • 피부톤: 웜톤 (76%)                                 │   │
│  │  • 언더톤: 옐로우 베이스                              │   │
│  │  • 추천 컬러 팔레트: [■][■][■][■][■]                  │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  💄 추천 제품                                         │   │
│  │  [카드 캐러셀]                                        │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**핵심 원칙**:
- **F-패턴 레이아웃**: 사용자 시선 흐름에 맞춘 핵심 정보 배치
- **정보 계층 구조**: 요약 → 상세 → 액션 순서
- **화이트 스페이스**: 카드 간 최소 16px 간격 유지
- **반응형 그리드**: 모바일 1열, 태블릿 2열, 데스크톱 3열

#### 2.1.2 스크롤 스토리텔링

긴 리포트는 **스크롤 기반 내러티브**로 전환되고 있다. Spotify Wrapped, GitHub Contribution Graph, Apple Music Replay가 대표 사례다.

```typescript
// 스크롤 트리거 애니메이션 패턴
interface ScrollSection {
  id: string;
  title: string;
  triggerOffset: number;  // viewport 상단에서 트리거되는 위치 (0-1)
  animation: 'fadeIn' | 'slideUp' | 'counter' | 'chart';
}

const REPORT_SECTIONS: ScrollSection[] = [
  { id: 'summary', title: '분석 요약', triggerOffset: 0.8, animation: 'fadeIn' },
  { id: 'details', title: '상세 결과', triggerOffset: 0.6, animation: 'slideUp' },
  { id: 'comparison', title: '비교 분석', triggerOffset: 0.5, animation: 'counter' },
  { id: 'recommendations', title: '추천', triggerOffset: 0.4, animation: 'chart' },
];
```

#### 2.1.3 인쇄/PDF 최적화 레이아웃

화면용과 인쇄용 레이아웃 분리가 필수다:

| 항목 | 화면용 | 인쇄/PDF용 |
|------|--------|-----------|
| 네비게이션 | 표시 | 숨김 |
| 인터랙티브 요소 | 활성화 | 정적 이미지로 대체 |
| 컬러 | 브랜드 컬러 | CMYK 안전 컬러 |
| 폰트 크기 | 16px 기준 | 12pt 기준 |
| 페이지 브레이크 | 없음 | 섹션별 제어 |

### 2.2 PDF 생성

#### 2.2.1 기술 스택 비교

| 기술 | 장점 | 단점 | 적합한 상황 |
|------|------|------|------------|
| **@react-pdf/renderer** | React 친화적, 정밀 레이아웃 | 복잡한 차트 지원 한계 | 폼 기반 리포트 |
| **html2canvas + jsPDF** | DOM 그대로 변환 | 품질 저하, 대용량 느림 | 간단한 스크린샷 |
| **Puppeteer (서버)** | 최고 품질, 완전한 CSS 지원 | 서버 리소스 필요 | 복잡한 리포트 |
| **wkhtmltopdf** | 빠른 속도 | 구형, 일부 CSS 미지원 | 레거시 시스템 |
| **Prince XML** | 출판 품질 | 유료, 고비용 | 상업 출판물 |

#### 2.2.2 Yiroom 권장 전략: 하이브리드 접근

```typescript
// lib/pdf/generate-report.ts
export async function generateReportPDF(
  analysisId: string,
  options: PDFOptions = {}
): Promise<{ url: string; method: 'client' | 'server' }> {
  const { complexity, hasCharts, isUrgent } = await analyzeReportComplexity(analysisId);

  // 전략 1: 간단한 리포트 → 클라이언트 사이드
  if (complexity === 'simple' && !hasCharts) {
    return {
      url: await generateClientSidePDF(analysisId),
      method: 'client',
    };
  }

  // 전략 2: 복잡한 리포트 → 서버 사이드 (백그라운드)
  if (!isUrgent) {
    const jobId = await queueServerPDF(analysisId);
    return {
      url: `/api/pdf/status/${jobId}`,  // 폴링 또는 웹훅
      method: 'server',
    };
  }

  // 전략 3: 긴급 + 복잡 → 서버 사이드 (동기)
  return {
    url: await generateServerSidePDF(analysisId),
    method: 'server',
  };
}
```

#### 2.2.3 UX 패턴: 프로그레스 인디케이터

```tsx
// components/PDFDownloadButton.tsx
export function PDFDownloadButton({ analysisId }: Props) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');
  const [progress, setProgress] = useState(0);

  const handleDownload = async () => {
    setStatus('generating');

    // 단계별 프로그레스
    setProgress(10);  // "리포트 데이터 로딩..."
    const data = await fetchReportData(analysisId);

    setProgress(40);  // "차트 렌더링..."
    await prerenderCharts(data);

    setProgress(70);  // "PDF 생성 중..."
    const pdfUrl = await generatePDF(data);

    setProgress(100); // "완료!"
    setStatus('ready');

    // 자동 다운로드
    downloadFile(pdfUrl, `yiroom-report-${analysisId}.pdf`);
  };

  return (
    <Button onClick={handleDownload} disabled={status === 'generating'}>
      {status === 'generating' ? (
        <>
          <Spinner className="mr-2" />
          PDF 생성 중... {progress}%
        </>
      ) : (
        <>
          <Download className="mr-2" />
          PDF 다운로드
        </>
      )}
    </Button>
  );
}
```

#### 2.2.4 PDF 스타일 가이드

```css
/* styles/pdf-report.css */
@media print {
  /* 페이지 설정 */
  @page {
    size: A4;
    margin: 20mm 15mm;
  }

  /* 헤더/푸터 숨김 */
  header, footer, nav, .no-print {
    display: none !important;
  }

  /* 페이지 브레이크 제어 */
  .section {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  .page-break {
    page-break-before: always;
  }

  /* 배경색 인쇄 */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* 링크 URL 표시 */
  a[href]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: #666;
  }
}
```

### 2.3 공유 기능

#### 2.3.1 링크 공유 (딥링크)

```typescript
// lib/share/generate-share-link.ts
export interface ShareLinkOptions {
  analysisId: string;
  expiresIn?: number;  // 초 단위, 기본 7일
  accessLevel: 'full' | 'summary' | 'preview';
}

export async function generateShareLink(options: ShareLinkOptions): Promise<string> {
  const { analysisId, expiresIn = 7 * 24 * 60 * 60, accessLevel } = options;

  // 1. 공유 토큰 생성
  const token = await createShareToken({
    analysisId,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
    accessLevel,
  });

  // 2. 단축 URL 생성 (선택)
  const shortUrl = await createShortUrl(`/share/${token}`);

  return shortUrl || `${process.env.NEXT_PUBLIC_APP_URL}/share/${token}`;
}
```

#### 2.3.2 OG 메타태그 (미리보기 카드)

```tsx
// app/share/[token]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shareData = await getShareData(params.token);

  if (!shareData) {
    return { title: '이룸 - 분석 결과' };
  }

  // 동적 OG 이미지 생성
  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/og?` +
    `season=${shareData.season}&score=${shareData.score}`;

  return {
    title: `${shareData.userName}님의 퍼스널컬러 분석 결과`,
    description: `${shareData.season} 타입 - 추천 컬러와 스타일 가이드를 확인하세요!`,
    openGraph: {
      title: `${shareData.season} 타입 분석 완료!`,
      description: `매치율 ${shareData.score}% - 어울리는 컬러 팔레트 확인하기`,
      images: [ogImageUrl],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${shareData.season} 타입 분석 완료!`,
      description: `매치율 ${shareData.score}%`,
      images: [ogImageUrl],
    },
  };
}
```

#### 2.3.3 동적 OG 이미지 생성

```tsx
// app/api/og/route.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get('season') || 'Spring';
  const score = searchParams.get('score') || '85';

  // 시즌별 컬러 팔레트
  const seasonColors = {
    'Spring Warm': ['#FF6B6B', '#FFE66D', '#4ECDC4'],
    'Summer Cool': ['#A8E6CF', '#DCEDC1', '#FFD3B6'],
    'Autumn Warm': ['#C9B037', '#D4A56A', '#8B4513'],
    'Winter Cool': ['#2C3E50', '#E74C3C', '#ECF0F1'],
  };

  const colors = seasonColors[season] || seasonColors['Spring Warm'];

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          fontFamily: 'Pretendard',
        }}
      >
        <div style={{ fontSize: 48, color: 'white', marginBottom: 20 }}>
          이룸 퍼스널컬러 분석
        </div>
        <div style={{ fontSize: 72, color: 'white', fontWeight: 'bold' }}>
          {season}
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 40 }}>
          {colors.map((color, i) => (
            <div
              key={i}
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                background: color,
                border: '4px solid white',
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 36, color: 'white', marginTop: 40 }}>
          매치율 {score}%
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

#### 2.3.4 SNS 공유 버튼

```tsx
// components/ShareButtons.tsx
const SHARE_PLATFORMS = [
  {
    id: 'kakao',
    name: '카카오톡',
    icon: KakaoIcon,
    share: (url: string, title: string) => {
      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title,
          imageUrl: `${url}/og-image`,
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [{ title: '결과 보기', link: { mobileWebUrl: url, webUrl: url } }],
      });
    },
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: XIcon,
    share: (url: string, title: string) => {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
        '_blank'
      );
    },
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: InstagramIcon,
    share: (url: string) => {
      // Instagram은 웹 공유 미지원 → 이미지 다운로드 유도
      downloadAsImage(url);
      toast.info('이미지가 저장되었습니다. Instagram에 공유해주세요!');
    },
  },
  {
    id: 'copy',
    name: '링크 복사',
    icon: LinkIcon,
    share: async (url: string) => {
      await navigator.clipboard.writeText(url);
      toast.success('링크가 복사되었습니다!');
    },
  },
];
```

### 2.4 인쇄 최적화

#### 2.4.1 @media print 전략

```css
/* globals.css */
@media print {
  /* 1. 불필요한 UI 숨김 */
  .navigation,
  .sidebar,
  .share-buttons,
  .download-button,
  .interactive-chart-controls,
  [data-print="hide"] {
    display: none !important;
  }

  /* 2. 전체 너비 사용 */
  .container {
    max-width: 100% !important;
    padding: 0 !important;
  }

  /* 3. 배경색 인쇄 허용 */
  .color-swatch,
  .chart-bar,
  .progress-fill {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* 4. 링크 스타일 변경 */
  a {
    color: #000 !important;
    text-decoration: none !important;
  }

  /* 5. 페이지 브레이크 제어 */
  .section-header {
    page-break-after: avoid;
  }

  .result-card {
    page-break-inside: avoid;
  }

  .new-page {
    page-break-before: always;
  }

  /* 6. 고아/과부 텍스트 방지 */
  p, li {
    orphans: 3;
    widows: 3;
  }

  /* 7. 폰트 크기 조정 */
  body {
    font-size: 12pt;
    line-height: 1.5;
  }

  h1 { font-size: 24pt; }
  h2 { font-size: 18pt; }
  h3 { font-size: 14pt; }
}
```

#### 2.4.2 인쇄 전용 컴포넌트

```tsx
// components/PrintableReport.tsx
interface PrintableReportProps {
  analysis: AnalysisResult;
  includeCharts?: boolean;
}

export function PrintableReport({ analysis, includeCharts = true }: PrintableReportProps) {
  return (
    <div className="print-container" data-print="show">
      {/* 헤더: 로고 + 날짜 */}
      <header className="print-header">
        <img src="/logo-print.svg" alt="이룸" className="print-logo" />
        <span className="print-date">
          {format(new Date(analysis.createdAt), 'yyyy년 M월 d일')}
        </span>
      </header>

      {/* 요약 섹션 */}
      <section className="print-section">
        <h2>분석 요약</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">시즌 타입</span>
            <span className="value">{analysis.seasonType}</span>
          </div>
          <div className="summary-item">
            <span className="label">매치율</span>
            <span className="value">{analysis.matchRate}%</span>
          </div>
        </div>
      </section>

      {/* 차트: 인쇄용 정적 이미지로 대체 */}
      {includeCharts && (
        <section className="print-section new-page">
          <h2>상세 분석</h2>
          <img
            src={`/api/chart-image?id=${analysis.id}`}
            alt="분석 차트"
            className="print-chart"
          />
        </section>
      )}

      {/* 푸터 */}
      <footer className="print-footer">
        <p>이룸 (yiroom.app) | 이 리포트는 {format(new Date(), 'yyyy-MM-dd')}에 생성되었습니다.</p>
      </footer>
    </div>
  );
}
```

#### 2.4.3 인쇄 버튼 UX

```tsx
// components/PrintButton.tsx
export function PrintButton({ analysisId }: { analysisId: string }) {
  const handlePrint = () => {
    // 1. 인쇄 전 준비
    document.body.classList.add('print-mode');

    // 2. 차트를 정적 이미지로 변환
    const charts = document.querySelectorAll('[data-chart]');
    charts.forEach(chart => {
      const canvas = chart.querySelector('canvas');
      if (canvas) {
        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/png');
        img.className = 'print-chart-image';
        chart.appendChild(img);
      }
    });

    // 3. 인쇄
    window.print();

    // 4. 정리
    document.body.classList.remove('print-mode');
    document.querySelectorAll('.print-chart-image').forEach(img => img.remove());
  };

  return (
    <Button variant="outline" onClick={handlePrint}>
      <Printer className="mr-2 h-4 w-4" />
      인쇄
    </Button>
  );
}
```

### 2.5 데이터 내보내기

#### 2.5.1 다중 포맷 지원

```typescript
// lib/export/formats.ts
export type ExportFormat = 'pdf' | 'csv' | 'excel' | 'json' | 'image';

interface ExportConfig {
  format: ExportFormat;
  label: string;
  icon: React.ComponentType;
  mimeType: string;
  extension: string;
  handler: (data: AnalysisData) => Promise<Blob>;
}

export const EXPORT_CONFIGS: Record<ExportFormat, ExportConfig> = {
  pdf: {
    format: 'pdf',
    label: 'PDF 리포트',
    icon: FileText,
    mimeType: 'application/pdf',
    extension: 'pdf',
    handler: generatePDFExport,
  },
  csv: {
    format: 'csv',
    label: 'CSV (스프레드시트)',
    icon: Table,
    mimeType: 'text/csv',
    extension: 'csv',
    handler: generateCSVExport,
  },
  excel: {
    format: 'excel',
    label: 'Excel',
    icon: FileSpreadsheet,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: 'xlsx',
    handler: generateExcelExport,
  },
  json: {
    format: 'json',
    label: 'JSON (개발자용)',
    icon: Braces,
    mimeType: 'application/json',
    extension: 'json',
    handler: generateJSONExport,
  },
  image: {
    format: 'image',
    label: '이미지 (PNG)',
    icon: Image,
    mimeType: 'image/png',
    extension: 'png',
    handler: generateImageExport,
  },
};
```

#### 2.5.2 CSV 내보내기

```typescript
// lib/export/csv.ts
export async function generateCSVExport(data: AnalysisData): Promise<Blob> {
  const rows: string[][] = [];

  // 헤더
  rows.push(['항목', '값', '점수', '설명']);

  // 기본 정보
  rows.push(['시즌 타입', data.seasonType, '', data.seasonDescription]);
  rows.push(['매치율', `${data.matchRate}%`, data.matchRate.toString(), '']);

  // 상세 점수
  Object.entries(data.scores).forEach(([key, value]) => {
    rows.push([SCORE_LABELS[key], `${value}점`, value.toString(), '']);
  });

  // 추천 컬러
  data.recommendedColors.forEach((color, i) => {
    rows.push([`추천 컬러 ${i + 1}`, color.name, '', color.hex]);
  });

  // CSV 문자열 생성
  const csvContent = rows
    .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // BOM 추가 (한글 호환)
  const BOM = '\uFEFF';
  return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
}
```

#### 2.5.3 Excel 내보내기

```typescript
// lib/export/excel.ts
import ExcelJS from 'exceljs';

export async function generateExcelExport(data: AnalysisData): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = '이룸';
  workbook.created = new Date();

  // 요약 시트
  const summarySheet = workbook.addWorksheet('분석 요약');
  summarySheet.columns = [
    { header: '항목', key: 'item', width: 20 },
    { header: '값', key: 'value', width: 30 },
  ];
  summarySheet.addRow({ item: '시즌 타입', value: data.seasonType });
  summarySheet.addRow({ item: '매치율', value: `${data.matchRate}%` });
  summarySheet.addRow({ item: '분석 일시', value: data.createdAt });

  // 상세 점수 시트
  const scoresSheet = workbook.addWorksheet('상세 점수');
  scoresSheet.columns = [
    { header: '지표', key: 'metric', width: 20 },
    { header: '점수', key: 'score', width: 10 },
    { header: '등급', key: 'grade', width: 10 },
  ];
  Object.entries(data.scores).forEach(([key, value]) => {
    scoresSheet.addRow({
      metric: SCORE_LABELS[key],
      score: value,
      grade: getGrade(value),
    });
  });

  // 추천 컬러 시트
  const colorsSheet = workbook.addWorksheet('추천 컬러');
  colorsSheet.columns = [
    { header: '컬러명', key: 'name', width: 20 },
    { header: 'HEX', key: 'hex', width: 10 },
    { header: 'RGB', key: 'rgb', width: 20 },
  ];
  data.recommendedColors.forEach(color => {
    const row = colorsSheet.addRow({
      name: color.name,
      hex: color.hex,
      rgb: hexToRgb(color.hex),
    });
    // 컬러 셀에 배경색 적용
    row.getCell('hex').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: color.hex.replace('#', 'FF') },
    };
  });

  // Blob 생성
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
```

#### 2.5.4 부분 선택 내보내기

```tsx
// components/ExportDialog.tsx
export function ExportDialog({ analysis, onClose }: Props) {
  const [selectedSections, setSelectedSections] = useState<string[]>(['summary']);
  const [format, setFormat] = useState<ExportFormat>('pdf');

  const SECTIONS = [
    { id: 'summary', label: '분석 요약', required: true },
    { id: 'scores', label: '상세 점수' },
    { id: 'colors', label: '추천 컬러' },
    { id: 'products', label: '추천 제품' },
    { id: 'history', label: '분석 이력' },
  ];

  const handleExport = async () => {
    const filteredData = filterDataBySections(analysis, selectedSections);
    const config = EXPORT_CONFIGS[format];
    const blob = await config.handler(filteredData);

    downloadBlob(blob, `yiroom-report-${analysis.id}.${config.extension}`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>내보내기</DialogTitle>
        </DialogHeader>

        {/* 포맷 선택 */}
        <div className="space-y-2">
          <Label>파일 형식</Label>
          <RadioGroup value={format} onValueChange={setFormat}>
            {Object.values(EXPORT_CONFIGS).map(config => (
              <RadioGroupItem key={config.format} value={config.format}>
                <config.icon className="h-4 w-4 mr-2" />
                {config.label}
              </RadioGroupItem>
            ))}
          </RadioGroup>
        </div>

        {/* 섹션 선택 */}
        <div className="space-y-2">
          <Label>포함할 내용</Label>
          {SECTIONS.map(section => (
            <div key={section.id} className="flex items-center">
              <Checkbox
                id={section.id}
                checked={selectedSections.includes(section.id)}
                disabled={section.required}
                onCheckedChange={checked => {
                  setSelectedSections(prev =>
                    checked
                      ? [...prev, section.id]
                      : prev.filter(id => id !== section.id)
                  );
                }}
              />
              <Label htmlFor={section.id} className="ml-2">
                {section.label}
                {section.required && <span className="text-muted-foreground"> (필수)</span>}
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            내보내기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 2.6 인터랙티브 리포트

#### 2.6.1 차트 라이브러리 비교

| 라이브러리 | 번들 크기 | React 지원 | 장점 | 단점 |
|-----------|----------|-----------|------|------|
| **Chart.js** | ~60KB | react-chartjs-2 | 경량, 쉬운 사용 | 복잡한 커스텀 한계 |
| **Recharts** | ~150KB | 네이티브 | React 친화적, 선언적 | 대용량 데이터 느림 |
| **D3.js** | ~250KB | 수동 통합 | 완전한 제어 | 러닝커브 높음 |
| **Nivo** | ~200KB | 네이티브 | 아름다운 기본 스타일 | 커스텀 제한적 |
| **Visx** | ~100KB | 네이티브 | D3 + React 결합 | 저수준 API |

**Yiroom 권장**: 기본 차트는 **Recharts**, 복잡한 시각화는 **D3.js/Visx** 하이브리드

#### 2.6.2 드릴다운 차트

```tsx
// components/charts/DrilldownChart.tsx
interface DrilldownChartProps {
  data: AnalysisData;
  onDrilldown?: (category: string) => void;
}

export function DrilldownChart({ data, onDrilldown }: DrilldownChartProps) {
  const [drillLevel, setDrillLevel] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const chartData = useMemo(() => {
    if (drillLevel === 0) {
      // Level 0: 전체 카테고리
      return Object.entries(data.scores).map(([key, value]) => ({
        name: SCORE_LABELS[key],
        value,
        fill: CATEGORY_COLORS[key],
      }));
    }
    // Level 1: 선택된 카테고리 상세
    return data.scoreDetails[selectedCategory!].map(detail => ({
      name: detail.label,
      value: detail.score,
      fill: detail.color,
    }));
  }, [data, drillLevel, selectedCategory]);

  const handleClick = (entry: any) => {
    if (drillLevel === 0) {
      setSelectedCategory(entry.name);
      setDrillLevel(1);
      onDrilldown?.(entry.name);
    }
  };

  const handleBack = () => {
    setDrillLevel(0);
    setSelectedCategory(null);
  };

  return (
    <div className="drilldown-chart">
      {drillLevel > 0 && (
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          전체 보기
        </Button>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} onClick={handleClick}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const { name, value } = payload[0].payload;
              return (
                <div className="bg-popover p-3 rounded-lg shadow-lg border">
                  <p className="font-medium">{name}</p>
                  <p className="text-2xl font-bold">{value}점</p>
                  {drillLevel === 0 && (
                    <p className="text-sm text-muted-foreground">
                      클릭하여 상세 보기
                    </p>
                  )}
                </div>
              );
            }}
          />
          <Bar
            dataKey="value"
            cursor={drillLevel === 0 ? 'pointer' : 'default'}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

#### 2.6.3 필터링 가능한 대시보드

```tsx
// components/InteractiveReport.tsx
export function InteractiveReport({ analysis }: { analysis: AnalysisResult }) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['overall']);

  const filteredData = useMemo(() => {
    let data = analysis.history;

    // 시간 필터
    if (timeRange !== 'all') {
      const cutoff = timeRange === 'week' ? 7 : 30;
      data = data.filter(
        item => differenceInDays(new Date(), new Date(item.date)) <= cutoff
      );
    }

    // 메트릭 필터
    if (selectedMetrics.length > 0 && !selectedMetrics.includes('all')) {
      data = data.map(item => ({
        ...item,
        scores: Object.fromEntries(
          Object.entries(item.scores).filter(([key]) =>
            selectedMetrics.includes(key)
          )
        ),
      }));
    }

    return data;
  }, [analysis.history, timeRange, selectedMetrics]);

  return (
    <div className="interactive-report">
      {/* 필터 바 */}
      <div className="filters flex gap-4 mb-6">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">최근 1주</SelectItem>
            <SelectItem value="month">최근 1개월</SelectItem>
            <SelectItem value="all">전체</SelectItem>
          </SelectContent>
        </Select>

        <MultiSelect
          values={selectedMetrics}
          onChange={setSelectedMetrics}
          options={METRIC_OPTIONS}
          placeholder="지표 선택"
        />
      </div>

      {/* 차트 영역 */}
      <div className="charts-grid grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>점수 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={filteredData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>카테고리별 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <RadarChart data={filteredData} />
          </CardContent>
        </Card>
      </div>

      {/* 인터랙티브 테이블 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>상세 데이터</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredData}
            columns={ANALYSIS_COLUMNS}
            sorting
            pagination
            searchable
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 2.6.4 호버 툴팁 및 마이크로 인터랙션

```tsx
// components/charts/InteractiveTooltip.tsx
interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  analysisContext?: AnalysisContext;
}

export function InteractiveTooltip({
  active,
  payload,
  label,
  analysisContext,
}: TooltipProps) {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload;
  const trend = calculateTrend(data.history);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-popover p-4 rounded-xl shadow-xl border min-w-[200px]"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {trend !== 0 && (
          <Badge variant={trend > 0 ? 'success' : 'destructive'}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </Badge>
        )}
      </div>

      {/* 메인 값 */}
      <div className="text-3xl font-bold mb-2">
        {data.value}
        <span className="text-lg text-muted-foreground ml-1">점</span>
      </div>

      {/* 미니 차트 (스파크라인) */}
      <div className="h-[40px] mt-2">
        <Sparklines data={data.history.slice(-7)}>
          <SparklinesLine color="#10b981" />
        </Sparklines>
      </div>

      {/* 컨텍스트 정보 */}
      {analysisContext && (
        <div className="mt-3 pt-3 border-t text-sm">
          <p className="text-muted-foreground">
            {analysisContext.getInsight(data.category, data.value)}
          </p>
        </div>
      )}
    </motion.div>
  );
}
```

---

## 3. 이룸 앱 적용 사항

### 3.1 즉시 적용 (1-2일)

- [ ] **공유 버튼 개선**: 카카오톡, X, 링크 복사 버튼 추가
- [ ] **OG 메타태그**: 동적 og:image 생성 API 구현
- [ ] **@media print CSS**: 기본 인쇄 스타일시트 적용
- [ ] **링크 복사 토스트**: 복사 성공 피드백 추가

### 3.2 단기 적용 (1주)

- [ ] **PDF 다운로드 버튼**: 프로그레스 인디케이터 포함
- [ ] **레이아웃 모듈화**: 카드 기반 리포트 레이아웃 리팩토링
- [ ] **CSV 내보내기**: 분석 데이터 스프레드시트 내보내기
- [ ] **공유 링크 만료**: 7일 자동 만료 토큰 시스템

### 3.3 중기 적용 (2-4주)

- [ ] **인터랙티브 차트**: Recharts 기반 드릴다운 구현
- [ ] **Excel 내보내기**: ExcelJS 통합
- [ ] **다중 포맷 선택 다이얼로그**: 내보내기 옵션 UI
- [ ] **서버 사이드 PDF**: Puppeteer 또는 @react-pdf 통합
- [ ] **공유 페이지 개선**: 비로그인 사용자용 미리보기 페이지

### 3.4 장기 적용 (1-2개월)

- [ ] **스크롤 스토리텔링**: 분석 결과 내러티브 플로우
- [ ] **비교 분석 리포트**: 이전 분석과 비교 시각화
- [ ] **이미지 내보내기**: Instagram 공유용 이미지 생성
- [ ] **인쇄 미리보기**: 인쇄 전 레이아웃 확인 모달

---

## 4. 참고 사례

### 4.1 Spotify Wrapped

- **스크롤 스토리텔링**: 세로 스크롤 기반 연간 리뷰
- **공유 최적화**: Instagram 스토리 맞춤 이미지 자동 생성
- **게이미피케이션**: "당신은 상위 1% 리스너" 배지

### 4.2 GitHub Contribution Graph

- **인터랙티브 차트**: 호버 시 상세 정보 표시
- **필터링**: 연도/저장소별 필터
- **SVG 내보내기**: 프로필 이미지로 활용 가능

### 4.3 Notion

- **PDF 내보내기**: 페이지 전체 또는 부분 선택
- **마크다운 내보내기**: 개발자 친화적
- **링크 공유**: 읽기 전용 공개 페이지

### 4.4 Linear (이슈 트래커)

- **리포트 대시보드**: 팀 생산성 시각화
- **CSV/JSON 내보내기**: 데이터 분석용
- **Slack 공유**: 인라인 미리보기 카드

### 4.5 Apple Health

- **PDF 리포트**: 의료 기관 공유용 표준 형식
- **시간대별 필터링**: 주간/월간/연간 뷰
- **트렌드 분석**: 자동 인사이트 생성

---

## 5. 참고 자료

### 웹 접근성 및 인쇄

- [W3C CSS Paged Media](https://www.w3.org/TR/css-page-3/) - 페이지 미디어 표준
- [MDN @media print](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/print) - 인쇄 미디어 쿼리

### PDF 생성

- [React-PDF 공식 문서](https://react-pdf.org/) - React PDF 렌더러
- [Puppeteer PDF 생성](https://pptr.dev/guides/pdf-generation) - 서버 사이드 PDF

### 차트 라이브러리

- [Recharts 문서](https://recharts.org/en-US/) - React 차트
- [D3.js 갤러리](https://d3-graph-gallery.com/) - D3 예제

### 공유 및 OG

- [Open Graph Protocol](https://ogp.me/) - OG 표준
- [Vercel OG Image Generation](https://vercel.com/docs/functions/og-image-generation) - 동적 OG

### 데이터 내보내기

- [ExcelJS 문서](https://github.com/exceljs/exceljs) - Excel 생성
- [FileSaver.js](https://github.com/eligrey/FileSaver.js) - 파일 다운로드

---

**Version**: 1.0 | **Created**: 2026-01-16 | **Category**: MOD-5 (Reports)

> **Note**: 이 리서치는 Claude AI의 2025년 5월까지의 학습 데이터와 UX 설계 원칙을 기반으로 작성되었습니다. 웹 검색 기능이 제한되어 있어 일부 최신 트렌드는 포함되지 않을 수 있습니다.
