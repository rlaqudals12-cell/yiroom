/**
 * 위젯 설정 Config Plugin
 * iOS WidgetKit 및 Android Glance 위젯 설정
 *
 * 이 플러그인은 네이티브 위젯 빌드를 위한 설정을 추가합니다.
 * 실제 네이티브 코드는 EAS Build 시 별도로 추가해야 합니다.
 *
 * @see https://docs.expo.dev/config-plugins/introduction/
 */

const { withInfoPlist, withAndroidManifest } = require('@expo/config-plugins');

/**
 * iOS 위젯 설정
 */
function withIosWidget(config) {
  return withInfoPlist(config, (config) => {
    // App Groups 확인 (이미 app.json에서 설정됨)
    if (!config.modResults.NSAppTransportSecurity) {
      config.modResults.NSAppTransportSecurity = {};
    }

    // 위젯 관련 Info.plist 설정 추가
    config.modResults.NSWidgetExtensionDescription = '이룸 위젯';

    return config;
  });
}

/**
 * Android 위젯 설정
 */
function withAndroidWidget(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Application 노드 찾기
    const application = manifest.application?.[0];
    if (!application) return config;

    // 위젯 프로바이더 추가 (네이티브 코드 필요)
    // 실제 구현 시 AppWidgetProvider 추가
    if (!application.receiver) {
      application.receiver = [];
    }

    // 위젯 수신기 설정 (placeholder)
    const widgetReceiver = {
      $: {
        'android:name': '.widget.YiroomWidgetProvider',
        'android:exported': 'true',
      },
      'intent-filter': [
        {
          action: [
            {
              $: {
                'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
              },
            },
          ],
        },
      ],
      'meta-data': [
        {
          $: {
            'android:name': 'android.appwidget.provider',
            'android:resource': '@xml/widget_info',
          },
        },
      ],
    };

    // 중복 방지
    const hasWidgetReceiver = application.receiver.some(
      (r) => r.$?.['android:name'] === '.widget.YiroomWidgetProvider'
    );

    if (!hasWidgetReceiver) {
      application.receiver.push(widgetReceiver);
    }

    return config;
  });
}

/**
 * 메인 플러그인
 */
module.exports = function withWidgetConfig(config) {
  config = withIosWidget(config);
  config = withAndroidWidget(config);
  return config;
};
