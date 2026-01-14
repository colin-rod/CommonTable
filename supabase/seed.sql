-- Seed Data for CommonTable
-- Creates test data for local development: households, users, recipes, calendar entries, and cooking events

-- =============================================================================
-- TEST USERS (In auth.users schema)
-- =============================================================================
-- Note: In local development, users are created via Supabase Auth
-- This seed script assumes users with these IDs exist in auth.users
-- For local dev, you can create users via Supabase Studio or Auth API

-- User IDs we'll reference:
-- Smith Family:
--   - alice@smith.com: 11111111-1111-1111-1111-111111111111 (admin)
--   - bob@smith.com:   22222222-2222-2222-2222-222222222222 (member)
-- Johnson Household:
--   - carol@johnson.com: 33333333-3333-3333-3333-333333333333 (admin)
--   - dave@johnson.com:  44444444-4444-4444-4444-444444444444 (member)

-- =============================================================================
-- PROFILES
-- =============================================================================

INSERT INTO public.profiles (id, display_name, avatar_url, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Alice Smith', NULL, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  ('22222222-2222-2222-2222-222222222222', 'Bob Smith', NULL, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
  ('33333333-3333-3333-3333-333333333333', 'Carol Johnson', NULL, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
  ('44444444-4444-4444-4444-444444444444', 'Dave Johnson', NULL, NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- HOUSEHOLDS
-- =============================================================================

INSERT INTO public.households (id, name, created_at, updated_at)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Smith Family', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Johnson Household', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days');

-- =============================================================================
-- HOUSEHOLD MEMBERS
-- =============================================================================

INSERT INTO public.household_members (household_id, user_id, role, joined_at)
VALUES
  -- Smith Family
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin', NOW() - INTERVAL '30 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'member', NOW() - INTERVAL '28 days'),
  -- Johnson Household
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'admin', NOW() - INTERVAL '25 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'member', NOW() - INTERVAL '23 days');

-- =============================================================================
-- RECIPES (Using database function for atomic creation)
-- =============================================================================

-- Smith Family Recipes
SELECT public.create_recipe_with_version(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- household_id
  'Classic Pasta Carbonara', -- title
  'A traditional Italian pasta dish made with eggs, cheese, pancetta, and black pepper', -- description
  '[
    {"name": "spaghetti", "quantity": 400, "unit": "g"},
    {"name": "pancetta", "quantity": 200, "unit": "g"},
    {"name": "eggs", "quantity": 4, "unit": "whole"},
    {"name": "parmesan cheese", "quantity": 100, "unit": "g"},
    {"name": "black pepper", "quantity": 1, "unit": "tsp"}
  ]'::jsonb, -- ingredients_json
  '[
    {"position": 1, "text": "Cook spaghetti in salted boiling water until al dente"},
    {"position": 2, "text": "Fry pancetta until crispy"},
    {"position": 3, "text": "Beat eggs and mix with grated parmesan"},
    {"position": 4, "text": "Drain pasta, reserving 1 cup of pasta water"},
    {"position": 5, "text": "Mix hot pasta with pancetta, remove from heat"},
    {"position": 6, "text": "Add egg mixture, toss quickly, add pasta water if needed"},
    {"position": 7, "text": "Season with black pepper and serve immediately"}
  ]'::jsonb, -- steps_json
  4, -- servings
  10, -- prep_time_minutes
  20, -- cook_time_minutes
  'Best made with guanciale if you can find it', -- notes
  '11111111-1111-1111-1111-111111111111' -- created_by (Alice)
);

