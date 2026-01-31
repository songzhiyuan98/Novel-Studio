# API 与事件流规范（API & Events Specification）

本文档定义系统的外部接口与内部事件流。

---

## 一、RESTful API

### 1.1 项目管理

#### 创建项目

```http
POST /projects

Request:
{
  "title": "重返大学，开局成了富二代",
  "genreTags": ["重生", "校园", "创业", "多女主"],
  "preferences": {
    "pacing": "slow_burn",
    "romanceIntensity": 0.3,
    "powerLevel": "realistic"
  },
  "taboo": ["系统面板", "神豪撒钱"]
}

Response:
{
  "id": "proj_001",
  "title": "重返大学，开局成了富二代",
  "createdAt": "2024-01-15T10:00:00Z",
  "status": "created"
}
```

#### 获取项目详情

```http
GET /projects/:id

Response:
{
  "id": "proj_001",
  "title": "重返大学，开局成了富二代",
  "genreTags": ["重生", "校园", "创业", "多女主"],
  "pointers": {
    "currentBibleVersionId": "bible_v3",
    "currentOutlineVersionId": "outline_v2",
    "chapterHead": 5
  },
  "preferences": {...},
  "taboo": [...],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z"
}
```

#### 获取项目列表

```http
GET /projects

Response:
{
  "projects": [
    {
      "id": "proj_001",
      "title": "重返大学，开局成了富二代",
      "chapterHead": 5,
      "updatedAt": "2024-01-20T15:30:00Z"
    }
  ],
  "total": 1
}
```

---

### 1.2 章节管理

#### 获取章节列表（分页）

```http
GET /projects/:id/chapters?cursor=&limit=10

Response:
{
  "chapters": [
    {
      "id": "ch_005",
      "chapterNo": 5,
      "title": "父子摊牌",
      "status": "confirmed",
      "wordCount": 3500,
      "summary": "主角与父亲发生正面冲突...",
      "updatedAt": "2024-01-20T15:30:00Z"
    }
  ],
  "nextCursor": "ch_004",
  "hasMore": true
}
```

#### 获取章节详情

```http
GET /chapters/:id

Response:
{
  "id": "ch_005",
  "projectId": "proj_001",
  "chapterNo": 5,
  "title": "父子摊牌",
  "status": "confirmed",
  "version": "v2",
  "content": {
    "text": "...",
    "wordCount": 3500,
    "summary": "...",
    "sceneCardsRef": ["sc_001", "sc_002", "sc_003"]
  },
  "metadata": {
    "scores": {
      "pacing": 85,
      "hookDensity": 78,
      "overall": 82
    }
  }
}
```

---

### 1.3 聊天与交互

#### 发送消息

```http
POST /chat/:projectId/messages

Request:
{
  "content": "我想让主角在这章展示一下商业头脑，但不要太夸张",
  "type": "user_input"
}

Response: (Stream)
{
  "messageId": "msg_001",
  "type": "producer_thinking",
  "content": "正在解析您的需求..."
}
{
  "messageId": "msg_002",
  "type": "artifact_preview",
  "artifact": {
    "type": "scene_cards",
    "status": "draft",
    "content": [...]
  }
}
{
  "messageId": "msg_003",
  "type": "question",
  "content": "主角的商业展示更偏向哪种风格？",
  "options": [
    {"id": "A", "text": "观察细节发现商机"},
    {"id": "B", "text": "谈判中展示头脑"},
    {"id": "C", "text": "解决实际问题"}
  ]
}
```

#### 回答选择题

```http
POST /chat/:projectId/messages

Request:
{
  "content": "A",
  "type": "option_selection",
  "questionId": "msg_003"
}
```

---

### 1.4 工件操作

#### 获取工件

```http
GET /artifacts/:id

Response:
{
  "id": "bible_v3",
  "projectId": "proj_001",
  "type": "bible",
  "status": "confirmed",
  "version": "v3",
  "content": {...},
  "createdAt": "2024-01-18T12:00:00Z"
}
```

#### 编辑工件

```http
POST /artifacts/:id/edit

Request:
{
  "changes": {
    "path": "content.cast[0].motivation",
    "newValue": "证明自己不是废物"
  }
}

Response:
{
  "id": "bible_v4",
  "status": "draft",
  "version": "v4",
  "parentVersion": "v3"
}
```

#### 重写工件

```http
POST /artifacts/:id/rewrite

Request:
{
  "target": "chapter",
  "scope": "scene_3",
  "instructions": "更爽一点，加强父子冲突的张力"
}

Response:
{
  "taskId": "task_rewrite_001",
  "status": "processing"
}
```

#### 确认工件

```http
POST /artifacts/:id/confirm

Request:
{
  "confirmationType": "full"
}

Response:
{
  "id": "ch_005",
  "status": "confirmed",
  "canonUpdates": [
    "timeline: 新增事件",
    "romanceProgress: female_lead_a +5"
  ]
}
```

#### 查看版本差异

```http
GET /artifacts/:id/diff?to=v2

Response:
{
  "from": "v3",
  "to": "v2",
  "changes": [
    {
      "path": "content.text",
      "type": "modified",
      "before": "...",
      "after": "..."
    }
  ]
}
```

#### 回滚版本

```http
POST /artifacts/:id/rollback

Request:
{
  "targetVersion": "v1"
}

Response:
{
  "newVersionId": "ch_005_v4",
  "status": "draft",
  "message": "已创建回滚版本，内容恢复到 v1"
}
```

---

### 1.5 任务管理（内部）

#### 创建任务

```http
POST /tasks

Request:
{
  "projectId": "proj_001",
  "agentType": "writer",
  "contextPacket": {...},
  "priority": "normal"
}

Response:
{
  "taskId": "task_001",
  "status": "queued",
  "createdAt": "2024-01-20T15:00:00Z"
}
```

