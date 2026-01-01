# 이룸 네이티브 위젯 빌드 가이드

> iOS WidgetKit 및 Android Glance 위젯 빌드 방법

## 사전 요구사항

1. **EAS CLI 설치**

   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **EAS 프로젝트 설정**

   ```bash
   eas init
   ```

3. **개발 빌드 생성**
   ```bash
   npm run build:dev
   ```

## iOS 위젯 빌드

### 1. Widget Extension 생성

Xcode에서 Widget Extension을 추가해야 합니다.

```bash
# EAS로 로컬 빌드 후 Xcode에서 열기
eas build --platform ios --profile development --local
open ios/yiroom.xcworkspace
```

### 2. Widget Extension 추가

1. Xcode에서 `File > New > Target` 선택
2. `Widget Extension` 선택
3. Product Name: `YiroomWidget`
4. App Groups 활성화: `group.com.yiroom.app`

### 3. 위젯 코드 구현

```swift
// YiroomWidget.swift
import WidgetKit
import SwiftUI

struct YiroomWidgetEntry: TimelineEntry {
    let date: Date
    let workoutMinutes: Int
    let waterMl: Int
    let calories: Int
}

struct YiroomWidgetView: View {
    let entry: YiroomWidgetEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("오늘의 이룸")
                .font(.headline)

            HStack {
                StatItem(icon: "figure.run", value: "\(entry.workoutMinutes)분")
                StatItem(icon: "drop.fill", value: "\(entry.waterMl)ml")
                StatItem(icon: "flame.fill", value: "\(entry.calories)kcal")
            }
        }
        .padding()
    }
}

@main
struct YiroomWidget: Widget {
    let kind: String = "YiroomWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            YiroomWidgetView(entry: entry)
        }
        .configurationDisplayName("이룸 위젯")
        .description("오늘의 운동, 물, 칼로리 현황")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

### 4. App Groups 데이터 공유

```swift
// UserDefaults 공유
let sharedDefaults = UserDefaults(suiteName: "group.com.yiroom.app")
let widgetData = sharedDefaults?.dictionary(forKey: "widget_data")
```

## Android 위젯 빌드

### 1. 위젯 리소스 생성

`android/app/src/main/res/xml/widget_info.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="180dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/widget_layout"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />
```

### 2. 위젯 레이아웃

`android/app/src/main/res/layout/widget_layout.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:background="@drawable/widget_background">

    <TextView
        android:id="@+id/widget_title"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="오늘의 이룸"
        android:textSize="16sp"
        android:textStyle="bold" />

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:layout_marginTop="8dp">

        <TextView
            android:id="@+id/workout_stat"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1" />

        <TextView
            android:id="@+id/water_stat"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1" />

        <TextView
            android:id="@+id/calorie_stat"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1" />
    </LinearLayout>
</LinearLayout>
```

### 3. 위젯 프로바이더

```kotlin
// YiroomWidgetProvider.kt
class YiroomWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val prefs = context.getSharedPreferences("widget_data", Context.MODE_PRIVATE)

        val views = RemoteViews(context.packageName, R.layout.widget_layout)
        views.setTextViewText(R.id.workout_stat, "${prefs.getInt("workout_minutes", 0)}분")
        views.setTextViewText(R.id.water_stat, "${prefs.getInt("water_ml", 0)}ml")
        views.setTextViewText(R.id.calorie_stat, "${prefs.getInt("calories", 0)}kcal")

        // 딥링크 설정
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("yiroom://workout/session"))
        val pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE)
        views.setOnClickPendingIntent(R.id.widget_layout, pendingIntent)

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}
```

## EAS 빌드 프로파일

`eas.json`에 위젯 빌드용 프로파일 추가:

```json
{
  "build": {
    "widget-development": {
      "extends": "development",
      "ios": {
        "buildConfiguration": "Debug"
      },
      "android": {
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "widget-production": {
      "extends": "production",
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  }
}
```

## 빌드 명령어

```bash
# 개발 빌드 (위젯 포함)
eas build --profile widget-development --platform all

# 프로덕션 빌드
eas build --profile widget-production --platform all

# 로컬 빌드 (디버깅)
eas build --profile widget-development --platform ios --local
```

## 데이터 동기화

React Native에서 위젯 데이터 업데이트:

```typescript
import { saveWidgetData } from '@/lib/widgets';

// 위젯 데이터 저장 (iOS App Groups / Android SharedPreferences)
await saveWidgetData({
  workoutMinutes: 30,
  waterMl: 1500,
  calories: 1800,
  streak: 7,
});
```

## 트러블슈팅

### iOS: App Groups 오류

- Xcode에서 Signing & Capabilities 확인
- `group.com.yiroom.app` 정확히 일치 확인

### Android: 위젯 표시 안됨

- AndroidManifest.xml receiver 설정 확인
- widget_info.xml 리소스 경로 확인

### 데이터 동기화 안됨

- UserDefaults/SharedPreferences 키 일치 확인
- 앱 백그라운드 전환 시 동기화 호출 확인
