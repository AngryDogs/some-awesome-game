#!/usr/bin/env bash
# Signs "Some Awesome Game.app" on a Mac so macOS and security software (for example
# ThreatLocker, Jamf or Santa) can identify it, and prints what an administrator needs to
# approve it.
#
#   ./tools/sign-macos.sh [path/to/Some Awesome Game.app]
#
# Signing identity:
#   SIGN_IDENTITY="Developer ID Application: Your Name (TEAMID)"
#       Signs with your Apple Developer ID and the hardened runtime. Allowlisting tools can
#       then approve the app by certificate, which keeps working for every new build.
#   NOTARY_PROFILE=<profile>   (optional, with SIGN_IDENTITY)
#       Also notarizes with Apple and staples the ticket. Create the profile once with:
#       xcrun notarytool store-credentials <profile>
#   Neither set: an ad-hoc signature of the whole bundle. This is enough for macOS to run it,
#   but an allowlisting tool can only approve it by file hash, which changes every build.
set -euo pipefail
cd "$(dirname "$0")/.."

APP="${1:-dist/macos/Some Awesome Game.app}"
if [[ ! -d "$APP" ]]; then
  echo "App not found: $APP" >&2
  exit 1
fi
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Signing needs macOS (codesign); skipped." >&2
  exit 0
fi
BIN="$APP/Contents/MacOS/some-awesome-game"

# Anything copied or downloaded can carry extended attributes that break signatures.
xattr -cr "$APP"

if [[ -n "${SIGN_IDENTITY:-}" ]]; then
  echo "Signing with: $SIGN_IDENTITY"
  codesign --force --options runtime --timestamp --sign "$SIGN_IDENTITY" "$BIN"
  codesign --force --options runtime --timestamp --sign "$SIGN_IDENTITY" "$APP"
  if [[ -n "${NOTARY_PROFILE:-}" ]]; then
    zip="$(mktemp -d)/SomeAwesomeGame.zip"
    ditto -c -k --keepParent "$APP" "$zip"
    echo "Notarizing (this can take a few minutes)..."
    xcrun notarytool submit "$zip" --keychain-profile "$NOTARY_PROFILE" --wait
    xcrun stapler staple "$APP"
  fi
else
  echo "No SIGN_IDENTITY set: ad-hoc signature (approval by hash only)."
  codesign --force --sign - "$BIN"
  codesign --force --sign - "$APP"
fi

codesign --verify --strict --verbose=2 "$APP"

echo
echo "---- For your IT / security administrator --------------------------------"
echo "Application:  Some Awesome Game"
echo "Bundle ID:    $(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP/Contents/Info.plist")"
echo "Version:      $(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$APP/Contents/Info.plist")"
echo "Path:         $(cd "$(dirname "$APP")" && pwd)/$(basename "$APP")"
echo "Executable:   Contents/MacOS/some-awesome-game"
echo "SHA-256:      $(shasum -a 256 "$BIN" | cut -d' ' -f1)"
codesign -dv "$APP" 2>&1 | grep -E "^(Authority|TeamIdentifier|Identifier|Signature)" | sed 's/^/Signature:    /'
echo "--------------------------------------------------------------------------"
