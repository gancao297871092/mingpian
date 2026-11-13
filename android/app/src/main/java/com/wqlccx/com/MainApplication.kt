package com.wqlccx.com

import android.app.Application
import android.content.res.Configuration
import cn.jiguang.api.utils.JCollectionAuth
import com.facebook.react.PackageList
import com.wqlccx.com.appchannel.AppChannelPackage
import com.wqlccx.com.phonelogin.PhoneLoginPackage
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ExpoReactHostFactory

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    ExpoReactHostFactory.getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
          add(PhoneLoginPackage())
          add(AppChannelPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    // 隐私合规：默认关闭极光 SDK 数据采集，用户在首启隐私弹窗同意后由 JS 调 JCore.setAuth(true) 再 init
    JCollectionAuth.setAuth(this, false)
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
