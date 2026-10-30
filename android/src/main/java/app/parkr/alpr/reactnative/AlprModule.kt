package app.parkr.alpr.reactnative

import android.Manifest
import android.content.Context
import app.parkr.alpr.Alpr
import app.parkr.alpr.AlprAccelerator
import app.parkr.alpr.AlprCameraView
import app.parkr.alpr.AlprCameraViewListener
import app.parkr.alpr.AlprConfig
import app.parkr.alpr.AlprEngine
import app.parkr.alpr.AlprError
import app.parkr.alpr.AlprPlate
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

private inline fun <T> rethrowing(block: () -> T): T =
  try {
    block()
  } catch (error: AlprError) {
    throw AlprCodedException(error)
  }

class AlprModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("Alpr")

    OnCreate {
      Alpr.framework = "react-native"
      appContext.reactContext?.let { Alpr.init(it) }
    }

    AsyncFunction("loadModels") { config: AlprConfigRecord? ->
      rethrowing { AlprEngine.loadModels(requireContext(), AlprAccelerator.from(config?.accelerator)) }
    }

    AsyncFunction("scanImage") { uri: String, config: AlprConfigRecord? ->
      rethrowing {
        AlprEngine.scanImage(requireContext(), uri, config?.toConfig() ?: AlprConfig()).map(::DetectedPlateRecord)
      }
    }

    Function("setTelemetryEnabled") { enabled: Boolean ->
      appContext.reactContext?.let { Alpr.init(it) }
      Alpr.setTelemetryEnabled(enabled)
    }

    Function("setFrameworkVersion") { version: String ->
      Alpr.frameworkVersion = version
    }

    AsyncFunction("getCameraPermissionsAsync") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.CAMERA)
    }

    AsyncFunction("requestCameraPermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.CAMERA)
    }

    View(AlprExpoView::class) {
      Prop("isActive") { view: AlprExpoView, value: Boolean -> view.camera.isActive = value }
      Prop("throttle") { view: AlprExpoView, value: Double -> view.camera.throttle = value.toLong() }
      Prop("showFps") { view: AlprExpoView, value: Boolean -> view.camera.showFps = value }
      Prop("showOverlay") { view: AlprExpoView, value: Boolean -> view.camera.showOverlay = value }
      Prop("mockImage") { view: AlprExpoView, value: String? -> view.camera.mockImage = value }
      Prop("torch") { view: AlprExpoView, value: Boolean -> view.camera.torch = value }
      Prop("zoom") { view: AlprExpoView, value: Double -> view.camera.zoom = value.toFloat() }
      Prop("scanRegion") { view: AlprExpoView, value: BoundingBoxRecord? -> view.camera.scanRegion = value?.toBoundingBox() }
      Prop("showScanRegion") { view: AlprExpoView, value: Boolean -> view.camera.showScanRegion = value }
      Prop("overlayStyle") { view: AlprExpoView, value: OverlayStyleRecord? -> view.camera.overlayStyle = value?.toStyle() }
      Prop("detectionThreshold") { view: AlprExpoView, value: Double? -> view.camera.detectionThreshold = value?.toFloat() }
      Prop("ocrThreshold") { view: AlprExpoView, value: Double? -> view.camera.ocrThreshold = value?.toFloat() }
      Prop("accelerator") { view: AlprExpoView, value: String? -> view.camera.accelerator = AlprAccelerator.from(value) }
      Prop("recognizesPlates") { view: AlprExpoView, value: Boolean -> view.camera.recognizesPlates = value }
      Prop("scansPlates") { view: AlprExpoView, value: Boolean -> view.camera.scansPlates = value }

      Events("onPlatesRaw", "onPlates", "onPlate", "onScan", "onError")
    }
  }

  private fun requireContext(): Context =
    requireNotNull(appContext.reactContext) { "react-native-alpr: reactContext is not available yet." }
}

class AlprExpoView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  override val shouldUseAndroidLayout: Boolean = true

  val onPlatesRaw by EventDispatcher<PlatesEvent>()
  val onPlates by EventDispatcher<PlatesEvent>()
  val onPlate by EventDispatcher<PlateEvent>()
  val onScan by EventDispatcher<PlateEvent>()
  val onError by EventDispatcher<ErrorEvent>()
  val camera = AlprCameraView(context)

  init {
    camera.listener = object : AlprCameraViewListener {
      override fun onPlatesRaw(view: AlprCameraView, plates: List<AlprPlate>, frameWidth: Int, frameHeight: Int) {
        this@AlprExpoView.onPlatesRaw(PlatesEvent(plates.map(::DetectedPlateRecord), frameWidth, frameHeight))
      }

      override fun onPlates(view: AlprCameraView, plates: List<AlprPlate>, frameWidth: Int, frameHeight: Int) {
        this@AlprExpoView.onPlates(PlatesEvent(plates.map(::DetectedPlateRecord), frameWidth, frameHeight))
      }

      override fun onPlate(view: AlprCameraView, plate: AlprPlate) {
        this@AlprExpoView.onPlate(PlateEvent(DetectedPlateRecord(plate)))
      }

      override fun onScan(view: AlprCameraView, plate: AlprPlate) {
        this@AlprExpoView.onScan(PlateEvent(DetectedPlateRecord(plate)))
      }

      override fun onError(view: AlprCameraView, error: AlprError) {
        this@AlprExpoView.onError(ErrorEvent(error.code.value, error.message ?: ""))
      }
    }
    addView(camera, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
  }
}
