# 数据模型（Data Models）

本文档定义系统核心数据结构。

---

## 一、核心实体关系

```
┌─────────────────────────────────────────────────────────────────┐
│                           Project                                │
│                        （一本书/项目）                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   ┌─────────┐        ┌─────────┐        ┌─────────┐
   │  Story  │        │ Chapters│        │ Outline │
   │  Bible  │        │ 章节集合 │        │  大纲   │
   └─────────┘        └─────────┘        └─────────┘
        │                   │
        │                   │
        ▼                   ▼
   ┌─────────┐        ┌─────────┐
   │Characters│       │ Scenes  │
   │ 角色卡   │        │ 场景卡  │
   └─────────┘        └─────────┘
```

---

## 二、Project（项目）

```typescript
interface Project {
  id: string;
  title: string;
  genreTags: string[];              // ["重生", "校园", "创业", "多女主"]
  createdAt: Date;
  updatedAt: Date;
  
  // 版本指针
  pointers: {
    currentBibleVersionId: string;
    currentOutlineVersionId: string;
    chapterHead: number;            // 最新已确认章节号
  };
  
  // 用户偏好
  preferences: {
    pacing: "slow_burn" | "medium" | "fast";
    romanceIntensity: number;       // 0.0 - 1.0
    powerLevel: "realistic" | "moderate" | "op";
    hookDensity: "low" | "medium" | "high";
  };
  
  // 禁区
  taboo: string[];                  // ["系统面板", "神豪撒钱", ...]
}
```

---

## 三、Artifact（工件基类）

所有可编辑内容都继承自 Artifact：

```typescript
interface Artifact {
  id: string;
  projectId: string;
  type: "bible" | "chapter" | "outline" | "character" | "scene_cards";
  
  // 状态机
  status: "draft" | "reviewed" | "confirmed" | "locked";
  
  // 版本控制
  version: string;                  // "v1", "v2", ...
  parents: string[];                // 父版本ID，用于 diff/回滚
  
  // 元数据
  createdBy: "producer" | "agent" | "user";
  createdAt: Date;
  updatedAt: Date;
  
  // 内容（子类型具体定义）
  content: unknown;
  
  // 附加信息
  metadata?: {
    scores?: Record<string, number>;
    risks?: string[];
    notes?: string[];
  };
}
```

---

## 四、StoryBible（设定圣经）

```typescript
interface StoryBible extends Artifact {
  type: "bible";
  content: {
    // 世界规则
    world: {
      era: string;                  // "2012年"
      setting: string;              // "都市校园"
      rules: WorldRule[];           // 最小规则集
    };
    
    // 能力/金手指系统
    powerSystem: {
      type: string;                 // "重生记忆"
      abilities: string[];
      limits: string[];             // 限制
      costs: string[];              // 代价
      progression: string;          // 成长路径
    };
    
    // 主要角色
    cast: CharacterSeed[];
    
    // 关系进度
    romanceProgress: {
      [characterId: string]: {
        intimacy: number;           // 0-100
        stage: "stranger" | "acquaintance" | "friend" | "close" | "romantic";
        keyMoments: string[];
      };
    };
    
    // 势力/阵营
    factions?: Faction[];
    
    // 时间线
    timeline: TimelineEvent[];
    
    // 伏笔表
    promises: Promise[];
    
    // 风格指南
    styleGuide: {
      tone: string;                 // "轻松日常中带点热血"
      pov: "first" | "third";
      tense: "past" | "present";
      avoidPatterns: string[];      // 避免的写作模式
    };
  };
}

interface WorldRule {
  id: string;
  rule: string;
  impact: string;
  isConfirmed: boolean;
}

interface CharacterSeed {
  id: string;
  name: string;
  role: "protagonist" | "female_lead" | "supporting" | "antagonist";
  motivation: string;               // 动机
  need: string;                     // 需求
  fear: string;                     // 恐惧
  boundary: string;                 // 边界/底线
  secrets?: string[];               // 秘密
}

interface Faction {
  id: string;
  name: string;
  goal: string;
  resources: string[];
  relationship_to_protagonist: "ally" | "neutral" | "enemy";
}

interface TimelineEvent {
  id: string;
  chapter?: number;
  time: string;
  event: string;
  participants: string[];
  isConfirmed: boolean;
}

interface Promise {
  id: string;
  type: "foreshadowing" | "chekhov_gun" | "character_arc" | "plot_thread";
  planted_in: number;               // 埋下伏笔的章节
  description: string;
  expected_payoff?: number;         // 预期回收章节
  status: "planted" | "developing" | "paid_off" | "abandoned";
}
```

---

## 五、Chapter（章节）

```typescript
interface Chapter extends Artifact {
  type: "chapter";
  content: {
    chapterNo: number;
    title: string;
    
    // 场景卡引用
    sceneCardsRef: string[];
    
    // 正文
    text: string;
    wordCount: number;
    
    // 摘要（用于后续章节的 Recent Summary）
    summary: string;
    
    // 关联报告
    continuityReportRef?: string;
    editorNotesRef?: string;
  };
}
```

---

## 六、SceneCard（场景卡）

```typescript
interface SceneCard {
  id: string;
  chapterNo: number;
  order: number;                    // 场景在章节中的顺序
  
  // 场景设计
  purpose: string;                  // 这个场景的目的
  conflict: string;                 // 冲突/张力来源
  characters: string[];             // 出场人物
  location: string;                 // 地点
  
  // 钩子
  endHook?: string;                 // 场景结尾的钩子
  
  // 元数据
  estimatedWords?: number;
  mood?: string;                    // 氛围
  pacing?: "slow" | "medium" | "fast";
  
  // 状态
  status: "draft" | "reviewed" | "confirmed";
}
```

