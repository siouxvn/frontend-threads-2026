## Implementation Steps

### Step 1: Add an Event Definition

**File:** `src/app/yourModule/events.ts`

```typescript
// Create new file if doesn't exist
export const events = {
  CREATE_ITEM_ATTEMPT: 'yourmodule:business:create_attempt',
  CREATE_ITEM_SUCCEEDED: 'yourmodule:business:create_succeeded',
  CREATE_ITEM_FAILED: 'yourmodule:business:create_failed',
};
```

### Step 2: Add Translations

**File:** `src/infrastructure/localize/languages/eventLog.json`

```json
{
  "yourmodule": {
    "create_attempt": {
      "name": "创建项目",
      "description": "用户尝试创建项目 \"{{itemName}}\""
    },
    "create_succeeded": {
      "name": "创建成功",
      "description": "项目 \"{{itemName}}\" 创建成功"
    },
    "create_failed": {
      "name": "创建失败",
      "description": "项目 \"{{itemName}}\" 创建失败"
    }
  }
}
```

> ⚠️ **CRITICAL: Do NOT include `{{error}}` in `_failed` translations!**
>
> The error details are stored and displayed separately by the admin event log UI. Including `{{error}}` in the translation description will result in broken/incorrect display like: `创建患者档案 "test_001" 失败: {{error}}`
>
> ✅ **Correct:** `"description": "项目 \"{{itemName}}\" 创建失败"`  
> ❌ **Wrong:** `"description": "项目 \"{{itemName}}\" 创建失败: {{error}}"`

### Step 3: Implement Event Tracking

Please refer to `references\event-patterns.md` to know common patterns in implementing events
