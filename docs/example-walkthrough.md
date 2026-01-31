# 完整示例流程（Example Walkthrough）

本文档以《重返大学，开局成了富二代》为例，演示系统从用户输入到生成第一章的完整流程。

---

## 输入素材

**标题**：《重返大学，开局成了富二代》

**标签**：日常 / 校园 / 重生 / 无系统 / 多女主 / 慢热 / 非神豪 / 创业

**简介**：男主顾若尘三十岁穷、没女人没钱 → 意外重生到2012年 → 第一目标搞钱补遗憾 → 结果发现自己是富二代 → 基调偏日常慢热、非"撒钱神豪"

---

## 步骤 0：用户创建项目

用户在 UI 中新建 Tab，粘贴标题+标签+简介。

---

## 步骤 1：Producer 解析（Parse）

Producer 收到用户输入后，先做结构化理解：

### 1.1 解析输出

```json
{
  "hard_constraints": {
    "genre": "校园日常 + 重生（回到2012）",
    "power_system": "重生记忆（无系统）",
    "multi_heroine": true,
    "pacing": "慢热",
    "not_tycoon": true,
    "main_driver": "搞钱/创业 + 补遗憾"
  },
  "soft_preferences": {
    "pacing": "慢热但要持续上头（每章有小钩子）",
    "realism": "创业和校园细节要贴近2012（不悬浮）"
  },
  "taboo": [
    "系统面板/签到升级",
    "低幼撒币式神豪",
    "女主纯挂件"
  ],
  "unknowns": [
    "多女主规模：2-3？还是4-6？",
    "创业方向：互联网/电商/校园服务/自媒体/投资？",
    "富二代的真实结构：家里什么产业？父子关系矛盾点？"
  ]
}
```

> 用户会看到一个可折叠的"理解结果"卡片。

---

## 步骤 2：Evaluator 评估可写性

Producer 调用 Evaluator 评估材料是否足够开写：

### 2.1 Coverage Map 输出

```json
{
  "readiness": "threshold_a",
  "can_write": true,
  "coverage": {
    "genre": "✅ 清晰",
    "era": "✅ 2012年",
    "protagonist_goal": "✅ 搞钱补遗憾",
    "core_twist": "✅ 富二代",
    "tone": "✅ 慢热非神豪"
  },
  "gaps": [
    {
      "item": "女主数量上限",
      "impact": "影响后续节奏",
      "urgency": "medium"
    },
    {
      "item": "创业赛道偏好",
      "impact": "影响第一卷主线",
      "urgency": "medium"
    },
    {
      "item": "富二代但不神豪的逻辑",
      "impact": "需要限制/代价机制",
      "urgency": "high"
    }
  ],
  "minimum_questions": [
    {
      "q": "女主规模你倾向：",
      "options": [
        "A: 2-3位慢热精品",
        "B: 4-6位修罗场更热闹"
      ]
    },
    {
      "q": "创业方向更想看：",
      "options": [
        "A: 校园服务/社团商业",
        "B: 互联网产品/APP",
        "C: 电商/渠道",
        "D: 投资/信息差套利（偏现实）"
      ]
    }
  ]
}
```

### 2.2 Producer 发起最小问题集

Producer 向用户展示 2 个选择题：

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  材料已经足够开写！但有几个小问题想确认：                      │
│                                                              │
│  1. 女主规模你倾向：                                         │
│     ○ A: 2-3位慢热精品                                      │
│     ○ B: 4-6位修罗场更热闹                                  │
│                                                              │
│  2. 创业方向更想看：                                         │
│     ○ A: 校园服务/社团商业                                  │
│     ○ B: 互联网产品/APP                                     │
│     ○ C: 电商/渠道                                          │
│     ○ D: 投资/信息差套利                                    │
│                                                              │
│  💡 如果不确定，可以点"按默认继续"                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 用户未回答，系统采用保守默认

假设用户暂时未回答，系统采用默认：
- 女主规模：2-3位（慢热精品）
- 创业方向：校园服务起步 → 逐步互联网化

---

## 步骤 3：Producer 派单（禁止直接写正文）

Producer 创建任务，先做"可写骨架"：

### 3.1 任务清单

| 任务 | Agent | 目的 |
|------|-------|------|
| task_001 | Worldbuilder | 2012校园+富二代限制机制（为什么不神豪） |
| task_002 | Character | 2-3位女主候选 + 相遇事件 + 各自独立目标线 |
| task_003 | Plot Architect | 第一卷关键节点 |
| task_004 | Scene Designer | 第1章场景卡 |

> ⚠️ Writer 暂时不派，这是"不要一上来又灵感又正文导致乱"的关键。

---

## 步骤 4：子 Agent 回报

