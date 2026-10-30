require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
xcframework = File.join(__dir__, "ios", "AlprKit.xcframework")

alpr_send_build_telemetry = lambda do |version|
  begin
    next if $alpr_build_telemetry_sent
    $alpr_build_telemetry_sent = true
    dnt = ENV["DO_NOT_TRACK"].to_s
    next if (!dnt.empty? && !%w[0 false].include?(dnt.downcase)) || %w[0 false].include?(ENV["ALPR_TELEMETRY"].to_s.downcase)
    next unless defined?(Pod::Config) && defined?(Xcodeproj::Project)
    project_path = Dir.glob(File.join(Pod::Config.instance.installation_root.to_s, "*.xcodeproj")).first
    next unless project_path
    project = Xcodeproj::Project.open(project_path)
    ids = project.targets
      .select { |t| t.respond_to?(:product_type) && t.product_type == "com.apple.product-type.application" }
      .flat_map { |t| t.build_configurations.map { |c| c.build_settings["PRODUCT_BUNDLE_IDENTIFIER"] } }
      .compact.uniq.reject { |id| id.include?("$") }
    next if ids.empty?
    require "net/http"
    require "json"
    worker = Thread.new do
      Thread.current.report_on_exception = false
      ids.each do |app_id|
        begin
          uri = URI("https://alpr.parkr.app/t/build")
          body = { source: "cocoapods", appId: app_id, platform: "ios", buildType: "pod-install", sdkVersion: version,
                   framework: "react-native", ci: !ENV["CI"].nil?, licenseState: "unknown" }.to_json
          Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 2, read_timeout: 2) do |http|
            http.post(uri.path, body, "Content-Type" => "application/json")
          end
        rescue Exception
          nil
        end
      end
    end
    begin
      worker.join(3)
    rescue Exception
      nil
    end
  rescue Exception
    nil
  end
end

alpr_send_build_telemetry.call(package["version"])

Pod::Spec.new do |s|
  s.name         = "ReactNativeAlpr"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "15.1" }
  s.source       = { :git => package["repository"]["url"], :tag => "v#{s.version}" }
  s.swift_version = "5.9"

  s.source_files = "ios/*.swift"
  s.frameworks = "AVFoundation", "UIKit"

  if File.exist?(xcframework) && ENV["ALPR_CORE_DIR"].to_s.empty?
    s.vendored_frameworks = "ios/AlprKit.xcframework"
  else
    s.dependency "AlprKit"
  end

  s.dependency "ExpoModulesCore"

  install_modules_dependencies(s) if respond_to?(:install_modules_dependencies, true)
end
