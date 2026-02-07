# Recipe Form UX Spec

## Section Navigation

- A lightweight "Jump to section" bar appears beneath the page title.
- Each section link scrolls smoothly to the matching form section and expands it if collapsed.
- Navigation items show completion status using a small chip (checkmark when complete, counts otherwise).

## Section Completion States

- **Details**: marked complete when the recipe title is filled.
- **Ingredients**: shows a count of filled ingredient rows; checked when at least one ingredient has a name.
- **Steps**: shows a count of filled step rows; checked when at least one step has text.

## Autosave + Save Draft

- The form autosaves draft content to local storage after brief inactivity.
- A "Save Draft" button lets users explicitly store a draft at any time.
- A status line reports draft state (saving, saved time, or failure).
- Drafts are restored on page load and cleared after a successful submit.

## Expand/Collapse Interaction + Keyboard Support

- Sections are collapsible; expanding a section moves focus to its primary action:
  - Details → title input
  - Ingredients → "Add Ingredient" button
  - Steps → "Add Step" button
- When a section collapses, focus returns to its section header.
- Section headers remain keyboard operable (enter/space to toggle).
