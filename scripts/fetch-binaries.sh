#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
version=$(node -p "require('./package.json').version")
repo="parkr-app/alpr-ios"
zip="AlprKit-$version.xcframework.zip"

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

# The zip is a GitHub release asset on alpr-ios; its checksum comes from Package.swift at the
# same tag, which Swift Package Manager also verifies.
curl -fsSL "https://github.com/$repo/releases/download/$version/$zip" -o "$work/$zip"
expected=$(curl -fsSL "https://raw.githubusercontent.com/$repo/$version/Package.swift" | sed -n 's/.*checksum: "\([0-9a-f]*\)".*/\1/p')
actual=$(shasum -a 256 "$work/$zip" | cut -d' ' -f1)
[ -n "$expected" ] && [ "$expected" = "$actual" ] || { echo "Checksum mismatch for $zip" >&2; exit 1; }
rm -rf ios/AlprKit.xcframework
unzip -q "$work/$zip" -d ios/

echo "Fetched AlprKit $version for iOS (Android resolves app.parkr:alpr:$version from Maven Central)"
