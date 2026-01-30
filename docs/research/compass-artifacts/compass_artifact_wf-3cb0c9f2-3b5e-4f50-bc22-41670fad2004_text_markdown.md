# WCAG 2.2 웹 접근성 종합 가이드: 이룸(Yiroom) 뷰티 플랫폼

이룸 앱의 WCAG 2.2 AA 준수를 위해 **9개의 새로운 성공 기준 구현**, **한국 WA 인증 획득**, **React 19/Next.js 16 접근성 패턴 적용**이 핵심입니다. 뷰티/웰니스 앱 특성상 색상 선택기, 제품 캐러셀, 인증 시스템이 가장 중요한 구현 포인트이며, 한국 시장에서는 **센스리더**(85.2% 점유율) 호환성이 필수입니다. 본 가이드는 2025년 1월 기준 최신 WCAG 2.2(2023년 10월 발표)와 KWCAG 2.2 요구사항을 반영합니다.

---

## WCAG 2.2 핵심 변경사항: 9개 새 성공 기준

WCAG 2.2는 2023년 10월 5일 W3C 권고안으로 발표되었으며, 인지 장애, 저시력, 운동 장애 사용자 지원을 강화한 **9개 신규 기준**을 추가하고 기존 **4.1.1 Parsing 기준을 삭제**했습니다.

### Level A 기준 (필수 최소)

| 기준 | 설명 | 이룸 적용 |
|------|------|----------|
| **3.2.6 일관된 도움(Consistent Help)** | 도움말 메커니즘이 모든 페이지에서 동일한 상대적 위치 유지 | 채팅/고객센터 버튼을 항상 하단 우측에 배치 |
| **3.3.7 중복 입력(Redundant Entry)** | 이전에 입력한 정보를 자동 완성하거나 선택 가능하게 제공 | 배송지→결제지 자동 복사, 피부 프로필 데이터 재활용 |

### Level AA 기준 (표준 준수 필수)

| 기준 | 설명 | 이룸 중요도 |
|------|------|-----------|
| **2.4.11 포커스 가림 방지(최소)** | 키보드 포커스 시 요소가 완전히 가려지면 안 됨 | 🔴 고정 헤더/플로팅 버튼 검토 필수 |
| **2.5.7 드래그 동작** | 드래그 필수 기능에 단일 포인터 대안 제공 | 🔴 컬러피커, 슬라이더, 캐러셀 핵심 |
| **2.5.8 타겟 크기(최소)** | 터치 타겟 최소 **24×24 CSS 픽셀** | 🔴 제품 색상 스와치, 아이콘 버튼 |
| **3.3.8 접근 가능한 인증(최소)** | 인지 기능 테스트(비밀번호 기억, 퍼즐) 없이 인증 가능해야 함 | 🔴 비밀번호 관리자 허용, 생체인증 지원 |

### Level AAA 기준 (권장)

| 기준 | 설명 |
|------|------|
| **2.4.12 포커스 가림 방지(향상)** | 포커스된 요소의 어떤 부분도 가려지면 안 됨 |
| **2.4.13 포커스 외관** | 포커스 표시자 최소 **2px 두께**, 대비율 **3:1 이상** |
| **3.3.9 접근 가능한 인증(향상)** | 이미지 인식 CAPTCHA도 불허 |

### 삭제된 기준

**4.1.1 Parsing**: 현대 브라우저가 마크업 오류를 자동 수정하므로 삭제됨. 관련 이슈는 1.3.1(정보와 관계), 4.1.2(이름, 역할, 값)로 커버됩니다.

---

## 뷰티 앱 핵심 구현 포인트

### 컬러피커/퍼스널컬러 분석 (2.5.7 드래그 동작)

드래그만 지원하면 **Level AA 위반**입니다. 반드시 단일 탭/클릭 대안을 제공해야 합니다.