SELECT public.create_recipe_with_version(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Chocolate Chip Cookies',
  'Soft and chewy homemade chocolate chip cookies',
  '[
    {"name": "all-purpose flour", "quantity": 280, "unit": "g"},
    {"name": "butter", "quantity": 225, "unit": "g"},
    {"name": "brown sugar", "quantity": 200, "unit": "g"},
    {"name": "granulated sugar", "quantity": 100, "unit": "g"},
    {"name": "eggs", "quantity": 2, "unit": "whole"},
    {"name": "vanilla extract", "quantity": 2, "unit": "tsp"},
    {"name": "baking soda", "quantity": 1, "unit": "tsp"},
    {"name": "salt", "quantity": 0.5, "unit": "tsp"},
    {"name": "chocolate chips", "quantity": 350, "unit": "g"}
  ]'::jsonb,
  '[
    {"position": 1, "text": "Preheat oven to 375°F (190°C)"},
    {"position": 2, "text": "Mix butter and sugars until fluffy"},
    {"position": 3, "text": "Beat in eggs and vanilla"},
    {"position": 4, "text": "Combine flour, baking soda, and salt"},
    {"position": 5, "text": "Gradually add dry ingredients to wet ingredients"},
    {"position": 6, "text": "Fold in chocolate chips"},
    {"position": 7, "text": "Drop rounded tablespoons onto baking sheet"},
    {"position": 8, "text": "Bake for 9-11 minutes until edges are golden"},
    {"position": 9, "text": "Cool on baking sheet for 2 minutes, then transfer to wire rack"}
  ]'::jsonb,
  24,
  15,
  11,
  'For chewier cookies, slightly underbake them',
  '22222222-2222-2222-2222-222222222222' -- Bob
);

SELECT public.create_recipe_with_version(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Greek Salad',
  'Fresh and healthy Mediterranean salad',
  '[
    {"name": "cucumber", "quantity": 1, "unit": "whole"},
    {"name": "tomatoes", "quantity": 4, "unit": "whole"},
    {"name": "red onion", "quantity": 0.5, "unit": "whole"},
    {"name": "feta cheese", "quantity": 200, "unit": "g"},
    {"name": "kalamata olives", "quantity": 100, "unit": "g"},
    {"name": "olive oil", "quantity": 60, "unit": "ml"},
    {"name": "lemon juice", "quantity": 2, "unit": "tbsp"},
    {"name": "oregano", "quantity": 1, "unit": "tsp"}
  ]'::jsonb,
  '[
    {"position": 1, "text": "Chop cucumber, tomatoes, and red onion"},
    {"position": 2, "text": "Combine vegetables in a large bowl"},
    {"position": 3, "text": "Add feta cheese and olives"},
    {"position": 4, "text": "Drizzle with olive oil and lemon juice"},
    {"position": 5, "text": "Sprinkle with oregano"},
    {"position": 6, "text": "Toss gently and serve"}
  ]'::jsonb,
  4,
  15,
  0,
  'Best served immediately after preparation',
  '11111111-1111-1111-1111-111111111111' -- Alice
);

SELECT public.create_recipe_with_version(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Chicken Stir-Fry',
  'Quick and healthy Asian-inspired dish',
  '[
    {"name": "chicken breast", "quantity": 500, "unit": "g"},
    {"name": "broccoli", "quantity": 300, "unit": "g"},
    {"name": "bell peppers", "quantity": 2, "unit": "whole"},
    {"name": "soy sauce", "quantity": 60, "unit": "ml"},
    {"name": "garlic", "quantity": 3, "unit": "cloves"},
    {"name": "ginger", "quantity": 1, "unit": "tbsp"},
    {"name": "sesame oil", "quantity": 2, "unit": "tbsp"},
    {"name": "cornstarch", "quantity": 1, "unit": "tbsp"}
  ]'::jsonb,
  '[
    {"position": 1, "text": "Cut chicken into bite-sized pieces"},
    {"position": 2, "text": "Prepare vegetables: cut broccoli into florets, slice peppers"},
    {"position": 3, "text": "Mix soy sauce, cornstarch, and 2 tbsp water"},
    {"position": 4, "text": "Heat oil in wok or large pan over high heat"},
    {"position": 5, "text": "Stir-fry chicken until cooked through"},
    {"position": 6, "text": "Add garlic and ginger, cook for 30 seconds"},
    {"position": 7, "text": "Add vegetables, stir-fry for 3-4 minutes"},
    {"position": 8, "text": "Pour in sauce, toss to coat everything"},
    {"position": 9, "text": "Serve over rice"}
  ]'::jsonb,
  4,
  15,
  10,
  NULL,
  '22222222-2222-2222-2222-222222222222' -- Bob
);

