#!/bin/bash
# ─────────────────────────────────────────────────────
#  TastyBites APK Builder
#  Run this after installing Android Studio
# ─────────────────────────────────────────────────────

set -e

# Load NVM
NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
nvm use 20 --silent 2>/dev/null || true

# Set Android SDK path (Android Studio default on Mac)
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

echo "☕ Java: $(java -version 2>&1 | head -1)"
echo "📱 Android SDK: $ANDROID_HOME"

# Add Android platform if not already added
if [ ! -d "platforms/android" ]; then
  echo ""
  echo "➕ Adding Android platform..."
  npx cordova platform add android
fi

# Install plugins
echo ""
echo "🔌 Installing plugins..."
npx cordova plugin add cordova-plugin-whitelist 2>/dev/null || true
npx cordova plugin add cordova-plugin-inappbrowser 2>/dev/null || true

# Build debug APK
echo ""
echo "🔨 Building APK..."
npx cordova build android

APK_PATH=$(find platforms/android -name "*.apk" 2>/dev/null | head -1)

echo ""
echo "✅ APK built successfully!"
echo "📦 APK location: $APK_PATH"
echo ""
echo "📲 To install on a connected Android device:"
echo "   adb install $APK_PATH"