```tsx
// ✅ 접근 가능한 컬러피커 컴포넌트
interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export const AccessibleColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const [rgb, setRgb] = useState({ r: 255, g: 128, b: 128 });
  
  return (
    <div role="group" aria-labelledby="color-picker-label">
      <span id="color-picker-label">색상 선택</span>
      
      {/* 색상 휠: 클릭으로 선택 가능 (드래그 대안) */}
      <canvas 
        onClick={(e) => handleColorSelect(e)} 
        aria-label="색상 휠 - 클릭하여 색상 선택"
      />
      
      {/* 텍스트 입력 대안 (필수) */}
      <div className="color-inputs">
        <label>
          Hex 코드
          <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            aria-describedby="hex-hint"
          />
          <span id="hex-hint" className="sr-only">예: #FF8080</span>
        </label>
        
        {/* RGB 개별 입력 */}
        <fieldset>
          <legend>RGB 값 직접 입력</legend>
          <label>
            R <input type="number" min={0} max={255} value={rgb.r} 
                     onChange={(e) => handleRgbChange('r', e.target.value)} />
          </label>
          <label>
            G <input type="number" min={0} max={255} value={rgb.g}
                     onChange={(e) => handleRgbChange('g', e.target.value)} />
          </label>
          <label>
            B <input type="number" min={0} max={255} value={rgb.b}
                     onChange={(e) => handleRgbChange('b', e.target.value)} />
          </label>
        </fieldset>
      </div>
    </div>
  );
};
```

### 제품 캐러셀 (2.5.7 + 2.4.11)

스와이프 전용 캐러셀은 접근성 위반입니다.

```tsx
// ✅ 접근 가능한 제품 캐러셀
export const AccessibleCarousel: React.FC<{ products: Product[] }> = ({ products }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    // 스크린 리더에 슬라이드 변경 알림
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = 
        `슬라이드 ${index + 1}/${products.length}: ${products[index].name}`;
    }
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="추천 제품"
      onFocus={() => setIsPaused(true)}   // 포커스 시 자동 재생 중지
      onBlur={() => setIsPaused(false)}
    >
      {/* 필수: 일시정지/재생 컨트롤 */}
      <button 
        onClick={() => setIsPaused(!isPaused)}
        aria-label={isPaused ? '슬라이드쇼 재생' : '슬라이드쇼 일시정지'}
      >
        {isPaused ? '▶️' : '⏸️'}
      </button>

      {/* 필수: 이전/다음 버튼 (드래그 대안) */}
      <button 
        onClick={() => goToSlide((currentIndex - 1 + products.length) % products.length)}
        aria-label="이전 슬라이드"
        style={{ minWidth: '44px', minHeight: '44px' }} // 타겟 크기 확보
      >
        ←
      </button>
      <button 
        onClick={() => goToSlide((currentIndex + 1) % products.length)}
        aria-label="다음 슬라이드"
        style={{ minWidth: '44px', minHeight: '44px' }}
      >
        →
      </button>

      {/* 슬라이드 콘텐츠 */}
      <div className="slides">
        {products.map((product, i) => (
          <div
            key={product.id}
            role="group"
            aria-roledescription="slide"
            aria-hidden={i !== currentIndex}
            aria-label={`${i + 1}/${products.length}`}
          >
            <img src={product.image} alt={product.name} />
          </div>
        ))}
      </div>

      {/* 필수: 닷 네비게이션 (드래그 대안) */}
      <div role="tablist" aria-label="슬라이드 컨트롤">
        {products.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === currentIndex}
            aria-label={`${i + 1}번 슬라이드로 이동`}
            onClick={() => goToSlide(i)}
            style={{ minWidth: '24px', minHeight: '24px' }} // 최소 타겟 크기
          />
        ))}
      </div>

      {/* 라이브 리전 (스크린 리더 알림) */}
      <div ref={liveRegionRef} aria-live="polite" className="sr-only" />
    </section>
  );
};
```

### 인증 시스템 (3.3.8)

```tsx
// ✅ 접근 가능한 로그인 폼
export const AccessibleLoginForm: React.FC = () => {
  return (
    <form>
      {/* 비밀번호 입력: 붙여넣기 허용 필수 */}
      <label htmlFor="password">비밀번호</label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"  // 비밀번호 관리자 지원
        // ❌ onPaste={(e) => e.preventDefault()} 절대 금지
      />

      {/* 인증코드: 분할 입력 필드 금지 */}
      <label htmlFor="otp">인증 코드</label>
      <input
        id="otp"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"  // OTP 자동완성 지원
        // ❌ 6자리를 6개 필드로 분할하지 말 것
      />

      {/* 대체 인증 수단 제공 (필수) */}
      <div className="alternative-auth">
        <button type="button" onClick={handleKakaoLogin}>
          카카오 로그인
        </button>
        <button type="button" onClick={handleBiometricLogin}>
          생체 인증 로그인
        </button>
      </div>
    </form>
  );
};
```

---

## 한국 웹 접근성 인증(WA) 획득 가이드

### 인증 기관

