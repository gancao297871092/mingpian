Pod::Spec.new do |s|
  s.name         = "FaceVerify"
  s.version      = "1.0.0"
  s.summary      = "腾讯云增强版人脸核身 RN 桥"
  s.license      = "MIT"
  s.authors      = { "wanq" => "dev@wanq.local" }
  s.homepage     = "https://example.local"
  s.platform     = :ios, "12.0"
  s.source       = { :path => "." }
  s.source_files = "*.{h,m}"
  s.static_framework = true

  s.dependency "React-Core"
  s.dependency "TencentCloudHuiyanSDKFace_framework"
end