#### 任务结果回传

```http
POST /tasks/:id/result

Request:
{
  "status": "success",
  "artifact": {
    "type": "chapter_draft",
    "content": "..."
  },
  "issuePacket": null
}

Response:
{
  "received": true,
  "nextAction": "qa_review"
}
```

---

## 二、内部事件（Event Flow）

系统内部通过事件驱动协作：

### 2.1 事件类型

| 事件 | 触发时机 | 订阅者 |
|------|----------|--------|
| `ArtifactCreated` | 工件创建完成 | Producer, QA |
| `ArtifactConfirmed` | 用户确认工件 | Producer, Timeline, Promises |
| `IssueReported` | Agent 上报问题 | Triage Router |
| `ChapterDraftReady` | 章节草稿完成 | QA Gate |
| `QAGatePassed` | QA 审核通过 | Producer |
| `QAGateFailed` | QA 审核不通过 | Producer, Writer |
| `TaskCreated` | 任务创建 | Agent Runtime |
| `TaskCompleted` | 任务完成 | Producer |
| `UserConfirmRequired` | 需要用户确认 | Frontend |
| `CanonUpdated` | Canon 更新 | All Agents |

### 2.2 事件流示意

```
┌─────────────────────────────────────────────────────────────────┐
│                        Event Bus                                 │
└─────────────────────────────────────────────────────────────────┘
         ▲           ▲           ▲           ▲           ▲
         │           │           │           │           │
    ┌────┴────┐ ┌────┴────┐ ┌────┴────┐ ┌────┴────┐ ┌────┴────┐
    │Producer │ │  Agent  │ │   QA    │ │Timeline │ │Frontend │
    │         │ │ Runtime │ │  Gate   │ │ Service │ │         │
    └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### 2.3 关键事件流程

#### ArtifactConfirmed 事件处理

```
ArtifactConfirmed
        │
        ├──► TimelineService: 更新时间线
        │
        ├──► PromisesService: 更新伏笔表
        │
        ├──► RomanceService: 更新关系进度
        │
        ├──► SummaryService: 生成 "Previously on..." 摘要
        │
        └──► ContinuityService: 检查潜在冲突
```

#### IssueReported 事件处理

```
IssueReported
        │
        ▼
┌───────────────────┐
│  Triage Router    │
└─────────┬─────────┘
          │
    ┌─────┼─────┐
    ▼     ▼     ▼
 Path A  Path B  Path C
 内部处理 询问用户 占位继续
```

#### ChapterDraftReady 事件处理

```
ChapterDraftReady
        │
        ▼
┌───────────────────┐
│     QA Gate       │
│  Editor检查       │
│  Continuity检查   │
└─────────┬─────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
 通过          不通过
    │           │
    ▼           ▼
QAGatePassed  QAGateFailed
    │           │
    ▼           ▼
用户审阅    自动重写/
           询问用户
```

---

## 三、WebSocket 实时通信

### 3.1 连接

```javascript
const ws = new WebSocket('wss://api.novelstudio.com/ws/:projectId');
```

### 3.2 消息类型

#### 服务端 → 客户端

```typescript
interface WSMessage {
  type: 
    | "producer_thinking"    // Producer 正在思考
    | "agent_working"        // Agent 正在工作
    | "artifact_preview"     // 工件预览
    | "artifact_ready"       // 工件完成
    | "question"             // 需要用户回答
    | "issue_alert"          // 问题提醒
    | "progress_update"      // 进度更新
    | "error";               // 错误
  
  payload: unknown;
  timestamp: string;
}
```

#### 客户端 → 服务端

```typescript
interface WSClientMessage {
  type:
    | "user_input"           // 用户输入
    | "option_select"        // 选择答案
    | "confirm"              // 确认
    | "cancel"               // 取消
    | "edit_request";        // 编辑请求
  
  payload: unknown;
}
```

### 3.3 示例对话流

```
Client: { type: "user_input", payload: { content: "开始写第一章" } }
Server: { type: "producer_thinking", payload: { message: "正在规划场景..." } }
Server: { type: "agent_working", payload: { agent: "scene_designer", progress: 30 } }
Server: { type: "agent_working", payload: { agent: "scene_designer", progress: 100 } }
Server: { type: "artifact_preview", payload: { type: "scene_cards", content: [...] } }
Server: { type: "question", payload: { id: "q1", content: "场景卡看起来如何？", options: ["继续写正文", "调整场景", "重新设计"] } }
Client: { type: "option_select", payload: { questionId: "q1", answer: "继续写正文" } }
Server: { type: "agent_working", payload: { agent: "writer", progress: 0 } }
...
Server: { type: "artifact_ready", payload: { type: "chapter_draft", id: "ch_001_v1" } }
```

---

## 四、错误码

| 错误码 | 说明 |
|--------|------|
| `E001` | 项目不存在 |
| `E002` | 工件不存在 |
| `E003` | 无权限操作 |
| `E004` | 状态不允许该操作 |
| `E005` | Agent 执行失败 |
| `E006` | QA 检查未通过 |
| `E007` | Canon 冲突 |
| `E008` | 版本冲突 |
| `E009` | 任务超时 |
| `E010` | 系统繁忙 |

---

## 五、速率限制

| 接口类型 | 限制 |
|----------|------|
| 聊天消息 | 60次/分钟 |
| 工件操作 | 30次/分钟 |
| 任务创建 | 10次/分钟 |
| WebSocket 消息 | 120次/分钟 |

---

## 六、认证

所有 API 请求需要携带认证 Token：

```http
Authorization: Bearer <token>
```

WebSocket 连接时通过 URL 参数传递：

```
wss://api.novelstudio.com/ws/:projectId?token=<token>
```

