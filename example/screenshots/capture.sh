#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: screenshots/capture.sh [ios|android|all] [--no-build]

Builds the example app in Release, installs it on a simulator or emulator,
drives it with Maestro and writes screenshots to screenshots/output.

Environment:
  ALPR_LICENSE_KEY  License key for app.parkr.alpr.example. Android release
                    builds need it for Pro features; iOS simulators are always unlocked.
  IOS_DEVICE        Simulator name (default: iPhone 17 Pro)
  ANDROID_AVD       Emulator to boot when none is running (default: Pixel_9)
EOF
}

here=$(cd "$(dirname "$0")" && pwd)
example=$(cd "$here/.." && pwd)
output="$here/output"
platforms=all
build=1
for arg in "$@"; do
  case "$arg" in
    ios | android | all) platforms=$arg ;;
    --no-build) build=0 ;;
    -h | --help) usage; exit 0 ;;
    *) usage >&2; exit 1 ;;
  esac
done

app_id=app.parkr.alpr.example
ios_device=${IOS_DEVICE:-iPhone 17 Pro}
android_avd=${ANDROID_AVD:-Pixel_9}
export LANG=en_US.UTF-8

if [ -z "${ALPR_LICENSE_KEY:-}" ] && [ "$platforms" != ios ]; then
  echo "warning: ALPR_LICENSE_KEY is not set. Android release builds will show the license badge." >&2
fi

prebuild() {
  if [ "$build" = 1 ]; then
    (cd "$example" && npx expo prebuild --platform "$1" --no-install)
  fi
}

maestro_run() {
  local dir="$output/$1"
  rm -rf "$dir"
  mkdir -p "$dir"
  maestro --device "$2" test -e OUTPUT="$dir" "$here/flows/capture.yaml"
}

capture_ios() {
  local udid
  udid=$(xcrun simctl list devices available -j | node -e "
    const devices = Object.values(JSON.parse(require('fs').readFileSync(0, 'utf8')).devices).flat();
    const matches = devices.filter((d) => d.name === process.argv[1]);
    const device = matches.find((d) => d.state === 'Booted') ?? matches.at(-1);
    if (!device) process.exit(1);
    console.log(device.udid);
  " "$ios_device") || { echo "No simulator named $ios_device" >&2; exit 1; }
  xcrun simctl boot "$udid" 2>/dev/null || true
  xcrun simctl bootstatus "$udid" >/dev/null

  if [ "$build" = 1 ]; then
    prebuild ios
    (cd "$example/ios" && pod install)
    xcodebuild -quiet -workspace "$example/ios/ALPR.xcworkspace" -scheme ALPR -configuration Release \
      -sdk iphonesimulator -destination "id=$udid" -derivedDataPath "$example/ios/build" build
  fi
  xcrun simctl install "$udid" "$example/ios/build/Build/Products/Release-iphonesimulator/ALPR.app"

  xcrun simctl status_bar "$udid" override --time 9:41 --dataNetwork wifi --wifiMode active --wifiBars 3 \
    --cellularMode active --cellularBars 4 --batteryState charged --batteryLevel 100
  maestro_run ios "$udid"
  xcrun simctl status_bar "$udid" clear
}

capture_android() {
  local serial
  serial=$(adb devices | awk '/^emulator-.*device$/ { print $1; exit }')
  if [ -z "$serial" ]; then
    emulator -avd "$android_avd" -no-snapshot-save -no-audio -no-boot-anim >/dev/null 2>&1 &
    adb wait-for-device
    serial=$(adb devices | awk '/^emulator-.*device$/ { print $1; exit }')
  fi
  until [ "$(adb -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ]; do sleep 2; done

  if [ "$build" = 1 ]; then
    prebuild android
    local abi
    abi=$(adb -s "$serial" shell getprop ro.product.cpu.abi | tr -d '\r')
    (cd "$example/android" && ./gradlew -q :app:assembleRelease -PreactNativeArchitectures="$abi")
  fi
  adb -s "$serial" install -r "$example/android/app/build/outputs/apk/release/app-release.apk" >/dev/null
  adb -s "$serial" shell pm grant "$app_id" android.permission.CAMERA 2>/dev/null || true

  local demo="adb -s $serial shell am broadcast -a com.android.systemui.demo -e command"
  adb -s "$serial" shell settings put global sysui_demo_allowed 1
  $demo enter >/dev/null
  $demo clock -e hhmm 0941 >/dev/null
  $demo battery -e level 100 -e plugged false >/dev/null
  $demo network -e wifi show -e level 4 -e mobile hide >/dev/null
  $demo notifications -e visible false >/dev/null
  maestro_run android "$serial"
  $demo exit >/dev/null
}

case "$platforms" in
  ios) capture_ios ;;
  android) capture_android ;;
  all) capture_ios; capture_android ;;
esac

node "$here/compose.mjs"
