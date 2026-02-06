# Tasks - Patient List UI Refinement (JHYX-1235)

This document outlines the tasks required to implement the Patient List UI refinements and Privacy Protection feature.

## Task 1: Adjust Layout & Navigation (AC1)

- **Expectation**:
  - Background color updated to `@color-surface-light`.
  - Tab "患者列表" (Patient List) appears before "Dashboard".
  - Page header back button and title are removed (as breadcrumbs are present).
- **Technical Design**:
  - **Navigation**: Modify `src/app/researchCenter/components/researchDashboardLayout/useResearchDashboardNavigationItems.tsx` to swap the order of items in the `navigationItems` array.
  - **Header**: In `src/app/researchCenter/components/researchDashboardLayout/ResearchDashboardLayout.tsx`, remove the `<GoBack />` component rendering.
  - **Styling**: Update `src/app/researchCenter/components/patientList/PatientList.module.less` to set the container background color using the `@color-surface-light` token.
- **How to Test**:
  - Navigate to `http://localhost:8080/research/records/1/patients`.
  - Verify that the "Patient List" tab is the first item.
  - Verify the title/back button is gone and the background color matches the design tokens.

## Task 2: Reposition & Update Action Buttons (AC2)

- **Expectation**:
  - "Add to Custom Research" (添加到自定义研究) and "Create Patient" (创建患者) buttons are moved from the header to the filter area.
  - Icons and labels are updated.
- **Technical Design**:
  - **Layout**: Move button logic from `ResearchDashboardLayout.tsx` to `PatientList.tsx`.
  - **Placement**: Place buttons in a `Flex` or `Row` aligned horizontally with the filter components.
  - **Icon**: Use `AddResearch` (or updated `Copy` icon from `src/ui/icons/copy.tsx`) for the "Add to Custom Research" button.
- **How to Test**:
  - Verify buttons are located next to Search/Filters.
  - Confirm the label change for "Add to Custom Research".

## Task 3: Refine Table Checkboxes & Selection (AC3)

- **Expectation**:
  - Table checkboxes use the custom design from `src/ui/components/checkbox/Checkbox.tsx`.
  - A "Select All" checkbox is added below the table, next to pagination.
- **Technical Design**:
  - **Table Checkbox**: Customize `src/ui/components/selectableTable/SelectableTable.tsx` to use the project's custom `Checkbox` component for row selection.
  - **Select All Footer**: Add a `Flex` container at the bottom of `PatientList.tsx` containing a `Checkbox` labeled "全选" (Select All) that controls the `selectedRowKeys` state.
- **How to Test**:
  - Select individual rows and verify checkbox styling.
  - Click "Select All" at the bottom and verify all rows in the current view are selected.

## Task 4: Update Table Columns & Tooltips (AC4)

- **Expectation**:
  - Edit button uses the `Edit` icon and shows a tooltip.
  - "More" button shows a tooltip.
- **Technical Design**:
  - **Icons**: Update `src/app/researchCenter/components/patientList/usePatientColumns.tsx` to import and use the `Edit` icon from `src/ui/icons`.
  - **Tooltips**:
    - Check for existing `edit` and `more` keys in the `common` namespace of `src/infrastructure/localize/languages/zh-cn.json`.
    - If `common.more` is missing, add it (e.g., `"more": "更多"`).
    - Apply `tooltip={t('common.edit')}` to the Edit button and `tooltip={t('common.more')}` to the More button.
- **How to Test**:
  - Hover over the Edit and More icons in the table and verify the tooltips appear.

## Task 5: Implement Fixed Action Column (AC5)

- **Expectation**: The "Action" column remains visible on the right when the table is scrolled horizontally.
- **Technical Design**:
  - **Table Config**: In `usePatientColumns.tsx`, add `fixed: 'right'` to the action column definition.
  - **Scroll Config**: Ensure `scroll={{ x: 'max-content' }}` is applied to the table.
- **How to Test**:
  - Narrow the browser window until horizontal scrollbars appear.
  - Scroll right and confirm the "Action" column stays pinned.

## Task 6: Implement Robust Filtering with URL Synchronization (AC6)

- **Expectation**:
  - Filters (Doctor, Surgery Type, Date Range) are persisted in the browser's address bar.
  - Refreshing the page preserves all active filter selections.
  - All filter dropdowns include a "Clear" button that removes values from both the UI and the URL.
- **Technical Design**:
  - **URL Synchronization**:
    - Use `useSearch` and `useNavigate` (from `@tanstack/react-router`) in `PatientList.tsx`.
    - Implement `navigateToNewFilter` helper (refer to `src/app/admin/components/behaviorMonitor/EventList.tsx`) to update filters without losing page or sort state.
    - Add a `useEffect` to sync the URL's `filter` string into the Ant Design `Form` instance on mount/update.
  - **Form Controls**:
    - Apply `allowClear` to all `FormSelect` components.
    - Use the `onChange` event of `FormSelect` and `RangePicker` to trigger URL updates immediately.
  - **Mock API Enhancement**:
    - Modify `src/app/researchCenter/apis/mocks/research/getPatients.ts` to support the `bt` (between) operator for the `createdAt` (or `surgeryDate`) field.
    - Ensure the mock correctly parses strings like `createdAt:bt:2023-01-01,2023-12-31`.
  - **Table Integration**:
    - Use `tableUtils.paramsToUrl` (from `src/ui/components/table/utils/tableParamConverter.ts`) in the table's `onChange` to ensure table-level filters/sorting are merged with the form-based filters in the URL.
- **How to Test**:
  - Select a doctor and date range; verify the URL address bar updates.
  - Refresh the page; verify the form selections and table data remain filtered.
  - Click the 'x' icon to clear a filter; verify the URL updates and the specific filter is removed.
  - Run `yarn dev:mock` and verify the mocked response reflects the date range selection.

## Task 7: Implement Privacy Protection Mode (AC7)

- **Expectation**:
  - A custom `Switch` allows toggling "Privacy Protection".
  - When enabled, sensitive fields (Patient ID, Name, Surgery Date, Birth Date, Gender) are censored with `***`.
- **Technical Design**:
  - **Component**: Create a custom `Switch` in `src/ui/components` (wrapping Ant Design Switch).
  - **Styling**:
    - Apply specific color tokens: Use `@color-icon-action_inactive-light` for the enabled state, and `@color-icon-action-light` for the enabled state when hovered or pressed.
    - Implement a focus/pressed outline similar to the project's button style (refer to `src/ui/components/button`).
    - Refer to `specs\JHYX-1235\designs\Switch.png` for layout and visual alignment.
  - **State**: Add `isPrivacyEnabled` state in `PatientList.tsx`.
  - **Censorship**: Pass `isPrivacyEnabled` to `usePatientColumns.tsx`. Wrap the `render` functions for sensitive columns to return `"***"` when `isPrivacyEnabled` is true.
- **How to Test**:
  - Toggle the "Privacy Protection" switch.
  - Confirm sensitive columns show `***` when active and real data when inactive.
