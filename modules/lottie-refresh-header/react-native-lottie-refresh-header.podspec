require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-lottie-refresh-header"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://example.local"
  s.license      = package["license"]
  s.authors      = { "template" => "template@example.local" }
  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://example.local", :tag => s.version.to_s }
  s.source_files = "ios/**/*.{h,m,mm,cpp}"
  s.requires_arc = true

  install_modules_dependencies(s)
end
