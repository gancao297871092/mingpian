#import "LCPhoneLogin.h"

#import <ATAuthSDK_D/TXCommonHandler.h>
#import <ATAuthSDK_D/TXCustomModel.h>
#import <React/RCTUtils.h>

/**
 * 阿里云号码认证一键登录 RN 桥接（iOS）。
 *
 * JS 侧接口见 src/native/PhoneLogin.ts：
 * - initSDK()      App 启动时调用一次（设置方案密钥）
 * - checkSupport() 检查当前环境是否支持一键登录
 * - preLogin()     预取号，加速授权页弹起
 * - open(options)  打开授权页，成功 resolve {token, userAuthorization?}，
 *                  取消 reject(code=CANCELLED)，
 *                  自定义入口 reject(code=SWITCH_OTHER / SWITCH_BACK)
 * - close()        关闭授权页
 *
 * 错误码约定（与 Android 端一致）：
 * CANCELLED / SWITCH_OTHER / SWITCH_BACK / UNSUPPORTED / BUSY / FAILED
 */

// 阿里云控制台 → 号码认证方案管理 → APP端/iOS → 方案密钥（仅客户端初始化用）
static NSString *const kAuthSecret = @"frF2l1EFoJDuZeUxhlU3oUtjRf1lQfVoD4E5x22eToZYNw0VJP9UxpTeaevYH5giS0rxB8va0Opr1/XLuw9N6aHWwBa6dw+fapPpqQYgHvhXVL8ny03yN0s0Y59od7lWseMv+ftVuNikPcZ26T2LDnndlob7W/q3xsgDnZhZJVtTugkJdVd59S8CLjco74X+25B9mJ/WXolGL9XTqxCmRcCWMLsDWl/RoCuV3WY+g9Pn/Ij2kH1QvhCimqFYFQpW";

// 协议点击：SDK 不内置打开协议页（privacyVCIsCustomized=YES），
// 点击后以 OPEN_AGREEMENT 结束 open()，message 携带协议类型（userSure/privates），
// JS 侧据此打开 App 内协议页（与登录页一致，内容走 /v1/common/userSure 等接口）。
static NSString *const kAgreementUserSureURL = @"lccx://agreement?type=userSure";
static NSString *const kAgreementPrivatesURL = @"lccx://agreement?type=privates";

static UIColor *LCColor(int r, int g, int b) {
  return [UIColor colorWithRed:r / 255.0 green:g / 255.0 blue:b / 255.0 alpha:1.0];
}

/// 圆角按钮背景图（高 48pt，圆角 24pt）
static UIImage *LCButtonBgImage(UIColor *color) {
  CGSize size = CGSizeMake(66, 48);
  UIGraphicsBeginImageContextWithOptions(size, NO, 0);
  UIBezierPath *path = [UIBezierPath bezierPathWithRoundedRect:CGRectMake(0, 0, size.width, size.height)
                                                  cornerRadius:size.height / 2.0];
  [color setFill];
  [path fill];
  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return [image resizableImageWithCapInsets:UIEdgeInsetsMake(24, 24, 24, 24)
                                resizingMode:UIImageResizingModeStretch];
}

/// 导航返回箭头（深灰 chevron）
static UIImage *LCBackArrowImage(void) {
  CGSize size = CGSizeMake(24, 24);
  UIGraphicsBeginImageContextWithOptions(size, NO, 0);
  UIBezierPath *path = [UIBezierPath bezierPath];
  [path moveToPoint:CGPointMake(15.5, 4.5)];
  [path addLineToPoint:CGPointMake(8, 12)];
  [path addLineToPoint:CGPointMake(15.5, 19.5)];
  [path setLineWidth:2.0];
  [path setLineCapStyle:kCGLineCapRound];
  [path setLineJoinStyle:kCGLineJoinRound];
  [LCColor(0x32, 0x32, 0x32) setStroke];
  [path stroke];
  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return image;
}

