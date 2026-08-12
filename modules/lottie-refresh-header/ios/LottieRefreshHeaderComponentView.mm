#import "LottieRefreshHeaderComponentView.h"

#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>

#import <react/renderer/components/LottieRefreshHeaderSpec/ComponentDescriptors.h>
#import <react/renderer/components/LottieRefreshHeaderSpec/EventEmitters.h>
#import <react/renderer/components/LottieRefreshHeaderSpec/Props.h>
#import <react/renderer/components/LottieRefreshHeaderSpec/RCTComponentViewHelpers.h>

#import "RCTCustomPullToRefreshViewProtocol.h"

using namespace facebook::react;

static void *kContentOffsetKVOContext = &kContentOffsetKVOContext;

@interface LottieRefreshHeaderComponentView () <RCTCustomPullToRefreshViewProtocol>
@end

@implementation LottieRefreshHeaderComponentView {
  __weak UIScrollView *_scrollView;
  BOOL _isRefreshing;
  CGFloat _triggerHeight;
  CGFloat _headerHeight;
  NSInteger _lastState;
  UIEdgeInsets _originalInset;
  BOOL _hasOriginalInset;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<LottieRefreshHeaderComponentDescriptor>();
}

+ (BOOL)shouldBeRecycled
{
  return NO;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const LottieRefreshHeaderProps>();
    _props = defaultProps;
    _triggerHeight = 100;
    _headerHeight = 80;
    _isRefreshing = NO;
    _lastState = -1;
    _hasOriginalInset = NO;
  }
  return self;
}

#pragma mark - Props

- (void)updateProps:(const facebook::react::Props::Shared &)props
           oldProps:(const facebook::react::Props::Shared &)oldProps
{
  const auto &oldViewProps = *std::static_pointer_cast<LottieRefreshHeaderProps const>(_props);
  const auto &newViewProps = *std::static_pointer_cast<LottieRefreshHeaderProps const>(props);

  if (newViewProps.triggerHeight > 0) {
    _triggerHeight = newViewProps.triggerHeight;
  }
  if (newViewProps.headerHeight > 0) {
    _headerHeight = newViewProps.headerHeight;
  }
  if (oldViewProps.refreshing != newViewProps.refreshing) {
    if (!newViewProps.refreshing && _isRefreshing) {
      [self endRefreshing];
    }
  }

  [super updateProps:props oldProps:oldProps];
}

#pragma mark - ScrollView attach

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  if (self.window) {
    [self attachToScrollViewIfNeeded];
  } else {
    [self detachFromScrollView];
  }
}

- (UIScrollView *)findParentScrollView
{
  UIView *view = self.superview;
  while (view) {
    if ([view isKindOfClass:UIScrollView.class]) {
      return (UIScrollView *)view;
    }
    view = view.superview;
  }
  return nil;
}

- (void)attachToScrollViewIfNeeded
{
  if (_scrollView) {
    return;
  }
  UIScrollView *scrollView = [self findParentScrollView];
  if (!scrollView) {
    return;
  }
  _scrollView = scrollView;
  [_scrollView addObserver:self
                forKeyPath:@"contentOffset"
                   options:NSKeyValueObservingOptionNew
                   context:kContentOffsetKVOContext];
}

- (void)detachFromScrollView
{
  if (_scrollView) {
    @try {
      [_scrollView removeObserver:self forKeyPath:@"contentOffset" context:kContentOffsetKVOContext];
    } @catch (__unused NSException *exception) {
    }
    _scrollView = nil;
  }
  _isRefreshing = NO;
  _lastState = -1;
  _hasOriginalInset = NO;
}

- (void)dealloc
{
  [self detachFromScrollView];
}

#pragma mark - KVO

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary<NSKeyValueChangeKey, id> *)change
                       context:(void *)context
{
  if (context != kContentOffsetKVOContext) {
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
    return;
  }
  if (!_scrollView) {
    return;
  }

  if (_isRefreshing) {
    [self emitOffset:_headerHeight];
    return;
  }

  // 基线 = 原始 adjustedContentInset.top（含安全区），保证静止时 pull = 0
  CGFloat baseline = _scrollView.adjustedContentInset.top;
  CGFloat offsetY = _scrollView.contentOffset.y;
  CGFloat pull = MAX(0, -(offsetY + baseline));

  [self emitOffset:pull];

  if (pull <= 0) {
    [self emitStateIfChanged:0];
    return;
  }

  if (pull >= _triggerHeight) {
    if (_scrollView.isDragging) {
      [self emitStateIfChanged:1];
    } else {
      [self startRefreshing];
    }
  } else {
    [self emitStateIfChanged:0];
  }
}

#pragma mark - Refresh control

- (void)startRefreshing
{
  if (_isRefreshing || !_scrollView) {
    return;
  }
  _isRefreshing = YES;
  [self emitStateIfChanged:2];

  if (!_hasOriginalInset) {
    _originalInset = _scrollView.contentInset;
    _hasOriginalInset = YES;
  }

  UIEdgeInsets inset = _scrollView.contentInset;
  inset.top += _headerHeight;
  __weak UIScrollView *weakScrollView = _scrollView;
  [UIView animateWithDuration:0.2
                   animations:^{
                     weakScrollView.contentInset = inset;
                     [weakScrollView setContentOffset:CGPointMake(weakScrollView.contentOffset.x, -inset.top)
                                             animated:NO];
                   }];
}

- (void)endRefreshing
{
  if (!_isRefreshing || !_scrollView) {
    return;
  }
  _isRefreshing = NO;

  UIEdgeInsets inset = _scrollView.contentInset;
  inset.top -= _headerHeight;
  __weak UIScrollView *weakScrollView = _scrollView;
  [UIView animateWithDuration:0.2
                   animations:^{
                     weakScrollView.contentInset = inset;
                     [weakScrollView setContentOffset:CGPointMake(weakScrollView.contentOffset.x, -inset.top)
                                             animated:NO];
                   }
                   completion:^(__unused BOOL finished) {
                     [self emitStateIfChanged:0];
                   }];
}

#pragma mark - Events

- (void)emitOffset:(CGFloat)offset
{
  if (_eventEmitter) {
    auto emitter = std::static_pointer_cast<LottieRefreshHeaderEventEmitter const>(_eventEmitter);
    LottieRefreshHeaderEventEmitter::OnChangeOffset event{(double)offset};
    emitter->onChangeOffset(event);
  }
}

- (void)emitStateIfChanged:(NSInteger)state
{
  if (state == _lastState) {
    return;
  }
  _lastState = state;
  if (_eventEmitter) {
    auto emitter = std::static_pointer_cast<LottieRefreshHeaderEventEmitter const>(_eventEmitter);
    LottieRefreshHeaderEventEmitter::OnChangeState event{(int)state};
    emitter->onChangeState(event);
  }
}

@end

Class<RCTComponentViewProtocol> LottieRefreshHeaderCls(void)
{
  return LottieRefreshHeaderComponentView.class;
}
