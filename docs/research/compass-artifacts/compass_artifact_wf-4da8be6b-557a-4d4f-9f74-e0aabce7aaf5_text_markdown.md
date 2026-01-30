# 이룸(Yiroom) PWA 구현 전략 가이드 2026

**핵심 결론: PWA는 Expo 앱을 대체하기보다 보완해야 한다.** 한국 시장의 앱 중심 문화와 iOS 제약을 고려할 때, Expo 기반 네이티브 앱을 주력으로 유지하고 PWA를 웹 진입점 및 Android 보조 채널로 활용하는 하이브리드 전략이 최적이다. 한국의 Android 점유율 **76%**에서 PWA는 우수한 경험을 제공하지만, iOS **24%** 사용자에게는 푸시 알림, 백그라운드 동기화 등 핵심 기능이 제한된다. AI 이미지 분석 성능도 네이티브 대비 **7~17배** 느려 퍼스널컬러 분석 품질에 영향을 미친다.

---

## PWA 브라우저 지원 현황과 한국 시장 분석

2025-2026년 기준 PWA의 핵심 기술인 Service Worker는 전 세계 브라우저의 **96.12%**에서 지원된다. Chrome, Firefox, Edge, Samsung Internet에서 완전한 PWA 기능을 사용할 수 있으며, iOS Safari도 iOS 11.3부터 Service Worker를 지원한다.

**한국 모바일 OS 시장 점유율 (2025년 11월)**

| OS | 점유율 | PWA 지원 수준 |
|-----|------|------------|
| Android | **75.7%** | ✅ 완전 지원 |
| iOS | **23.85%** | ⚠️ 제한적 지원 |

한국에서 삼성전자가 스마트폰 시장의 **82%**를 점유하고 있어 Android 기반 PWA는 대다수 사용자에게 우수한 경험을 제공한다. 그러나 iOS는 가장 빠르게 성장하는 세그먼트이며, 고소득 사용자 비율이 높아 뷰티·패션 앱에서 무시할 수 없는 시장이다.

### 주요 PWA 기능별 브라우저 지원

| 기능 | Chrome/Edge | iOS Safari | 비고 |
|------|------------|-----------|-----|
| Service Worker | ✅ | ✅ | 전 플랫폼 지원 |
| 푸시 알림 | ✅ 자동 | ⚠️ 홈 화면 설치 필수 | iOS 16.4+ |
| 백그라운드 동기화 | ✅ | ❌ 미지원 | iOS 대안 필요 |
| 설치 프롬프트 | ✅ 자동 | ❌ 수동만 | iOS UX 열세 |
| 저장 용량 | 디스크 60% | ~50MB Cache | iOS 제한 심각 |

---

## iOS Safari의 핵심 제약사항과 우회 전략

iOS Safari는 PWA에 가장 큰 제약을 가하는 플랫폼이다. Apple의 App Store 중심 비즈니스 모델로 인해 PWA 기능 확장에 소극적이며, 2024년 2월에는 EU에서 PWA 지원을 철회하려 했다가 반발로 철회했다.

### iOS PWA 핵심 제약 (2026년 기준)

**푸시 알림 제한**: iOS 16.4부터 웹 푸시를 지원하지만, **반드시 홈 화면에 PWA를 설치해야만** 작동한다. Safari 브라우저 내에서는 푸시가 불가능하다. 또한 알림 신뢰성 문제가 보고되어 있으며, 사용자가 PWA를 일정 기간 사용하지 않으면 알림 전달이 중단될 수 있다.

**7일 데이터 삭제 정책**: Safari에서 PWA를 7일간 사용하지 않으면 IndexedDB, Cache API, Service Worker 등록이 **자동 삭제**된다. 홈 화면에 설치된 PWA는 이 정책에서 제외되므로, 설치 유도가 필수다.

**저장 공간 제한**: Cache API는 약 **50MB**, IndexedDB는 **500MB+**까지 사용 가능하다. 이룸의 AI 분석 결과와 제품 카탈로그 캐싱에 IndexedDB 활용이 필수적이다.

### iOS 제약 우회 방법

| 제약 | 우회 전략 |
|-----|---------|
| 푸시 알림 제한 | 홈 화면 설치 튜토리얼 제공 + 인앱 알림 센터 폴백 |
| 백그라운드 동기화 없음 | 앱 활성화 시 즉시 동기화 + "지금 동기화" 버튼 제공 |
| 7일 데이터 삭제 | 매 실행 시 필수 에셋 재캐싱 + 설치 적극 유도 |
| 자동 설치 프롬프트 없음 | 커스텀 설치 가이드 (공유 → 홈 화면에 추가) |
| 50MB 캐시 제한 | 앱 셸만 캐싱 + 대용량 데이터는 IndexedDB 활용 |