/// 弹窗右上角关闭 X（灰色）
static UIImage *LCCloseImage(void) {
  CGSize size = CGSizeMake(24, 24);
  UIGraphicsBeginImageContextWithOptions(size, NO, 0);
  UIBezierPath *path = [UIBezierPath bezierPath];
  [path moveToPoint:CGPointMake(6.5, 6.5)];
  [path addLineToPoint:CGPointMake(17.5, 17.5)];
  [path moveToPoint:CGPointMake(17.5, 6.5)];
  [path addLineToPoint:CGPointMake(6.5, 17.5)];
  [path setLineWidth:1.8];
  [path setLineCapStyle:kCGLineCapRound];
  [LCColor(0x6C, 0x6C, 0x6C) setStroke];
  [path stroke];
  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return image;
}

/// 右向小箭头（「返回其他登录方式」右侧，#999999）
static UIImage *LCChevronImage(void) {
  CGSize size = CGSizeMake(16, 20); // @2x，实际显示 8x10
  UIGraphicsBeginImageContextWithOptions(size, NO, 0);
  UIBezierPath *path = [UIBezierPath bezierPath];
  [path moveToPoint:CGPointMake(5.5, 4.5)];
  [path addLineToPoint:CGPointMake(11, 10)];
  [path addLineToPoint:CGPointMake(5.5, 15.5)];
  [path setLineWidth:1.6];
  [path setLineCapStyle:kCGLineCapRound];
  [path setLineJoinStyle:kCGLineJoinRound];
  [LCColor(0x99, 0x99, 0x99) setStroke];
  [path stroke];
  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return image;
}

static NSAttributedString *LCAttributedString(NSString *text, UIColor *color, CGFloat fontSize,
                                              UIFontWeight weight) {
  return [[NSAttributedString alloc] initWithString:text
                                         attributes:@{
                                           NSForegroundColorAttributeName : color,
                                           NSFontAttributeName : [UIFont systemFontOfSize:fontSize
                                                                                   weight:weight]
                                         }];
}

/// 单行 attributed 文本的宽度（用于手动居中）
static CGFloat LCWidthForText(NSAttributedString *text) {
  return ceil([text boundingRectWithSize:CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX)
                                 options:NSStringDrawingUsesLineFragmentOrigin
                                 context:nil].size.width);
}

/// 协议勾选框图片（未勾选：灰边白底圆；已勾选：蓝圆白勾，设计稿 12x12 正圆）
static UIImage *LCCheckboxImage(BOOL checked) {
  CGSize size = CGSizeMake(28, 28); // @2x，实际显示 14pt
  UIGraphicsBeginImageContextWithOptions(size, NO, 0);
  CGRect box = CGRectMake(1, 1, 26, 26);
  UIBezierPath *path = [UIBezierPath bezierPathWithOvalInRect:box];
  if (checked) {
    [LCColor(0x29, 0x62, 0xD4) setFill];
    [path fill];
    UIBezierPath *tick = [UIBezierPath bezierPath];
    [tick moveToPoint:CGPointMake(8, 14.5)];
    [tick addLineToPoint:CGPointMake(12.5, 19)];
    [tick addLineToPoint:CGPointMake(20.5, 9.5)];
    [tick setLineWidth:2.4];
    [tick setLineCapStyle:kCGLineCapRound];
    [tick setLineJoinStyle:kCGLineJoinRound];
    [[UIColor whiteColor] setStroke];
    [tick stroke];
  } else {
    [[UIColor whiteColor] setFill];
    [path fill];
    [path setLineWidth:2.0];
    [LCColor(0xC4, 0xC4, 0xC4) setStroke];
    [path stroke];
  }
  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return image;
}

@interface LCPhoneLogin ()

@property (nonatomic, copy) RCTPromiseResolveBlock resolve;
@property (nonatomic, copy) RCTPromiseRejectBlock reject;
@property (nonatomic, assign) BOOL sdkReady;
@property (nonatomic, assign) BOOL bottomSheetMode;
@property (nonatomic, weak) UIView *customContainer;

@end

@implementation LCPhoneLogin

