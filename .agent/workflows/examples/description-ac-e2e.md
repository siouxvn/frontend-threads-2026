**Description**

This feature enables **adding patients to customized research** from the **Patient Lists** page in the **Research Center**. Users can select patients from the Default Research's patient list and add them to any previously created Customized Research, with support for handling duplicate patient detection and resolution.

**Acceptance Criteria**

- **AC1**: Given the user is on the patient list of the Default Research, when the page is rendered, then the "Add Research" button displays the text **添加到自定义研究** with a **Copy** icon.
- **AC2**: Given the user is on the patient list of a Customized Research, when the page is rendered, then the "Add Research" button displays the text **从默认研究添加患者** with a **Leading** icon.
- **AC3**: Given no patients are selected in the table, when the user views the "Add Research" button, then the button is **disabled**.
- **AC4**: Given one or more patients are selected in the table, when the user views the "Add Research" button, then the button is **enabled**.
- **AC5**: Given the user is on the Default Research patient list, when the user clicks the "Add Research" button (添加到自定义研究), then a dropdown appears displaying a list of Customized Researches (excluding the Default Research) according to the Figma design.
- **AC6**: Given the user selects a research from the dropdown, when no duplicate patient information is detected, then a success message is displayed in the format: **患者信息添加完成，{count} 条成功新增。**
- **AC7**: Given the user selects a research from the dropdown, when duplicate patient information is detected, then a modal is displayed with:
  - Title: **检测到重复的患者信息**
  - Content: A list of duplicate patients in the format: **以下患者已存在：** followed by patient entries like **张三（123456789KL）**
  - Three buttons: **取消**, **跳过**, **替换** according to the Figma design.
- **AC8**: Given the duplicate detection modal is displayed, when the user clicks **取消**, then the modal is closed without any action.
- **AC9**: Given the duplicate detection modal is displayed, when the user clicks **跳过**, then the operation proceeds, duplicate patients are skipped, and a success message is displayed in the format: **患者信息添加完成，{skipped} 条已跳过，{added} 条成功新增。**
- **AC10**: Given the duplicate detection modal is displayed, when the user clicks **替换**, then the operation proceeds, duplicate patients are replaced, and a success message is displayed in the format: **患者信息添加完成，{replaced} 条已替换，{added} 条成功新增。**
- **AC11**: Given the user is on a Customized Research patient list, when the user clicks the "Add Research" button (从默认研究添加患者), then a modal is displayed with:
  - Title: **添加患者**
  - Content: A patient list table showing patients from the Default Research (with filters but without the "Add Research" and "Create" buttons), allowing user selection.
  - Two buttons: **取消**, **添加**
- **AC12**: Given the "添加患者" modal is displayed, when the user clicks **取消**, then the modal is closed without any action.
- **AC13**: Given the "添加患者" modal is displayed, when the user selects patients and clicks **添加**, then the patients are added with duplicate handling as described in AC6-AC10.
