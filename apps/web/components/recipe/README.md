# Recipe Form

## Field map & requirements

### Basics (required section)
- **Recipe title** — **Required**
- **Servings** — Optional
- **Prep time (minutes)** — Optional
- **Cook time (minutes)** — Optional

### Meta
- **Cuisine** — Optional
- **Meal type** — Optional
- **Dietary categories** — Optional
- **Dish category** — Optional
- **Status** — Optional (defaults to `suggested`)
- **Priority** — Optional
- **Cooking method** — Optional
- **Tags** — Optional
- **Key ingredients** — Optional (currently populated programmatically/import flows)

### Ingredients (required section)
- **Ingredient name** — **Required** (per ingredient row)
- **Quantity** — Optional
- **Unit** — Optional
- **Notes** — Optional

### Steps (required section)
- **Step text** — **Required** (per step row)
- **Position** — Required (auto-managed, hidden field)

### Optional
- **Description** — Optional
- **Notes** — Optional

## Accordion & required-field behavior
- Default expanded sections must include **all required fields** (Basics, Ingredients, Steps).
- Required inputs show a visual indicator (asterisk) **and** inline help text that says “Required.”
- Optional and Meta sections can start collapsed unless they already contain values.