한국에는 과학기술정보통신부 지정 **3개 공식 인증기관**이 있습니다:

| 기관 | 웹사이트 | 연락처 |
|------|----------|--------|
| 한국디지털접근성진흥원(KWACC/KDAA) | www.kwacc.or.kr | 02-2138-7530 |
| 한국정보접근성인증평가원 | www.wa.or.kr | 02-858-7220 |
| 웹와치(WebWatch) | www.webwatch.or.kr | - |

### 인증 절차 및 비용

```
1. 견적 신청 → 2. 심사 신청/결제 → 3. 심사 진행 → 4. 결과 통보
```

**모바일 앱 인증 비용 (2025년 기준, VAT 별도):**

| 규모 | 화면 수 | 신규 | 갱신 |
|------|---------|------|------|
| 소형 | 1-20 | ₩1,000,000~1,200,000 | ₩700,000~840,000 |
| 중형 | 21-99 | ₩1,500,000 | ₩1,050,000 |
| 대형 | 100+ | ₩2,100,000 | ₩1,470,000 |

⚠️ **이룸 예상 비용**: 쇼핑/결제 기능 포함 시 별도 견적 필요. **iOS와 Android 별도 평가** 필수.

**인증 기간**: 7~30 영업일 (수정 기간 포함)
**유효 기간**: 1년 (갱신 시 30% 할인)

### KWCAG 2.2 vs WCAG 2.2 비교

| 항목 | WCAG 2.2 | KWCAG 2.2 |
|------|----------|-----------|
| 성공 기준 수 | 86개+ (A/AA/AAA) | **33개** (단일 레벨) |
| 스크린 리더 | NVDA, JAWS, VoiceOver | **센스리더** (필수 테스트) |
| 법적 구속력 | 권고 | **법적 의무** (장애인차별금지법) |
| 인증 방식 | 자체 선언 가능 | **공식 인증 필수** (공공기관) |

### 인증 체크리스트 핵심 항목

KWCAG 2.2는 4원칙 14지침 33개 기준으로 구성됩니다:

**가장 빈번한 불합격 사유:**
- 이미지 대체 텍스트 누락
- 폼 입력 필드 레이블 미연결
- 색상 대비 4.5:1 미달
- 키보드 접근 불가 요소
- 자동 재생 멈춤 컨트롤 없음
- 센스리더 호환 안 되는 커스텀 컴포넌트

---

## React 19 / Next.js 16 접근성 구현 패턴

### React 19 새 기능 활용

```tsx
// React 19: 폼 상태 관리 + 접근성
import { useActionState, useId } from 'react';

interface FormState {
  errors: Record<string, string>;
  success: boolean;
}

async function submitBooking(prev: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get('email') as string;
  if (!email.includes('@')) {
    return { errors: { email: '올바른 이메일을 입력하세요' }, success: false };
  }
  return { errors: {}, success: true };
}

export function BookingForm() {
  const [state, formAction, isPending] = useActionState(submitBooking, { errors: {}, success: false });
  const emailId = useId();
  const emailErrorId = useId();

  return (
    <form action={formAction}>
      <label htmlFor={emailId}>이메일</label>
      <input
        id={emailId}
        name="email"
        type="email"
        aria-describedby={state.errors.email ? emailErrorId : undefined}
        aria-invalid={!!state.errors.email}
        aria-required="true"
      />
      {state.errors.email && (
        <span id={emailErrorId} role="alert" className="error">
          {state.errors.email}
        </span>
      )}
      
      <button type="submit" disabled={isPending}>
        {isPending ? '예약 중...' : '예약하기'}
      </button>
      
      {/* 상태 알림 라이브 리전 */}
      <div aria-live="polite" className="sr-only">
        {isPending && '예약을 처리 중입니다...'}
        {state.success && '예약이 완료되었습니다!'}
      </div>
    </form>
  );
}
```

### Next.js App Router 접근성

```tsx
// app/layout.tsx
import { SkipLinks } from '@/components/SkipLinks';

export const metadata = {
  title: {
    template: '%s | 이룸',
    default: '이룸 - 뷰티 & 웰니스 플랫폼',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {/* 스킵 네비게이션 */}
        <SkipLinks links={[
          { targetId: 'main-content', label: '본문으로 건너뛰기' },
          { targetId: 'main-nav', label: '네비게이션으로 이동' },
        ]} />
        
        <header>
          <nav id="main-nav" aria-label="메인 네비게이션">
            {/* 네비게이션 */}
          </nav>
        </header>
        
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
```

