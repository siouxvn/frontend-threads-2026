---
nav: Frontend
order: 1
---

# Local settings

This section is nothing particularly special. However, since I know that local settings are used frequently across frontend projects, I keep a few code snippets here as a quick reference.

The main goal is to make them easy to copy and reuse when needed, and to revisit them later for refinement, improvement, or deeper exploration of different approaches to handling local settings on the frontend—ranging from simple solutions to more structured and scalable ones.

## Demo

```jsx
import React from 'react';
import { Button, Flex, Switch } from 'antd';
import { useSettings } from 'ft2026/app/settings';

export default () => {
  const { enableSettingOne, setEnableSettingOne } = useSettings();

  return (
    <Flex vertical align="start" gap={16}>
      Try toggling the switch and then refresh the page
      <Switch checked={enableSettingOne} onChange={setEnableSettingOne} />
      <Button
        type="link"
        onClick={() => {
          window.location.reload(true);
        }}
        style={{
          padding: 0,
        }}
      >
        Refresh the page
      </Button>
    </Flex>
  );
};
```
