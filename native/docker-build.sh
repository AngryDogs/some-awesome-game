#!/usr/bin/env bash
# Builds the game with Docker; no Rust installation needed.
#
#   ./docker-build.sh          on a Mac: the macOS app; elsewhere: the Linux executable
#   ./docker-build.sh macos    "Some Awesome Game.app" in dist/macos/
#   ./docker-build.sh linux    the Linux executable in dist/linux/
#
# Needs Docker (Docker Desktop on a Mac). The macOS build also needs Apple's
# Command Line Tools for the macOS SDK: run  xcode-select --install  once.
set -euo pipefail
cd "$(dirname "$0")"

what="${1:-auto}"
if [[ "$what" == "auto" ]]; then
  if [[ "$(uname -s)" == "Darwin" ]]; then what=macos; else what=linux; fi
fi

case "$what" in
  linux)
    docker buildx build --target linux --output type=local,dest=dist/linux .
    echo
    echo "Done: dist/linux/SomeAwesomeGame/some-awesome-game"
    ;;
  macos)
    sdk="${MACOS_SDK:-}"
    if [[ -z "$sdk" ]] && command -v xcrun >/dev/null 2>&1; then
      sdk="$(xcrun --sdk macosx --show-sdk-path 2>/dev/null || true)"
    fi
    if [[ -z "$sdk" || ! -d "$sdk" ]]; then
      sdk=/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk
    fi
    if [[ ! -d "$sdk" ]]; then
      echo "The macOS SDK was not found. Install Apple's Command Line Tools with:" >&2
      echo "    xcode-select --install" >&2
      echo "then run this script again (or set MACOS_SDK=/path/to/MacOSX.sdk)." >&2
      exit 1
    fi
    sdk="$(cd "$sdk" && pwd -P)"
    echo "Using macOS SDK: $sdk"
    rm -rf "dist/macos/Some Awesome Game.app"
    docker buildx build --build-context macsdk="$sdk" --target macos --output type=local,dest=dist/macos .
    echo
    echo "Done: dist/macos/Some Awesome Game.app  (double-click to play, or drag it to Applications)"
    ;;
  *)
    echo "usage: $0 [macos|linux]" >&2
    exit 2
    ;;
esac