### 컴포넌트 라이브러리 비교

| 라이브러리 | 장점 | 이룸 적합도 |
|-----------|------|-----------|
| **React Aria** | 최고 수준 ARIA 지원, 30+ 언어 i18n, 복잡한 위젯 | ⭐ 폼, 날짜선택기, 컬러피커에 최적 |
| **Radix UI** | Tailwind 호환, 빠른 개발, data-* 스타일링 | ⭐ 모달, 드롭다운에 적합 |
| **Headless UI** | Tailwind 최적화, 간단한 API | 기본 컴포넌트용 |

**권장 조합**: 복잡한 폼에는 React Aria, 오버레이 UI에는 Radix UI 사용

### 접근 가능한 모달 컴포넌트

```tsx
// components/Modal.tsx
import { useRef, useEffect, useCallback } from 'react';
import FocusTrap from 'focus-trap-react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // 열릴 때 이전 포커스 저장
  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 닫힐 때 포커스 복원
  useEffect(() => {
    if (!isOpen && previousFocus.current) {
      previousFocus.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return createPortal(
    <FocusTrap>
      <div 
        className="modal-overlay" 
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onKeyDown={handleKeyDown}
          className="modal-content"
        >
          <h2 id={titleId}>{title}</h2>
          {children}
          <button onClick={onClose} aria-label="모달 닫기">×</button>
        </div>
      </div>
    </FocusTrap>,
    document.body
  );
};
```

---

## 스크린 리더 호환성 가이드

### 한국 시장 스크린 리더 점유율

| 스크린 리더 | 점유율 | 테스트 우선순위 |
|------------|--------|----------------|
| **센스리더** | 85.2% | 🔴 필수 (WA 인증 기준) |
| VoiceOver | 7.6% | 🟡 높음 (iOS 사용자) |
| NVDA | 4.2% | 🟢 중간 |
| JAWS | 0.6% | 🟢 낮음 |

### 라이브 리전 구현

```tsx
// ✅ 올바른 라이브 리전 패턴
const SearchResults: React.FC<{ query: string; results: Product[] }> = ({ query, results }) => {
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (liveRef.current && query) {
      liveRef.current.textContent = results.length
        ? `"${query}" 검색 결과 ${results.length}개`
        : `"${query}" 검색 결과 없음`;
    }
  }, [query, results]);

  return (
    <>
      {/* 라이브 리전은 항상 DOM에 존재해야 함 */}
      <div ref={liveRef} aria-live="polite" aria-atomic="true" className="sr-only" />
      
      <ul role="list" aria-label="검색 결과">
        {results.map((product) => (
          <li key={product.id}><ProductCard product={product} /></li>
        ))}
      </ul>
    </>
  );
};
```

### React Native/Expo 접근성

```tsx
// 모바일 앱 접근성 컴포넌트
import { View, Text, TouchableOpacity, AccessibilityInfo } from 'react-native';

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const handleAddToCart = () => {
    // 스크린 리더에 알림
    AccessibilityInfo.announceForAccessibility(
      `${product.name}이(가) 장바구니에 추가되었습니다`
    );
  };

  return (
    <View
      accessible={true}
      accessibilityLabel={`${product.name}, ${product.price}원`}
      accessibilityRole="button"
      accessibilityHint="장바구니에 추가하려면 두 번 탭하세요"
      accessibilityLanguage="ko-KR"  // iOS 발음 최적화
    >
      <Text>{product.name}</Text>
      <TouchableOpacity
        accessible={true}
        accessibilityLabel="장바구니에 추가"
        accessibilityRole="button"
        onPress={handleAddToCart}
      >
        <Text>추가</Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## 키보드 네비게이션 구현

### 스킵 링크 컴포넌트

```tsx
// components/SkipLinks.tsx
import styles from './SkipLinks.module.css';

interface SkipLinksProps {
  links: Array<{ targetId: string; label: string }>;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ links }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus();
    }
  };

  return (
    <nav aria-label="스킵 링크">
      {links.map(({ targetId, label }) => (
        <a
          key={targetId}
          href={`#${targetId}`}
          className={styles.skipLink}
          onClick={(e) => handleClick(e, targetId)}
        >
          {label}
        </a>
      ))}
    </nav>
  );
};
```

```css
/* SkipLinks.module.css */
.skipLink {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: 9999;
  padding: 1rem 1.5rem;
  background: #0066cc;
  color: white;
  transform: translateY(-100%);
  transition: transform 0.2s;
}

