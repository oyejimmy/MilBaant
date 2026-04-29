# Requirements Document

## Introduction

This document defines the requirements for a comprehensive structural refactor of the MilBaant frontend codebase — a React + TypeScript + Vite + Ant Design v6 application. The refactor targets four areas: removal of redundant CSS overrides in the global styles layer, cleanup of the base CSS file, extraction of repeated inline patterns into reusable components, and elimination of dead code (unused imports, commented-out blocks, unused state) across all source files.

No new features are introduced, no APIs change, and no business logic is altered. The application must be functionally and visually identical before and after the refactor.

## Glossary

- **GlobalStyles**: The styled-component defined in `src/styles/global-styles.ts` that injects global CSS rules into the document at runtime.
- **index.css**: The base CSS file at `src/index.css` that provides font imports, CSS variable imports, box-sizing reset, and mobile touch rules.
- **theme.ts**: The file at `src/styles/theme.ts` that exports `createAntTheme`, which configures all Ant Design component design tokens via `ConfigProvider`.
- **theme-variables.css**: The file at `src/styles/theme-variables.css` that defines all CSS custom properties (CSS variables) for the application.
- **ConfigProvider**: The Ant Design component that applies design tokens to all child Ant Design components.
- **Design Token**: A named value passed to Ant Design's `ConfigProvider` that controls the visual appearance of a component (e.g., `Input.colorBorder`).
- **Redundant CSS Rule**: A CSS rule in `GlobalStyles` or `index.css` that sets a property already controlled by an equivalent design token in `theme.ts`.
- **Structural CSS Rule**: A CSS rule that controls layout, spacing, or border removal (not color, not shadow) and has no equivalent design token.
- **Dead Code**: Unused import statements, commented-out code blocks, and unused `useState` hooks in TypeScript/TSX source files.
- **SummaryStat**: The existing reusable component at `src/components/SummaryStat.tsx` that renders a labelled stat card with an icon.
- **Refactoring_Tool**: The automated process (this spec) that applies all changes described in this document.
- **Source_File**: Any `.ts` or `.tsx` file under `src/`.

---

## Requirements

### Requirement 1: Remove Redundant Ant Design Form Component CSS Overrides from GlobalStyles

**User Story:** As a developer, I want all redundant CSS overrides for Ant Design form components removed from GlobalStyles, so that the styling system has a single source of truth in `theme.ts` and there are no conflicting rules.

#### Acceptance Criteria