SELECT public.create_recipe_with_version(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Banana Bread',
  'Moist and delicious homemade banana bread',
  '[
    {"name": "ripe bananas", "quantity": 3, "unit": "whole"},
    {"name": "butter", "quantity": 75, "unit": "g"},
    {"name": "sugar", "quantity": 150, "unit": "g"},
    {"name": "egg", "quantity": 1, "unit": "whole"},
    {"name": "vanilla extract", "quantity": 1, "unit": "tsp"},
    {"name": "baking soda", "quantity": 1, "unit": "tsp"},
    {"name": "salt", "quantity": 0.25, "unit": "tsp"},
    {"name": "all-purpose flour", "quantity": 190, "unit": "g"}
  ]'::jsonb,
  '[
    {"position": 1, "text": "Preheat oven to 350°F (175°C)"},
    {"position": 2, "text": "Mash bananas in a bowl"},
    {"position": 3, "text": "Melt butter and mix with mashed bananas"},
    {"position": 4, "text": "Add sugar, egg, and vanilla, mix well"},
    {"position": 5, "text": "Sprinkle baking soda and salt over mixture"},
    {"position": 6, "text": "Add flour, mix until just combined"},
    {"position": 7, "text": "Pour into greased loaf pan"},
    {"position": 8, "text": "Bake for 60 minutes or until toothpick comes out clean"},
    {"position": 9, "text": "Cool in pan for 10 minutes, then turn out onto wire rack"}
  ]'::jsonb,
  8,
  10,
  60,
  'Great for using up overripe bananas',
  '11111111-1111-1111-1111-111111111111' -- Alice
);

-- Johnson Household Recipes
SELECT public.create_recipe_with_version(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Vegetarian Chili',
  'Hearty and flavorful meatless chili',
  '[
    {"name": "black beans", "quantity": 400, "unit": "g"},
    {"name": "kidney beans", "quantity": 400, "unit": "g"},
    {"name": "crushed tomatoes", "quantity": 800, "unit": "g"},
    {"name": "onion", "quantity": 1, "unit": "whole"},
    {"name": "bell peppers", "quantity": 2, "unit": "whole"},
    {"name": "chili powder", "quantity": 2, "unit": "tbsp"},
    {"name": "cumin", "quantity": 1, "unit": "tbsp"},
    {"name": "garlic", "quantity": 4, "unit": "cloves"}
  ]'::jsonb,
  '[
    {"position": 1, "text": "Dice onion and bell peppers, mince garlic"},
    {"position": 2, "text": "Sauté onion and peppers in large pot"},
    {"position": 3, "text": "Add garlic, cook for 1 minute"},
    {"position": 4, "text": "Add chili powder and cumin, stir"},
    {"position": 5, "text": "Add beans and crushed tomatoes"},
    {"position": 6, "text": "Simmer for 30 minutes, stirring occasionally"},
    {"position": 7, "text": "Season with salt and pepper to taste"}
  ]'::jsonb,
  6,
  10,
  35,
  'Tastes even better the next day',
  '33333333-3333-3333-3333-333333333333' -- Carol
);

SELECT public.create_recipe_with_version(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Pancakes',
  'Fluffy homemade pancakes perfect for breakfast',
  '[
    {"name": "all-purpose flour", "quantity": 250, "unit": "g"},
    {"name": "milk", "quantity": 300, "unit": "ml"},
    {"name": "egg", "quantity": 1, "unit": "whole"},
    {"name": "butter", "quantity": 30, "unit": "g"},
    {"name": "sugar", "quantity": 2, "unit": "tbsp"},
    {"name": "baking powder", "quantity": 2, "unit": "tsp"},
    {"name": "salt", "quantity": 0.5, "unit": "tsp"}
  ]'::jsonb,
  '[
    {"position": 1, "text": "Mix flour, sugar, baking powder, and salt"},
    {"position": 2, "text": "Melt butter and let cool slightly"},
    {"position": 3, "text": "Whisk together milk, egg, and melted butter"},
    {"position": 4, "text": "Pour wet ingredients into dry ingredients"},
    {"position": 5, "text": "Mix until just combined (batter should be lumpy)"},
    {"position": 6, "text": "Heat griddle or pan over medium heat"},
    {"position": 7, "text": "Pour 1/4 cup batter for each pancake"},
    {"position": 8, "text": "Cook until bubbles form, flip and cook other side"},
    {"position": 9, "text": "Serve with maple syrup and butter"}
  ]'::jsonb,
  4,
  10,
  15,
  'Don''t overmix the batter - lumps are okay',
  '44444444-4444-4444-4444-444444444444' -- Dave
);

