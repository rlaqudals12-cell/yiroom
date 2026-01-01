# 앱 에셋 교체 가이드

> 이룸 모바일 앱 아이콘 및 스플래시 화면 에셋 가이드

## 현재 에셋 위치

```
apps/mobile/assets/
├── icon.png              # 앱 아이콘 (1024x1024)
├── adaptive-icon.png     # Android 적응형 아이콘 (1024x1024)
├── splash-icon.png       # 스플래시 아이콘 (512x512)
├── notification-icon.png # 알림 아이콘 (96x96)
└── favicon.png           # 웹 파비콘 (48x48)
```

---

## 필수 에셋 사양

### 1. 앱 아이콘 (icon.png)

| 플랫폼  | 크기        | 형식 | 비고                   |
| ------- | ----------- | ---- | ---------------------- |
| iOS     | 1024 x 1024 | PNG  | 투명 배경 금지         |
| Android | 1024 x 1024 | PNG  | 원본 (EAS가 크기 조절) |

**디자인 가이드라인:**

- 모서리 둥글림: iOS가 자동 적용 (마스킹 없이 제공)
- 배경색: `#2E5AFA` (브랜드 컬러) 또는 흰색
- 콘텐츠 영역: 중앙 80% 내에 로고 배치
- 투명 영역: 없어야 함 (iOS 거부 사유)

### 2. Android 적응형 아이콘 (adaptive-icon.png)

| 항목              | 크기              | 설명               |
| ----------------- | ----------------- | ------------------ |
| 전경 (Foreground) | 1024 x 1024       | 로고만 (투명 배경) |
| 배경              | app.json에서 지정 | `#2E5AFA`          |

```json
// app.json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#2E5AFA"
  }
}
```

**Safe Zone:**

- 중앙 66% (684px) 내에 핵심 콘텐츠 배치
- 외곽 영역은 마스킹으로 잘릴 수 있음

### 3. 스플래시 화면 (splash-icon.png)

| 항목   | 값                |
| ------ | ----------------- |
| 크기   | 512 x 512 (권장)  |
| 형식   | PNG (투명 가능)   |
| 배경색 | app.json에서 지정 |

```json
// app.json
"splash": {
  "image": "./assets/splash-icon.png",
  "resizeMode": "contain",
  "backgroundColor": "#2E5AFA"
}
```

### 4. 알림 아이콘 (notification-icon.png)

| 항목 | 값                |
| ---- | ----------------- |
| 크기 | 96 x 96 (Android) |
| 형식 | PNG (투명 배경)   |
| 색상 | 단색 (흰색 권장)  |

**Android 요구사항:**

- 단순한 실루엣 형태
- 투명 배경
- 흰색 아이콘 (시스템이 색상 적용)

### 5. 파비콘 (favicon.png)

| 항목 | 값          |
| ---- | ----------- |
| 크기 | 48 x 48     |
| 형식 | PNG         |
| 용도 | PWA / 웹 뷰 |

---

## Figma에서 에셋 제작

### 1. 아이콘 프레임 설정

```
Frame: 1024 x 1024
Background: #2E5AFA
Logo: 중앙 배치, 800x800 이내
```

### 2. Export 설정

| 에셋                  | Export 설정                |
| --------------------- | -------------------------- |
| icon.png              | 1x, PNG, 배경 포함         |
| adaptive-icon.png     | 1x, PNG, 투명 배경         |
| splash-icon.png       | 0.5x (512px), PNG          |
| notification-icon.png | 0.09375x (96px), PNG, 단색 |
| favicon.png           | 0.046875x (48px), PNG      |

### 3. 체크리스트

- [ ] 1024x1024 정사각형 확인
- [ ] 브랜드 컬러 (#2E5AFA) 사용
- [ ] 로고 Safe Zone 내 배치
- [ ] PNG 형식 확인
- [ ] 파일명 정확히 일치

---

## 에셋 교체 방법

### 1. 파일 교체

```bash
# assets/ 폴더에 새 파일 복사
cp ~/Downloads/icon.png apps/mobile/assets/
cp ~/Downloads/adaptive-icon.png apps/mobile/assets/
cp ~/Downloads/splash-icon.png apps/mobile/assets/
cp ~/Downloads/notification-icon.png apps/mobile/assets/
cp ~/Downloads/favicon.png apps/mobile/assets/
```

### 2. 캐시 클리어

```bash
cd apps/mobile
npx expo start --clear
```

### 3. 빌드 테스트

```bash
# Development 빌드로 확인
npm run build:dev:android
npm run build:dev:ios
```

---

## 브랜드 가이드라인

### 색상

| 용도   | 색상 코드 | 이름        |
| ------ | --------- | ----------- |
| 메인   | #2E5AFA   | Yiroom Blue |
| 보조   | #FFFFFF   | White       |
| 텍스트 | #1A1A1A   | Dark        |
| 배경   | #F5F5F5   | Light Gray  |

### 로고 사용 규칙

1. **여백**: 로고 높이의 25% 이상 확보
2. **최소 크기**: 32px 이상
3. **배경**: 단색 배경 위에 사용
4. **변형 금지**: 비율 유지, 색상 변경 금지

---

## 앱 스토어 에셋

### iOS (App Store Connect)

| 에셋          | 크기        | 필수 |
| ------------- | ----------- | ---- |
| App Icon      | 1024 x 1024 | ✅   |
| 스크린샷 6.9" | 1320 x 2868 | ✅   |
| 스크린샷 6.7" | 1290 x 2796 | ✅   |
| 스크린샷 6.5" | 1284 x 2778 | ✅   |
| 스크린샷 5.5" | 1242 x 2208 | ✅   |
| iPad 12.9"    | 2048 x 2732 | ✅   |

### Android (Google Play Console)

| 에셋            | 크기                    | 필수 |
| --------------- | ----------------------- | ---- |
| App Icon        | 512 x 512               | ✅   |
| Feature Graphic | 1024 x 500              | ✅   |
| 스크린샷        | 최소 320px, 최대 3840px | ✅   |
| TV Banner       | 1280 x 720              | 선택 |

---

## 자동화 스크립트

### 아이콘 리사이즈 (ImageMagick)

```bash
#!/bin/bash
# resize-icons.sh

SOURCE="icon-source.png"

# 앱 아이콘
convert $SOURCE -resize 1024x1024 assets/icon.png

# 적응형 아이콘 (전경)
convert $SOURCE -resize 1024x1024 assets/adaptive-icon.png

# 스플래시
convert $SOURCE -resize 512x512 assets/splash-icon.png

# 알림 (단색 변환)
convert $SOURCE -resize 96x96 -colorspace Gray assets/notification-icon.png

# 파비콘
convert $SOURCE -resize 48x48 assets/favicon.png

echo "에셋 생성 완료!"
```

### 사용법

```bash
chmod +x resize-icons.sh
./resize-icons.sh
```

---

## 트러블슈팅

### iOS 아이콘이 표시되지 않음

```bash
# Xcode 캐시 클리어
rm -rf ~/Library/Developer/Xcode/DerivedData
npx expo start --clear
```

### Android 적응형 아이콘 깨짐

- Safe Zone (66%) 내에 콘텐츠 배치 확인
- 배경색이 app.json에 설정되어 있는지 확인

### 스플래시 화면 늘어남

```json
// app.json - resizeMode 확인
"splash": {
  "resizeMode": "contain"  // "cover" 아님
}
```