RCT_EXPORT_MODULE(LCPhoneLogin)

#define LCPLog(fmt, ...) NSLog(@"[LCPhoneLogin] " fmt, ##__VA_ARGS__)

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

#pragma mark - JS 接口

RCT_EXPORT_METHOD(initSDK) {
  LCPLog(@"initSDK");
  [self ensureSDKReady];
}

RCT_EXPORT_METHOD(checkSupport:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  [self ensureSDKReady];
  LCPLog(@"checkSupport: start");
  [[TXCommonHandler sharedInstance] checkEnvAvailableWithAuthType:PNSAuthTypeLoginToken
                                                       complete:^(NSDictionary *_Nullable resultDic) {
    NSString *code = [NSString stringWithFormat:@"%@", resultDic[@"resultCode"] ?: @""];
    LCPLog(@"checkSupport: result=%@ dic=%@", code, resultDic);
    resolve(@([code isEqualToString:@"600000"]));
  }];
}

RCT_EXPORT_METHOD(preLogin) {
  [self ensureSDKReady];
  LCPLog(@"preLogin: accelerateLoginPage start");
  [[TXCommonHandler sharedInstance] accelerateLoginPageWithTimeout:5.0
                                                          complete:^(NSDictionary *_Nonnull resultDic) {
    LCPLog(@"preLogin: result dic=%@", resultDic);
  }];
}

RCT_EXPORT_METHOD(open:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  [self ensureSDKReady];
  if (self.resolve) {
    reject(@"BUSY", @"授权页正在展示", nil);
    return;
  }
  self.resolve = resolve;
  self.reject = reject;
  self.bottomSheetMode = [options[@"presentation"] isEqualToString:@"bottomSheet"];

  TXCustomModel *model = [self buildModel];
  UIViewController *controller = RCTPresentedViewController();
  LCPLog(@"open: presentation=%@ bottomSheet=%d controller=%@",
         options[@"presentation"] ?: @"fullscreen", self.bottomSheetMode,
         NSStringFromClass(controller.class));
  if (!controller) {
    self.resolve = nil;
    self.reject = nil;
    LCPLog(@"open: RCTPresentedViewController is nil");
    reject(@"FAILED", @"无法获取当前页面", nil);
    return;
  }
  __weak typeof(self) weakSelf = self;
  LCPLog(@"open: getLoginToken start (timeout=5.0s)");
  [[TXCommonHandler sharedInstance] getLoginTokenWithTimeout:5.0
                                                  controller:controller
                                                       model:model
                                                    complete:^(NSDictionary *_Nonnull resultDic) {
    [weakSelf handleResult:resultDic];
  }];
}

RCT_EXPORT_METHOD(close) {
  LCPLog(@"close");
  [[TXCommonHandler sharedInstance] cancelLoginVCAnimated:YES complete:nil];
}

#pragma mark - 内部实现

- (void)ensureSDKReady {
  if (self.sdkReady) {
    return;
  }
  self.sdkReady = YES;
#if DEBUG
  // 打开阿里云 SDK 控制台日志（Release 务必关闭）
  PNSReporter *reporter = [[TXCommonHandler sharedInstance] getReporter];
  [reporter setConsolePrintLoggerEnable:YES];
  LCPLog(@"ensureSDKReady: SDK console logger enabled");
#endif
  LCPLog(@"ensureSDKReady: setAuthSDKInfo start");
  [[TXCommonHandler sharedInstance] setAuthSDKInfo:kAuthSecret
                                          complete:^(NSDictionary *_Nonnull resultDic) {
    LCPLog(@"ensureSDKReady: setAuthSDKInfo result=%@", resultDic);
  }];
}

