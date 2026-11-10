Pod::Spec.new do |s|
  s.name         = "PhoneLogin"
  s.version      = "1.0.0"
  s.summary      = "Aliyun number auth one-click login bridge for RN"
  s.homepage     = "https://www.lccxin.com"
  s.license      = "Proprietary"
  s.authors      = { "lccxin" => "dev@lccxin.com" }
  s.platform     = :ios, "12.0"
  s.source       = { :path => "." }
  s.source_files = "*.{h,m}"
  s.requires_arc = true
  # 阿里云号码认证一键登录 iOS SDK（动态库 xcframework）：从控制台 API&SDK 页下载后解压到本目录
  s.vendored_frameworks = "ATAuthSDK_D.xcframework"
  s.dependency "React-Core"
end
