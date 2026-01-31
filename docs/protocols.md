# 协议规范（Protocols Specification）

本文档定义系统内各组件间的通信协议。

---

## 一、用户 ↔ Producer 交互协议

### 1.1 用户输入形态

用户输入分为两类，系统都需要支持：

| 类型 | 说明 | 示例 |
|------|------|------|
| 自由表达 | 随便说想法/吐槽/偏好/反感 | "我想写个重生到2012年搞钱的故事" |
| 选择与调参 | 从 A/B/C 方案卡中选择，或调整滑条/开关 | 选择方案A，甜度调到0.3 |

### 1.2 Producer 响应流程

Producer 每次收到用户消息，内部执行：

```
┌─────────────────────────────────────────────────────────────┐
│                    Producer 响应流程                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Parse（解析）                                            │
│     ├── Hard constraints（必须遵守）                         │
│     ├── Soft preferences（尽量满足）                         │
│     ├── Do-not / Taboo（绝不出现）                          │
│     └── Unknowns（未知项）                                   │
│              │                                               │
│              ▼                                               │
│  2. Evaluate（调用 Evaluator）                               │
│     └── 材料是否达到"可写阈值"？                              │
│              │                                               │
│              ▼                                               │
│  3. Decide Next（决定下一步）                                │
│     ├── 不足 → 问最少问题（2-3 个选项）                       │
│     └── 足够 → 派单（创建任务）                               │
│              │                                               │
│              ▼                                               │
│  4. Synthesize（汇总）                                       │
│     └── 把后台产出汇总成用户能判断的内容                       │
│         （方案卡/场景卡/章节草稿/风险提示）                    │
│              │                                               │
│              ▼                                               │
│  5. Confirm Handling（确认处理）                             │
│     └── 当用户 Confirm 时，写入 Canon 并更新下游状态           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 "最少问题"规则（防烦）

| 规则 | 说明 |
|------|------|
| 数量限制 | 一轮最多问 2-3 个问题 |
| 形式优先 | 尽量是 A/B/C 或滑条 |
| 可跳过 | 用户可答"我不知道，你按保守默认"，系统继续推进 |

---

## 二、Producer ↔ Agents 协作协议

### 2.1 Context Packet（简报包）

Producer 派单时，必须生成 Context Packet：

```json
{
  "task_id": "task_001",
  "agent_type": "writer",
  "canon_snapshot": {
    "world_rules": [...],
    "power_system": {...},
    "confirmed_facts": [...]
  },
  "arc_state": {
    "current_volume": 1,
    "current_chapter": 5,
    "current_goal": "证明自己不是富二代废物",
    "current_opponent": "父亲的不信任",
    "romance_progress": {...}
  },
  "recent_summary": "第3章：主角在社团招新中展示了商业头脑...\n第4章：父亲发现后提出质疑...",
  "task_brief": {
    "objective": "生成第5章正文",
    "must_include": ["父子冲突升级", "女主A出现"],
    "must_avoid": ["神豪撒钱", "系统面板"],
    "output_format": "chapter_draft"
  },
  "capability_limits": {
    "can_create_rules": false,
    "can_modify_canon": false,
    "can_reference_future": false
  }
}
```

**核心原则**：子 Agent 永远不读整段聊天历史，防止"灵感污染"。

### 2.2 Agent 响应格式

#### 正常情况：返回 Artifact

```json
{
  "task_id": "task_001",
  "status": "success",
  "artifact": {
    "type": "chapter_draft",
    "content": "...",
    "metadata": {
      "word_count": 3500,
      "scene_count": 4
    }
  }
}
```

#### 遇到问题：附带 Issue Packet

```json
{
  "task_id": "task_001",
  "status": "blocked",
  "artifact": null,
  "issue_packet": {
    "issue_type": "conflict",
    "severity": "high",
    "where": "Bible",
    "conflicting_items": {
      "item_a": "父亲掌控所有资金",
      "item_b": "主角需要10万启动资金"
    },
    "impact": "无法推进创业线",
    "options": [
      {
        "id": "A",
        "description": "父亲给予小额测试资金（5万）",
        "risk": "low"
      },
      {
        "id": "B", 
        "description": "主角通过其他渠道借款",
        "risk": "medium"
      }
    ],
    "recommended": "A",
    "need_user": true,
    "questions": [
      {
        "q": "主角第一笔资金来源偏好？",
        "options": ["父亲小额资助", "自己借款", "找投资人"]
      }
    ]
  }
}
```

---

## 三、Issue Packet 规范

### 3.1 字段定义

| 字段 | 类型 | 说明 |
|------|------|------|
| `issue_type` | enum | conflict / missing_info / ambiguity / feasibility / quality |
| `severity` | enum | low / medium / high / blocker |
| `where` | enum | Bible / Outline / Chapter / Scene / State |
| `conflicting_items` | object | 冲突点 A vs B（当 issue_type=conflict） |
| `impact` | string | 不解决会导致什么 |
| `options` | array | 2-4 个解决方案（各自风险） |
| `recommended` | string | 推荐方案 ID |
| `need_user` | boolean | 是否必须询问用户 |
| `questions` | array | 若 need_user=true，提供最小问题集（2-3 个选项题） |

### 3.2 Issue 类型说明

| 类型 | 说明 | 示例 |
|------|------|------|
| `conflict` | 设定/剧情冲突 | 父亲说没钱，但主角需要钱创业 |
| `missing_info` | 缺少必要信息 | 女主B的职业未定义 |
| `ambiguity` | 存在歧义 | "慢热"具体指多慢？ |
| `feasibility` | 可行性问题 | 2012年做短视频不现实 |
| `quality` | 质量问题 | 章节节奏过慢 |

### 3.3 严重程度说明

| 级别 | 说明 | 处理方式 |
|------|------|----------|
| `low` | 小问题，不影响继续 | 可稍后处理 |
| `medium` | 中等问题，建议尽快处理 | 本章内解决 |
| `high` | 严重问题，必须解决 | 阻断当前任务 |
| `blocker` | 致命问题，无法继续 | 必须用户介入 |

---

## 四、Triage Router（决策分流）

Producer 收到 Issue Packet 后，走 Triage Router 决定处理路径：

### 4.1 三条路径

```
                    Issue Packet 到达
                           │
                           ▼
              ┌────────────────────────┐
              │     Triage Router      │
              └───────────┬────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │ Path A  │     │ Path B  │     │ Path C  │
    │ 内部处理 │     │ 询问用户 │     │ 占位继续 │
    └─────────┘     └─────────┘     └─────────┘