- (void)handleResult:(NSDictionary *)resultDic {
  NSString *code = [NSString stringWithFormat:@"%@", resultDic[@"resultCode"] ?: @""];

  // 日志中脱敏 token：只打印长度和前 8 位
  NSMutableDictionary *logDic = [resultDic mutableCopy];
  NSString *token = logDic[@"token"];
  if (token.length > 0) {
    logDic[@"token"] = [NSString stringWithFormat:@"<%lu chars: %@…>",
                        (unsigned long)token.length, [token substringToIndex:MIN(8, token.length)]];
  }
  LCPLog(@"handleResult: code=%@ dic=%@", code, logDic);

  if ([code isEqualToString:@"600001"]) {
    return; // 授权页唤起成功
  }
  if ([code isEqualToString:@"700004"]) {
    // 点击协议富文本：关闭授权页，交由 JS 打开 App 内协议页
    NSString *info = [NSString stringWithFormat:@"%@", resultDic.allValues];
    NSString *type = [info containsString:@"privates"] ? @"privates" : @"userSure";
    [self closeAuthPage];
    [self settleReject:@"OPEN_AGREEMENT" message:type error:nil];
    return;
  }
  if ([code isEqualToString:@"700002"] || [code isEqualToString:@"700003"]) {
    return; // 登录按钮 / 勾选框点击
  }

  if ([code isEqualToString:@"600000"]) {
    NSString *token = resultDic[@"token"];
    if (token.length > 0) {
      NSMutableDictionary *result = [NSMutableDictionary dictionary];
      result[@"token"] = token;
      NSString *userAuth = resultDic[@"userAuthorization"];
      if ([userAuth isKindOfClass:[NSString class]] && userAuth.length > 0) {
        result[@"userAuthorization"] = userAuth;
      }
      [self settleResolve:result];
      return;
    }
  }

  if ([code isEqualToString:@"700001"]) {
    // “切换到其他方式”
    [self closeAuthPage];
    [self settleReject:@"SWITCH_OTHER" message:@"其他号码登录" error:nil];
    return;
  }
  if ([code hasPrefix:@"700"]) {
    // 返回按钮等交互事件
    [self closeAuthPage];
    [self settleReject:@"CANCELLED" message:@"用户取消" error:nil];
    return;
  }

  NSString *message = resultDic[@"msg"] ?: @"一键登录失败，请重试";
  [self closeAuthPage];
  [self settleReject:code.length > 0 ? code : @"FAILED" message:message error:nil];
}

- (void)onOtherLoginTap {
  [self closeAuthPage];
  [self settleReject:@"SWITCH_OTHER" message:@"其他号码登录" error:nil];
}

- (void)onBackTap {
  [self closeAuthPage];
  [self settleReject:@"SWITCH_BACK" message:@"返回其他登录方式" error:nil];
}

- (void)closeAuthPage {
  [[TXCommonHandler sharedInstance] cancelLoginVCAnimated:YES complete:nil];
}

- (void)settleResolve:(id)value {
  RCTPromiseResolveBlock resolve = self.resolve;
  RCTPromiseRejectBlock reject = self.reject;
  self.resolve = nil;
  self.reject = nil;
  if (resolve) {
    resolve(value);
  }
}

- (void)settleReject:(NSString *)code message:(NSString *)message error:(NSError *)error {
  RCTPromiseResolveBlock resolve = self.resolve;
  RCTPromiseRejectBlock reject = self.reject;
  self.resolve = nil;
  self.reject = nil;
  if (reject) {
    reject(code, message, error);
  }
}

#pragma mark - 授权页 UI（按设计稿定制）

