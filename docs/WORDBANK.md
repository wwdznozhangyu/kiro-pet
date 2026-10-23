# 词库构建与扩充指南（扩充到 6000 高频词）

本项目提供一套**可规模化的词库构建管线**，让你在本机用一条命令，把一份
「按出现频率排序」的外部词表转换成本应用使用的、经校验去重的词库，目标规模 6000 词。

> 为什么是「管线 + 词表」而不是直接内置 6000 词？
> 高质量词条需要准确的英式/美式音标、按考试优先级排序的释义与同义词。
> 这类数据必须来自可信词源（词频表 + 词典），而不是凭空生成。管线把「可信词源 →
> 规范词库」这一步自动化，既保证规模，又保证质量可追溯。

---

## 一、命令一览

```bash
# 构建：从频率排序词表生成 6000 词的各考试词库
npm run wordbank:build -- --input <你的词表> --count 6000

# 校验：确认 resources/wordbanks 下所有词库符合 schema（可用于提交前/CI 门禁）
npm run wordbank:validate
```

两个脚本都**不依赖 npm 安装 Electron**，用全局 `tsc` 做类型剥离后由 Node 运行
（见 `scripts/run-node-ts.sh`）。

---

## 二、输入词表格式

词表需**按词频从高到低排序**（第 1 行最高频）。支持三种格式：

### 1. `.txt`（最简单：一行一个单词）
```
the
be
of
and
...
```
只有单词时，脚本会生成**占位词条**（音标/释义为空，标记 `needsEnrichment`），
并按频率段自动分配考试标签。适合先跑通规模，之后再补充释义。

### 2. `.json`
- **字符串数组**（按频率排序的纯单词）：等价于 `.txt`。
  ```json
  ["the", "be", "of", "and"]
  ```
- **对象数组**（完整 schema，推荐，数据最全）：
  ```json
  [
    {
      "word": "abandon",
      "ukPhonetic": "əˈbændən",
      "usPhonetic": "əˈbændən",
      "meanings": [{ "pos": "vt.", "text": "放弃；抛弃" }],
      "synonyms": ["desert", "forsake"],
      "tags": ["CET4", "CET6"]
    }
  ]
  ```

### 3. `.csv`
表头：`word,ukPhonetic,usPhonetic,meanings,synonyms,tags`
- `meanings`：`词性:释义`，多条用 `|` 分隔，如 `vt.:放弃|n.:放纵`
- `synonyms`、`tags`：用 `|` 分隔

---

## 三、参数

| 参数 | 说明 | 默认 |
|---|---|---|
| `--input <path>` | 词表路径（必填） | — |
| `--count <n>` | 目标词数，取频率最高的前 n 个 | `6000` |
| `--out <dir>` | 输出目录 | `resources/wordbanks` |
| `--merged <file>` | 额外输出一个合并大文件 | 不输出 |
| `--dry-run` | 只校验与报告，不写文件 | 关 |
| `--require-rich` | 若有词条缺音标/需补充则报错退出（质量门禁） | 关 |

### 考试标签的自动分配（当词表未自带 tags 时）
按词频排名分段（越高频覆盖的考试越多）：

| 频率段（百分位） | 分配标签 |
|---|---|
| 0–30% | CET4, CET6, IELTS, TOEFL |
| 30–50% | CET6, IELTS, TOEFL |
| 50–70% | IELTS, TOEFL, TEM8 |
| 70–85% | TOEFL, TEM8 |
| 85–100% | TEM8 |

> 如果你的词表自带 `tags`（JSON/CSV 对象形式），脚本会**优先使用你的标签**，不做覆盖。

---

## 四、一键生成 6000 词的推荐流程

1. 准备一份 6000 词的频率排序词表。可信来源示例：
   - 通用高频：COCA / BNC 前 6000 词频表
   - 考试词表：四六级/雅思/托福官方或权威词表（最好自带 tags 与释义）
2. 放到仓库里（如 `resources/sources/top6000.csv`）或任意路径。
3. 运行：
   ```bash
   npm run wordbank:build -- --input resources/sources/top6000.csv --count 6000
   ```
4. 看「Quality report」确认 `needs enrichment` / `missing IPA` 为 0（若用的是富数据源）。
5. 校验并跑测试：
   ```bash
   npm run wordbank:validate
   npm test
   ```
6. 启动验证：`npm run dev`，双击桌宠看卡片内容。

> 若只有纯单词表（`.txt`），先跑通 6000 规模，占位词条会被标记；
> 之后可用词典数据源或脚本把音标/释义/同义词逐步补齐，再 `--require-rich` 做门禁。

---

## 五、内置种子词库

`resources/wordbanks/*.json` 内置了一批**人工核对**的高频词条，开箱即用。
当你用本管线重建时，这些文件会被覆盖为新生成的结果——如需保留，先备份或指定不同的 `--out`。

示例词源文件见 `resources/samples/`：
- `frequency-list.sample.txt`
- `custom-words.sample.json`
- `custom-words.sample.csv`
