# 问筊 (WenJiao)

> **“心怀两端，敬问爻象，掷杯以决。”**
> 
> 一款融合东方传统掷筊文化、现代严格概率数学、宣纸文书美学与纯程序化物理音效的个人随机决断工具。

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20macOS%20%7C%20Windows-blue)](https://github.com/2116657276/WenJiao)

---

## ✨ 核心特色

- 📜 **克制温润的东方复古宣纸风**：以浅木长案（`#E8DDC3`）为托、核心宣纸（`#FAF3DF`）为主体，全站通过轻薄宣纸层叠、极细茶褐色纤维边线、暗朱砂篆印与经典中文字体（宋体/明朝体）构建层级秩序。全站杜绝任何 Emoji。
- ⚖️ **严格的数学概率平衡（公平三圣）**：
  - 单次圣杯概率设定为立方根二分之一：$p = \sqrt[3]{0.5} \approx 79.3701\%$，笑杯与阴杯各约 $10.315\%$。
  - 只有连续三次圣杯方可决策为甲（$P(甲) = p^3 = 50\%$），中途有异即决策为乙（$P(乙) = 50\%$），在保留传统“三圣”庄重仪式感的同时，达成了现代决策严格公平的各半概率。
- 🏮 **传统民俗模式**：保持经典独立掷筊概率（圣杯 50%、笑杯 25%、阴杯 25%），圣杯从甲、阴杯归乙、笑杯意旨未明可继续复掷。
- 🌙 **纯 CSS 3D 新月形几何与物理抛掷**：空间三维透视投影、空中翻滚滞空、三级落案阻尼弹跳衰减及凸弧地面晃动余颤。
- 🪵 **纯 Web Audio 原生算法物理音效**：零外部音频资源依赖，纯原生数学波形（Triangle/Sine 振荡器与带通滤波器）实时合成木质相撞与长案共振发声。
- ⚙️ **案台个性化设置**：
  - **字号大小**：支持 5 阶无级缩放（`90%` ~ `130%`），文字与纸签联动自适应排版。
  - **动效节律**：提供 `悠缓 (1.35x)`、`标准 (1.0x)`、`迅捷 (0.7x)` 三档节奏。
  - **击案音量**：提供 `轻柔`、`适中`、`清亮` 三档实时试听与调节。
  - **数据记忆**：所有设置与选项均自动保存至本地，刷新不丢失。
- 📜 **防误触与流水簿册记录**：支持中途更动模式二次防污染确认、历史投掷簿册流水查阅、一键导出誊录文本。

---

## 🖥️ 桌面应用支持

本项目提供两套极轻量、无任何臃肿运行时的桌面客户端方案：

### 1. 超轻量 macOS 原生版 (~55 KB)
- 基于 Apple Clang 与 macOS 自带的 `Cocoa` / `WebKit.framework` 原生构建。
- 二进制体积仅约 **55 KB**，内存常驻仅 **~25 MB**。
- 窗口锁定为默认宽 820px、最小宽 680px、最大宽 960px，并禁用了系统全屏拉宽，确保宣纸案台排版始终优美。

### 2. Tauri v2 跨平台版 (Windows / macOS)
- 基于 Rust 语言与系统原生 WebView 构建，安装包小巧克制（~9 MB）。
- 支持在 Windows 上生成直接双击运行的独立便携绿色版 `.exe`。
- 本仓库已内置 GitHub Actions 持续集成脚本，推送代码或 Tag 即可自动在云端生成 Windows `.exe`。

---

## 🚀 快速上手与本地运行

### 方式一：直接在浏览器中打开
本应用为纯标准前端编写，无需安装任何 npm 包或复杂构建环境：
- 直接双击打开根目录的 [index.html](index.html) 即可使用。

### 方式二：运行数学引擎单元测试
项目包含完整的数学逻辑与 10,000 次蒙特卡洛收敛性测试：
```bash
# 使用 Node.js 自带的测试运行器（无需额外依赖）
node --test tests/engine.test.js
```

### 方式三：编译 macOS 原生超轻版
```bash
bash desktop/build_app.sh
```
执行后会在根目录生成 `问筊.app` 以及一键运行脚本 `start.command`。

### 方式四：编译 Tauri 桌面客户端
```bash
cd src-tauri
cargo build --release
```
编译成功后，在 `src-tauri/target/release/` 目录下即可获得优化后的可执行文件（在 macOS 上可运行 `bash desktop/build_tauri_app.sh` 包装为 `问筊-Tauri.app`；在 Windows 上直接获取 `wenjiao.exe`）。

---

## 📦 项目结构

```text
WenJiao/
├── index.html               # 核心宣纸流式排版页面
├── css/
│   └── style.css            # 宣纸底色、轻薄纸签层级与 3D 透视舞台样式
├── js/
│   ├── engine.js            # 严格概率数学引擎与防污染状态机
│   ├── audio.js             # 纯 Web Audio 程序化物理音效合成器
│   ├── bwa-3d.js            # 3D 筊杯建模与阻尼弹跳物理动画渲染器
│   └── app.js               # 交互中枢、设置管理与本地簿册持久化
├── tests/
│   └── engine.test.js       # 自动化测试用例（含 10000 次蒙特卡洛期望收敛）
├── desktop/
│   ├── main.m               # macOS 原生 Cocoa / WebKit 宿主源码 (~55KB)
│   ├── build_app.sh         # 原生 App 一键编译脚本
│   └── build_tauri_app.sh   # Tauri macOS App 封装脚本
├── src-tauri/               # Tauri v2 跨平台工程（Rust）
│   ├── Cargo.toml           # Rust 依赖配置
│   ├── tauri.conf.json      # 窗口尺寸与安全配置
│   └── src/main.rs          # Tauri 入口
├── .github/workflows/       # GitHub Actions 自动化云端构建 (Windows .exe & macOS)
│   └── build.yml
├── .gitignore               # 忽略 target 临时产物与缓存
├── LICENSE                  # 非商用开源许可证 (CC BY-NC-SA 4.0)
└── README.md                # 项目详细说明文档
```

---

## 📄 开源许可证

本项目基于 **[CC BY-NC-SA 4.0 (知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议)](LICENSE)** 开源。

- **允许**：个人学习、个人非商业性使用、研究探讨与非商业性分发。
- **禁止**：**严禁任何形式的商业营利用途**，包括但不限于任何形式的付费售卖、转售、商业软件捆绑销售、付费订阅包装牟利等行为。
