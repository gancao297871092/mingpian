package com.wqlccx.com.phonelogin

import android.graphics.Color
import android.os.Handler
import android.util.Log
import android.os.Looper
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.mobile.auth.gatewayauth.AuthUIConfig
import com.mobile.auth.gatewayauth.PhoneNumberAuthHelper
import com.mobile.auth.gatewayauth.PreLoginResultListener
import com.mobile.auth.gatewayauth.TokenResultListener
import org.json.JSONObject

/**
 * 阿里云号码认证一键登录 RN 桥接（Android）。
 *
 * JS 侧接口见 src/native/PhoneLogin.ts：
 * - init()                 App 启动时调用一次（设置方案密钥）
 * - checkSupport()         检查当前环境是否支持一键登录（SIM 卡、网络等）
 * - preLogin()             预取号，加速授权页弹起
 * - open(options)          打开授权页，成功 resolve {token, userAuthorization?}，
 *                          取消 reject(code=CANCELLED)，
 *                          自定义入口 reject(code=SWITCH_OTHER / SWITCH_BACK)
 * - close()                关闭授权页
 *
 * 错误码约定（与 iOS 端一致）：
 * CANCELLED / SWITCH_OTHER / SWITCH_BACK / UNSUPPORTED / BUSY / FAILED
 */
class PhoneLoginModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    /** 供 AgreementTrampolineActivity 回调（协议点击中转） */
    @Volatile
    var shared: PhoneLoginModule? = null
      private set

    // 阿里云控制台 → 号码认证方案管理 → APP端/安卓 → 方案密钥（仅客户端初始化用）
    private const val AUTH_SECRET =
      "x1+KLtZL0rRPcQDHkBgVQt01T0DREd6vdjbKQ5KbYvn936JXLQcuxQtd8E6dAvsE/T+nZA+QEjpP6QvFQ8wRgK45XwK3gTez5FPturFRm1G7idM9cPW3Y6PTbwU+6QE5YPhP2muVPcLuOM+aGFOLFxx1F/JFafqYtXAOkH80ypsSuVcb42lyHBwrXfjIiIXsbcUDg/obeZb+JCNz44SxZIQMk5f097fks6jd/FI+/8fsWOuua4GAk0I/4jjZGqAFA/JHZ8QzrqXOsGU/jpBijsUpkrbWRZSRlmLzPgTOTso="

    // 协议点击：SDK 不内置打开协议页（setProtocolAction 转到 AgreementTrampolineActivity），
    // 点击后以 OPEN_AGREEMENT 结束 open()，message 携带协议类型（userSure/privates），
    // JS 侧据此打开 App 内协议页（与登录页一致，内容走 /v1/common/userSure 等接口）。
    private const val AGREEMENT_USER_SURE_URL = "lccx://agreement?type=userSure"
    private const val AGREEMENT_PRIVATES_URL = "lccx://agreement?type=privates"
    private const val PROTOCOL_ACTION = "com.wqlccx.com.action.AGREEMENT"
    private const val TAG = "LCPhoneLogin"
  }

  private var helper: PhoneNumberAuthHelper? = null
  private var pendingPromise: Promise? = null
  private var envPromise: Promise? = null
  private var settled = false

  private val tokenListener = object : TokenResultListener {
    override fun onTokenSuccess(result: String?) = handleResult(result)
    override fun onTokenFailed(result: String?) = handleResult(result)
  }

  override fun getName() = "LCPhoneLogin"

  init {
    shared = this
  }

  /** 协议点击中转：关闭授权页，并以 OPEN_AGREEMENT 结束 open()（message=协议类型）。 */
  fun notifyAgreement(agreementType: String) {
    runOnUi {
      try {
        helper?.quitLoginPage()
      } catch (e: Exception) {
        // ignore
      }
      settle { it.reject("OPEN_AGREEMENT", agreementType) }
    }
  }

  private fun runOnUi(block: () -> Unit) {
    if (Looper.myLooper() == Looper.getMainLooper()) {
      block()
    } else {
      Handler(Looper.getMainLooper()).post { block() }
    }
  }

  private fun getHelper(): PhoneNumberAuthHelper {
    return helper ?: PhoneNumberAuthHelper.getInstance(
      reactContext.applicationContext,
      tokenListener,
    ).also {
      it.setAuthSDKInfo(AUTH_SECRET)
      helper = it
      Log.i(TAG, "getHelper: SDK 初始化完成，已设置方案密钥")
    }
  }

  /** App 生命周期内调用一次即可（内部幂等）。 */
  @ReactMethod
  fun init() {
    runOnUi { getHelper() }
  }

  /** 环境检查：resolve(true/false)。结果经 TokenResultListener 异步返回。 */
  @ReactMethod
  fun checkSupport(promise: Promise) {
    runOnUi {
      try {
        if (envPromise != null) {
          promise.resolve(false)
          return@runOnUi
        }
        envPromise = promise
        getHelper().checkEnvAvailable(PhoneNumberAuthHelper.SERVICE_TYPE_LOGIN)
      } catch (e: Exception) {
        envPromise = null
        promise.resolve(false)
      }
    }
  }

  /** 预取号加速授权页弹起，失败静默（open 内部会自动再取）。 */
  @ReactMethod
  fun preLogin() {
    runOnUi {
      try {
        getHelper().accelerateLoginPage(
          5000,
          object : PreLoginResultListener {
            override fun onTokenSuccess(result: String?) {
              Log.i(TAG, "preLogin: 预取号成功")
            }

            override fun onTokenFailed(errorCode: String?, msg: String?) {
              Log.i(TAG, "preLogin: 预取号失败 code=$errorCode msg=$msg")
            }
          },
        )
      } catch (e: Exception) {
        // ignore
      }
    }
  }

  @ReactMethod
  fun open(options: ReadableMap?, promise: Promise) {
    runOnUi {
      if (pendingPromise != null) {
        promise.reject("BUSY", "授权页正在展示")
        return@runOnUi
      }
      val presentation = if (options?.hasKey("presentation") == true)
        options.getString("presentation") else "fullscreen"
      pendingPromise = promise
      settled = false
      try {
        val h = getHelper()
        h.removeAuthRegisterXmlConfig()
        h.setAuthUIConfig(buildUiConfig(presentation))
        h.getLoginToken(reactContext.currentActivity ?: reactContext.applicationContext, 5000)
      } catch (e: Exception) {
        settle { it.reject("FAILED", e.message ?: "一键登录初始化失败") }
      }
    }
  }

  @ReactMethod
  fun close() {
    runOnUi {
      try {
        helper?.quitLoginPage()
      } catch (e: Exception) {
        // ignore
      }
    }
  }

  /** 自定义入口：先关闭授权页，再以特定错误码结束 open() 的 Promise。 */
  private fun finishWithSwitch(code: String, message: String) {
    runOnUi {
      try {
        helper?.quitLoginPage()
      } catch (e: Exception) {
        // ignore
      }
      settle { it.reject(code, message) }
    }
  }

  private inline fun settle(action: (Promise) -> Unit) {
    if (settled) return
    settled = true
    val p = pendingPromise
    pendingPromise = null
    p?.let(action)
  }

  private fun handleResult(raw: String?) {
    runOnUi {
      val json = try {
        JSONObject(raw ?: "")
      } catch (e: Exception) {
        null
      }
      // Android SDK 回调字段为 code（iOS 为 resultCode），两者兼容取值
      val code = json?.optString("resultCode")?.takeIf { it.isNotEmpty() }
        ?: json?.optString("code") ?: ""
      val msg = json?.optString("msg") ?: ""

      // 日志中脱敏 token：只打印长度和前 8 位
      if (json != null) {
        val logJson = JSONObject(json.toString())
        val token = logJson.optString("token")
        if (token.isNotEmpty()) {
          logJson.put("token", "<${token.length} chars: ${token.take(8)}…>")
        }
        Log.i(TAG, "handleResult: code=$code dic=$logJson envPending=${envPromise != null}")
      } else {
        Log.i(TAG, "handleResult: 无法解析 raw=$raw")
      }

      // 环境检查（checkSupport）的结果优先消费
      // 注意：Android 环境检查成功码为 600024「终端支持认证」，登录成功才是 600000
      val env = envPromise
      if (env != null) {
        envPromise = null
        val supported = code == "600000" || code == "600024"
        Log.i(TAG, "checkSupport: result=$code supported=$supported msg=$msg")
        env.resolve(supported)
        return@runOnUi
      }

      when {
        code.isEmpty() -> Unit
        code == "600001" -> Unit // 授权页唤起成功
        code == "600000" -> {
          val token = json?.optString("token") ?: ""
          if (token.isEmpty()) {
            settle { it.reject("FAILED", "未获取到登录凭证") }
          } else {
            val result = Arguments.createMap().apply {
              putString("token", token)
              val userAuth = json?.optString("userAuthorization") ?: ""
              if (userAuth.isNotEmpty()) putString("userAuthorization", userAuth)
            }
            settle { it.resolve(result) }
          }
        }
        // 700xxx 为授权页控件交互事件：
        // 700002 点击登录按钮 / 700003 勾选协议 —— 忽略，由 SDK 继续取号流程；
        // 700004 点击协议 —— 由 setProtocolAction 中转 Activity 处理，忽略；
        // 700001 切换其他登录方式单独处理；700000 返回等其余视为用户取消。
        code == "700001" -> finishWithSwitch("SWITCH_OTHER", "其他号码登录")
        code == "700002" || code == "700003" || code == "700004" -> Unit
        code.startsWith("700") -> {
          try {
            helper?.quitLoginPage()
          } catch (e: Exception) {
            // ignore
          }
          settle { it.reject("CANCELLED", "用户取消") }
        }
        else -> {
          try {
            helper?.quitLoginPage()
          } catch (e: Exception) {
            // ignore
          }
          settle { it.reject(code, msg.ifEmpty { "一键登录失败（$code）" }) }
        }
      }
    }
  }

  /** 按设计稿定制授权页（全屏）；bottomSheet 为预留的底部弹窗模式。 */
  private fun buildUiConfig(presentation: String?): AuthUIConfig {
    val dm = reactContext.resources.displayMetrics
    fun dp(v: Int) = (v * dm.density + 0.5f).toInt()

    // 布局使用 SDK 默认（避免触发 600005“页面非法修改”），只定制内容
    val builder = AuthUIConfig.Builder()
      // 导航栏
      .setNavColor(Color.WHITE)
      .setNavText("手机登录")
      .setNavTextColor(0xFF1A1A1A.toInt())
      .setNavTextSizeDp(17)
      .setNavReturnImgPath("lccx_ic_nav_back")
      // 品牌区隐藏默认 Logo，其余控件保持 SDK 默认样式
      .setLogoHidden(true)
      // 协议区（设计稿 12pt，文案「《用户协议》和《隐私政策》」）
      .setAppPrivacyOne("《用户协议》", AGREEMENT_USER_SURE_URL)
      .setAppPrivacyTwo("《隐私政策》", AGREEMENT_PRIVATES_URL)
      .setAppPrivacyColor(0xFF000000.toInt(), 0xFF2962D4.toInt())
      .setPrivacyTextSizeDp(12)
      .setPrivacyConectTexts(arrayOf("和", "和"))
      .setPrivacyState(false)
      .setCheckBoxWidth(dp(12))
      .setCheckBoxHeight(dp(12))
      .setUncheckedImgPath("lccx_checkbox_unchecked")
      .setCheckedImgPath("lccx_checkbox_checked")
      .setVendorPrivacyPrefix("《")
      .setVendorPrivacySuffix("》")
      // 协议点击跳 App 内协议页（清单中已注册对应 intent-filter 的透明中转 Activity）
      .setProtocolAction(PROTOCOL_ACTION)
      .setPackageName(reactContext.packageName)

    if (presentation == "bottomSheet") {
      // 注意：弹窗模式需先在 AndroidManifest 的 LoginAuthActivity 上配置
      // android:theme="@style/authsdk_activity_dialog"，再开启以下配置。
      builder
        .setDialogWidth(dm.widthPixels)
        .setDialogHeight(dp(360))
        .setDialogBottom(true)
    }

    return builder.create()
  }
}
