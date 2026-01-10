#!/bin/bash

# ============================================================
# 이미지 최적화 스크립트
# ============================================================
# 사용법:
#   chmod +x scripts/optimize-images.sh
#   ./scripts/optimize-images.sh
#
# 필요 도구:
#   - pngquant: brew install pngquant (macOS) / apt install pngquant (Ubuntu)
#   - jpegoptim: brew install jpegoptim (macOS) / apt install jpegoptim (Ubuntu)
#   - cwebp: brew install webp (macOS) / apt install webp (Ubuntu)
# ============================================================

set -e

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 스크립트 위치 기준으로 public 폴더 찾기
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PUBLIC_DIR="$SCRIPT_DIR/../public"
IMAGES_DIR="$PUBLIC_DIR/images"

echo -e "${YELLOW}=== 이미지 최적화 시작 ===${NC}"

# 이미지 폴더 확인
if [ ! -d "$IMAGES_DIR" ]; then
  echo -e "${RED}이미지 폴더가 없습니다: $IMAGES_DIR${NC}"
  exit 1
fi

# 필요 도구 확인
check_tool() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}$1이 설치되어 있지 않습니다.${NC}"
    echo "설치: $2"
    return 1
  fi
  return 0
}

TOOLS_OK=true
check_tool "pngquant" "brew install pngquant (macOS) / apt install pngquant (Ubuntu)" || TOOLS_OK=false
check_tool "jpegoptim" "brew install jpegoptim (macOS) / apt install jpegoptim (Ubuntu)" || TOOLS_OK=false
check_tool "cwebp" "brew install webp (macOS) / apt install webp (Ubuntu)" || TOOLS_OK=false

if [ "$TOOLS_OK" = false ]; then
  echo -e "${YELLOW}일부 도구가 누락되었습니다. 해당 단계를 건너뜁니다.${NC}"
fi

# PNG 최적화 (65-80% 품질)
echo -e "\n${GREEN}1. PNG 최적화 중...${NC}"
if command -v pngquant &> /dev/null; then
  PNG_COUNT=$(find "$IMAGES_DIR" -name "*.png" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$PNG_COUNT" -gt 0 ]; then
    find "$IMAGES_DIR" -name "*.png" -exec pngquant --quality=65-80 --ext .png --force {} \; 2>/dev/null || true
    echo -e "  ${GREEN}PNG 파일 $PNG_COUNT개 최적화 완료${NC}"
  else
    echo -e "  ${YELLOW}PNG 파일 없음${NC}"
  fi
else
  echo -e "  ${YELLOW}pngquant 미설치 - 건너뜀${NC}"
fi

# JPG 최적화 (최대 80% 품질)
echo -e "\n${GREEN}2. JPG 최적화 중...${NC}"
if command -v jpegoptim &> /dev/null; then
  JPG_COUNT=$(find "$IMAGES_DIR" \( -name "*.jpg" -o -name "*.jpeg" \) 2>/dev/null | wc -l | tr -d ' ')
  if [ "$JPG_COUNT" -gt 0 ]; then
    find "$IMAGES_DIR" \( -name "*.jpg" -o -name "*.jpeg" \) -exec jpegoptim --max=80 --strip-all {} \; 2>/dev/null || true
    echo -e "  ${GREEN}JPG 파일 $JPG_COUNT개 최적화 완료${NC}"
  else
    echo -e "  ${YELLOW}JPG 파일 없음${NC}"
  fi
else
  echo -e "  ${YELLOW}jpegoptim 미설치 - 건너뜀${NC}"
fi

# WebP 변환 (PNG/JPG → WebP)
echo -e "\n${GREEN}3. WebP 변환 중...${NC}"
if command -v cwebp &> /dev/null; then
  CONVERTED=0
  for file in "$IMAGES_DIR"/*.png "$IMAGES_DIR"/*.jpg "$IMAGES_DIR"/*.jpeg; do
    if [ -f "$file" ]; then
      OUTPUT="${file%.*}.webp"
      if [ ! -f "$OUTPUT" ]; then
        cwebp -q 80 "$file" -o "$OUTPUT" 2>/dev/null
        CONVERTED=$((CONVERTED + 1))
      fi
    fi
  done
  if [ "$CONVERTED" -gt 0 ]; then
    echo -e "  ${GREEN}WebP 파일 $CONVERTED개 생성${NC}"
  else
    echo -e "  ${YELLOW}변환할 파일 없음 (이미 WebP 존재)${NC}"
  fi
else
  echo -e "  ${YELLOW}cwebp 미설치 - 건너뜀${NC}"
fi

# 최적화 결과 요약
echo -e "\n${YELLOW}=== 최적화 완료 ===${NC}"
echo -e "이미지 폴더: $IMAGES_DIR"
if [ -d "$IMAGES_DIR" ]; then
  echo -e "총 이미지 수: $(find "$IMAGES_DIR" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" \) 2>/dev/null | wc -l | tr -d ' ')"
fi
