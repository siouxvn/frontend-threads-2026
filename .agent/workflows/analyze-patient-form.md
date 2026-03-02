---
description: Analyze patient form issue
---

## Execution Mode

You are operating in **Analysis & Documentation Mode**.

You are **NOT allowed to modify, rewrite, or fix any code** unless explicitly instructed.

Your task is strictly limited to:

- Analyze
- Reproduce
- Explain
- Document

You must NOT:

- Suggest code changes
- Provide patched code
- Rewrite implementation
- Refactor logic
- Apply fixes

If you believe you have identified a fix, document it under a section titled:

> “Potential Root Cause (No Fix Applied)”

Do NOT implement it.

---

## Task Definition

The user will provide an issue description in Chinese or English.

Your responsibilities:

### 1. Issue Analysis

- Interpret the issue
- Identify affected module(s)
- Clarify expected vs actual behavior
- Define scope

---

### 2. Reproduction Guide (Bilingual UI-Safe Mode)

**Core Principle**

When documenting reproduction steps:

1. Always keep the original Chinese UI labels exactly as displayed.
2. Provide English explanation in parentheses.
3. Never replace Chinese labels with English-only descriptions.
4. If label meaning is unclear, describe UI position instead of guessing.

**Correct Format Example**

Instead of:

> Click “Save”

Use:

> Click “保存” (Save) button at the bottom right of the form.

Instead of:

> Select Gender field

Use:

> In the field labeled “性别” (Gender), select “男” (Male).

You can find the correct Chinese labels in the user input or in the `schema.json` (see details in the **Technical Inspection** section)

**Example format:**

> Step 1 and 2 are the basic step to access patient form in the mocking/testing mode

```
1. Run:
   yarn dev:mock

2. Navigate to:
   http://localhost:8080/research/1/patients/1

3. Click “新增患者” (Add Patient) button on the top-right corner.

4. Fill in:
   - “姓名” (Name)
   - “身份证号” (ID Number)
   - “性别” (Gender)

5. Click “保存” (Save) at the bottom-right.
```

---

### 3. Technical Inspection

Inspect these files:

- `src/app/researchCenter/components/upsertPatient/UpsertPatient.tsx`
- `src/app/researchCenter/components/upsertPatient/hooks/useUpsertPatient.ts`
- `src/assets/schema.json`

Analyze:

- State flow
- Form binding
- Validation logic
- API interaction
- Schema mismatch
- Conditional rendering logic

Only describe behavior. Do not fix.

---

### 4. Required Output Format (Mandatory)

All outputs must follow this structure:

```
# <Issue Title>

## Issue Summary

## Environment

## Reproduction Steps

## Expected Behavior

## Actual Behavior

## Technical Analysis

## Potential Root Cause (No Fix Applied)

## Related Files
```

No additional sections allowed.

---

# File Generation Contract

You MUST generate a markdown file artifact.

### File Naming Convention

```
docs/issues/<kebab-case-issue-title>.md
```

Example:

```
docs/issues/patient-form-validation-not-triggered.md
```

### Rules

- Use kebab-case
- Lowercase only
- No spaces
- No special characters

### Behavior

- If file exists → overwrite
- Always output full markdown content
- Do not output commentary outside markdown file
- Do not embed explanations outside file content

---

# Output Mode

Return ONLY the markdown file content.

No additional explanation.
No reasoning.
No commentary.
No fix.
