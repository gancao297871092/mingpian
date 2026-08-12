Pod::Spec.new do |s|
  s.name         = "LiquidGlassView"
  s.version      = "1.0.0"
  s.summary      = "Native Liquid Glass View for iOS"
  s.homepage     = "https://github.com/example"
  s.license      = "MIT"
  s.authors      = { "author" => "author@example.com" }
  s.platform     = :ios, "13.0"
  s.source       = { :path => "." }
  s.source_files = "**/*.{h,m,mm,swift}"
  s.swift_version = "5.0"
  s.requires_arc = true
  s.dependency "React-Core"
end
