#!/usr/bin/env bash
# Builds the game in a container with Docker or Podman; no Rust installation needed.
#
#   ./docker-build.sh          on a Mac: the macOS app; elsewhere: the Linux executable
#   ./docker-build.sh macos    "Some Awesome Game.app" in dist/macos/
#   ./docker-build.sh linux    the Linux executable in dist/linux/
#
# Uses Docker when it is running, otherwise Podman. Choose one with
# CONTAINER_ENGINE=podman (or docker). Extra flags for the build command can be given in
# EXTRA_BUILD_FLAGS (for example "--no-cache"). The macOS build also needs Apple's Command Line
# Tools for the macOS SDK: run  xcode-select --install  once.
set -euo pipefail
cd "$(dirname "$0")"

what="${1:-auto}"
if [[ "$what" == "auto" ]]; then
  if [[ "$(uname -s)" == "Darwin" ]]; then what=macos; else what=linux; fi
fi
if [[ "$what" != "macos" && "$what" != "linux" ]]; then
  echo "usage: $0 [macos|linux]" >&2
  exit 2
fi

# ------------------------------------------------------------ container engine
engine="${CONTAINER_ENGINE:-}"
if [[ -z "$engine" ]]; then
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    engine=docker
  elif command -v podman >/dev/null 2>&1; then
    engine=podman
  else
    echo "Neither a running Docker nor Podman was found. Install one of them first." >&2
    exit 1
  fi
fi
if [[ "$engine" == "podman" && "$(uname -s)" == "Darwin" ]]; then
  # On a Mac, Podman runs containers in a Linux virtual machine; make sure it is up.
  if ! podman info >/dev/null 2>&1; then
    echo "Starting the Podman machine..."
    podman machine start >/dev/null 2>&1 || {
      podman machine init && podman machine start
    }
  fi
fi
echo "Container engine: $engine"

# ------------------------------------------------------------ macOS SDK
if [[ "$what" == "macos" ]]; then
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
  # Copy it next to the Dockerfile so every engine can see it (Podman on a Mac only
  # shares your home folder with its virtual machine). Symlinks are kept as they are.
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$sdk/" macos-sdk/
  else
    rm -rf macos-sdk && cp -R "$sdk" macos-sdk
  fi
else
  # The Linux build doesn't use it; keep the folder so the build context is the same.
  mkdir -p macos-sdk
fi

# ------------------------------------------------------------ build and export
image="some-awesome-game-build:$what"
# shellcheck disable=SC2086
$engine build ${EXTRA_BUILD_FLAGS:-} --target "$what-build" -t "$image" .

out="dist/$what"
mkdir -p "$out"
rm -rf "$out/Some Awesome Game.app" "$out/SomeAwesomeGame"
container="$($engine create "$image" /bin/true)"
trap '$engine rm -f "$container" >/dev/null 2>&1 || true' EXIT
$engine cp "$container:/out/." "$out/"

echo
if [[ "$what" == "macos" ]]; then
  # Sign the whole bundle (with your Developer ID if SIGN_IDENTITY is set) and print the
  # details an administrator needs to approve it in tools like ThreatLocker.
  ./tools/sign-macos.sh "$out/Some Awesome Game.app"
  echo
  echo "Done: $out/Some Awesome Game.app  (double-click to play, or drag it to Applications)"
else
  echo "Done: $out/SomeAwesomeGame/some-awesome-game"
fi