1. WHEN `global-styles.ts` is refactored, THE Refactoring_Tool SHALL remove all CSS rules that target `.ant-input`, `.ant-input-affix-wrapper`, or `.ant-input-number` selectors for the properties `border`, `border-color`, `box-shadow`, `color`, or `background`.
2. WHEN `global-styles.ts` is refactored, THE Refactoring_Tool SHALL remove all CSS rules that target `.ant-select-selector` or `.ant-select-focused` selectors for the properties `border`, `border-color`, or `box-shadow`.
3. WHEN `global-styles.ts` is refactored, THE Refactoring_Tool SHALL remove all CSS rules that target `.ant-picker` or `.ant-picker-focused` selectors for the properties `border`, `border-color`, or `box-shadow`.
4. WHEN `global-styles.ts` is refactored, THE Refactoring_Tool SHALL remove all CSS rules that apply a `color` property to broad typography selectors (`h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `p`, `span`, `div`, `.ant-typography`, `.ant-typography-secondary`, `.ant-typography-disabled`).
5. WHEN `global-styles.ts` is refactored, THE Refactoring_Tool SHALL remove all CSS rules targeting `.ant-tag-*` color variants, `.ant-menu-item`, `.ant-menu-item-selected`, `.ant-pagination-*`, `.ant-tabs-*`, `.ant-collapse-*`, `.ant-segmented-*`, `.ant-badge-count`, `.ant-avatar`, `.ant-switch`, `.ant-switch-checked`, `.ant-checkbox-*`, `.ant-radio-*`, `.ant-slider-*`, `.ant-progress-*`, `.ant-statistic-*`, `.ant-form-item-label`, `.ant-message-notice-content`, and `.ant-notification-notice` selectors that duplicate design tokens already set in `theme.ts`.
6. WHILE `global-styles.ts` is being refactored, THE Refactoring_Tool SHALL preserve all structural CSS rules that control `border-radius`, `overflow`, `display`, `width`, `height`, `box-shadow` (non-color), or `border: none` on Ant Design container components (Card, Modal, Drawer, Dropdown, Popover, Table).
7. WHILE `global-styles.ts` is being refactored, THE Refactoring_Tool SHALL preserve all `.auth-shell` scoped CSS rules.
8. WHILE `global-styles.ts` is being refactored, THE Refactoring_Tool SHALL preserve all mobile responsive overrides inside `@media (max-width: 767px)` blocks.
9. WHILE `global-styles.ts` is being refactored, THE Refactoring_Tool SHALL preserve the `.ant-btn` desktop size override, `.ant-btn-dangerous` rules, `.ant-btn-group` rules, `.ant-menu-item` width layout fix, `.scrollable` rule, and `.ant-layout` background rule.
10. WHILE `global-styles.ts` is being refactored, THE Refactoring_Tool SHALL preserve the base `html`, `body`, `#root` min-height rules, `body` margin and overflow rules, `a { color: inherit }`, and `* { -webkit-tap-highlight-color: transparent }`.

---

### Requirement 2: Clean Up index.css

**User Story:** As a developer, I want `index.css` to contain only base reset rules and essential mobile rules, so that it does not conflict with design tokens already set in `theme.ts`.

#### Acceptance Criteria

1. WHEN `index.css` is refactored, THE Refactoring_Tool SHALL remove all `.ant-btn-primary` color override rules from `index.css`.
2. WHILE `index.css` is being refactored, THE Refactoring_Tool SHALL preserve the font import statements, the `theme-variables.css` import, the `box-sizing: border-box` reset, and the `overflow-x: hidden` rule.
3. WHILE `index.css` is being refactored, THE Refactoring_Tool SHALL preserve the `.auth-shell .ant-form-item-label > label::after { display: none }` rule.
4. WHILE `index.css` is being refactored, THE Refactoring_Tool SHALL preserve the `[class*="ant-input-prefix"]` separator removal rules, the `.ant-input-affix-wrapper { border-radius: 8px }` rule, and the password icon border removal rules.

---

### Requirement 3: Extract Repeated Inline Stat Card Pattern in ExpensesPage

**User Story:** As a developer, I want the three repeated inline stat card `div` blocks in `ExpensesPage.tsx` replaced with the existing `SummaryStat` component, so that the code is DRY and the stat card appearance is consistent.

#### Acceptance Criteria

1. WHEN `ExpensesPage.tsx` is refactored, THE Refactoring_Tool SHALL replace all three repeated inline stat card `div` blocks with invocations of the `SummaryStat` component.
2. WHEN `SummaryStat` is used in `ExpensesPage.tsx`, THE Refactoring_Tool SHALL pass `title`, `value`, `subtitle`, `icon`, and `color` props that match the data previously rendered by each inline block.
3. WHEN `ExpensesPage.tsx` is refactored, THE Refactoring_Tool SHALL remove all inline `style={{}}` objects that were part of the extracted stat card blocks.
4. IF the `SummaryStat` component does not already accept all required props, THEN THE Refactoring_Tool SHALL extend the `SummaryStat` component interface to accept the missing props without breaking existing usages.

---

### Requirement 4: Remove Dead Code from All Source Files

**User Story:** As a developer, I want all unused imports, commented-out code blocks, and unused state variables removed from every source file, so that the codebase is clean and easy to navigate.

#### Acceptance Criteria

1. THE Refactoring_Tool SHALL remove every import statement in every Source_File where the imported symbol is not referenced anywhere in that file's body.
2. THE Refactoring_Tool SHALL remove every block comment in every Source_File that contains commented-out TypeScript or TSX code.
3. THE Refactoring_Tool SHALL remove every `useState` hook declaration in every Source_File where neither the state value nor the setter function is referenced in the file body.
4. IF removing a dead import causes a TypeScript type error in the same file, THEN THE Refactoring_Tool SHALL resolve the type error before completing the refactor of that file.
5. WHILE removing dead code, THE Refactoring_Tool SHALL preserve all JSDoc comments, explanatory prose comments, and `TODO` comments that do not contain executable code.

---

### Requirement 5: Preserve Legitimate Styled-Components

**User Story:** As a developer, I want all styled-components that use dynamic props or animations to remain untouched, so that the refactor does not break complex interactive UI components.

#### Acceptance Criteria

1. WHILE refactoring component files, THE Refactoring_Tool SHALL preserve all styled-components in `AppLayout.tsx`, `AuthShell.tsx`, `BrandLoader.tsx`, `Glass.tsx`, `PageHeader.tsx`, `SummaryStat.tsx`, `shared/StatCard.tsx`, `ExpenseFormModal.tsx`, and `DashboardPage.tsx`.
2. WHILE refactoring component files, THE Refactoring_Tool SHALL preserve any styled-component that accepts dynamic props (e.g., `$color`, `$active`) or defines CSS animations.
3. THE Refactoring_Tool SHALL NOT remove any styled-component that has at least one usage site in the codebase.

---

### Requirement 6: Preserve Source of Truth Files

**User Story:** As a developer, I want `theme.ts` and `theme-variables.css` to remain completely unchanged, so that the design token configuration and CSS variable definitions are not accidentally altered.

#### Acceptance Criteria

1. THE Refactoring_Tool SHALL NOT modify `src/styles/theme.ts`.
2. THE Refactoring_Tool SHALL NOT modify `src/styles/theme-variables.css`.

---

### Requirement 7: Maintain Functional and Type Correctness

**User Story:** As a developer, I want the application to remain functionally identical and type-safe after the refactor, so that no regressions are introduced.

#### Acceptance Criteria

1. WHEN the refactor is complete, THE Refactoring_Tool SHALL produce zero TypeScript compiler errors across all Source_Files.
2. WHEN the refactor is complete, THE Refactoring_Tool SHALL NOT have changed any business logic, data transformation, API call, or Supabase query in any Source_File.
3. WHEN the refactor is complete, THE application SHALL render identically in both light and dark mode on all pages compared to the pre-refactor state.
4. IF a CSS rule removal causes a visual regression in any page or component, THEN THE Refactoring_Tool SHALL restore that specific rule and annotate it with a comment explaining why it cannot be removed.
