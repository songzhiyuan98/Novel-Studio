# Novel Studio — Multi-Agent Writing Room 

> 可交互编剧室式的长篇小说生成系统

Novel Studio 是一个"可交互编剧室"式的小说生成系统：
- 你不需要会写剧情，只需要提供设定/偏好并做判断
- 系统会通过总控（Producer）+ 按需子 Agent 协作完成：灵感发散、世界观落地、人物与关系、结构节点、分镜场景卡、正文生成、编辑与一致性检查

---

## ✨ 核心特性

| 特性 | 说明 |
|------|------|
| **一本书一个 Tab（Project）** | 每个项目拥有独立的章节流、设定圣经、角色卡与时间线 |
| **聊天式交互 + 工件驱动** | 聊天中不仅有对话，还会产出可编辑工件（章节/大纲/设定/角色卡） |
| **章节滚动加载** | 默认只展示最近 N 章，向上滚动加载历史 |
| **可编辑/重写/删除/对比/确认** | 每个章节和工件都有版本与状态机 |
| **Canon Gate（正史闸门）** | 只有用户 Confirm 的内容进入正史（Story Bible） |
| **多 Agent 协作但不污染** | 子 Agent 只读"简报包（Context Packet）"，不读完整聊天历史 |
| **质量闸门（QA Gate）** | 正文发布前必须通过编辑+一致性检查 |

---

## 🎯 设计目标

把"写小说"变成一个可交互的编剧室工作流：

1. **用户不需要会写剧情**，只需要表达偏好 + 做判断 + 确认进入正史
2. **系统能长期连载不崩**：设定一致、人物不崩、节奏不崩、可回滚

---

## 🏛 设计原则（硬规则）

| 原则 | 说明 |
|------|------|
| **Canon Gate** | 正史闸门：只有用户 Confirm 的内容才进入正史 |
| **Context Isolation** | 上下文隔离：子 Agent 永远只看"简报包"，不看完整聊天历史 |
| **Task-on-demand** | 按需子 Agent：除少数常驻角色，大部分 Agent 任务制拉起 |
| **Triage Router** | 分流决策：遇到冲突/缺口，先分流：内部解决 vs 询问用户 vs provisional 占位继续写 |
| **Artifact-first** | 工件驱动：章节、设定、大纲、角色卡都是可编辑工件（Draft/Reviewed/Confirmed/Locked） |
| **Quality Gate** | 质量闸门：正文发布前必须过编辑+一致性检查（至少 Reviewed） |

---

## 🤖 Agent 编制

### 常驻（MVP 必需）

| Agent | 职责 |
|-------|------|
| **Producer（总控）** | 唯一对话窗口；解析需求、派单、汇总、仲裁、版本管理 |
| **Evaluator（评估）** | 判断材料是否足以开写；输出缺口与"最小问题集" |
| **Writer（正文）** | 严格按场景卡写正文；禁止自创世界规则 |
| **QA（Editor + Continuity）** | 节奏/爽点/文风评估 + 设定一致性检查 |

### 按需生成（任务制子 Agent）

| Agent | 职责 |
|-------|------|
| Divergent | 发散方案 A/B/C |
| Worldbuilder | 世界观/修炼体系最小规则集 |
| Plot Architect | 关键节点/反转/节奏曲线 |
| Scene Designer | 场景卡/分镜 |
| Character & Romance | 女主池/关系推进/修罗场 |
| Research | 外部资料调研；禁止改 Canon |

---

## 📂 文档结构

| 文档 | 内容 |
|------|------|
| 📐 [系统架构](docs/architecture.md) | 核心组件、高层架构、前后端设计 |
| 🔄 [工作流阶段](docs/workflow.md) | Phase 0-5 完整工作流程（像真实作者的写作流程） |
| 🤖 [Agent 编制](docs/agents.md) | Agent 职责、能力边界、协作模式 |
| 📜 [协议规范](docs/protocols.md) | 用户↔Producer、Producer↔Agents、上下文包、问题包、决策分流 |
| 🗄 [数据模型](docs/data-models.md) | Project、Artifact、StoryBible、Chapter 等数据结构 |
| 🔌 [API 规范](docs/api-spec.md) | 核心接口与内部事件流 |
| 📈 [结构扩容](docs/structure-expansion.md) | 从短剧情升级为长篇成长线的机制 |
| 📖 [完整示例](docs/example-walkthrough.md) | 用《重返大学》案例演示完整流程 |

---

## 🔄 核心工作流

```
用户自由描述 → Producer 解析 → Evaluator 评估可写性
                    ↓
            材料不足 → 最小问题集（2-3个选择题）
                    ↓
            材料充足 → 派单给子 Agent
                    ↓
    Divergent/Worldbuilder/Plot Architect → 方案/设定/结构
                    ↓
            Scene Designer → 场景卡
                    ↓
            Writer → 章节草稿
                    ↓
            QA Gate → 质量检查
                    ↓
        用户 Confirm → 写入 Canon → 下一轮循环
```

---

## 🗂 目录结构（建议）

```
.
├── apps/
│   ├── web/                  # 前端：Chat + Chapters + Artifacts Panel
│   └── api/                  # 后端：Producer Orchestrator + Task APIs
├── packages/
│   ├── core/                 # 数据模型：Project/Artifact/Bible/IssuePacket/ContextPacket
│   ├── agent-runtime/        # 子 Agent 执行器（按需任务）
│   └── prompts/              # Agent 模板与工单模板
├── docs/
│   ├── architecture.md       # 系统架构
│   ├── workflow.md           # 工作流阶段
│   ├── agents.md             # Agent 编制
│   ├── protocols.md          # 协议规范
│   ├── data-models.md        # 数据模型
│   ├── api-spec.md           # API 规范
│   ├── structure-expansion.md # 结构扩容
│   └── example-walkthrough.md # 完整示例
└── README.md
```

---

## 🛣 Roadmap

### MVP
- Project/Tab + Chat feed
- Chapters timeline（近 N 章分页加载）
- Artifacts（Bible/Outline）可编辑与 Confirm
- Producer + Evaluator + Writer + QA（合体）
- Context Packet + Issue Packet + Triage Router

### v2
- A/B/C 方案卡 + 参数滑条
- Diff / Rollback / Revision 分支
- Reader Persona（弃坑风险评估）
- Research Agent（外部资料调研）

---

## License

MIT
