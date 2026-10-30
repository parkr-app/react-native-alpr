import AlprKit
import AVFoundation
import ExpoModulesCore
import UIKit

func colorFromArgb(_ value: Double?) -> UIColor? {
  guard let value else { return nil }
  let argb = UInt32(truncatingIfNeeded: Int64(value))
  return UIColor(
    red: CGFloat((argb >> 16) & 0xFF) / 255,
    green: CGFloat((argb >> 8) & 0xFF) / 255,
    blue: CGFloat(argb & 0xFF) / 255,
    alpha: CGFloat((argb >> 24) & 0xFF) / 255
  )
}

final class AlprCodedException: Exception, @unchecked Sendable {
  let error: AlprError

  init(_ error: AlprError) {
    self.error = error
    super.init()
  }

  override var code: String { error.code.rawValue }
  override var reason: String { error.message }
}

struct BoundingBoxRecord: Record {
  @Field var x: Double = 0
  @Field var y: Double = 0
  @Field var width: Double = 0
  @Field var height: Double = 0

  init() {}

  init(_ bbox: CGRect) {
    x = Double(bbox.origin.x)
    y = Double(bbox.origin.y)
    width = Double(bbox.size.width)
    height = Double(bbox.size.height)
  }

  var rect: CGRect { CGRect(x: x, y: y, width: width, height: height) }
}

struct DetectedPlateRecord: Record {
  @Field var plate: String = ""
  @Field var ocrConfidence: Double = 0
  @Field var detectionConfidence: Double = 0
  @Field var bbox: BoundingBoxRecord = BoundingBoxRecord()
  @Field var country: String = "Unknown"
  @Field var countryCode: String? = nil
  @Field var countryConfidence: Double = 0

  init() {}

  init(_ plate: AlprPlate) {
    self.plate = plate.plate
    ocrConfidence = Double(plate.ocrConfidence)
    detectionConfidence = Double(plate.detectionConfidence)
    bbox = BoundingBoxRecord(plate.bbox)
    country = plate.country
    countryCode = plate.countryCode
    countryConfidence = Double(plate.countryConfidence)
  }
}

struct AlprConfigRecord: Record {
  @Field var detectionThreshold: Double?
  @Field var ocrThreshold: Double?
  @Field var region: BoundingBoxRecord?
  @Field var accelerator: String?

  init() {}

  var accelerator_: AlprAccelerator { accelerator.flatMap(AlprAccelerator.init(rawValue:)) ?? .gpu }

  var config: AlprConfig {
    AlprConfig(
      detectionThreshold: detectionThreshold.map(Float.init),
      ocrThreshold: ocrThreshold.map(Float.init),
      region: region?.rect,
      accelerator: accelerator_
    )
  }
}

struct OverlayStyleRecord: Record {
  @Field var boxColor: Double?
  @Field var boxBorderWidth: Double?
  @Field var boxCornerRadius: Double?
  @Field var labelBackgroundColor: Double?
  @Field var labelTextColor: Double?
  @Field var labelFontSize: Double?
  @Field var showLabel: Bool?
  @Field var showPlate: Bool?
  @Field var showCountry: Bool?
  @Field var showConfidence: Bool?

  init() {}

  var style: AlprOverlayStyle {
    var style = AlprOverlayStyle()
    style.boxColor = colorFromArgb(boxColor)
    style.boxBorderWidth = boxBorderWidth.map { CGFloat($0) } ?? style.boxBorderWidth
    style.boxCornerRadius = boxCornerRadius.map { CGFloat($0) } ?? style.boxCornerRadius
    style.labelBackgroundColor = colorFromArgb(labelBackgroundColor)
    style.labelTextColor = colorFromArgb(labelTextColor) ?? style.labelTextColor
    style.labelFontSize = labelFontSize.map { CGFloat($0) } ?? style.labelFontSize
    style.showLabel = showLabel ?? style.showLabel
    style.showPlate = showPlate ?? style.showPlate
    style.showCountry = showCountry ?? style.showCountry
    style.showConfidence = showConfidence ?? style.showConfidence
    return style
  }
}

struct CameraPermissionResponse: Record {
  @Field var status: String = "undetermined"
  @Field var granted: Bool = false
  @Field var canAskAgain: Bool = true
  @Field var expires: String = "never"

  init() {}

  init(_ authorization: AVAuthorizationStatus) {
    switch authorization {
    case .authorized:
      status = "granted"
      granted = true
      canAskAgain = true
    case .notDetermined:
      status = "undetermined"
      granted = false
      canAskAgain = true
    default:
      status = "denied"
      granted = false
      canAskAgain = false
    }
  }
}

struct PlatesEvent: Record {
  @Field var plates: [DetectedPlateRecord] = []
  @Field var frameWidth: Double = 0
  @Field var frameHeight: Double = 0

  init() {}

  init(_ plates: [DetectedPlateRecord], frameSize: CGSize) {
    self.plates = plates
    frameWidth = Double(frameSize.width)
    frameHeight = Double(frameSize.height)
  }
}

struct PlateEvent: Record {
  @Field var plate: DetectedPlateRecord = DetectedPlateRecord()

  init() {}

  init(_ plate: DetectedPlateRecord) {
    self.plate = plate
  }
}

struct ErrorEvent: Record {
  @Field var code: String = ""
  @Field var message: String = ""

  init() {}

  init(_ error: AlprError) {
    code = error.code.rawValue
    message = error.message
  }
}