.skipLink:focus {
  top: 0;
  transform: translateY(0);
  outline: 3px solid #ffcc00;
}
```

### 포커스 트랩 훅

```tsx
// hooks/useFocusTrap.ts
import { useEffect, useRef, useCallback, RefObject } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap<T extends HTMLElement>(
  containerRef: RefObject<T>,
  options: { isActive: boolean; onEscape?: () => void }
) {
  const { isActive, onEscape } = options;
  const previousFocus = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!containerRef.current) return;
    
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
      return;
    }

    if (e.key === 'Tab') {
      const focusable = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [containerRef, onEscape]);

  useEffect(() => {
    if (isActive) {
      previousFocus.current = document.activeElement as HTMLElement;
      containerRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
      document.addEventListener('keydown', handleKeyDown);
    } else if (previousFocus.current) {
      previousFocus.current.focus();
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleKeyDown, containerRef]);
}
```

### WCAG 2.2 포커스 스타일

```css
/* 전역 포커스 스타일 - WCAG 2.4.13 준수 */
*:focus {
  outline: none;
}

*:focus-visible {
  outline: 3px solid #0066cc;  /* 최소 2px, 3:1 대비 */
  outline-offset: 2px;
}

/* 고대비 모드 지원 */
@media (prefers-contrast: more) {
  *:focus-visible {
    outline: 4px solid currentColor;
    outline-offset: 4px;
  }
}

/* 스크롤 시 고정 헤더가 포커스 가리지 않도록 (2.4.11) */
html {
  scroll-padding-top: 80px;
}
```

---

## 색상 대비 및 시각 접근성

### WCAG 대비 요구사항

| 대상 | Level AA | Level AAA |
|------|----------|-----------|
| 일반 텍스트 | **4.5:1** | 7:1 |
| 큰 텍스트 (18pt+ 또는 14pt 볼드) | **3:1** | 4.5:1 |
| UI 컴포넌트/아이콘 | **3:1** | - |

### 뷰티 앱 색상 표현 패턴

```tsx
// ✅ 접근 가능한 립스틱 색상 선택기
const LipstickShadeSelector: React.FC<{ shades: Shade[] }> = ({ shades }) => (
  <fieldset>
    <legend>립스틱 색상 선택</legend>
    {shades.map((shade) => (
      <label key={shade.id} className="shade-option">
        <input type="radio" name="shade" value={shade.id} />
        <span 
          className="swatch" 
          style={{ backgroundColor: shade.hex }}
          aria-hidden="true"  // 시각적 장식
        >
          {/* 색상에만 의존하지 않도록 텍스처 패턴 추가 */}
          <span className={`pattern pattern-${shade.finish}`} />
        </span>
        {/* 필수: 색상 이름 텍스트 */}
        <span className="shade-name">{shade.name}</span>
        <span className="shade-code">#{shade.code}</span>
        <span className="shade-finish">{shade.finish}</span>
      </label>
    ))}
  </fieldset>
);
```

### 다크 모드 구현

```css
/* CSS 변수 기반 테마 */
:root {
  --color-bg: #ffffff;
  --color-text: #1a1a1a;           /* 16.6:1 대비 */
  --color-text-secondary: #404040; /* 10.7:1 대비 */
  --color-accent: #0066cc;         /* 7:1 대비 */
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #1a1a1a;           /* 순수 검정 피함 */
    --color-text: #ececec;         /* 순수 흰색 피함 */
    --color-text-secondary: #b3b3b3;
    --color-accent: #66b3ff;       /* 어두운 배경용 밝은 파랑 */
  }
}
```

### 색맹 사용자 고려

**피해야 할 색상 조합:**
- 빨강 + 초록 (가장 흔한 색맹 유형)
- 파랑 + 보라
- 연두 + 노랑

**권장 패턴:**
- 색상 + 아이콘 + 텍스트 조합 사용
- 오류: 🔴 + ✗ + "오류 메시지"
- 성공: 🟢 + ✓ + "성공 메시지"

---

## 테스트 도구 및 자동화

### 개발 단계 도구

| 도구 | 유형 | 용도 |
|------|------|------|
| **eslint-plugin-jsx-a11y** | ESLint 플러그인 | 코드 작성 시 접근성 오류 감지 |
| **axe DevTools** | 브라우저 확장 | 실시간 페이지 검사 |
| **Lighthouse** | Chrome 내장 | 접근성 점수 측정 |
| **WAVE** | 브라우저 확장 | 시각적 오류 표시 |

### 자동화 테스트 설정

```typescript
// jest.setup.ts
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