- (TXCustomModel *)buildModel {
  TXCustomModel *model = [[TXCustomModel alloc] init];

  // 状态栏与导航栏
  model.prefersStatusBarHidden = NO;
  model.navColor = [UIColor whiteColor];
  model.navTitle = LCAttributedString(@"手机登录", LCColor(0x1A, 0x1A, 0x1A), 17, UIFontWeightMedium);
  model.navBackImage = LCBackArrowImage();

  // 品牌区：隐藏 SDK Logo，slogan 在号码下方（设计稿：Frame 394）
  model.logoIsHidden = YES;
  NSAttributedString *sloganText =
      LCAttributedString(@"使用本机号码完成快速登录", LCColor(0x6C, 0x6C, 0x6C), 14, UIFontWeightLight);
  model.sloganText = sloganText;

  // 掩码手机号（设计稿 24/380 #000，左对齐，整体居中）
  model.numberColor = LCColor(0x00, 0x00, 0x00);
  model.numberFont = [UIFont systemFontOfSize:24 weight:UIFontWeightRegular];

  // 主按钮（设计稿：322x48 全圆角 #2962d4，文字 15/380 白）
  model.loginBtnText =
      LCAttributedString(@"本机号码一键登录", [UIColor whiteColor], 15, UIFontWeightRegular);
  model.loginBtnBgImgs = @[
    LCButtonBgImage(LCColor(0x29, 0x62, 0xD4)), // 正常
    LCButtonBgImage(LCColor(0x9A, 0xB8, 0xEC)), // 失效（未勾选协议）
    LCButtonBgImage(LCColor(0x21, 0x52, 0xB8))  // 高亮
  ];
  model.autoHideLoginLoading = YES;

  // “切换到其他方式”隐藏（设计由自定义控件实现）
  model.changeBtnIsHidden = YES;

  // 协议区（设计稿：12pt，文案「我已阅读并同意《用户协议》和《隐私政策》」）
  model.checkBoxIsChecked = NO;
  model.checkBoxWH = 12;
  model.checkBoxImages = @[ LCCheckboxImage(NO), LCCheckboxImage(YES) ];
  model.checkBoxVerticalCenter = YES;
  model.privacyOne = @[ @"《用户协议》", kAgreementUserSureURL ];
  model.privacyTwo = @[ @"《隐私政策》", kAgreementPrivatesURL ];
  model.privacyColors = @[ LCColor(0x00, 0x00, 0x00), LCColor(0x29, 0x62, 0xD4) ];
  model.privacyFont = [UIFont systemFontOfSize:12];
  model.privacyAlignment = NSTextAlignmentCenter;
  model.privacyConectTexts = @[ @"和", @"和" ]; // 《运营商协议》和《用户协议》和《隐私政策》
  model.privacyOperatorPreText = @"《";
  model.privacyOperatorSufText = @"》";
  model.privacyVCIsCustomized = YES;

  // 布局：设计稿画布 402x874（iPhone 16 Pro），按宽度等比缩放 s（字号不缩放）
  __weak typeof(self) weakSelf = self;
  CGFloat sloganW = LCWidthForText(sloganText);
  NSAttributedString *numberProbe = [[NSAttributedString alloc] initWithString:@"188****8888"
                                     attributes:@{ NSFontAttributeName : model.numberFont }];
  CGFloat numberW = LCWidthForText(numberProbe);
  NSAttributedString *prefixText =
      LCAttributedString(@"+86 ", LCColor(0x00, 0x00, 0x00), 24, UIFontWeightRegular);
  CGFloat prefixW = LCWidthForText(prefixText);

  model.sloganFrameBlock = ^CGRect(CGSize screenSize, CGSize superViewSize, CGRect frame) {
    if (weakSelf.bottomSheetMode) {
      CGFloat y = superViewSize.height * 0.10 + 32;
      return CGRectMake((superViewSize.width - sloganW) / 2.0, y, sloganW, 20);
    }
    CGFloat s = MIN(superViewSize.width / 402.0, superViewSize.height / 874.0);
    return CGRectMake((superViewSize.width - sloganW) / 2.0, 344.0 * s, sloganW, 19.0 * s);
  };
  model.numberFrameBlock = ^CGRect(CGSize screenSize, CGSize superViewSize, CGRect frame) {
    if (weakSelf.bottomSheetMode) {
      CGFloat y = superViewSize.height * 0.10;
      return CGRectMake((superViewSize.width - numberW) / 2.0, y, numberW, 34);
    }
    CGFloat s = MIN(superViewSize.width / 402.0, superViewSize.height / 874.0);
    return CGRectMake((superViewSize.width - numberW) / 2.0, 292.0 * s, numberW, 32.0 * s);
  };
  model.loginBtnFrameBlock = ^CGRect(CGSize screenSize, CGSize superViewSize, CGRect frame) {
    if (weakSelf.bottomSheetMode) {
      CGFloat y = superViewSize.height * 0.10 + 100;
      return CGRectMake(24, y, superViewSize.width - 48, 48);
    }
    CGFloat s = MIN(superViewSize.width / 402.0, superViewSize.height / 874.0);
    return CGRectMake(40.0 * s, 535.0 * s, superViewSize.width - 80.0 * s, 48.0 * s);
  };
  // 协议整体（含勾选框）：保持默认纵向位置，限定左右边距 24，居中排布避免孤字折行
  model.privacyFrameBlock = ^CGRect(CGSize screenSize, CGSize superViewSize, CGRect frame) {
    if (!weakSelf.bottomSheetMode) {
      CGFloat s = MIN(superViewSize.width / 402.0, superViewSize.height / 874.0);
      return CGRectMake(24.0 * s, 719.0 * s, superViewSize.width - 48.0 * s, 44);
    }
    return CGRectMake(24, frame.origin.y, superViewSize.width - 48, frame.size.height);
  };

  // 自定义控件：大标题+副标题（Frame 395）、+86 前缀、其他号码登录、返回其他登录方式
  model.customViewBlock = ^(UIView *superCustomView) {
    UIView *container = [[UIView alloc] init];
    container.tag = 1001;

    UILabel *heroTitle = [[UILabel alloc] init];
    heroTitle.tag = 1004;
    heroTitle.textAlignment = NSTextAlignmentCenter;
    heroTitle.attributedText =
        LCAttributedString(@"手机号登录", LCColor(0x00, 0x00, 0x00), 24, UIFontWeightRegular);

    UILabel *heroSub = [[UILabel alloc] init];
    heroSub.tag = 1005;
    heroSub.textAlignment = NSTextAlignmentCenter;
    heroSub.attributedText = LCAttributedString(@"未注册的手机号登录成功后将自动注册",
                                                LCColor(0xB9, 0xB9, 0xB9), 12, UIFontWeightLight);

    UILabel *prefixLabel = [[UILabel alloc] init];
    prefixLabel.tag = 1006;
    prefixLabel.attributedText = prefixText;

    UIButton *otherBtn = [UIButton buttonWithType:UIButtonTypeCustom];
    otherBtn.tag = 1002;
    otherBtn.layer.cornerRadius = 24;
    otherBtn.clipsToBounds = YES;
    [otherBtn setBackgroundImage:LCButtonBgImage(LCColor(0xF4, 0xF4, 0xF4)) forState:UIControlStateNormal];
    [otherBtn setAttributedTitle:LCAttributedString(@"其他号码登录", LCColor(0x32, 0x32, 0x32), 15,
                                                    UIFontWeightRegular)
                        forState:UIControlStateNormal];
    [otherBtn addTarget:weakSelf
                  action:@selector(onOtherLoginTap)
        forControlEvents:UIControlEventTouchUpInside];

    UIButton *backBtn = [UIButton buttonWithType:UIButtonTypeCustom];
    backBtn.tag = 1003;
    NSTextAttachment *chevron = [[NSTextAttachment alloc] init];
    chevron.image = LCChevronImage();
    chevron.bounds = CGRectMake(2, -1, 8, 10);
    NSMutableAttributedString *backTitle = [[NSMutableAttributedString alloc]
        initWithString:@"返回其他登录方式"
            attributes:@{
              NSForegroundColorAttributeName : LCColor(0x29, 0x62, 0xD4),
              NSFontAttributeName : [UIFont systemFontOfSize:12 weight:UIFontWeightLight]
            }];
    [backTitle appendAttributedString:[NSAttributedString attributedStringWithAttachment:chevron]];
    [backBtn setAttributedTitle:backTitle forState:UIControlStateNormal];
    [backBtn addTarget:weakSelf
                action:@selector(onBackTap)
      forControlEvents:UIControlEventTouchUpInside];

    [container addSubview:heroTitle];
    [container addSubview:heroSub];
    [container addSubview:prefixLabel];
    [container addSubview:otherBtn];
    [container addSubview:backBtn];
    [superCustomView addSubview:container];
    weakSelf.customContainer = container;
  };
  model.customViewLayoutBlock = ^(CGSize screenSize, CGRect contentViewFrame, CGRect navFrame,
                                  CGRect titleBarFrame, CGRect logoFrame, CGRect sloganFrame,
                                  CGRect numberFrame, CGRect loginFrame, CGRect changeBtnFrame,
                                  CGRect privacyFrame) {
    UIView *container = weakSelf.customContainer;
    if (!container) {
      return;
    }
    container.frame = CGRectMake(0, 0, contentViewFrame.size.width, contentViewFrame.size.height);

    UIView *heroTitle = [container viewWithTag:1004];
    UIView *heroSub = [container viewWithTag:1005];
    UIView *prefixLabel = [container viewWithTag:1006];
    UIView *otherBtn = [container viewWithTag:1002];
    UIView *backBtn = [container viewWithTag:1003];

    if (weakSelf.bottomSheetMode) {
      // 底部弹窗：跟随登录按钮向下排布（弹窗设计稿未定，先保证可用）
      heroTitle.hidden = heroSub.hidden = NO;
      CGFloat s = container.frame.size.width / 402.0;
      heroTitle.frame = CGRectMake(0, 115.0 * s, container.frame.size.width, 32.0 * s);
      heroSub.frame = CGRectMake(0, 152.0 * s, container.frame.size.width, 16.0 * s);
      prefixLabel.frame =
          CGRectMake(numberFrame.origin.x - prefixW, numberFrame.origin.y, prefixW, 32);
      CGFloat width = container.frame.size.width - 48;
      otherBtn.frame = CGRectMake(24, CGRectGetMaxY(loginFrame) + 16, width, 48);
      otherBtn.layer.cornerRadius = 24;
      backBtn.frame = CGRectMake(0, CGRectGetMaxY(otherBtn.frame) + 20, container.frame.size.width, 22);
      return;
    }

    CGFloat s = MIN(container.frame.size.width / 402.0, container.frame.size.height / 874.0);
    heroTitle.frame = CGRectMake(0, 115.0 * s, container.frame.size.width, 32.0 * s);
    heroSub.frame = CGRectMake(0, 152.0 * s, container.frame.size.width, 16.0 * s);
    prefixLabel.frame =
        CGRectMake(numberFrame.origin.x - prefixW, numberFrame.origin.y, prefixW, 32.0 * s);
    otherBtn.frame = CGRectMake(40.0 * s, 599.0 * s, container.frame.size.width - 80.0 * s, 48.0 * s);
    otherBtn.layer.cornerRadius = 24.0 * s;
    backBtn.frame = CGRectMake(0, 667.0 * s, container.frame.size.width, 22.0 * s);
  };

  if (self.bottomSheetMode) {
    // 底部弹窗模式（小红书式）：半屏弹层 + 顶部圆角 + 蒙层
    model.presentDirection = PNSPresentationDirectionBottom;
    model.contentViewFrameBlock = ^CGRect(CGSize screenSize, CGSize superViewSize, CGRect frame) {
      return CGRectMake(0, screenSize.height * 0.5, screenSize.width, screenSize.height * 0.5);
    };
    model.alertCornerRadiusArray = @[ @(12.0), @(0.0), @(0.0), @(12.0) ];
    model.alertBlurViewColor = [UIColor blackColor];
    model.alertBlurViewAlpha = 0.5;
    model.alertBarIsHidden = NO;
    model.alertTitleBarColor = [UIColor whiteColor];
    model.alertTitle =
        LCAttributedString(@"手机登录", LCColor(0x1A, 0x1A, 0x1A), 17, UIFontWeightMedium);
    model.alertCloseImage = LCCloseImage();
  }

  return model;
}

@end
