package app.parkr.alpr.reactnative

import app.parkr.alpr.AlprAccelerator
import app.parkr.alpr.AlprConfig
import app.parkr.alpr.AlprError
import app.parkr.alpr.AlprOverlayStyle
import app.parkr.alpr.AlprPlate
import app.parkr.alpr.BoundingBox
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

class AlprCodedException(error: AlprError) : CodedException(error.code.value, error.message, error)

@OptimizedRecord
class BoundingBoxRecord(
  @Field val x: Double = 0.0,
  @Field val y: Double = 0.0,
  @Field val width: Double = 0.0,
  @Field val height: Double = 0.0,
) : Record {
  constructor(bbox: BoundingBox) : this(bbox.x.toDouble(), bbox.y.toDouble(), bbox.width.toDouble(), bbox.height.toDouble())

  fun toBoundingBox() = BoundingBox(x.toFloat(), y.toFloat(), width.toFloat(), height.toFloat())
}

@OptimizedRecord
class DetectedPlateRecord(
  @Field val plate: String = "",
  @Field val ocrConfidence: Double = 0.0,
  @Field val detectionConfidence: Double = 0.0,
  @Field val bbox: BoundingBoxRecord = BoundingBoxRecord(),
  @Field val country: String = "Unknown",
  @Field val countryCode: String? = null,
  @Field val countryConfidence: Double = 0.0,
) : Record {
  constructor(plate: AlprPlate) : this(
    plate = plate.plate,
    ocrConfidence = plate.ocrConfidence.toDouble(),
    detectionConfidence = plate.detectionConfidence.toDouble(),
    bbox = BoundingBoxRecord(plate.bbox),
    country = plate.country,
    countryCode = plate.countryCode,
    countryConfidence = plate.countryConfidence.toDouble(),
  )
}

class AlprConfigRecord(
  @Field val detectionThreshold: Double? = null,
  @Field val ocrThreshold: Double? = null,
  @Field val region: BoundingBoxRecord? = null,
  @Field val accelerator: String? = null,
) : Record {
  fun toConfig() = AlprConfig(
    detectionThreshold = detectionThreshold?.toFloat(),
    ocrThreshold = ocrThreshold?.toFloat(),
    region = region?.toBoundingBox(),
    accelerator = AlprAccelerator.from(accelerator),
  )
}

class OverlayStyleRecord(
  @Field val boxColor: Double? = null,
  @Field val boxBorderWidth: Double? = null,
  @Field val boxCornerRadius: Double? = null,
  @Field val labelBackgroundColor: Double? = null,
  @Field val labelTextColor: Double? = null,
  @Field val labelFontSize: Double? = null,
  @Field val showLabel: Boolean? = null,
  @Field val showPlate: Boolean? = null,
  @Field val showCountry: Boolean? = null,
  @Field val showConfidence: Boolean? = null,
) : Record {
  fun toStyle(): AlprOverlayStyle {
    val defaults = AlprOverlayStyle()
    return AlprOverlayStyle(
      boxColor = boxColor?.toArgb(),
      boxBorderWidth = boxBorderWidth?.toFloat() ?: defaults.boxBorderWidth,
      boxCornerRadius = boxCornerRadius?.toFloat() ?: defaults.boxCornerRadius,
      labelBackgroundColor = labelBackgroundColor?.toArgb(),
      labelTextColor = labelTextColor?.toArgb() ?: defaults.labelTextColor,
      labelFontSize = labelFontSize?.toFloat() ?: defaults.labelFontSize,
      showLabel = showLabel ?: defaults.showLabel,
      showPlate = showPlate ?: defaults.showPlate,
      showCountry = showCountry ?: defaults.showCountry,
      showConfidence = showConfidence ?: defaults.showConfidence,
    )
  }

  private fun Double.toArgb(): Int = toLong().toInt()
}

@OptimizedRecord
class PlatesEvent(
  @Field val plates: List<DetectedPlateRecord> = emptyList(),
  @Field val frameWidth: Int = 0,
  @Field val frameHeight: Int = 0,
) : Record

@OptimizedRecord
class PlateEvent(
  @Field val plate: DetectedPlateRecord = DetectedPlateRecord(),
) : Record

@OptimizedRecord
class ErrorEvent(
  @Field val code: String = "",
  @Field val message: String = "",
) : Record
