package com.wqlccx.com.phonelogin

import android.app.Activity
import android.os.Bundle

/**
 * 一键登录授权页协议点击的中转 Activity（透明、无 UI）。
 *
 * 阿里云 SDK 通过 setProtocolAction 把协议点击以 Intent 形式发到这里，
 * data 为配置的协议 URL（lccx://agreement?type=userSure / privates），
 * 解析后交给 PhoneLoginModule 结束 open() 并由 JS 打开 App 内协议页。
 */
class AgreementTrampolineActivity : Activity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    try {
      val uri = intent?.data
      val type = uri?.getQueryParameter("type")
        ?: if (uri?.toString()?.contains("privates") == true) "privates" else "userSure"
      PhoneLoginModule.shared?.notifyAgreement(type)
    } catch (e: Exception) {
      // ignore
    }
    finish()
  }
}
