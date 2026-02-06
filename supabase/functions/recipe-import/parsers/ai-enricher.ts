/**
 * AI-powered recipe data enrichment using OpenAI GPT-4o-mini
 * Cleans and standardizes recipe data while preserving source faithfulness
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

import type { IngredientPreview, RecipePreview, StepPreview } from '../schema.ts';

// =====================================================================
// TYPES
// =====================================================================

/**
 * Cuisine type enum (30 options) - matches packages/types/src/schemas/recipe.ts
 */
export type CuisineType =
  | 'african'
  | 'american'
  | 'asian'
  | 'brazilian'
  | 'breakfast'
  | 'chinese'
  | 'dessert'
  | 'french'
  | 'german'
  | 'greek'
  | 'hungarian'
  | 'indian'
  | 'italian'
  | 'japanese'
  | 'korean'
  | 'mediterranean'
  | 'mexican'
  | 'middle_eastern'
  | 'pastry'
  | 'persian'
  | 'peruvian'
  | 'salad'
  | 'sauce'
  | 'seafood'
  | 'spanish'
  | 'staple'
  | 'thai'
  | 'vegetable'
  | 'vietnamese';

/**
 * Meal type enum (6 options) - matches packages/types/src/schemas/recipe.ts
 */
export type MealType = 'main_dish' | 'side_dish' | 'breakfast' | 'dessert' | 'snack' | 'beverage';

/**
 * AI enrichment result containing all enriched fields
 */
export interface AIEnrichmentResult {
  // Metadata fields
  tags: string[];
  cuisine: CuisineType | null;
  meal_type: MealType | null;
  key_ingredients: string[];

  // Core recipe fields (cleaned/enhanced)
  servings: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  ingredients: IngredientPreview[];
  steps: StepPreview[];

  // Status
  status: 'success' | 'failed' | 'skipped';
  error?: string;
}

/**
 * OpenAI API types
 */
interface OpenAIMessage {
  role: 'system' | 'user';
  content: string;
}

interface OpenAIRequestBody {
  model: string;
  messages: OpenAIMessage[];
  response_format: {
    type: 'json_schema';
    json_schema: {
      name: string;
      strict: boolean;
      schema: Record<string, unknown>;
    };
  };
  temperature: number;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// =====================================================================
// CONSTANTS
// =====================================================================

const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_TEMPERATURE = 0.2; // Low temperature to discourage hallucination
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_TEXT_LENGTH = 500; // Truncate long text to reduce tokens

const CUISINE_TYPES: CuisineType[] = [
  'african',
  'american',
  'asian',
  'brazilian',
  'breakfast',
  'chinese',
  'dessert',
  'french',
  'german',
  'greek',
  'hungarian',
  'indian',
  'italian',
  'japanese',
  'korean',
  'mediterranean',
  'mexican',
  'middle_eastern',
  'pastry',
  'persian',
  'peruvian',
  'salad',
  'sauce',
  'seafood',
  'spanish',
  'staple',
  'thai',
  'vegetable',
  'vietnamese',
];

const MEAL_TYPES: MealType[] = [
  'main_dish',
  'side_dish',
  'breakfast',
  'dessert',
  'snack',
  'beverage',
];

const SYSTEM_PROMPT = `You are a recipe data cleaning and enrichment assistant. Your job is to extract and standardize recipe data from parsed HTML.

CRITICAL RULES:
- Return ONLY data that is explicitly present in the source recipe
- DO NOT invent, estimate, or make up missing fields
- If a field is not present in the source, return null or empty array
- DO NOT add ingredients or steps that aren't in the original recipe
- DO NOT estimate times if they aren't specified

Your tasks:
1. Clean and standardize ingredient formatting
2. Clean and standardize step formatting
3. Extract metadata (tags, cuisine, meal_type, key_ingredients)
4. Parse servings/times if present

Guidelines:
- Tags: 3-5 lowercase tags (max 20 chars), ordered by relevance
  - Prefer existing household tags when applicable
  - Consider: cuisine, cooking method, main ingredient, dietary restriction, meal type, difficulty, occasion
- Cuisine: Select ONE from 30-option enum (italian, mexican, asian, etc.) or null if unclear
- Meal Type: Select ONE from 6-option enum (main_dish, side_dish, breakfast, dessert, snack, beverage) or null
- Key Ingredients: 3-5 PRIMARY ingredients (max 50 chars), exclude common staples (salt, pepper, oil)
- Ingredients: Standardize format to {name, quantity, unit, notes}, preserve ALL original ingredients
- Steps: Clean up formatting, preserve ALL original steps in order
- Servings/Times: Extract if mentioned, otherwise return null

Be faithful to the source. Accuracy over completeness.`;

// =====================================================================
// ZODS SCHEMAS FOR VALIDATION
// =====================================================================

const TagSuggestionSchema = z.object({
  name: z.string(),
  confidence: z.number(),
});

const AIResponseSchema = z.object({
  tags: z.array(TagSuggestionSchema).min(3).max(5),
  cuisine: z.enum(CUISINE_TYPES as [CuisineType, ...CuisineType[]]).nullable(),
  meal_type: z.enum(MEAL_TYPES as [MealType, ...MealType[]]).nullable(),
  key_ingredients: z.array(z.string()).max(5),
  servings: z.number().nullable(),
  prep_time_minutes: z.number().nullable(),
  cook_time_minutes: z.number().nullable(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().nullable().optional(),
      unit: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
    }),
  ),
  steps: z.array(
    z.object({
      position: z.number(),
      text: z.string(),
    }),
  ),
});

