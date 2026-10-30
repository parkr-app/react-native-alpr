import AlprKit
import AVFoundation
import ExpoModulesCore
import UIKit

private func imageURL(_ uri: String) -> URL? {
  uri.hasPrefix("/") ? URL(fileURLWithPath: uri) : URL(string: uri)
}

private func rethrowing<T>(_ body: () throws -> T) throws -> T {
  do {
    return try body()
  } catch let error as AlprError {
    throw AlprCodedException(error)
  }
}

public class AlprModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Alpr")

    OnCreate {
      Alpr.framework = "react-native"
    }

    AsyncFunction("loadModels") { (config: AlprConfigRecord?) in
      try rethrowing { try AlprEngine.shared.loadModels(accelerator: config?.accelerator_ ?? .gpu) }
    }

    AsyncFunction("scanImage") { (uri: String, config: AlprConfigRecord?) -> [DetectedPlateRecord] in
      try rethrowing {
        guard let url = imageURL(uri) else { throw AlprError(.file, "Invalid image URI \(uri)") }
        return try AlprEngine.shared.scanImage(contentsOf: url, config: config?.config ?? AlprConfig())
          .map(DetectedPlateRecord.init)
      }
    }

    Function("setTelemetryEnabled") { (enabled: Bool) in
      Alpr.setTelemetryEnabled(enabled)
    }

    Function("setFrameworkVersion") { (version: String) in
      Alpr.frameworkVersion = version
    }

    AsyncFunction("getCameraPermissionsAsync") { () -> CameraPermissionResponse in
      CameraPermissionResponse(AVCaptureDevice.authorizationStatus(for: .video))
    }

    AsyncFunction("requestCameraPermissionsAsync") { (promise: Promise) in
      AVCaptureDevice.requestAccess(for: .video) { _ in
        promise.resolve(CameraPermissionResponse(AVCaptureDevice.authorizationStatus(for: .video)))
      }
    }

    View(AlprExpoView.self) {
      Prop("isActive") { (view: AlprExpoView, value: Bool) in view.camera.isActive = value }
      Prop("throttle") { (view: AlprExpoView, value: Double) in view.camera.throttle = value }
      Prop("showFps") { (view: AlprExpoView, value: Bool) in view.camera.showFps = value }
      Prop("showOverlay") { (view: AlprExpoView, value: Bool) in view.camera.showOverlay = value }
      Prop("mockImage") { (view: AlprExpoView, value: String?) in view.camera.mockImage = value }
      Prop("torch") { (view: AlprExpoView, value: Bool) in view.camera.torch = value }
      Prop("zoom") { (view: AlprExpoView, value: Double) in view.camera.zoom = value }
      Prop("scanRegion") { (view: AlprExpoView, value: BoundingBoxRecord?) in view.camera.scanRegion = value?.rect }
      Prop("showScanRegion") { (view: AlprExpoView, value: Bool) in view.camera.showScanRegion = value }
      Prop("overlayStyle") { (view: AlprExpoView, value: OverlayStyleRecord?) in view.camera.overlayStyle = value?.style }
      Prop("detectionThreshold") { (view: AlprExpoView, value: Double?) in view.camera.detectionThreshold = value.map(Float.init) }
      Prop("ocrThreshold") { (view: AlprExpoView, value: Double?) in view.camera.ocrThreshold = value.map(Float.init) }
      Prop("accelerator") { (view: AlprExpoView, value: String?) in
        view.camera.accelerator = value.flatMap(AlprAccelerator.init(rawValue:)) ?? .gpu
      }
      Prop("recognizesPlates") { (view: AlprExpoView, value: Bool) in view.camera.recognizesPlates = value }
      Prop("scansPlates") { (view: AlprExpoView, value: Bool) in view.camera.scansPlates = value }

      Events("onPlatesRaw", "onPlates", "onPlate", "onScan", "onError")
    }
  }
}

final class AlprExpoView: ExpoView, AlprCameraViewDelegate {
  let onPlatesRaw = EventDispatcher()
  let onPlates = EventDispatcher()
  let onPlate = EventDispatcher()
  let onScan = EventDispatcher()
  let onError = EventDispatcher()
  let camera = AlprCameraView(frame: .zero)

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    camera.delegate = self
    addSubview(camera)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    camera.frame = bounds
  }

  func alprCameraView(_ view: AlprCameraView, didDetectRaw plates: [AlprPlate], frameSize: CGSize) {
    onPlatesRaw(PlatesEvent(plates.map(DetectedPlateRecord.init), frameSize: frameSize))
  }

  func alprCameraView(_ view: AlprCameraView, didDetect plates: [AlprPlate], frameSize: CGSize) {
    onPlates(PlatesEvent(plates.map(DetectedPlateRecord.init), frameSize: frameSize))
  }

  func alprCameraView(_ view: AlprCameraView, didRecognize plate: AlprPlate) {
    onPlate(PlateEvent(DetectedPlateRecord(plate)))
  }

  func alprCameraView(_ view: AlprCameraView, didScan plate: AlprPlate) {
    onScan(PlateEvent(DetectedPlateRecord(plate)))
  }

  func alprCameraView(_ view: AlprCameraView, didFailWith error: AlprError) {
    onError(ErrorEvent(error))
  }
}
