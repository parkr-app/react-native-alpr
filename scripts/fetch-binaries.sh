#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
version=$(node -p "require('./package.json').version")
base="https://alpr.parkr.app"
zip="AlprKit-$version.xcframework.zip"

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

curl -fsSL "$base/sdk/ios/$version/$zip" -o "$work/$zip"
expected=$(curl -fsSL "$base/sdk/ios/$version/$zip.sha256")
actual=$(shasum -a 256 "$work/$zip" | cut -d' ' -f1)
[ "$expected" = "$actual" ] || { echo "Checksum mismatch for $zip" >&2; exit 1; }
rm -rf ios/AlprKit.xcframework
unzip -q "$work/$zip" -d ios/

dir="android/maven/app/parkr/alpr/$version"
rm -rf android/maven
mkdir -p "$dir"
for file in "alpr-$version.aar" "alpr-$version.pom" "alpr-$version.module"; do
  curl -fsSL "$base/maven/app/parkr/alpr/$version/$file" -o "$dir/$file"
done

echo "Fetched AlprKit $version for iOS and Android"