---

## 七、Outline（大纲）

```typescript
interface Outline extends Artifact {
  type: "outline";
  content: {
    // 卷结构
    volumes: Volume[];
    
    // 当前进度
    currentVolume: number;
    currentChapter: number;
  };
}

interface Volume {
  volumeNo: number;
  title: string;
  chapters: number;                 // 预计章节数
  
  // 关键节点
  arcBeats: ArcBeat[];
  
  // 主线目标
  mainGoal: string;
  antagonist: string;
  
  // 状态
  status: "planning" | "writing" | "completed";
}

interface ArcBeat {
  type: "inciting" | "cost" | "mid_twist" | "darkest" | "final";
  chapter?: number;                 // 预计发生章节
  description: string;
  isConfirmed: boolean;
}
```

---

## 八、Context Packet（上下文包）

Producer 派单给 Agent 时生成：

```typescript
interface ContextPacket {
  taskId: string;
  agentType: string;
  
  // 正史快照（只包含相关部分）
  canonSnapshot: {
    worldRules: WorldRule[];
    powerSystem: object;
    relevantCharacters: CharacterSeed[];
    recentFacts: string[];
  };
  
  // 当前状态
  arcState: {
    currentVolume: number;
    currentChapter: number;
    currentGoal: string;
    currentOpponent: string;
    romanceProgress: object;
  };
  
  // 最近摘要
  recentSummary: string;            // 最近 2-3 章摘要
  
  // 任务简报
  taskBrief: {
    objective: string;
    mustInclude: string[];
    mustAvoid: string[];
    outputFormat: string;
  };
  
  // 能力限制
  capabilityLimits: {
    canCreateRules: boolean;
    canModifyCanon: boolean;
    canReferenceFuture: boolean;
  };
}
```

---

## 九、Issue Packet（问题包）

Agent 遇到问题时上报：

```typescript
interface IssuePacket {
  issueType: "conflict" | "missing_info" | "ambiguity" | "feasibility" | "quality";
  severity: "low" | "medium" | "high" | "blocker";
  where: "bible" | "outline" | "chapter" | "scene" | "state";
  
  // 冲突详情
  conflictingItems?: {
    itemA: string;
    itemB: string;
  };
  
  // 影响说明
  impact: string;
  
  // 解决方案
  options: {
    id: string;
    description: string;
    risk: "low" | "medium" | "high";
  }[];
  
  recommended: string;              // 推荐方案 ID
  
  // 是否需要用户介入
  needUser: boolean;
  
  // 用户问题（如果 needUser=true）
  questions?: {
    q: string;
    options: string[];
  }[];
}
```

---

## 十、QA Report（质量报告）

```typescript
interface QAReport {
  id: string;
  chapterId: string;
  
  // 评分
  scores: {
    pacing: number;                 // 节奏 0-100
    hookDensity: number;            // 爽点密度 0-100
    styleConsistency: number;       // 文风一致性 0-100
    settingConsistency: number;     // 设定一致性 0-100
    characterConsistency: number;   // 人物一致性 0-100
    overall: number;                // 综合 0-100
  };
  
  // 问题列表
  issues: {
    type: string;
    severity: "low" | "medium" | "high";
    location: string;               // 问题位置描述
    description: string;
    suggestion: string;
  }[];
  
  // 决定
  decision: "pass" | "revise" | "rewrite";
  
  // 评审时间
  reviewedAt: Date;
}
```

---

## 十一、状态机流转

### Artifact 状态流转

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    ▼                                     │
┌────────┐    ┌──────────┐    ┌───────────┐    ┌────────┐│
│ Draft  │───►│ Reviewed │───►│ Confirmed │───►│ Locked ││
│        │    │          │    │           │    │        ││
└────────┘    └──────────┘    └───────────┘    └────────┘│
    ▲              │                │                     │
    │              │                │                     │
    └──────────────┘                └─────────────────────┘
        打回修改                        创建 Revision
```

### 状态说明

| 状态 | 描述 | 可执行操作 |
|------|------|-----------|
| `draft` | 草稿，可自由修改 | Edit, Rewrite, Delete, Submit for Review |
| `reviewed` | 通过 QA 审核 | Edit, Confirm, Reject |
| `confirmed` | 用户确认，进入 Canon | 只读，Create Revision |
| `locked` | 冻结（核心设定） | 只读 |

---

## 十二、版本控制

```typescript
interface ArtifactVersion {
  artifactId: string;
  version: string;
  parentVersion?: string;
  
  // 变更类型
  changeType: "create" | "edit" | "rewrite" | "revision";
  
  // 变更描述
  changeDescription?: string;
  
  // 快照
  snapshot: object;
  
  createdAt: Date;
  createdBy: string;
}
```

### 回滚流程

```
当前版本 v3 (confirmed)
         │
         │ 用户请求回滚到 v1
         ▼
┌─────────────────────────────┐
│  创建新版本 v4              │
│  内容 = v1 的快照           │
│  parentVersion = v3         │
│  changeType = "revision"    │
│  status = "draft"           │
└─────────────────────────────┘
         │
         ▼
   用户确认后变为 confirmed
```