SELECT public.create_recipe_with_version(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Roasted Vegetables',
  'Simple and healthy roasted vegetable medley',
  '[
    {"name": "carrots", "quantity": 300, "unit": "g"},
    {"name": "zucchini", "quantity": 300, "unit": "g"},
    {"name": "red bell pepper", "quantity": 1, "unit": "whole"},
    {"name": "red onion", "quantity": 1, "unit": "whole"},
    {"name": "olive oil", "quantity": 3, "unit": "tbsp"},
    {"name": "garlic powder", "quantity": 1, "unit": "tsp"},
    {"name": "dried herbs", "quantity": 1, "unit": "tsp"}
  ]'::jsonb,
  '[
    {"position": 1, "text": "Preheat oven to 425°F (220°C)"},
    {"position": 2, "text": "Cut all vegetables into similar-sized pieces"},
    {"position": 3, "text": "Toss vegetables with olive oil and seasonings"},
    {"position": 4, "text": "Spread on baking sheet in single layer"},
    {"position": 5, "text": "Roast for 25-30 minutes, stirring halfway"},
    {"position": 6, "text": "Vegetables should be tender and lightly browned"}
  ]'::jsonb,
  4,
  10,
  30,
  'Works with any combination of vegetables',
  '33333333-3333-3333-3333-333333333333' -- Carol
);

SELECT public.create_recipe_with_version(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Smoothie Bowl',
  'Refreshing and nutritious breakfast bowl',
  '[
    {"name": "frozen berries", "quantity": 200, "unit": "g"},
    {"name": "banana", "quantity": 1, "unit": "whole"},
    {"name": "Greek yogurt", "quantity": 150, "unit": "g"},
    {"name": "honey", "quantity": 1, "unit": "tbsp"},
    {"name": "granola", "quantity": 50, "unit": "g"},
    {"name": "fresh fruit", "quantity": 100, "unit": "g"}
  ]'::jsonb,
  '[
    {"position": 1, "text": "Blend frozen berries, banana, yogurt, and honey until smooth"},
    {"position": 2, "text": "Pour into bowl"},
    {"position": 3, "text": "Top with granola and fresh fruit"},
    {"position": 4, "text": "Serve immediately"}
  ]'::jsonb,
  1,
  5,
  0,
  'Use very frozen fruit for thick consistency',
  '44444444-4444-4444-4444-444444444444' -- Dave
);

SELECT public.create_recipe_with_version(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Tomato Soup',
  'Creamy homemade tomato soup',
  '[
    {"name": "canned tomatoes", "quantity": 800, "unit": "g"},
    {"name": "onion", "quantity": 1, "unit": "whole"},
    {"name": "garlic", "quantity": 3, "unit": "cloves"},
    {"name": "vegetable broth", "quantity": 500, "unit": "ml"},
    {"name": "heavy cream", "quantity": 100, "unit": "ml"},
    {"name": "basil", "quantity": 10, "unit": "leaves"}
  ]'::jsonb,
  '[
    {"position": 1, "text": "Sauté diced onion until soft"},
    {"position": 2, "text": "Add minced garlic, cook for 1 minute"},
    {"position": 3, "text": "Add tomatoes and broth, bring to boil"},
    {"position": 4, "text": "Simmer for 20 minutes"},
    {"position": 5, "text": "Add basil and blend until smooth"},
    {"position": 6, "text": "Stir in cream and heat through"},
    {"position": 7, "text": "Season with salt and pepper"}
  ]'::jsonb,
  4,
  10,
  25,
  'Perfect with grilled cheese sandwiches',
  '33333333-3333-3333-3333-333333333333' -- Carol
);

