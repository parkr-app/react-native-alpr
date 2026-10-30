# Screenshots

Reproducible screenshots of the example app on an iOS simulator and an Android emulator, driven by [Maestro](https://maestro.dev).

```sh
cd example
./screenshots/capture.sh            # iOS and Android
./screenshots/capture.sh ios        # one platform
./screenshots/capture.sh android --no-build
```

The script builds the example app in Release, installs it, sets a clean status bar (9:41, full battery), runs `flows/capture.yaml` and writes:

| Path | Content |
| --- | --- |
| `output/<platform>/*.png` | Raw screenshots |
| `output/web/<platform>-*.webp` | Each screenshot in a phone frame, for the README and alpr.parkr.app |

Requirements: Xcode with an `iPhone 17 Pro` simulator (`IOS_DEVICE` to change), an Android emulator (`ANDROID_AVD`, default `Pixel_9`), Maestro, ImageMagick 7 and Node. Set `ALPR_LICENSE_KEY` to a key for `app.parkr.alpr.example`, otherwise Pro features are limited in the Android release build. iOS simulators are always unlocked.

## How it works

- The live scan screens use the mock camera: the deep link `alpr-example://?mock=<image>&fps=0` feeds a still image to `AlprCameraView` as camera frames and hides the FPS label. Maestro waits until consensus confirms the plate.
- The photo screens open an image from the Examples tab, which runs `scanImage`.
- The photos come from Wikimedia Commons under CC0, public domain and CC BY / CC BY-SA licenses. `images.json` lists them with their country and plates, and `node screenshots/fetch-images.mjs` downloads, crops and resizes them into `test-images/showcase`, writes the list thumbnails to `test-images/thumbs`, together with `CREDITS.md`. Credit the authors wherever the screenshots are published.
