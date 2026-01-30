# 07. 데이터 일관성 규칙

> version: 1.0
> last_updated: 2026-01-14
> source: v2.2 섹션 18

---

## 🔄 문제 정의

```
[문제]
키/체중이 여러 모듈에서 중복 입력될 수 있음
- 체형 분석에서 입력
- 운동 모듈에서 또 입력
- 영양 모듈에서 또 입력
```

---

## ✅ 해결 방안

```
[해결]
기존 데이터 있으면 재사용 여부 물어보기:

"기존에 입력하신 키 170cm, 체중 65kg을 사용할까요?
 아니면 새로 입력하시겠어요?"
```

---

## 📊 데이터 재사용 정책

| 데이터 | 변경 주기 | 재사용 정책 |
|--------|----------|------------|
| 키 | 거의 안 바뀜 | 항상 재사용 확인 |
| 체중 | 주기적 변경 | 최근 데이터 확인 |
| 퍼스널컬러 | 평생 고정 | 1회 분석 후 고정 |
| 피부 분석 | 주기적 (계절/컨디션) | 재분석 옵션 제공 |
| 체형 | 변경 가능 (운동 효과) | 주기적 업데이트 옵션 |

---

## 🔀 특수 케이스

### 당일 동시 분석

퍼스널컬러 + 피부 분석 동시 진행 시:
- 얼굴 사진 1회 촬영으로 두 분석 동시 처리
- 중복 촬영 방지 UX

---

## 💾 구현 패턴

```typescript
// 기존 데이터 확인 후 재사용
async function getOrRequestMeasurement(userId: string) {
  const existing = await getMeasurement(userId);
  
  if (existing) {
    const reuse = await showConfirmDialog(
      `기존 정보 사용: 키 ${existing.height}cm, 체중 ${existing.weight}kg`
    );
    if (reuse) return existing;
  }
  
  return await requestNewMeasurement();
}
```

---

## 🔗 관련 문서

- `06-avatar-system.md` - 아바타 생성
- `10-inventory.md` - 인벤토리 시스템
