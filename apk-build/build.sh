#!/usr/bin/env bash
# 课时工资 APK 构建脚本（无 Gradle，直接用 Android build-tools）
# 依赖：JDK 17+、Android SDK（build-tools 34.0.0 + platforms/android-34）
# 用法：ANDROID_HOME=/opt/android-sdk ./build.sh
set -e

BT=${ANDROID_HOME:?请设置 ANDROID_HOME}/build-tools/34.0.0
AJ=${ANDROID_HOME}/platforms/android-34/android.jar
OUT=${1:-../课时工资-安卓版/课时工资.apk}

rm -rf gen classes dexout res.zip base.apk aligned.apk

# 1. 编译资源并链接（生成 R.java 与基础 APK，内含 assets）
$BT/aapt2 compile --dir res -o res.zip
$BT/aapt2 link -o base.apk -I "$AJ" --manifest AndroidManifest.xml -A assets --java gen res.zip

# 2. 编译 Java
javac -source 8 -target 8 -bootclasspath "$AJ" -d classes \
  gen/com/ksgz/app/R.java java/com/ksgz/app/MainActivity.java

# 3. 转 DEX 并打进 APK
mkdir -p dexout
$BT/d8 --release --min-api 21 --lib "$AJ" --output dexout $(find classes -name '*.class')
(cd dexout && zip -q ../base.apk classes.dex)

# 4. 对齐 + 签名（首次会自动生成调试密钥库）
$BT/zipalign -f 4 base.apk aligned.apk
if [ ! -f debug.keystore ]; then
  keytool -genkeypair -keystore debug.keystore -storepass android -keypass android \
    -alias androiddebugkey -dname "CN=Android Debug,O=Android,C=US" \
    -keyalg RSA -keysize 2048 -validity 10000
fi
$BT/apksigner sign --ks debug.keystore --ks-pass pass:android --key-pass pass:android \
  --out "$OUT" aligned.apk
$BT/apksigner verify "$OUT"
echo "构建完成：$OUT"
