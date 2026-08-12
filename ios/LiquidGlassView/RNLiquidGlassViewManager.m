#import "RNLiquidGlassViewManager.h"
#import "LiquidGlassView-Swift.h"

@implementation RNLiquidGlassViewManager

RCT_EXPORT_MODULE(RNLiquidGlassView)

RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(interactive, BOOL)

RCT_CUSTOM_VIEW_PROPERTY(effect, NSString, LiquidGlassViewImpl)
{
  if ([json isKindOfClass:[NSString class]]) {
    NSString *value = (NSString *)json;
    if ([value isEqualToString:@"clear"]) {
      view.style = LiquidGlassEffectClear;
    } else if ([value isEqualToString:@"none"]) {
      view.style = LiquidGlassEffectNone;
    } else {
      view.style = LiquidGlassEffectRegular;
    }
  }
}

RCT_CUSTOM_VIEW_PROPERTY(colorScheme, NSString, LiquidGlassViewImpl)
{
  if ([json isKindOfClass:[NSString class]]) {
    NSString *value = (NSString *)json;
    if ([value isEqualToString:@"dark"]) {
      view.overrideUserInterfaceStyle = UIUserInterfaceStyleDark;
    } else if ([value isEqualToString:@"light"]) {
      view.overrideUserInterfaceStyle = UIUserInterfaceStyleLight;
    } else {
      view.overrideUserInterfaceStyle = UIUserInterfaceStyleUnspecified;
    }
  }
}

- (UIView *)view
{
  LiquidGlassViewImpl *view = [[LiquidGlassViewImpl alloc] init];
  return view;
}

@end
