internal import Expo
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import RNBootSplash
import UserNotifications
import JPush

@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: ExpoReactNativeFactory?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "RnBaseTemplate",
      in: window,
      launchOptions: launchOptions
    )

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    RCTLinkingManager.application(app, open: url, options: options)
    return super.application(app, open: url, options: options)
  }

  override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
    return super.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
  }

  // MARK: - 极光推送：APNs deviceToken 上报

  override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    JPUSHService.registerDeviceToken(deviceToken)
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }
}

// MARK: - 极光推送：通知事件桥接（JPUSHRegisterDelegate）
// JPush RN 插件约定：App 侧把 APNs 事件以 NSNotification 形式转发，
// RCTJPushModule 监听 J_APNS_NOTIFICATION_ARRIVED_EVENT / J_APNS_NOTIFICATION_OPENED_EVENT 后发到 JS。
extension AppDelegate: JPUSHRegisterDelegate {

  /// 前台收到通知：转 JS（notificationArrived），并照常展示横幅/角标/声音
  func jpushNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (Int) -> Void
  ) {
    NotificationCenter.default.post(
      name: NSNotification.Name("J_APNS_NOTIFICATION_ARRIVED_EVENT"),
      object: notification.request.content.userInfo
    )
    completionHandler(
      Int(UNNotificationPresentationOptions.badge.rawValue
        | UNNotificationPresentationOptions.sound.rawValue
        | UNNotificationPresentationOptions.alert.rawValue)
    )
  }

  /// 点击通知（含冷启动）：转 JS（notificationOpened）
  func jpushNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    NotificationCenter.default.post(
      name: NSNotification.Name("J_APNS_NOTIFICATION_OPENED_EVENT"),
      object: response.notification.request.content.userInfo
    )
    completionHandler()
  }

  /// 协议必需方法（本项目未用到，空实现）
  func jpushNotificationCenter(
    _ center: UNUserNotificationCenter,
    openSettingsFor notification: UNNotification?
  ) {}

  /// 协议必需方法（授权状态变化，本项目未用到，空实现）
  func jpushNotificationAuthorization(
    _ status: JPAuthorizationStatus,
    withInfo info: [AnyHashable: Any]?
  ) {}
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }

  override func customize(_ rootView: UIView) {
    super.customize(rootView)
    RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)
  }
}
