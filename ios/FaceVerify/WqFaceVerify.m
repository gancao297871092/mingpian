#import "WqFaceVerify.h"
#import <React/RCTUtils.h>
#import <TencentCloudHuiyanSDKFace/TencentCloudHuiyanSDKFace.h>

/**
 * 腾讯云增强版人脸核身（App SDK 含 UI）RN 原生模块。
 *
 * 调用约定（与 src/native/FaceVerify.ts、Android FaceVerifyModule 对齐）：
 * - start(options)：options 为后端 /auth/faceid/prepare 下发的 SDK 启动参数 + license；
 *   拉起顺序 = initAdvanceSDKWithUserId（登录）→ success → startWbFaceVeirifySdk（刷脸页）→ delegate 回调
 * - resolve(nil)：SDK 流程完成（含 domain=CompareServer 的比对失败），最终结果以后端
 *   /auth/faceid/result 查询为准（官方硬性要求：不能信端上回调）
 * - reject(code, message)：CANCELLED=用户取消（42000）；FAILED=登录失败/活体失败/其他错误
 *
 * 官方约束：必须在主线程拉起；login 为异步且以最后一次为准。
 */
@interface WqFaceVerify () <WBFaceVerifyCustomerServiceDelegate>
@property (nonatomic, assign) BOOL verifying;
@property (nonatomic, copy) RCTPromiseResolveBlock resolveBlock;
@property (nonatomic, copy) RCTPromiseRejectBlock rejectBlock;
@end

@implementation WqFaceVerify

RCT_EXPORT_MODULE(WqFaceVerify);

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

RCT_EXPORT_METHOD(start:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  if (self.verifying) {
    reject(@"BUSY", @"人脸核身正在进行中", nil);
    return;
  }
  NSString *userId = options[@"userId"];
  NSString *nonce = options[@"nonce"];
  NSString *sign = options[@"sign"];
  NSString *appId = options[@"appId"];
  NSString *orderNo = options[@"orderNo"];
  NSString *version = options[@"version"] ?: @"1.0.0";
  NSString *license = options[@"license"];
  NSString *faceId = options[@"faceId"];
  if (!userId || !nonce || !sign || !appId || !orderNo || !license || !faceId) {
    reject(@"FAILED", @"SDK 启动参数不完整", nil);
    return;
  }

  self.verifying = YES;
  self.resolveBlock = resolve;
  self.rejectBlock = reject;

  __weak typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    __strong typeof(weakSelf) self = weakSelf;
    if (!self) return;
    WBFaceVerifyCustomerService *service = [WBFaceVerifyCustomerService sharedInstance];
    service.delegate = self;
    WBFaceVerifySDKConfig *config = [[WBFaceVerifySDKConfig alloc] init];
    // 关键：默认 NO 表示「仅活体」，SDK 不执行服务端比对，活体通过即回调成功但服务端无核身
    // 记录（查询必返 66660011）。完整活体+比对必须显式置 YES（官方文档 1007/57626）。
    config.useAdvanceCompare = YES;
    // 官方要求：上送身份信息接口返回的 optimalDomain 原样传入 SDK
    NSString *optimalDomain = options[@"optimalDomain"];
    if (optimalDomain.length > 0) {
      config.optimalDomain = optimalDomain;
    }
    [service initAdvanceSDKWithUserId:userId
                                nonce:nonce
                                 sign:sign
                                appid:appId
                              orderNo:orderNo
                           apiVersion:version
                              licence:license
                               faceId:faceId
                            sdkConfig:config
                              success:^{
                                // 登录成功：立即拉起 SDK 托管刷脸页（官方建议 success 回调中拉起）
                                NSLog(@"[WqFaceVerify] initAdvanceSDK 登录成功，拉起刷脸页");
                                BOOL ok = [[WBFaceVerifyCustomerService sharedInstance] startWbFaceVeirifySdk];
                                if (!ok) {
                                  RCTPromiseRejectBlock rj = self.rejectBlock;
                                  [self cleanup];
                                  if (rj) rj(@"FAILED", @"拉起刷脸页面失败", nil);
                                }
                              }
                              failure:^(WBFaceError * _Nonnull error) {
                                NSLog(@"[WqFaceVerify] initAdvanceSDK 登录失败 domain=%@ code=%@ desc=%@ reason=%@",
                                      error.domain, @(error.code), error.desc, error.reason);
                                RCTPromiseRejectBlock rj = self.rejectBlock;
                                [self cleanup];
                                if (rj) rj(@"FAILED", error.desc ?: @"刷脸登录失败，请重试", nil);
                              }];
  });
}

#pragma mark - WBFaceVerifyCustomerServiceDelegate

- (void)wbfaceVerifyCustomerServiceDidFinishedWithFaceVerifyResult:(WBFaceVerifyResult *)result {
  // 联调定位日志：确认后可在 release 前移除
  NSLog(@"[WqFaceVerify] SDK 回调 isSuccess=%@ orderNo=%@ domain=%@ code=%@ desc=%@ reason=%@",
        @(result.isSuccess), result.orderNo, result.error.domain, @(result.error.code),
        result.error.desc, result.error.reason);
  RCTPromiseResolveBlock rs = self.resolveBlock;
  RCTPromiseRejectBlock rj = self.rejectBlock;
  [self cleanup];
  if (!rs || !rj) return;
  if (result.isSuccess) {
    rs(nil);
    return;
  }
  WBFaceError *error = result.error;
  if (!error) {
    rj(@"FAILED", @"刷脸失败", nil);
    return;
  }
  // 用户中途取消/回退（domain=NativeProcess，code=42000）
  if ([error.domain isEqualToString:WBFaceErrorDomainNativeProcess] && error.code == 42000) {
    rj(@"CANCELLED", @"已取消人脸认证", nil);
    return;
  }
  // 活体已过、服务端比对失败：交回 JS 查后端权威结果（官方要求结果以服务端为准）
  if ([error.domain isEqualToString:WBFaceErrorDomainCompareServer]) {
    rs(nil);
    return;
  }
  rj(@"FAILED", error.desc ?: @"刷脸失败，请重试", nil);
}

/// 清重入锁与回调引用（SDK 单例随系统管理，无需显式 release）
- (void)cleanup {
  self.verifying = NO;
  self.resolveBlock = nil;
  self.rejectBlock = nil;
}

@end
