---
description: Create description and acceptance criteria
---

Example reference: `.agent/workflow-examples/create-description-and-ac.md`

Analyze the **Description** and **Cases** sections from the user input only, and ignore all other sections (for example, **Technical requirements**).

Based on this analysis, generate a `spec.md` file in the same folder as the input, following the format shown in the example above.

For any other sections that are not part of requirements (for example, **Technical requirements**), do **not** convert them into Acceptance Criteria. Instead, move their content into a **Notes** section.

The **Description** and **Acceptance Criteria** should focus strictly on functional and business requirements. Do not include low-level technical details such as file paths, color values, or implementation specifics.

If the input references design files or UI visuals, simply state “according to the Figma design” without mentioning detailed design attributes.