---

## Next.js 16을 위한 Service Worker 구현 가이드

### 추천 라이브러리: Serwist

`next-pwa`가 deprecated된 이후 **Serwist**가 Next.js 14+ 환경의 표준 PWA 라이브러리로 자리잡았다. Google Workbox를 기반으로 하며, Next.js App Router를 완전히 지원한다.

```bash
# 설치
npm i @serwist/next && npm i -D serwist
```

**next.config.mjs 설정**:
```javascript
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/offline", revision: "1.0.0" }],
});

export default withSerwist({
  // Next.js 설정
});
```

### 콘텐츠 유형별 캐싱 전략

| 콘텐츠 | 전략 | 만료 기간 | 이유 |
|-------|-----|---------|-----|
| 앱 셸 (JS/CSS) | Stale-While-Revalidate | 7일 | 빠른 로딩 + 최신 유지 |
| 정적 이미지/폰트 | Cache-First | 30일 | 변경 드묾 |
| API 응답 | Network-First | 24시간 | 최신 데이터 우선 |
| 사용자 업로드 이미지 | Cache-First | 7일 | 재사용 빈번 |
| AI 분석 결과 | IndexedDB 저장 | 영구 | 오프라인 조회 필요 |

### AI 이미지 분석을 위한 오프라인 전략

이룸의 퍼스널컬러 분석 기능은 온라인 AI(Google Gemini)에 의존하므로, 완전한 오프라인 분석은 어렵다. 그러나 다음과 같은 하이브리드 접근이 가능하다:

```javascript
// 오프라인 분석 큐 시스템
async function analyzeImage(imageBlob) {
  if (navigator.onLine) {
    // 온라인: 클라우드 AI 분석
    const result = await cloudAnalysis(imageBlob);
    await cacheResult(result);
    return result;
  } else {
    // 오프라인: 큐에 저장 후 나중에 처리
    const id = await queueForLater(imageBlob);
    await registerBackgroundSync('sync-analysis');
    return { status: 'queued', message: '온라인 연결 시 분석됩니다' };
  }
}
```

**권장 저장소 예산**:
- 앱 셸: 2-5 MB
- 정적 에셋: 20-50 MB  
- 사용자 이미지 캐시: 100-200 MB
- **총 목표**: 300 MB 이하 (iOS 호환성 확보)

---

## 푸시 알림 구현과 설치 유도 전략

### Web Push API 구현 핵심 포인트

iOS에서 푸시 알림이 작동하려면 **Web App Manifest에 `display: "standalone"` 설정이 필수**다. 이 설정 없이는 iOS에서 Web Push가 활성화되지 않는다.

**2단계 권한 요청 패턴** (필수):
```javascript
// 1단계: 소프트 프롬프트 (커스텀 UI)
function showSoftPrompt() {
  // "맞춤 뷰티 추천과 할인 알림을 받으시겠어요?"
  // [알림 받기] [나중에]
}

// 2단계: 사용자 동의 후 브라우저 프롬프트
async function requestPushPermission() {
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  
  const result = await Notification.requestPermission();
  return result === 'granted';
}
```

### 홈 화면 설치 유도 전략

**Chromium 브라우저** (Android)에서는 `beforeinstallprompt` 이벤트를 활용해 커스텀 설치 프롬프트를 표시할 수 있다. 그러나 **iOS Safari는 이 이벤트를 지원하지 않아** 수동 가이드가 필요하다.

**효과적인 설치 유도 타이밍**:
1. AI 피부 분석 완료 후: "결과를 저장하려면 앱을 설치하세요"
2. 위시리스트 생성 후: "세일 알림을 받으려면 설치하세요"
3. 3회 이상 방문 후: "더 빠른 접근을 위해 홈 화면에 추가"
4. 회원가입 완료 후: "앱 설치로 오프라인에서도 이용"

**iOS 전용 설치 가이드 UI**:
```javascript
function isIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

// iOS 사용자에게 시각적 가이드 표시
if (isIOS() && !isStandalone()) {
  showIOSInstallModal({
    steps: [
      "하단의 공유(↑) 버튼을 탭하세요",
      "'홈 화면에 추가'를 탭하세요",
      "'추가'를 탭하면 완료!"
    ]
  });
}
```