// __tests__/accessibility.test.tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import ProductCard from '@/components/ProductCard';

describe('ProductCard 접근성', () => {
  it('WCAG 위반 없음', async () => {
    const { container } = render(<ProductCard product={mockProduct} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('색상 대비 충족', async () => {
    const { container } = render(<ProductCard product={mockProduct} />);
    const results = await axe(container, { rules: ['color-contrast'] });
    expect(results).toHaveNoViolations();
  });
});
```

### Playwright 접근성 테스트

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('홈페이지 WCAG 2.2 AA 준수', async ({ page }) => {
  await page.goto('/');
  
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();
  
  expect(results.violations).toEqual([]);
});

test('키보드 네비게이션 작동', async ({ page }) => {
  await page.goto('/');
  
  // Tab으로 스킵 링크에 도달
  await page.keyboard.press('Tab');
  const skipLink = page.locator(':focus');
  await expect(skipLink).toHaveText('본문으로 건너뛰기');
  
  // Enter로 메인 콘텐츠로 이동
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});
```

---

## 이룸 앱 WCAG 2.2 AA 준수 체크리스트

### 🔴 필수 (Level A + AA)

#### 인식의 용이성
- [ ] 모든 이미지에 의미 있는 alt 텍스트 제공
- [ ] 색상 스와치에 텍스트 레이블 동반
- [ ] 텍스트 대비 4.5:1 이상 (큰 텍스트 3:1)
- [ ] UI 컴포넌트 대비 3:1 이상
- [ ] 자동 재생 오디오/비디오 3초 이내 또는 정지 컨트롤

#### 운용의 용이성
- [ ] 모든 기능 키보드로 접근 가능
- [ ] 포커스 표시자 2px 이상, 3:1 대비
- [ ] 고정 요소가 포커스 가리지 않음 (2.4.11)
- [ ] 드래그 기능에 클릭 대안 제공 (2.5.7)
- [ ] 터치 타겟 최소 24×24px (2.5.8)
- [ ] 스킵 네비게이션 제공

#### 이해의 용이성
- [ ] 페이지 언어 선언 (`lang="ko"`)
- [ ] 폼 입력에 레이블 연결
- [ ] 오류 메시지 명확히 식별
- [ ] 비밀번호 관리자/붙여넣기 허용 (3.3.8)
- [ ] 이전 입력 정보 자동 완성 (3.3.7)
- [ ] 도움말 위치 일관성 (3.2.6)

#### 견고성
- [ ] 유효한 HTML 마크업
- [ ] ARIA 올바르게 사용
- [ ] 센스리더 호환 테스트 완료

### 🟢 권장 (Level AAA)

- [ ] 포커스된 요소 일부도 가리지 않음 (2.4.12)
- [ ] 텍스트 대비 7:1 (향상)
- [ ] 모든 CAPTCHA 제거 (3.3.9)

---

## 결론: 핵심 실행 항목

이룸 플랫폼의 WCAG 2.2 AA 준수와 한국 WA 인증 획득을 위해 다음 순서로 진행하세요:

**1단계 - 즉시 구현 (2주)**
- 모든 드래그 기능에 클릭 대안 추가 (컬러피커, 슬라이더, 캐러셀)
- 터치 타겟 24×24px 이상 확보
- 비밀번호 필드 붙여넣기 허용, 소셜 로그인 제공

**2단계 - 단기 구현 (4주)**
- 고정 헤더/플로팅 버튼 포커스 가림 검토
- 스킵 네비게이션 추가
- 라이브 리전으로 동적 콘텐츠 알림

**3단계 - 인증 준비 (6주)**
- 센스리더로 전체 플로우 테스트
- 자동화 테스트 파이프라인 구축
- KWACC에 견적 신청

뷰티/웰니스 앱에서 가장 자주 간과되는 부분은 **색상 선택 UI의 드래그 대안**과 **작은 색상 스와치의 타겟 크기**입니다. 퍼스널컬러 분석 결과 화면에서는 색상만으로 정보를 전달하지 말고, 반드시 텍스트 레이블과 아이콘을 함께 사용하세요. 이러한 접근성 개선은 장애 사용자뿐 아니라 밝은 햇빛 아래에서 화면을 보는 모든 사용자의 경험을 향상시킵니다.