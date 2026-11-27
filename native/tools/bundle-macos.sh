#!/usr/bin/env bash
# Builds "Some Awesome Game.app" for macOS: a universal binary (Apple silicon + Intel)
# inside a standard app bundle. Run on a Mac with Rust installed (https://rustup.rs):
#   ./tools/bundle-macos.sh            universal app in target/macos/
#   ./tools/bundle-macos.sh --native   only this Mac's architecture (faster)
set -euo pipefail
cd "$(dirname "$0")/.."

APP_NAME="Some Awesome Game"
BIN="some-awesome-game"
VERSION="$(grep -m1 '^version' Cargo.toml | cut -d'"' -f2)"
OUT="target/macos"
export MACOSX_DEPLOYMENT_TARGET=11.0

if [[ "${1:-}" == "--native" ]]; then
  cargo build --release
  BINARY="target/release/$BIN"
else
  rustup target add aarch64-apple-darwin x86_64-apple-darwin
  cargo build --release --target aarch64-apple-darwin
  cargo build --release --target x86_64-apple-darwin
  mkdir -p "$OUT"
  lipo -create -output "$OUT/$BIN" \
    "target/aarch64-apple-darwin/release/$BIN" \
    "target/x86_64-apple-darwin/release/$BIN"
  BINARY="$OUT/$BIN"
fi

APP="$OUT/$APP_NAME.app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$BINARY" "$APP/Contents/MacOS/$BIN"
cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>$APP_NAME</string>
  <key>CFBundleDisplayName</key><string>$APP_NAME</string>
  <key>CFBundleIdentifier</key><string>com.someawesomegame.native</string>
  <key>CFBundleVersion</key><string>$VERSION</string>
  <key>CFBundleShortVersionString</key><string>$VERSION</string>
  <key>CFBundleExecutable</key><string>$BIN</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
  <key>LSApplicationCategoryType</key><string>public.app-category.action-games</string>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST
# Sign it (Developer ID if SIGN_IDENTITY is set, otherwise ad-hoc) and print the details
# an administrator needs to approve it.
./tools/sign-macos.sh "$APP"
echo "Built $APP"