### Web App Manifest 한국어 설정

```json
{
  "name": "이룸 - AI 뷰티 추천",
  "short_name": "이룸",
  "description": "AI 기반 퍼스널컬러 분석과 맞춤 뷰티 추천",
  "lang": "ko",
  "start_url": "/?utm_source=pwa",
  "display": "standalone",
  "theme_color": "#FF6B6B",
  "background_color": "#FFFFFF",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "purpose": "maskable" }
  ],
  "shortcuts": [
    { "name": "피부 분석", "url": "/skin-analysis", "icons": [{"src": "/icons/scan.png", "sizes": "192x192"}] },
    { "name": "오늘의 추천", "url": "/recommendations", "icons": [{"src": "/icons/recommend.png", "sizes": "192x192"}] }
  ],
  "categories": ["beauty", "fashion", "lifestyle"]
}
```

---

## 앱 스토어 배포 옵션

### Google Play Store: TWA (Trusted Web Activity)

TWA를 사용하면 PWA를 Android APK로 패키징하여 Google Play Store에 등록할 수 있다. Chrome이 설치된 기기에서 네이티브 앱과 구분되지 않는 풀스크린 경험을 제공한다.

**TWA 배포 절차**:
1. PWABuilder(pwabuilder.com) 접속 → PWA URL 입력
2. Android 패키지 생성 → APK/AAB 다운로드
3. `/.well-known/assetlinks.json` 설정 (디지털 에셋 링크)
4. Google Play Console에 업로드 ($25 일회성 비용)

**TWA 장점**: 앱 스토어 노출, 자동 업데이트 (앱 재배포 불필요), OAuth 지원

### Apple App Store: 직접 등록 불가

Apple은 PWA의 App Store 직접 등록을 허용하지 않는다. 가이드라인에서 "리패키징된 웹사이트"는 거부 사유다. 우회 방법으로 **PWABuilder iOS 패키지** 또는 **Capacitor 래퍼**를 사용할 수 있지만, 심사 통과가 보장되지 않으며 Apple의 PWA 정책 변동 리스크가 있다.

**결론**: iOS App Store 배포는 Expo/React Native가 안전한 선택이다.

---

## PWA vs Expo/React Native 비교 분석

### 기능 비교표

| 항목 | PWA | Expo (SDK 54) |
|-----|-----|--------------|
| 개발 비용 | 30-40% 저렴 | 중간 (단일 코드베이스) |
| 출시 속도 | 40-50% 빠름 | 중간 |
| iOS 성능 | WebKit 제한 | 네이티브 수준 |
| 앱스토어 노출 | 래퍼 필요 | ✅ 완전 통합 |
| 푸시 알림 | ⚠️ iOS 제한 | ✅ 완전 지원 |
| 카메라 제어 | ⚠️ 제한적 | ✅ 완전 API 접근 |
| 백그라운드 처리 | ❌ iOS 불가 | ✅ 완전 지원 |
| AR 지원 | ❌ 미지원 | ✅ ARKit/ARCore |
| SEO | ✅ 인덱싱 가능 | ❌ 불가 |
| 업데이트 | 즉시 (심사 없음) | OTA via EAS Update |

### AI 이미지 처리 성능

WebGPU의 등장으로 브라우저 기반 ML 추론이 크게 개선되었으나, 여전히 네이티브 대비 성능 격차가 존재한다:

- **CPU 추론**: 네이티브 대비 **16.9배** 느림
- **GPU 추론**: 네이티브 대비 **7.8~30.6배** 느림
- **기기별 편차**: 최대 28배까지 성능 차이 발생

퍼스널컬러 분석처럼 실시간 이미지 처리가 핵심인 이룸에게 이 성능 격차는 사용자 경험에 직접적 영향을 미친다.

---

## 이룸 PWA 구현 체크리스트

### Phase 1: 기본 PWA 설정 ✅

- [ ] HTTPS 설정 확인
- [ ] Web App Manifest 생성 (한국어, `display: standalone`)
- [ ] 아이콘 준비: 192x192, 512x512, maskable 버전
- [ ] Serwist 설치 및 Service Worker 설정
- [ ] 오프라인 폴백 페이지 생성
- [ ] Next.js metadata에 manifest 연결

### Phase 2: 오프라인 캐싱 🗄️

