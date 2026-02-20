#!/bin/bash
# Expo Go 에뮬레이터 빠른 실행 스크립트
# 사용법: bash scripts/expo-emulator.sh
#
# 전제 조건:
#   1. Android 에뮬레이터가 실행 중
#   2. Expo Go 54.x가 에뮬레이터에 설치됨
#
# 트러블슈팅: docs/troubleshooting/2026-02-20-expo-go-emulator-startup.md

set -e

# ADB 경로 (Windows SDK 기본 경로)
ADB="${ANDROID_SDK_ROOT:-$HOME/AppData/Local/Android/Sdk}/platform-tools/adb.exe"
if [ ! -f "$ADB" ]; then
  ADB="adb"  # PATH에서 찾기
fi

PORT=8081
PROJECT_DIR="apps/mobile"

echo "=== Expo Go 에뮬레이터 실행 ==="
echo ""

# 1. 에뮬레이터 연결 확인
echo "[1/4] 에뮬레이터 연결 확인..."
DEVICES=$("$ADB" devices | grep -c "device$" || true)
if [ "$DEVICES" -eq 0 ]; then
  echo "❌ 연결된 에뮬레이터가 없습니다."
  echo "   Android Studio → Device Manager → 에뮬레이터 실행 후 다시 시도하세요."
  exit 1
fi
echo "✅ 에뮬레이터 연결됨 ($DEVICES개)"

# 2. Expo Go 설치 확인
echo "[2/4] Expo Go 설치 확인..."
if "$ADB" shell pm list packages 2>/dev/null | grep -q "host.exp.exponent"; then
  echo "✅ Expo Go 설치됨"
else
  echo "❌ Expo Go가 설치되어 있지 않습니다."
  echo ""
  echo "설치 방법:"
  echo "  1. https://github.com/expo/expo-go-releases/releases 에서 SDK 54 APK 다운로드"
  echo "  2. adb install expo-go-54.apk"
  exit 1
fi

# 3. ADB 포트 포워딩
echo "[3/4] ADB 포트 포워딩 (tcp:$PORT)..."
"$ADB" reverse tcp:$PORT tcp:$PORT
echo "✅ localhost:$PORT → 호스트 포워딩 완료"

# 4. Metro 시작
echo "[4/4] Metro Bundler 시작..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Metro 시작 후 Expo Go에서 연결하세요:"
echo ""
echo "  방법 1: Recently opened → 이룸"
echo "  방법 2: Enter URL manually → exp://localhost:$PORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$PROJECT_DIR"
EXPO_NO_DEPENDENCY_VALIDATION=1 npx expo start --go --port $PORT
