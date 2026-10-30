#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
version=$(node -p "require('./package.json').version")
missing=()

plist=ios/AlprKit.xcframework/Info.plist
[ -f "$plist" ] || missing+=("$plist")
for slice in ios-arm64 ios-arm64_x86_64-simulator; do
  framework="ios/AlprKit.xcframework/$slice/AlprKit.framework"
  [ -d "$framework" ] || { missing+=("$framework"); continue; }
  for model in cct-xs-v2-global-model yolo-v9-t-640-license-plate-end2end; do
    [ -d "$framework/$model.mlmodelc" ] || missing+=("$framework/$model.mlmodelc")
  done
done

dir="android/maven/app/parkr/alpr/$version"
for file in "alpr-$version.aar" "alpr-$version.pom" "alpr-$version.module"; do
  [ -f "$dir/$file" ] || missing+=("$dir/$file")
done
if [ -f "$dir/alpr-$version.aar" ] && ! unzip -l "$dir/alpr-$version.aar" | grep "assets/models/yolo-v9-t-640-license-plate-end2end.tflite" >/dev/null; then
  missing+=("models in $dir/alpr-$version.aar")
fi

extra=$(find ios/AlprKit.xcframework android/maven \( -name '*.dSYM' -o -name '*.private.swiftinterface' -o -name 'maven-metadata.xml*' -o -name '*.md5' -o -name '*.sha1' -o -name '*.sha256' -o -name '*.sha512' \) 2>/dev/null || true)
if [ -n "$extra" ]; then
  echo "react-native-alpr $version: debug symbols, private interfaces or Maven checksums must not be packed:" >&2
  echo "$extra" | sed 's/^/  /' >&2
  exit 1
fi

if [ ${#missing[@]} -gt 0 ]; then
  echo "react-native-alpr $version: the package must bundle the native binaries, but these are missing:" >&2
  printf '  %s\n' "${missing[@]}" >&2
  echo "Run yarn fetch-binaries first." >&2
  exit 1
fi
echo "react-native-alpr $version: bundling AlprKit.xcframework and app.parkr:alpr:$version"