- [ ] 앱 셸 프리캐싱 (JS/CSS, 핵심 UI)
- [ ] 정적 에셋 캐싱 전략 구현 (Cache-First)
- [ ] API 응답 캐싱 (Network-First + 폴백)
- [ ] IndexedDB 설정 (분석 결과, 제품 데이터)
- [ ] 캐시 버저닝 및 정리 로직
- [ ] iOS 50MB 제한 대응 (앱 셸 최적화)

### Phase 3: 푸시 알림 📲

- [ ] VAPID 키 생성 및 서버 설정
- [ ] 푸시 구독 플로우 구현
- [ ] 2단계 권한 요청 UI (소프트 프롬프트)
- [ ] Service Worker 푸시 핸들러
- [ ] iOS 홈 화면 설치 필수 안내 UI
- [ ] 알림 분석 트래킹

### Phase 4: 설치 유도 📱

- [ ] `beforeinstallprompt` 핸들러 (Android)
- [ ] iOS 수동 설치 가이드 모달
- [ ] `display-mode: standalone` 감지 로직
- [ ] 설치 완료 시 프롬프트 숨김
- [ ] 설치율 분석 트래킹
- [ ] 컨텍스트별 설치 유도 (분석 후, 가입 후)

### Phase 5: 선택적 앱스토어 배포 🏪

- [ ] PWABuilder로 Android TWA 생성
- [ ] Digital Asset Links 설정 (`assetlinks.json`)
- [ ] Google Play Console 등록
- [ ] 스토어 리스팅 한국어 작성

---

## PWA 전환 비용/이점 분석

### 개발 비용 추정 (2026년 기준)

| 접근 방식 | 비용 범위 | 기간 |
|----------|---------|------|
| PWA 추가 (기존 Next.js) | $10,000 - $25,000 | 2-4주 |
| 복잡한 PWA 기능 | $25,000 - $50,000 | 4-8주 |
| Expo 앱 개발 (현재) | $50,000 - $150,000 | 12-24주 |

### 이점 분석

**PWA 도입 시 이점**:
- SEO 트래픽 확보 (앱스토어 외 유입 채널)
- 즉각적인 업데이트 배포 (심사 불필요)
- Android 사용자 76%에게 앱급 경험 제공
- 첫 방문자 진입 장벽 제거 (설치 없이 체험)
- 유지보수 비용 절감 (단일 코드베이스)

**PWA 한계로 인한 비용**:
- iOS 사용자 24%의 제한된 경험
- AI 이미지 분석 성능 저하
- 앱스토어 가시성 부재 (TWA 없이)
- 한국 사용자의 앱 선호 문화와 충돌

---

## 최종 전략 권장사항

### 권장 아키텍처: 하이브리드 전략

```
┌─────────────────────────────────────┐
│     공유 React 로직 (컴포넌트)        │
│   (상태 관리, 훅, 유틸리티)           │
└───────────────┬─────────────────────┘
                │
    ┌───────────┴───────────┐
    │                       │
┌───▼────┐            ┌─────▼─────┐
│ Expo   │            │ Next.js   │
│ 모바일앱 │            │ PWA/웹    │
├────────┤            ├───────────┤
│ 주력   │            │ 보조      │
│ iOS+   │            │ SEO      │
│ Android│            │ 유입 채널  │
│ AI/ML  │            │ 체험판    │
└────────┘            └───────────┘
    │                       │
    ▼                       ▼
 앱스토어              웹 + TWA
 (Primary)           (Secondary)
```

### 솔로 개발자를 위한 우선순위

1. **Phase 1** (즉시): Expo 앱 MVP 완성 → 앱스토어 출시
2. **Phase 2** (1-2개월 후): Next.js에 기본 PWA 기능 추가
3. **Phase 3** (3-6개월 후): 푸시 알림 및 설치 유도 최적화
4. **Phase 4** (선택): TWA로 Google Play 추가 등록

### 핵심 결론

**PWA는 Expo 앱을 대체할 수 없다.** 한국 시장의 앱 중심 문화, iOS 제약, AI 성능 요구사항을 고려할 때 Expo 네이티브 앱이 주력이어야 한다. 그러나 PWA는 SEO 기반 사용자 유입, Android 사용자 보조 경험, 앱 설치 전 체험 제공에서 가치를 발휘한다.

이룸의 최적 전략은 **"Expo App-First + Next.js PWA Complement"**이며, 이는 현재 채택한 전략과 일치한다. PWA에 과도한 투자보다는 Expo 앱 품질에 집중하면서, Next.js 웹에 점진적으로 PWA 기능을 추가하는 것이 리소스 효율적이다.