### 4.1 Worldbuilder 回报：最小规则集（6条）

```json
{
  "artifact_type": "world_rules",
  "status": "draft",
  "content": {
    "rules": [
      {
        "id": "rule_1",
        "rule": "家里有钱 ≠ 主角可支配",
        "detail": "父亲掌控资产，主角名下现金有限"
      },
      {
        "id": "rule_2",
        "rule": "父子关系有矛盾",
        "detail": "父亲对'败家/不务正业'零容忍"
      },
      {
        "id": "rule_3",
        "rule": "资金获取要过关",
        "detail": "创业项目必须'说服父亲/证明能力/阶段拨款'"
      },
      {
        "id": "rule_4",
        "rule": "时代红利存在但信息差有限",
        "detail": "不能无脑买比特币就起飞（要现实阻力）"
      },
      {
        "id": "rule_5",
        "rule": "校园身份是双刃剑",
        "detail": "资源多、人脉多，但也有规章/舆论/同学圈成本"
      },
      {
        "id": "rule_6",
        "rule": "重生记忆有盲区",
        "detail": "记得大趋势，不记得细节；蝴蝶效应会让确定性下降"
      }
    ]
  }
}
```

> ✅ Producer 把它作为 Bible Patch（Draft）放到 Artifacts 面板，等用户 Confirm 才进正史。

---

### 4.2 Character 回报：女主候选

```json
{
  "artifact_type": "character_cards",
  "status": "draft",
  "content": {
    "characters": [
      {
        "id": "female_lead_a",
        "name": "待定",
        "type": "学霸型/学生会资源位",
        "goal": "保研/奖学金/家里压力",
        "meet_event": "主角'想低调'，却被她抓到某件事逻辑不对（重生破绽）",
        "conflict": "她要秩序与确定性，主角要冒险与创业"
      },
      {
        "id": "female_lead_b",
        "name": "待定",
        "type": "文艺/传媒社团",
        "goal": "做作品/出圈/去大城市",
        "meet_event": "主角需要宣传/渠道，她需要'能落地的项目'",
        "conflict": "她讨厌'富二代装穷'，主角讨厌'被标签化'"
      },
      {
        "id": "female_lead_c",
        "name": "待定",
        "type": "校外职场姐姐/创业圈引路人",
        "goal": "把校园生意带向社会化扩张",
        "status": "optional",
        "note": "太早出现会抢节奏 → 标记为 optional"
      }
    ]
  }
}
```

---

### 4.3 Plot Architect 回报：第一卷关键节点

```json
{
  "artifact_type": "arc_beats",
  "status": "draft",
  "content": {
    "volume": 1,
    "beats": [
      {
        "type": "inciting",
        "description": "重生醒来 → 第一反应搞钱 → 发现自己是富二代但钱不在自己手里"
      },
      {
        "type": "cost",
        "description": "尝试快速套利失败/或被父亲否定 → 必须走'证明路线'"
      },
      {
        "type": "mid_twist",
        "description": "主角靠校园项目小成功 → 却触发家族内部/父子矛盾升级"
      },
      {
        "type": "darkest",
        "description": "项目崩盘或被截胡 → 同学误解'富二代玩票'"
      },
      {
        "type": "final",
        "description": "主角用一次关键选择证明不是渣男/不是玩票 → 拿到真正的自主权（但付出关系代价）"
      }
    ]
  }
}
```

---

### 4.4 Scene Designer 回报：第1章场景卡

```json
{
  "artifact_type": "scene_cards",
  "status": "reviewed",
  "content": {
    "chapter": 1,
    "scenes": [
      {
        "order": 1,
        "purpose": "确认重生",
        "conflict": "他意识到自己仍然是穷的惯性思维",
        "location": "宿舍/床上",
        "end_hook": "时代感细节（2012的手机、海报、室友对话）",
        "mood": "恍惚 → 确认 → 兴奋"
      },
      {
        "order": 2,
        "purpose": "搞钱冲动",
        "conflict": "记忆不完整，计划没法直接执行",
        "location": "校园/食堂",
        "end_hook": "列'遗憾清单'但发现很多细节想不起来"
      },
      {
        "order": 3,
        "purpose": "富二代反转揭示",
        "conflict": "他以为能直接拿钱，现实是父亲掌控",
        "location": "家里/书房",
        "end_hook": "父亲的态度暗示有矛盾"
      },
      {
        "order": 4,
        "purpose": "立规矩",
        "conflict": "父亲定下条件（想拿钱必须证明）",
        "location": "家里",
        "end_hook": "有一个期限/赌约"
      },
      {
        "order": 5,
        "purpose": "多线预埋",
        "conflict": "无",
        "location": "校园",
        "end_hook": "主角发现'上一世某个遗憾'的关键人物此刻就在校园里"
      }
    ]
  }
}
```

