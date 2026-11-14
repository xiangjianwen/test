#!/bin/bash
# Manim 持久化环境一键脚本
# 新任务开始时运行: bash /workspace/manim-env/setup.sh
# 环境完好时秒退；环境损坏时自动用本地缓存的安装包重建（约 1-2 分钟）。
set -e

ENV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$ENV_DIR/venv"
MANIM="$VENV/bin/manim"

# ---------- 1. 已就绪则直接退出 ----------
if [ -x "$MANIM" ] && "$MANIM" --version >/dev/null 2>&1; then
    echo "[OK] manim 环境已就绪，无需安装。"
    echo "使用: $MANIM -ql scene.py SceneName"
    exit 0
fi

# ---------- 2. 安装系统依赖（仅重建时需要）----------
echo "[1/3] 安装系统依赖 (apt)..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq python3-venv pkg-config ffmpeg \
    libcairo2-dev libpango1.0-dev \
    libavformat-dev libavcodec-dev libavdevice-dev libavutil-dev \
    libavfilter-dev libswscale-dev libswresample-dev >/dev/null

# ---------- 3. 重建虚拟环境并安装 manim ----------
echo "[2/3] 重建虚拟环境..."
rm -rf "$VENV"
/usr/bin/python3 -m venv "$VENV"
export PATH="$VENV/bin:$PATH"

echo "[3/3] 安装 manim (优先使用本地缓存)..."
# 先装构建工具（manimpango/pycairo 无预编译包，需本机编译）
pip install -q --no-index --find-links "$ENV_DIR/wheelhouse" \
    setuptools wheel meson-python meson ninja cython
# 离线安装；缓存异常时回退在线安装
if ! pip install -q --no-index --find-links "$ENV_DIR/wheelhouse" \
        --no-build-isolation manim; then
    echo "[提示] 本地缓存安装失败，回退在线安装..."
    pip install -q manim
fi

"$MANIM" --version
echo "[完成] manim 环境已就绪。"
echo "使用: $MANIM -ql scene.py SceneName"