type AIResponse = z.infer<typeof AIResponseSchema>;

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================

/**
 * Truncate text to max length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format ingredients as a readable string
 */
function formatIngredients(ingredients: IngredientPreview[]): string {
  if (ingredients.length === 0) return 'None';

  return ingredients
    .map((ing) => {
      if (ing.quantity && ing.unit) {
        return `${ing.quantity} ${ing.unit} ${ing.name}`;
      } else if (ing.quantity) {
        return `${ing.quantity} ${ing.name}`;
      }
      return ing.name;
    })
    .join(', ');
}

/**
 * Format steps as a readable string
 */
function formatSteps(steps: StepPreview[]): string {
  if (steps.length === 0) return 'None';

  return steps
    .sort((a, b) => a.position - b.position)
    .map((step) => step.text)
    .join(' ');
}

/**
 * Fetch existing household tags from Supabase
 */
async function fetchHouseholdTags(householdId: string, supabase: any): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('get_household_tags', {
      p_household_id: householdId,
    });

    if (error) {
      console.warn('Failed to fetch household tags:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.warn('Failed to fetch household tags:', error);
    return [];
  }
}

/**
 * Create OpenAI request body with structured output schema
 */
function createOpenAIRequest(
  title: string,
  ingredientsList: string,
  stepsText: string,
  existingTags: string[],
): OpenAIRequestBody {
  const existingTagsText = existingTags.length > 0 ? existingTags.join(', ') : 'None';

  return {
    model: OPENAI_MODEL,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Analyze this recipe:

Title: ${title}
Ingredients: ${ingredientsList}
Steps: ${stepsText}
Existing household tags: ${existingTagsText}

Provide structured metadata and cleaned recipe data.`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'recipe_enrichment',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  confidence: { type: 'number' },
                },
                required: ['name', 'confidence'],
                additionalProperties: false,
              },
              minItems: 3,
              maxItems: 5,
            },
            cuisine: {
              type: 'string',
              enum: CUISINE_TYPES,
              nullable: true,
            },
            meal_type: {
              type: 'string',
              enum: MEAL_TYPES,
              nullable: true,
            },
            key_ingredients: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 5,
            },
            servings: {
              type: 'number',
              nullable: true,
            },
            prep_time_minutes: {
              type: 'number',
              nullable: true,
            },
            cook_time_minutes: {
              type: 'number',
              nullable: true,
            },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  quantity: { type: 'number', nullable: true },
                  unit: { type: 'string', nullable: true },
                  notes: { type: 'string', nullable: true },
                },
                required: ['name'],
                additionalProperties: false,
              },
            },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  position: { type: 'number' },
                  text: { type: 'string' },
                },
                required: ['position', 'text'],
                additionalProperties: false,
              },
            },
          },
          required: [
            'tags',
            'cuisine',
            'meal_type',
            'key_ingredients',
            'servings',
            'prep_time_minutes',
            'cook_time_minutes',
            'ingredients',
            'steps',
          ],
          additionalProperties: false,
        },
      },
    },
    temperature: OPENAI_TEMPERATURE,
  };
}

/**
 * Call OpenAI API and parse response
 */
async function callOpenAI(requestBody: OpenAIRequestBody, apiKey: string): Promise<AIResponse> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data: OpenAIResponse = await response.json();

  // Extract content
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content in OpenAI response');
  }

  // Parse JSON content
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse OpenAI JSON response: ${error}`);
  }

  // Validate against schema
  const validated = AIResponseSchema.parse(parsed);

  // Log token usage
  if (data.usage) {
    console.log(
      `OpenAI tokens used: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`,
    );
  }

  return validated;
}