-- =============================================================================
-- CALENDAR ENTRIES (Upcoming week)
-- =============================================================================

INSERT INTO public.calendar_entries (household_id, recipe_id, planned_date, meal_slot, notes, created_by)
SELECT
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  r.id,
  CURRENT_DATE + INTERVAL '1 day',
  'dinner',
  'Family dinner',
  '11111111-1111-1111-1111-111111111111'
FROM public.recipes r
WHERE r.title = 'Classic Pasta Carbonara'
  AND r.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO public.calendar_entries (household_id, recipe_id, planned_date, meal_slot, notes, created_by)
SELECT
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  r.id,
  CURRENT_DATE + INTERVAL '2 days',
  'lunch',
  NULL,
  '22222222-2222-2222-2222-222222222222'
FROM public.recipes r
WHERE r.title = 'Greek Salad'
  AND r.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO public.calendar_entries (household_id, recipe_id, planned_date, meal_slot, notes, created_by)
SELECT
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  r.id,
  CURRENT_DATE + INTERVAL '1 day',
  'breakfast',
  'Weekend brunch',
  '44444444-4444-4444-4444-444444444444'
FROM public.recipes r
WHERE r.title = 'Pancakes'
  AND r.household_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

INSERT INTO public.calendar_entries (household_id, recipe_id, planned_date, meal_slot, notes, created_by)
SELECT
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  r.id,
  CURRENT_DATE + INTERVAL '3 days',
  'dinner',
  NULL,
  '33333333-3333-3333-3333-333333333333'
FROM public.recipes r
WHERE r.title = 'Vegetarian Chili'
  AND r.household_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- =============================================================================
-- COOKING EVENTS (Past week)
-- =============================================================================

INSERT INTO public.cooking_events (recipe_id, recipe_version_id, household_id, cooked_at, servings_made, rating, notes, cooked_by)
SELECT
  r.id,
  r.current_version_id,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  NOW() - INTERVAL '3 days',
  4,
  5,
  'Turned out perfect!',
  '11111111-1111-1111-1111-111111111111'
FROM public.recipes r
WHERE r.title = 'Chicken Stir-Fry'
  AND r.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO public.cooking_events (recipe_id, recipe_version_id, household_id, cooked_at, servings_made, rating, notes, cooked_by)
SELECT
  r.id,
  r.current_version_id,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  NOW() - INTERVAL '5 days',
  24,
  4,
  'Kids loved these',
  '22222222-2222-2222-2222-222222222222'
FROM public.recipes r
WHERE r.title = 'Chocolate Chip Cookies'
  AND r.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO public.cooking_events (recipe_id, recipe_version_id, household_id, cooked_at, servings_made, rating, notes, cooked_by)
SELECT
  r.id,
  r.current_version_id,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  NOW() - INTERVAL '2 days',
  6,
  5,
  'Great comfort food',
  '33333333-3333-3333-3333-333333333333'
FROM public.recipes r
WHERE r.title = 'Vegetarian Chili'
  AND r.household_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

INSERT INTO public.cooking_events (recipe_id, recipe_version_id, household_id, cooked_at, servings_made, rating, notes, cooked_by)
SELECT
  r.id,
  r.current_version_id,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  NOW() - INTERVAL '6 days',
  4,
  4,
  NULL,
  '44444444-4444-4444-4444-444444444444'
FROM public.recipes r
WHERE r.title = 'Tomato Soup'
  AND r.household_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

INSERT INTO public.cooking_events (recipe_id, recipe_version_id, household_id, cooked_at, servings_made, rating, notes, cooked_by)
SELECT
  r.id,
  r.current_version_id,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  NOW() - INTERVAL '7 days',
  4,
  5,
  'Quick and delicious',
  '11111111-1111-1111-1111-111111111111'
FROM public.recipes r
WHERE r.title = 'Greek Salad'
  AND r.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
