# AGENTS.md

## Manim 环境（重要：不要重复安装）

- manim 已持久化安装在 `/workspace/manim-env/`，**禁止执行 pip install manim**。
- 使用前先运行：`bash /workspace/manim-env/setup.sh`（环境完好时秒退，损坏时自动用本地缓存重建）。
- 渲染一律使用完整路径：
  `/workspace/manim-env/venv/bin/manim -ql scene.py SceneName`
- 系统路径里的 `manim` 或全局 pip 查不到属正常现象，以 venv 内的安装为准。
