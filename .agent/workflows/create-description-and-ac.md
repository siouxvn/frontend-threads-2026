---
agent: agent
description: Create description and acceptance criteria
---

## Overview

Generate a `spec.md` file from user input that contains functional requirements following the formats demonstrated in these examples:

- `./examples/description-ac-e2e.md` - For UI/feature requirements
- `./examples/description-ac-apis.md` - For API requirements

## Instructions

### 1. Input Analysis

- Analyze **only** the **Description** and **Cases** sections from the user input
- Ignore all other sections (e.g., **Technical requirements**, implementation details)

### 2. Output Structure

Generate a `spec.md` file in the same folder as the input with the following sections:

#### **Description Section**

- Write a clear, concise 1-2 sentence functional overview
- **Bold important keywords**:
  - Feature names and component names (e.g., **Patient Lists**, **Research Center**)
  - Action verbs (e.g., **migrating**, **implementing**, **enables**)
  - Technical components (e.g., **dashboard APIs**, **lung and nodule-related data**)
  - Key objectives and capabilities
- Focus on business and functional requirements only
- Exclude low-level technical details (file paths, color values, implementation specifics)
- For design references, use "according to the Figma design" without detailed attributes

#### **Acceptance Criteria Section**

##### **Structure and Format**

**CRITICAL FORMATTING RULES:**

1. Each AC must be a **single bullet point** starting with `-` (dash)
2. The entire Given-When-Then statement must be on **ONE LINE** (do not split across multiple lines or create sub-bullets)
3. Number ACs sequentially: **AC1**, **AC2**, etc.
4. Format template: `- **AC# (identifier)**: Given [condition], when [action], then [expected outcome].`

**Example of CORRECT format:**

```
- **AC1 (/gender)**: Given the gender dashboard is requested, when filters (all time, 3/6 months) and scope (all patients/specific researchId) are applied, then it must return a breakdown of **male**, **female**, and **unknown** patients, including both **labels** and **values** in the response.
```

**Example of INCORRECT format (DO NOT USE):**

```
**AC1 (/gender)**
- **Given** a request to the dashboard/gender endpoint
- **When** filtering by all time, 3 months, or 6 months
- **Then** the API returns statistics...
```

##### **For API Requirements** (see `description-ac-apis.md`)

- Create **one AC per API endpoint**
- Keep the entire AC on one line in Given-When-Then format
- Include in each AC:
  - Endpoint name in AC title (e.g., **AC1 (/gender)**)
  - All filters supported (e.g., all time, 3/6 months)
  - All scopes supported (e.g., all patients/specific researchId)
  - Response format requirements
  - Specific data fields returned
- **Bold**: endpoint names, filter types, scope options, data field names, and values

##### **For UI/Feature Requirements** (see `description-ac-e2e.md`)

- Create one AC per distinct user interaction, state, or outcome
- Keep the entire AC on one line in Given-When-Then format
- For complex flows with multiple outcomes (e.g., duplicate handling):
  - Create separate ACs for each outcome/path
  - Maintain logical sequence (AC7, AC8, AC9, AC10 for related scenarios)
- Include exact details:
  - UI element names and their exact text labels (preserve Chinese text like **添加到自定义研究**)
  - Button states (**enabled**, **disabled**)
  - Icon names (e.g., **Copy** icon, **Leading** icon)
  - Modal/dialog structures with Title, Content, and Button labels
  - Success/error message formats with placeholders (e.g., **患者信息添加完成，{count} 条成功新增。**)
- **Bold**:
  - UI element states (enabled, disabled)
  - Button labels and text (especially Chinese UI text)
  - Modal titles and button labels
  - Icon names
  - Data formats and placeholders
- Reference "according to the Figma design" when layout/visual details are mentioned

##### **Multi-AC Flows**

When a single feature has multiple branches or outcomes:

- Create a primary AC describing the trigger/condition
- Create subsequent ACs for each possible outcome
- Maintain clear logical sequence
- Example: AC7 shows duplicate modal, AC8-AC10 show different button outcomes

#### **Notes Section**

- Move any non-functional content here:
  - Migration paths (e.g., `research/dashboard` → `researches/dashboard`)
  - Previously mocked/hard-coded endpoints
  - Implementation-specific details
  - File paths and technical references

### 3. Quality Checklist

- [ ] Description is 1-2 sentences with bolded keywords
- [ ] Each AC is a single bullet point on one line (not split into sub-bullets)
- [ ] Each AC follows Given-When-Then format strictly on one line
- [ ] API ACs: One per endpoint with all filters/scopes/response details
- [ ] UI ACs: Detailed with exact text labels (including Chinese), states, and message formats
- [ ] All critical terms are bolded appropriately
- [ ] Complex flows are broken into multiple sequential ACs
- [ ] Technical details are in Notes section only
- [ ] Each AC is independently testable and verifiable
