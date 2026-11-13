package com.wqlccx.com.appchannel

import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * App 渠道信息 RN 桥（Android）。
 *
 * channel 来源：AndroidManifest 中 <meta-data android:name="APP_CHANNEL" .../>，
 * 日常构建默认 official；上架渠道包由加固工具（360 加固助手多渠道配置）按商店改写该值。
 * 取值口径与后端 POST /v1/common/activation 一致：
 * huawei / honor / xiaomi / oppo / vivo / tencent / official。
 *
 * JS 侧接口见 src/native/AppChannel.ts。
 */
class AppChannelModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "AppChannel"

  /** 渠道与设备信息：channel/deviceId/appVersion/os/osVersion/deviceModel。 */
  @ReactMethod
  fun getInfo(promise: Promise) {
    try {
      val pm = reactContext.packageManager
      val appInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        pm.getApplicationInfo(
          reactContext.packageName,
          PackageManager.ApplicationInfoFlags.of(PackageManager.GET_META_DATA.toLong()),
        )
      } else {
        @Suppress("DEPRECATION")
        pm.getApplicationInfo(reactContext.packageName, PackageManager.GET_META_DATA)
      }
      // 未配置（旧包）时按 official 处理，与后端 KNOWN_CHANNELS 口径一致
      val channel = appInfo.metaData?.getString("APP_CHANNEL")?.takeIf { it.isNotBlank() }
        ?: "official"

      val pkgInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        pm.getPackageInfo(reactContext.packageName, PackageManager.PackageInfoFlags.of(0))
      } else {
        @Suppress("DEPRECATION")
        pm.getPackageInfo(reactContext.packageName, 0)
      }

      // ANDROID_ID：无需权限、重装保留（与后端 deviceId 幂等口径匹配），极少数设备为空串则落 unknown-device
      val deviceId = Settings.Secure.getString(
        reactContext.contentResolver,
        Settings.Secure.ANDROID_ID,
      )?.takeIf { it.isNotBlank() } ?: "unknown-device"

      promise.resolve(
        Arguments.createMap().apply {
          putString("channel", channel)
          putString("deviceId", deviceId)
          putString("appVersion", pkgInfo.versionName ?: "")
          putString("os", "android")
          putString("osVersion", Build.VERSION.RELEASE ?: "")
          putString("deviceModel", "${Build.MANUFACTURER} ${Build.MODEL}".trim())
        },
      )
    } catch (e: Exception) {
      promise.reject("FAILED", e.message ?: "读取渠道信息失败")
    }
  }
}
