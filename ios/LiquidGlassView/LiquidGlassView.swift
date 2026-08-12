import UIKit

@objc public enum LiquidGlassEffect: Int {
  case regular
  case clear
  case none
}

@objc public class LiquidGlassViewImpl: UIView {
  private let visualEffectView = UIVisualEffectView()
  private let toolbarTintView = UIView()
  private var isFirstMount: Bool = true
  @objc public var effectTintColor: UIColor? {
    didSet { applyTintColor() }
  }
  @objc public var interactive: Bool = false
  @objc public var style: LiquidGlassEffect = .regular {
    didSet { if !isFirstMount { setupView() } }
  }

  public override var overrideUserInterfaceStyle: UIUserInterfaceStyle {
    get { visualEffectView.overrideUserInterfaceStyle }
    set { visualEffectView.overrideUserInterfaceStyle = newValue }
  }

  @objc public var contentView: UIView {
    return visualEffectView.contentView
  }

  public override init(frame: CGRect) {
    super.init(frame: frame)
    visualEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    visualEffectView.frame = bounds
    addSubview(visualEffectView)

    toolbarTintView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    toolbarTintView.frame = bounds
    toolbarTintView.isUserInteractionEnabled = false
    visualEffectView.contentView.addSubview(toolbarTintView)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    visualEffectView.frame = bounds
    toolbarTintView.frame = visualEffectView.contentView.bounds
    if visualEffectView.effect != nil { return }
    setupView()
    if isFirstMount {
      isFirstMount = false
    }
  }

  public override func insertSubview(_ view: UIView, at index: Int) {
    visualEffectView.contentView.insertSubview(view, at: index)
  }

  @objc public func setupView() {
#if compiler(>=6.2)
    if #available(iOS 26.0, tvOS 26.0, *),
       let glassEffectClass = NSClassFromString("UIGlassEffect") as? NSObject.Type,
       glassEffectClass.responds(to: Selector(("effectWithStyle:"))) {
      NSLog("[LiquidGlass] using UIGlassEffect path")
      guard let glassEffect = makeGlassEffect() else {
        NSLog("[LiquidGlass] makeGlassEffect returned nil, falling back")
        applyBlurFallback()
        visualEffectView.contentView.isUserInteractionEnabled = true
        return
      }

      glassEffect.isInteractive = interactive
      glassEffect.tintColor = effectTintColor
      animateEffect(glassEffect)
      visualEffectView.contentView.isUserInteractionEnabled = true
      return
    }
    NSLog("[LiquidGlass] UIGlassEffect unavailable, using blur fallback")
#endif

    applyBlurFallback()
    visualEffectView.contentView.isUserInteractionEnabled = true
  }

  private func applyBlurFallback() {
    guard style != .none else {
      let color = effectTintColor ?? UIColor(white: 1, alpha: 0.08)
      visualEffectView.effect = nil
      toolbarTintView.backgroundColor = color
      return
    }

    let blurStyle: UIBlurEffect.Style = style == .clear
      ? .systemUltraThinMaterial
      : .systemMaterial

    animateEffect(UIBlurEffect(style: blurStyle))
    toolbarTintView.backgroundColor = effectTintColor ?? UIColor(white: 1, alpha: 0.08)
  }

  private func animateEffect(_ effect: UIVisualEffect?) {
    if isFirstMount {
      visualEffectView.effect = effect
    } else {
      UIView.animate(withDuration: 0.35) { self.visualEffectView.effect = effect }
    }
  }

  private func applyTintColor() {
    let color = effectTintColor ?? UIColor(white: 1, alpha: 0.08)

#if compiler(>=6.2)
    if #available(iOS 26.0, tvOS 26.0, *) {
      toolbarTintView.backgroundColor = .clear
      return
    }
#endif

    toolbarTintView.backgroundColor = color
  }
}

#if compiler(>=6.2)
@available(iOS 26.0, tvOS 26.0, *)
private extension LiquidGlassViewImpl {
  func makeGlassEffect() -> UIGlassEffect? {
    guard let preferredStyle = style.converted else {
      animateEffect(nil)
      return nil
    }
    return UIGlassEffect(style: preferredStyle)
  }
}

@available(iOS 26.0, tvOS 26.0, *)
extension LiquidGlassEffect {
  var converted: UIGlassEffect.Style? {
    switch self {
    case .regular:
      return .regular
    case .clear:
      return .clear
    case .none:
      return nil
    }
  }
}
#endif
