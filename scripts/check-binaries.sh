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

extra=$(find ios/AlprKit.xcframework \( -name '*.dSYM' -o -name '*.private.swiftinterface' \) 2>/dev/null || true)
if [ -n "$extra" ]; then
  echo "react-native-alpr $version: debug symbols or private interfaces must not be packed:" >&2
  echo "$extra" | sed 's/^/  /' >&2
  exit 1
fi

if [ ${#missing[@]} -gt 0 ]; then
  echo "react-native-alpr $version: the package must bundle AlprKit.xcframework, but these are missing:" >&2
  printf '  %s\n' "${missing[@]}" >&2
  echo "Run yarn fetch-binaries first." >&2
  exit 1
fi
echo "react-native-alpr $version: bundling AlprKit.xcframework"