```

### 4.2 Path A：Producer 内部处理

**适用条件**（满足任一）：
- 冲突发生在 Draft（未 Confirm）
- 不修改 Canon，只是表达/节奏/桥段/补动机
- 有安全默认解，不涉及审美偏好
- 技术性补齐（补过渡、补相遇、补代价呈现）

**动作**：
1. Producer 选择 recommended
2. 立即派单重写/修补
3. 最多给用户一句"已修复 X 问题"（可折叠）

### 4.3 Path B：必须询问用户

**触发条件**（命中任一必须问）：
- 修改 Confirmed Canon（设定圣经/已确认章节事实）
- 触及硬约束/禁区（后宫雷点、尺度、文风）
- 审美取舍（更爽 vs 更慢热；更宏大 vs 更日常）
- 范围爆炸（宇宙流主打体验不明确）

**动作**：
1. Producer 把问题翻译成 2-3 个选项题问用户
2. 用户确认后更新 Canon/偏好
3. 再继续派单

### 4.4 Path C：Provisional 占位继续推进

**适用条件**：
- "现在不定也能写"的事
- L2 终局宇宙规则没定，但 L0 规则够写
- 女主细节未定但不影响当前章冲突

**动作**：
1. 标记为 `provisional`（不可写入 Canon）
2. Writer 禁止引用未确认细节
3. 同时挂"确认点卡片"让用户稍后选
4. 一旦确认再写入 Canon

### 4.5 铁律

> **凡涉及 Canon 改动或审美取舍 → 必问用户；否则 Producer 内部解决。**

---

## 五、状态写入规则

| 数据类型 | 写入权限 | 说明 |
|----------|----------|------|
| Canon | Producer ONLY | 正史数据，只有用户 Confirm 后 Producer 才能写入 |
| StoryBible | Producer ONLY | 设定圣经 |
| Outline | Producer ONLY | 大纲 |
| Characters | Producer ONLY | 角色卡 |
| Chapters | Producer ONLY | 章节 |
| Timeline | Producer ONLY | 时间线 |
| Promises | Producer ONLY | 伏笔表 |

**Agents 永远只读，不写。**

---

## 六、变更机制（Change Request & Patch）

### 6.1 用户提出修改时的流程

```
用户提出修改
      │
      ▼
┌─────────────────┐
│ Producer 解析    │
│ 变更内容         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  影响分析        │
│  范围评估        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 派发 Patch Agent│
│ 生成补丁         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   QA 校验        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 用户确认         │
│（如涉及 Canon）  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Producer        │
│ 更新状态         │
└─────────────────┘
```

### 6.2 Patch 结构

```json
{
  "patch_id": "patch_001",
  "patch_type": "character_patch",
  "target": "female_lead_a",
  "before": {
    "occupation": "学生会主席",
    "goal": "保研"
  },
  "after": {
    "occupation": "学生会副主席",
    "goal": "出国留学"
  },
  "impact_range": "chapters 3-10",
  "affected_artifacts": ["chapter_5", "chapter_7", "outline_v2"],
  "risk": "需要重写部分对话",
  "requires_confirmation": true
}
```

---

## 七、协作节奏（完整循环）

```
1. 世界回合运行
         │
         ▼
2. 事件池生成
         │
         ▼
3. Producer 选取事件
         │
         ▼
4. Scene Designer 构建场景
         │
         ▼
5. Writer 写章节
         │
         ▼
6. QA 检查
         │
   ┌─────┴─────┐
   ▼           ▼
 通过        不通过
   │           │
   │           ▼
   │        局部重写
   │           │
   └─────┬─────┘
         │
         ▼
7. 用户确认
         │
         ▼
8. 状态更新
         │
         ▼
9. 下一轮循环
```

