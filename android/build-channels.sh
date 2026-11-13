#!/bin/bash
# 安卓多渠道打包：输出 6 个「已签名」商店渠道包（不依赖加固工具）。
#
# 原理：build.gradle 将 -PAPP_CHANNEL=xxx 注入 Manifest 的 APP_CHANNEL meta-data，
#       App 冷启动读取该值上报 /v1/common/activation（渠道统计口径见后端 WqAppActivation.KNOWN_CHANNELS）。
#
# 用法：
#   ./build-channels.sh                 打全部 6 个商店渠道
#   ./build-channels.sh huawei vivo     只打指定渠道
#
# 产物：app/build/outputs/channels/lccx-<版本号>-<渠道>.apk（release 签名，可直接上架）
set -euo pipefail
cd "$(dirname "$0")"

ALL_CHANNELS="huawei honor xiaomi oppo vivo tencent"
if [ "$#" -gt 0 ]; then
  CHANNELS="$*"
else
  CHANNELS="$ALL_CHANNELS"
fi

# 渠道值白名单校验（与后端一致，防手滑打错包）
for c in $CHANNELS; do
  if ! echo "$ALL_CHANNELS official" | tr ' ' '\n' | grep -qx "$c"; then
    echo "✗ 非法渠道值: $c（合法值: $ALL_CHANNELS / official）" >&2
    exit 1
  fi
done

VERSION_NAME=$(sed -n 's/.*versionName "\(.*\)".*/\1/p' app/build.gradle | head -1)
OUT_DIR="app/build/outputs/channels"
mkdir -p "$OUT_DIR"

echo "== 版本 ${VERSION_NAME}，渠道: ${CHANNELS} =="
for c in $CHANNELS; do
  echo ""
  echo ">>> [$c] assembleRelease ..."
  ./gradlew assembleRelease -PAPP_CHANNEL="$c" -q
  APK="app/build/outputs/apk/release/app-release.apk"
  DEST="$OUT_DIR/lccx-${VERSION_NAME}-${c}.apk"
  cp "$APK" "$DEST"
  echo ">>> [$c] 完成 → $DEST"
done

echo ""
echo "== 全部完成，产物清单 =="
ls -lh "$OUT_DIR" | grep "lccx-${VERSION_NAME}-" || true
echo ""
echo "抽查渠道值：aapt2 dump xmltree <apk> --file AndroidManifest.xml | grep -A1 APP_CHANNEL"
