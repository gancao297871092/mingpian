package com.wqlccx.com.faceverify

import android.os.Bundle
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.tencent.cloud.huiyansdkface.facelight.api.WbCloudFaceContant
import com.tencent.cloud.huiyansdkface.facelight.api.WbCloudFaceVerifySdk
import com.tencent.cloud.huiyansdkface.facelight.api.listeners.WbCloudFaceVerifyLoginListener
import com.tencent.cloud.huiyansdkface.facelight.api.listeners.WbCloudFaceVerifyResultListener
import com.tencent.cloud.huiyansdkface.facelight.api.result.WbFaceError
import com.tencent.cloud.huiyansdkface.facelight.api.result.WbFaceVerifyResult
import com.tencent.cloud.huiyansdkface.facelight.process.FaceVerifyStatus
import com.wqlccx.com.BuildConfig

/**
 * 腾讯云增强版人脸核身（App SDK 含 UI）RN 原生模块。
 *
 * 调用约定（与 src/native/FaceVerify.ts 对应）：
 * - start(options)：options 为后端 /auth/faceid/prepare 下发的 SDK 启动参数 + license；
 *   拉起顺序 = initAdvSdk（登录）→ onLoginSuccess → startWbFaceVerifySdk（刷脸页）→ onFinish
 * - resolve(null)：SDK 流程完成（含 domain=CompareServer 的比对失败），最终结果以后端
 *   /auth/faceid/result 查询为准（官方硬性要求：不能信端上回调）
 * - reject(code, message)：CANCELLED=用户取消（41000）；FAILED=登录失败/活体失败/其他错误
 *
 * 官方约束：必须用 Activity context、必须在主线程拉起。
 */
class FaceVerifyModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  /** 防重入：刷脸页已打开时再次调用直接拒绝（JS 侧 submitting 之外的原生保险） */
  private var verifying = false

  override fun getName(): String = "WqFaceVerify"

  @ReactMethod
  fun start(options: ReadableMap, promise: Promise) {
    if (verifying) {
      promise.reject("BUSY", "人脸核身正在进行中")
      return
    }
    val activity = reactContext.currentActivity
    if (activity == null) {
      promise.reject("FAILED", "当前页面未就绪，请稍后重试")
      return
    }
    // 官方要求：主线程 + Activity context 拉起
    activity.runOnUiThread {
      verifying = true
      try {
        val inputData = WbCloudFaceVerifySdk.InputData(
          options.getString("faceId"),
          options.getString("orderNo"),
          options.getString("appId"),
          options.getString("version") ?: "1.0.0",
          options.getString("nonce"),
          options.getString("userId"),
          options.getString("sign"),
          FaceVerifyStatus.Mode.GRADE,
          options.getString("license"),
        )
        val data = Bundle().apply {
          putSerializable(WbCloudFaceContant.INPUT_DATA, inputData)
          // 关键：不显式设置时 SDK 仅活体检测、不执行权威库比对（liveRate 有分但
          // similarity 为空，服务端必返 66665001「请确保本人操作且正脸对框」）。
          // 官方 demo 默认显式传 ID_CARD（文档 1007/57621 比对类型选择）。
          putString(WbCloudFaceContant.COMPARE_TYPE, WbCloudFaceContant.ID_CARD)
          // SDK log 开关：仅 debug 包打开，release 必须关闭（官方要求）
          putBoolean(WbCloudFaceContant.IS_ENABLE_LOG, BuildConfig.DEBUG)
        }
        WbCloudFaceVerifySdk.getInstance().initAdvSdk(
          activity,
          data,
          object : WbCloudFaceVerifyLoginListener {
            override fun onLoginSuccess() {
              launchFacePage(promise)
            }

            override fun onLoginFailed(error: WbFaceError?) {
              Log.w(TAG, "initAdvSdk 登录失败: ${error?.toString()}")
              finish()
              promise.reject("FAILED", error?.desc ?: "刷脸登录失败，请重试")
            }
          },
        )
      } catch (e: Exception) {
        Log.e(TAG, "拉起人脸核身异常", e)
        finish()
        promise.reject("FAILED", "拉起人脸核身失败：${e.message}")
      }
    }
  }

  /** 登录成功：拉起 SDK 托管的刷脸页（光线活体） */
  private fun launchFacePage(promise: Promise) {
    val activity = reactContext.currentActivity
    if (activity == null) {
      finish()
      promise.reject("FAILED", "页面已关闭")
      return
    }
    WbCloudFaceVerifySdk.getInstance().startWbFaceVerifySdk(
      activity,
      object : WbCloudFaceVerifyResultListener {
        override fun onFinish(result: WbFaceVerifyResult?) {
          finish()
          if (result == null) {
            promise.reject("FAILED", "SDK 未返回结果")
            return
          }
          if (result.isSuccess) {
            promise.resolve(null)
            return
          }
          val error = result.error
          when {
            error == null -> promise.reject("FAILED", "刷脸失败")
            // 用户中途取消/返回（domain=NativeProcess）
            error.code == WbFaceError.WBFaceErrorCodeUserCancle ->
              promise.reject("CANCELLED", "已取消人脸认证")
            // 活体已过、服务端比对失败：也交回 JS 查后端权威结果（官方要求结果以服务端为准）
            error.domain == WbFaceError.WBFaceErrorDomainCompareServer -> promise.resolve(null)
            else -> promise.reject("FAILED", error.desc ?: "刷脸失败，请重试")
          }
        }
      },
    )
  }

  /** 释放 SDK 资源并解除重入锁（官方要求每次结束后 release） */
  private fun finish() {
    verifying = false
    try {
      WbCloudFaceVerifySdk.getInstance().release()
    } catch (e: Exception) {
      Log.w(TAG, "release 异常: ${e.message}")
    }
  }

  companion object {
    private const val TAG = "FaceVerifyModule"
  }
}
