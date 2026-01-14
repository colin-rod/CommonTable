# Design System

**Project:** Recipe Manager (MVP)  
**Platform:** Web (mobile-responsive)  
**UI Foundation:** Material Design (Material UI / M3)  
**Audience:** Frontend implementation (Claude Code / engineers)  
**Design Intent:** Calm, homely, Google-like, low cognitive load  
**Strictness:** High (hard rules, minimal variants)

This document is the **single source of truth** for all UI decisions.  
Material Design is used as a base, but **only a restricted subset is allowed**.

---

## 1. Core Philosophy

This app should feel like a **Google product used at home**:
- Calm
- Familiar
- Predictable
- Quietly confident

The UI should disappear behind the task.

If a user notices the design, it is likely too loud.

---

## 2. Non-Negotiable Constraints

- Material Design is the base system
- Only approved MUI components may be used
- Variants, colors, and behaviors are strictly limited
- No custom component styling outside the theme
- One obvious way to perform primary actions

---

## 3. Material Design Usage Rules

### 3.1 Material Version
- Use **Material Design 3 (M3)** defaults via MUI
- Do not mix M2 and M3 patterns

### 3.2 Custom Styling Rules
- All styling must come from:
  - MUI theme tokens
  - Spacing system
  - Component props
- No ad-hoc CSS
- No inline styles (except layout primitives like `Box`)

---

## 4. Theme Specification

### 4.1 Color System (Material Roles)

Use Material color roles only.

Required roles:
- `background.default`
- `background.paper`
- `primary.main`
- `text.primary`
- `text.secondary`
- `divider`
- `error.main`

Optional:
- `action.disabled`
- `action.hover`

#### Color Rules
- No gradients
- No transparency overlays
- No more than **one accent color** (`primary`) per screen
- `error` is used **only** for destructive actions
- Avoid pure white (`#FFFFFF`) and pure black (`#000000`)
- Prefer warm, neutral tones

---

### 4.2 Typography

#### Font
- Single font family (Material default, e.g. Roboto)
- No decorative fonts
- No italics

#### Allowed Typography Variants

Only these variants may be used:

| Variant | Usage |
|------|------|
| `h5` | Page titles |
| `h6` | Section headers |
| `body1` | Primary content |
| `body2` | Secondary / meta content |

Rules:
- Max **3 typography variants per screen**
- Line height ≥ `1.4`
- Hierarchy via size and weight, not color

---

### 4.3 Shape & Elevation

#### Shape
- Use theme `shape.borderRadius`
- No custom radius values

#### Elevation
- Use **low elevation only**
- Allowed elevations: `0`, `1`, `2`
- Elevation > `2` is forbidden in MVP

---

## 5. Spacing System

### 5.1 Base Unit
- 8px spacing system

Allowed values only:
4, 8, 16, 24, 32, 48

### 5.2 Rules
- Vertical spacing prioritized over horizontal
- No arbitrary spacing
- Layout must align to spacing scale

---

## 6. Layout System

### 6.1 Page Structure (Mandatory)

All pages must follow this order:

1. Page title
2. Optional page description
3. Primary content
4. Optional secondary content

Rules:
- Single primary content column
- No competing primary actions
- No complex grid layouts in MVP
- Use `Container`, `Stack`, and `Box` only

---

## 7. Allowed MUI Components (MVP)

Only the following components may be used:

### Layout & Structure
- `Container`
- `Box`
- `Stack`
- `Divider`

### Surfaces
- `Paper`
- `Card`
- `CardContent`

### Lists (Primary Pattern)
- `List`
- `ListItem`
- `ListItemButton`
- `ListItemText`

### Inputs
- `TextField`
- `Select`
- `Checkbox`
- `Radio`

### Actions
- `Button`

### Feedback
- `Dialog`
- `Snackbar`
- `CircularProgress`

Any component not listed here is **forbidden** without updating this document.

---

## 8. Buttons (Strict Rules)

### Allowed Button Types (Exactly 3)

1. **Primary**
   - `variant="contained"`
   - `color="primary"`

2. **Secondary**
   - `variant="outlined"`
   - `color="primary"`

3. **Destructive**
   - `variant="contained"`
   - `color="error"`

### Button Rules
- Only **one Primary button per screen**
- Primary buttons must contain text
- Icon-only primary buttons are forbidden
- Button labels must be verbs (e.g. “Add recipe”)

---

## 9. Forms & Inputs

Rules:
- Labels must always be visible
- Placeholders are not labels
- Errors appear only after user interaction
- Error messages are short and neutral

Avoid dense forms. Prefer one task per screen.

---

## 10. Lists (Critical Pattern)

Lists are the backbone of the app.

Rules:
- Lists are vertically stacked
- Each row contains:
  - Primary text
  - Optional secondary text
  - Optional single action
- Rows that navigate are fully clickable
- Tables are forbidden in MVP

---

## 11. States & Interaction

### Required States
All interactive components must support:
- Default
- Hover
- Active
- Disabled
- Loading
- Error

Rules:
- State changes are subtle and clear
- Animations limited to opacity and transform
- No playful or attention-grabbing motion

---

## 12. Content & Tone

### Voice
- Calm
- Neutral
- Practical
- Slightly warm

Rules:
- No emojis
- No jokes
- No playful language

Example:
- ❌ “Oops! Something went wrong 😅”
- ✅ “Couldn’t save the recipe. Try again.”

---

### Empty States
- One sentence maximum
- One clear action
- No illustrations in MVP

---

## 13. Accessibility (Baseline)

Required:
- Sufficient color contrast
- Tap targets ≥ 44px
- Visible keyboard focus
- Clear error messages

Out of scope for MVP:
- Full WCAG documentation
- Advanced screen reader optimization

---

## 14. Prohibited Patterns

Explicitly forbidden:
- Using non-approved MUI components
- Adding button variants
- Adding new colors outside the theme
- Icon-only primary actions
- One-off component styling
- Decorative animations

---

## 15. Default Decision Rules

When uncertain:
1. Reduce visual noise
2. Reduce options
3. Prefer text over icons
4. Prefer clarity over delight
5. Prefer reuse over novelty

---

## 16. Implementation Expectations

- Enforce constraints via:
  - Theme tokens
  - Wrapper components
  - TypeScript enums / props
- Prevent invalid combinations by design
- Remove options instead of adding new ones

> A boring, predictable UI means the system is working.
