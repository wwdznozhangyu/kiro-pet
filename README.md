# Kiro Pet 桌宠 🟣

跨平台（Windows / macOS）桌面端 **四六级 / 专八 / 雅思 / 托福** 单词学习桌宠应用。
基于 **Electron + Vite + React + TypeScript**，`electron-builder` 打包出 Windows `.exe` 与 macOS `.dmg/.app`。

**仓库地址**：https://github.com/wwdznozhangyu/kiro-pet
· [在线 Demo](https://wwdznozhangyu.github.io/kiro-pet/)
· [提交 Issue](https://github.com/wwdznozhangyu/kiro-pet/issues)
· [贡献指南](./CONTRIBUTING.md)

> 🌐 **在线 Demo**（浏览器可玩）：<https://wwdznozhangyu.github.io/kiro-pet/>
> 演示萌宠眼睛追踪、眨眼、单词卡片与英美发音。桌面原生能力（透明置顶、托盘、开机自启）请下载应用体验。
> Demo 源码在 [`demo/`](./demo)，由 GitHub Actions 自动部署到 Pages
> （需在仓库 **Settings → Pages** 将 Source 设为 “GitHub Actions”）。

---

## ✨ 功能一览

### 桌宠
- 采用 **Kiro 图标萌宠形象**（紫色渐变 SVG），**透明背景、无边框、始终置顶**。
- **鼠标拖拽移动**：按住拖动桌宠即可移动窗口。
- **眼睛追踪鼠标**：瞳孔随光标方向转动，并会**随机眨眼**。
- 在桌面**可用区域（work area）内随机走动、跳跃**，定时触发眨眼、左右游荡等小动作。
- **双击桌宠** → 手动弹出单词卡片。
- **右键呼出设置菜单**：弹出频率（5 / 10 / 15 / 30 分钟）、词库开关、隐藏/显示桌宠、开机自启、退出。
- **双系统适配**：macOS 下右键菜单改为 **Control + 点击**；置顶层级（`screen-saver` + 全 Space 可见）与透明渲染方式分别为两平台定制。

### 单词卡片
- 默认**每 10 分钟自动弹出**，弹出时桌宠做**举牌 / 蹦跳**动作。
- 内容严格匹配四六级 / 专八 / 雅思 / 托福高频词汇，每张卡片包含：
  - **单词**（大号加粗）
  - **英式 / 美式音标** + 英式 / 美式发音喇叭 🔊（点击即读，使用系统 TTS 自动匹配 en-GB / en-US 语音）
  - **三个中文释义**（按 四六级 → 专八 → 雅思 → 托福 优先级排序，标注词性）
  - **2–3 个同义词**
- 卡片样式：**圆角白色背景 + 浅蓝阴影**；点击任意位置、关闭按钮或按 `Esc` 收起；关闭后桌宠做**点头 / 摇尾巴**反馈。

### 其他
- 内置四六级、专八、雅思、托福**核心词库**（`resources/wordbanks/*.json`）。
- 支持**导入自定义 JSON / CSV 单词文件**（托盘菜单 → 导入自定义单词文件）。
- 低内存占用（单实例 + 两个轻量渲染窗口，典型 RSS < 300MB）。
- 可选**开机自启**（`app.setLoginItemSettings`，Windows 注册表 Run / macOS 登录项）。

---

## 🚀 快速开始

> 需要 Node.js 18+ 与联网环境以安装 Electron 等依赖。

```bash
git clone https://github.com/wwdznozhangyu/kiro-pet.git
cd kiro-pet
npm install          # 安装依赖（需要网络）
npm run dev          # 本地开发（Vite + Electron 热重载）
```

### 类型检查

```bash
npm run typecheck
```

### 运行单元测试（纯逻辑，无需 Electron/GUI）

```bash
npm test             # 词库解析/清洗/CSV/去重/筛选，共 57 项断言
```

### 扩充词库（可一键生成 6000 高频词）

```bash
# 从「按频率排序」的词表生成各考试词库
npm run wordbank:build -- --input <你的词表.csv|json|txt> --count 6000
# 校验现有词库是否符合 schema
npm run wordbank:validate
```

详见 [docs/WORDBANK.md](./docs/WORDBANK.md)。

### 打包安装包

```bash
# Windows（在 Windows 上，或配置好 wine 的环境）
npm run dist:win     # 输出 release/Kiro Pet Setup x.y.z.exe

# macOS（需在 macOS 上执行以生成签名/公证前的产物）
npm run dist:mac     # 输出 release/Kiro Pet-x.y.z.dmg 及 .app
```

> 跨平台打包限制：`.dmg/.app` 必须在 macOS 上构建；`.exe` 建议在 Windows 上构建。
> 产物位于 `release/` 目录（见 `package.json > build.directories.output`）。

---

## 🧩 自定义词库格式

### JSON

```json
[
  {
    "word": "serendipity",
    "ukPhonetic": "ˌserənˈdɪpəti",
    "usPhonetic": "ˌserənˈdɪpəti",
    "meanings": [{ "pos": "n.", "text": "机缘巧合" }],
    "synonyms": ["chance", "luck"],
    "tags": ["TEM8", "TOEFL"]
  }
]
```

- `ukPhonetic` / `usPhonetic`：IPA，不含两侧斜杠。
- `meanings[].pos`：词性缩写（`n. v. vt. vi. adj. adv. prep. conj. pron. num. phr.`）。
- `tags`：`CET4 | CET6 | TEM8 | IELTS | TOEFL`，用于筛选词库。
- `meanings` 最多取前 3 条（按你给定顺序即优先级）。

### CSV

表头（大小写/顺序不敏感）：`word, ukPhonetic, usPhonetic, meanings, synonyms, tags`

- `meanings` 用 `|` 分隔多条，每条 `词性:释义`，如 `adj.:有弹性的|n.:弹性`。
- `synonyms`、`tags` 用 `|` 分隔。

示例见 `resources/samples/`。

---

## 🗂 项目结构

```
kiro-pet/
├── package.json                 # 依赖与 electron-builder（win/mac）配置
├── vite.config.ts               # 双渲染入口：pet / card
├── tsconfig*.json
├── electron/                    # 主进程（Node 侧）
│   ├── main.ts                  # 生命周期、窗口、托盘、右键菜单、定时弹卡、拖拽、漫游、IPC
│   ├── preload.ts               # 安全 contextBridge（window.kiro）
│   ├── windows.ts               # 透明/无边框/置顶窗口工厂
│   ├── platform.ts              # macOS / Windows 差异（置顶层级、透明、开机自启、右键手势）
│   ├── settings.ts              # electron-store 持久化设置
│   ├── wordbank-core.ts         # 纯逻辑：解析/清洗/CSV/池化（可单测）
│   ├── wordbank-core.test.ts    # 57 项单元测试
│   └── wordbank.ts              # Electron 侧封装：内置词库加载 + JSON/CSV 导入
├── scripts/
│   ├── run-tests.sh             # 无依赖测试运行器（transpile 后用 Node 跑 TS）
│   ├── run-node-ts.sh           # 通用 TS 运行器（供 build/validate 复用）
│   ├── build-wordbank.ts        # 词库构建管线：频率表 -> 各考试词库（可扩到 6000）
│   └── validate-wordbank.ts     # 词库 schema 校验（可用于提交前/CI 门禁）
├── docs/
│   └── WORDBANK.md              # 词库构建与扩充指南
├── src/
│   ├── shared/types.ts          # 跨进程共享类型
│   ├── pet/                     # 桌宠渲染：KiroMascot（SVG）、眼睛追踪、动画
│   └── card/                    # 单词卡片渲染：音标、TTS 发音、释义、近义词
└── resources/
    ├── wordbanks/               # 内置 CET4/CET6/TEM8/IELTS/TOEFL 词库 JSON
    └── samples/                 # 自定义导入示例（JSON / CSV）
```

---

## 🎨 图标占位说明

打包需要以下图标（当前仓库未包含二进制图标，请自行放置后再打包）：

- `build/icon.ico`（Windows，256×256 多尺寸）
- `build/icon.icns`（macOS）
- `resources/pet/tray.png`（托盘图标，建议 16×16 / 32×32）；缺失时程序回退为空白托盘图标，不影响运行。

建议用 Kiro 紫色萌宠形象导出。可用 `electron-icon-builder` 从单张 1024×1024 PNG 生成全套图标。

---

## 🤝 参与贡献

本项目采用「分支 + Pull Request」流程，**不直接向 `main` 提交**。详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## ✅ 测试状态

- 核心词库逻辑：**57 / 57 单元测试通过**（`npm test`）。
- 源码类型检查：除 `@types/node`（需 `npm install`）外**零错误**。
- 交互 / 透明窗口 / TTS / 打包产物：需在本机带 GUI 的环境验证。