// =====================================================================
// MAIN FUNCTION
// =====================================================================

/**
 * Enrich recipe data using AI (GPT-4o-mini)
 * Returns cleaned/enriched recipe data or gracefully degrades on failure
 *
 * @param recipe - Parsed recipe preview data
 * @param householdId - Household ID for fetching existing tags
 * @param supabase - Supabase client for database queries
 * @returns AIEnrichmentResult with enriched data and status
 */
export async function enrichRecipeData(
  recipe: RecipePreview,
  householdId: string,
  supabase: any,
): Promise<AIEnrichmentResult> {
  // 1. Validate API key
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not set, skipping AI enrichment');
    return {
      tags: [],
      cuisine: null,
      meal_type: null,
      key_ingredients: [],
      servings: null,
      prep_time_minutes: null,
      cook_time_minutes: null,
      ingredients: [],
      steps: [],
      status: 'skipped',
    };
  }

  try {
    // 2. Fetch household tags
    const householdTags = await fetchHouseholdTags(householdId, supabase);

    // 3. Format recipe data
    const title = recipe.title || 'Untitled Recipe';
    const ingredientsList = truncate(formatIngredients(recipe.ingredients || []), MAX_TEXT_LENGTH);
    const stepsText = truncate(formatSteps(recipe.steps || []), MAX_TEXT_LENGTH);

    // 4. Build OpenAI request
    const requestBody = createOpenAIRequest(title, ingredientsList, stepsText, householdTags);

    // 5. Call OpenAI API
    const aiResponse = await callOpenAI(requestBody, apiKey);

    // 6. Extract tag names (drop confidence scores)
    const tags = aiResponse.tags.map((t) => t.name);

    // 7. Convert ingredients (remove null, convert to undefined)
    const ingredients: IngredientPreview[] = aiResponse.ingredients.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity ?? undefined,
      unit: ing.unit ?? undefined,
      notes: ing.notes ?? undefined,
    }));

    // 8. Return enriched data
    return {
      tags,
      cuisine: aiResponse.cuisine,
      meal_type: aiResponse.meal_type,
      key_ingredients: aiResponse.key_ingredients,
      servings: aiResponse.servings,
      prep_time_minutes: aiResponse.prep_time_minutes,
      cook_time_minutes: aiResponse.cook_time_minutes,
      ingredients,
      steps: aiResponse.steps,
      status: 'success',
    };
  } catch (error) {
    console.error('AI enrichment failed:', error);
    return {
      tags: [],
      cuisine: null,
      meal_type: null,
      key_ingredients: [],
      servings: null,
      prep_time_minutes: null,
      cook_time_minutes: null,
      ingredients: [],
      steps: [],
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