> QA 已审核：每场景有冲突/目的/钩子 ✅

---

## 步骤 5：Writer 生成第1章

### 5.1 Context Packet

Writer 收到的简报包：

```json
{
  "task_id": "task_write_001",
  "agent_type": "writer",
  "canon_snapshot": {
    "world_rules": [...],
    "power_system": { "type": "重生记忆", "limits": ["记忆有盲区"] }
  },
  "arc_state": {
    "current_volume": 1,
    "current_chapter": 1,
    "current_goal": "证明自己"
  },
  "recent_summary": null,
  "task_brief": {
    "objective": "生成第1章正文",
    "must_include": ["2012时代感", "富二代反转", "父亲条件"],
    "must_avoid": ["系统面板", "神豪撒钱", "女主工具人"],
    "output_format": "chapter_draft"
  },
  "scene_cards": [...],
  "style_guide": {
    "tone": "校园日常、慢热但每章有钩子",
    "pov": "third",
    "tense": "past"
  }
}
```

### 5.2 Writer 输出：Chapter Draft

```json
{
  "artifact_type": "chapter_draft",
  "status": "draft",
  "content": {
    "chapter_no": 1,
    "title": "重生",
    "text": "阳光透过破旧的窗帘缝隙照进来...(省略3500字正文)...那个熟悉又陌生的身影从图书馆门口走过，顾若尘的心跳漏了一拍。",
    "word_count": 3500
  }
}
```

---

## 步骤 6：QA 审核

### 6.1 QA Report

```json
{
  "chapter_id": "ch_001_v1",
  "scores": {
    "pacing": 82,
    "hook_density": 78,
    "style_consistency": 85,
    "setting_consistency": 90,
    "character_consistency": 88,
    "overall": 84
  },
  "issues": [
    {
      "type": "suggestion",
      "severity": "low",
      "location": "场景2",
      "description": "食堂描写可以加更多2012年代感细节",
      "suggestion": "加入当时流行的话题/歌曲/事件"
    }
  ],
  "decision": "pass"
}
```

> ✅ 审核通过，章节状态变为 Reviewed。

---

## 步骤 7：用户确认

用户看到章节草稿，有以下操作选项：

| 操作 | 说明 |
|------|------|
| Edit | 直接编辑某段 |
| Rewrite | 要求重写（可指定方向） |
| Confirm | 确认进入正史 |

假设用户点击 **Confirm**。

---

## 步骤 8：状态更新

用户 Confirm 后，系统自动执行：

```
Chapter 1 Confirmed
        │
        ├──► Chapter 状态: confirmed
        │
        ├──► Bible 更新: 父子资金规则写入 Canon
        │
        ├──► Timeline 更新: "2012年9月，顾若尘重生"
        │
        ├──► Promises 更新: "遗憾人物伏笔已埋"
        │
        └──► Summary 生成: "第1章摘要：顾若尘重生回到2012年大学时期..."
```

---

## 步骤 9：下一轮循环

系统准备好继续生成第2章：

```
Producer 检测: 第1章已确认
        │
        ▼
自动触发: Scene Designer 生成第2章场景卡
        │
        ▼
等待用户指令或自动继续...
```

---

## 流程总结

```
用户输入 → Producer解析 → Evaluator评估 → 最小问题集（可选）
                                              │
                              ┌───────────────┘
                              ▼
                    派单给子Agent（骨架优先）
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
     Worldbuilder       Character          Plot Architect
     (规则集)           (角色卡)            (节点)
           │                  │                  │
           └──────────────────┼──────────────────┘
                              │
                              ▼
                       Scene Designer
                        (场景卡)
                              │
                              ▼
                          Writer
                        (正文草稿)
                              │
                              ▼
                         QA Gate
                              │
                       ┌──────┴──────┐
                       ▼             ▼
                     通过          不通过
                       │             │
                       ▼             ▼
                  用户审阅      局部重写
                       │
                       ▼
                   Confirm
                       │
                       ▼
               状态更新 & Canon写入
                       │
                       ▼
                   下一章循环
```

---

## 关键设计体现

| 设计原则 | 本例中的体现 |
|----------|-------------|
| Canon Gate | 只有用户 Confirm 后规则集和章节才写入正史 |
| Context Isolation | Writer 只收到简报包，不知道完整对话历史 |
| Task-on-demand | Worldbuilder/Character/Plot/Scene 都是任务制拉起 |
| Artifact-first | 规则集/角色卡/节点/场景卡都是可编辑工件 |
| Quality Gate | 正文必须过 QA 审核才能给用户 Confirm |
| Triage Router | 本例无冲突，如有则 Producer 会分流处理 |

