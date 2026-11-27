# syntax=docker/dockerfile:1.7
#
# Builds the game inside Docker, so you don't need Rust on your computer.
# Use ./docker-build.sh, which runs the right command for you. By hand:
#
#   Linux executable:
#     docker buildx build --target linux --output type=local,dest=dist/linux .
#
#   macOS app (universal: Apple silicon + Intel). It needs Apple's macOS SDK, which
#   can't be shipped in an image. Pass the one from your Mac's Command Line Tools
#   (install them with: xcode-select --install):
#     docker buildx build --build-context macsdk="$(xcrun --sdk macosx --show-sdk-path)" \
#       --target macos --output type=local,dest=dist/macos .

FROM rust:1-trixie AS toolchain
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       clang lld llvm libclang-dev pkg-config \
       libasound2-dev libudev-dev libwayland-dev libxkbcommon-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY assets ./assets
COPY README.md ./

# ---------------------------------------------------------------- Linux

FROM toolchain AS linux-build
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/src/target,id=sag-linux-target \
    cargo build --release --locked \
    && mkdir -p /out/SomeAwesomeGame \
    && cp target/release/some-awesome-game README.md assets/sounds/CREDITS.txt /out/SomeAwesomeGame/

FROM scratch AS linux
COPY --from=linux-build /out/ /

# ---------------------------------------------------------------- macOS

FROM toolchain AS macos-build
RUN rustup target add aarch64-apple-darwin x86_64-apple-darwin
# Apple's SDK, provided at build time with --build-context macsdk=<path to MacOSX.sdk>.
COPY --from=macsdk . /sdk
# Cross compilers: clang targeting macOS, with LLVM's Mach-O linker. On Apple silicon,
# ld64.lld also adds the ad-hoc code signature that arm64 Macs require.
RUN LD64="$(ls /usr/lib/llvm-*/bin/ld64.lld | sort -V | tail -1)" \
    && for arch in aarch64:arm64 x86_64:x86_64; do \
         rust="${arch%%:*}"; apple="${arch##*:}"; \
         printf '#!/bin/sh\nexec clang --target=%s-apple-macos11 -isysroot /sdk --ld-path=%s -Wno-unused-command-line-argument "$@"\n' \
           "$apple" "$LD64" > "/usr/local/bin/macos-cc-$rust"; \
         chmod +x "/usr/local/bin/macos-cc-$rust"; \
       done
ENV SDKROOT=/sdk \
    COREAUDIO_SDK_PATH=/sdk \
    MACOSX_DEPLOYMENT_TARGET=11.0 \
    CARGO_TARGET_AARCH64_APPLE_DARWIN_LINKER=/usr/local/bin/macos-cc-aarch64 \
    CARGO_TARGET_X86_64_APPLE_DARWIN_LINKER=/usr/local/bin/macos-cc-x86_64 \
    CC_aarch64_apple_darwin=/usr/local/bin/macos-cc-aarch64 \
    CC_x86_64_apple_darwin=/usr/local/bin/macos-cc-x86_64 \
    AR_aarch64_apple_darwin=llvm-ar \
    AR_x86_64_apple_darwin=llvm-ar \
    CARGO_PROFILE_RELEASE_STRIP=false
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/src/target,id=sag-macos-target \
    cargo build --release --locked --target aarch64-apple-darwin \
    && cargo build --release --locked --target x86_64-apple-darwin \
    && APP="/out/Some Awesome Game.app" \
    && mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources" \
    && "$(ls /usr/lib/llvm-*/bin/llvm-lipo | sort -V | tail -1)" -create \
         -output "$APP/Contents/MacOS/some-awesome-game" \
         target/aarch64-apple-darwin/release/some-awesome-game \
         target/x86_64-apple-darwin/release/some-awesome-game \
    && VERSION="$(grep -m1 '^version' Cargo.toml | cut -d'"' -f2)" \
    && printf '%s\n' \
       '<?xml version="1.0" encoding="UTF-8"?>' \
       '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">' \
       '<plist version="1.0"><dict>' \
       '  <key>CFBundleName</key><string>Some Awesome Game</string>' \
       '  <key>CFBundleDisplayName</key><string>Some Awesome Game</string>' \
       '  <key>CFBundleIdentifier</key><string>com.someawesomegame.native</string>' \
       "  <key>CFBundleVersion</key><string>$VERSION</string>" \
       "  <key>CFBundleShortVersionString</key><string>$VERSION</string>" \
       '  <key>CFBundleExecutable</key><string>some-awesome-game</string>' \
       '  <key>CFBundlePackageType</key><string>APPL</string>' \
       '  <key>LSMinimumSystemVersion</key><string>11.0</string>' \
       '  <key>NSHighResolutionCapable</key><true/>' \
       '</dict></plist>' > "$APP/Contents/Info.plist" \
    && cp assets/sounds/CREDITS.txt /out/

FROM scratch AS macos
COPY --from=macos-build /out/ /
