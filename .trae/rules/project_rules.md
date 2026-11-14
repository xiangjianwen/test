# 项目规则

## Manim 环境（重要：不要重复安装）

- manim 已持久化安装在 `/workspace/manim-env/`，**禁止执行 pip install manim**。
- 使用前先运行：`bash /workspace/manim-env/setup.sh`
  - 环境完好时秒级退出；
  - 环境损坏时自动用本地缓存的安装包重建（约 1-2 分钟），无需联网下载 pip 包。
- 渲染一律使用完整路径：
  `/workspace/manim-env/venv/bin/manim -ql scene.py SceneName`
- 直接敲 `manim` 或 `pip show manim` 查不到是正常现象，以 venv 内的安装为准。
