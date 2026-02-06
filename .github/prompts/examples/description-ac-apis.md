**Description**

This project involves **migrating** the **dashboard APIs** from the **legacy path** to the **new research dashboard path** and implementing the **full functionality** for previously **mocked or hard-coded statistics**, including **lung and nodule-related data**. The objective is to provide **comprehensive dashboard statistics** that can be filtered by **time and scope**.

**Acceptance Criteria**

- **AC1 (/gender)**: Given the gender dashboard is requested, when filters (all time, 3/6 months) and scope (all patients/specific researchId) are applied, then it must return a breakdown of **male**, **female**, and **unknown** patients, including both **labels** and **values** in the response.
- **AC2 (/surgery-type)**: Given the surgery type dashboard is requested, when filters and scope are applied, then it must return statistics for different surgery types with **dynamic legends**, including both **labels** and **values** in the response.
- **AC3 (/statistics)**: Given the general statistics dashboard is requested, when filters and scope are applied, then it must return the **total number of surgeries** and the **average surgery duration**, including both **labels** and **values**.
- **AC4 (/monthly)**: Given the monthly dashboard is requested, when filters and scope are applied, then it must return the **number of surgeries per month**, with both **labels** and **values** provided.
- **AC5 (/lung)**: Given the lung dashboard is requested, when filters and scope are applied, then it must return the ratio of surgeries across positions (**rul, rml, rll, lul, lll**), including both **labels** and **values**.
- **AC6 (/nodule/left)**: Given the left nodule (ROSE) dashboard is requested, when filters and scope are applied, then it must return ratios for **Not Provided, Nonmalignant, Malignant, Nondiagnostic, and No Biopsy**, including both **labels** and **values**.
- **AC7 (/nodule/right)**: Given the right nodule (r-EBUS) dashboard is requested, when filters and scope are applied, then it must return ratios for **Concentric, Eccentric, Not Provided, and No Image**, including both **labels** and **values**.

**Notes**

- Migration from `research/dashboard` (legacy) to `researches/dashboard` (new).
- Completion of APIs that were previously mocked or hard-coded: `dashboard/nodule/left`, `dashboard/nodule/right`, and `dashboard/lung`.
