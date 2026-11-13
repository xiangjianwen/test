# 课时工资 · 安卓版使用指南

「课时工资」安卓版是一个**单文件 H5 应用**（核心功能全部内置于 `index.html`），无需安装即可使用，数据保存在手机本地（localStorage），不上传任何服务器。

## 功能

- **课表**：每周 7 天 × 12 节，点击任意格子设置科目与课时费，支持已有科目快捷选择
- **日历**：按月显示每天工资，含农历、节日、二十四节气；今日高亮
- **记课**：点某天弹出该天课程，点击可切换「计入 / 不计入」工资（如调课、请假）
- **统计**：本月工资总额 + 各科目节数 / 课时费 / 小计，科目数量不限
- **备份**：导出 / 导入 JSON 文本，换手机不丢数据

## 三种使用方式

### 方式一：直接用（最简单）

把 `index.html` 发送到安卓手机（微信 / QQ / 蓝牙均可），用 **Chrome 浏览器**打开即可使用。

> 建议在 Chrome 菜单中选「添加到主屏幕」，之后从桌面图标打开，体验接近原生 App。

### 方式二：部署成 PWA（推荐，可离线）

把整个文件夹放到任意静态服务器（自家 NAS、GitHub Pages、Vercel 等），手机 Chrome 访问后「添加到主屏幕」。已包含 `manifest.webmanifest`、图标和离线缓存（`sw.js`），添加后**无网络也能正常使用**。

### 方式三：打包成独立 APK（可选）

如果需要一个真正独立安装的 APK，使用 [Capacitor](https://capacitorjs.com/)（免费开源）。在装有 Node.js 和 Android Studio 的电脑上执行：

```bash
# 1. 创建工程（先把这个文件夹里的 index.html 等文件放入 www 目录）
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "课时工资" com.example.ksgz --web-dir www

# 2. 把本目录（index.html、manifest、图标等）复制进 www/ 后：
npx cap add android

# 3. 生成 APK（或用 Android Studio 打开 android/ 项目构建 Release 签名包）
cd android
./gradlew assembleDebug
# APK 输出在 android/app/build/outputs/apk/debug/app-debug.apk
```

把生成的 APK 传到手机安装即可。也可以用 Android Studio 的 `Build > Generate Signed Bundle / APK` 制作正式签名包发布。

> 数据说明：APK 版数据保存在应用沙箱内；卸载应用会清空数据，卸载前请先用应用内「导出数据」备份。

## 数据结构（供备份 / 二次开发参考）

- `timetable_v2`：课表，84 个槽位（12 节 × 7 天），每项 `{subject, price}`
- `records_v2`：勾选记录，按月按日存放，未记录的日期默认全部计入
- 与微信小程序优化版（`../课时工资-优化版`）的数据结构完全一致
