# Workplace-TCG PVP/PVE

> 一款以职场为背景的原创TCG卡牌模拟器，灵感来自炉石传说，机制与内容完全原创。

## 🎮 游戏说明

### 核心机制
| 原创术语 | 对应含义 |
|---|---|
| 离职 | 随从死亡 |
| 离职补偿 | 亡语（死亡触发正面效果） |
| 遗留Bug | 死亡触发负面效果 |
| 离职档案 | 弃牌堆 |
| 背锅 | 嘲讽 |
| 甩锅 | 指定护盾 |
| 摸鱼 | 潜行 |
| 嗜睡 | 冻结/沉睡 |
| 紧急支援 | 冲锋（入场立即攻击） |
| 加班 | 费用-1 |
| 绩效考核 | 受伤时成长 |
| 三班倒 | 场上3张IT卡时攻击翻倍 |
| 离职谈话 | 场上3张HR卡时费用翻倍 |
| 职场PUA | 秒杀低品质随从 |
| 灵感/脑暴会 | 特殊资源积累触发奖励 |

### 卡牌品质
`普通` → `罕见` → `精英` → `史诗` → `传说`

## 🚀 本地运行

```bash
# 需要一个静态文件服务器（浏览器安全策略限制直接打开 index.html）
npx serve .
# 或
python -m http.server 8080
```

然后访问 `http://localhost:8080`

## 📦 部署到 GitHub Pages

```bash
# 1. 在 GitHub 新建仓库（如 wudao-tcg）

# 2. 初始化并推送
git init
git add .
git commit -m "feat: initial commit - 无大道职场卡牌对决"
git branch -M main
git remote add origin https://github.com/你的用户名/wudao-tcg.git
git push -u origin main

# 3. 在仓库 Settings → Pages → Source 选择 main 分支 → Save
# 4. 访问 https://你的用户名.github.io/wudao-tcg/
```

## 📁 项目结构

```
simulatorForWUDAO/
├── index.html          # 游戏入口
├── style.css           # 暗色科技风格
├── data/
│   ├── cards.json      # 卡牌数据
│   ├── decks.json      # 预设牌组
│   └── heroes.json     # 英雄数据
└── src/
    ├── main.js         # 游戏入口/初始化
    ├── core/           # 游戏核心逻辑
    ├── systems/        # 功能系统
    ├── ui/             # 界面渲染
    ├── ai/             # 电脑对手
    └── utils/          # 工具函数
```

## ⚖️ 版权声明

本项目游戏架构参考炉石传说设计思路，但所有卡牌内容、机制名称、美术风格均为原创，不包含任何暴雪版权内容。
