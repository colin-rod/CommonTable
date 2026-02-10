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

const SYSTEM_PROMPT = `You are a recipe metadata extraction assistant. Your ONLY job is to extract metadata from parsed recipe data.

CRITICAL RULES:
- You are extracting METADATA ONLY - not modifying recipe content
- The ingredients and steps are provided for CONTEXT ONLY
- DO NOT modify, clean, or reformat the ingredients or steps
- DO NOT return ingredients or steps in your response
- Return ONLY: tags, cuisine, meal_type, key_ingredients, servings, times

Your tasks:
1. Extract 3-5 relevant tags from the recipe content
2. Identify cuisine type (or null if unclear)
3. Identify meal type (or null if unclear)
4. Extract 3-5 primary ingredients from the ingredients list
5. Extract servings/times if mentioned in the recipe

Metadata Guidelines:
- Tags: 3-5 lowercase tags (max 20 chars), ordered by relevance
  - Prefer existing household tags when applicable
  - Consider: cuisine, cooking method, main ingredient, dietary restriction, meal type, difficulty, occasion
- Cuisine: Select ONE from 30-option enum (italian, mexican, asian, etc.) or null if unclear
- Meal Type: Select ONE from 6-option enum (main_dish, side_dish, breakfast, dessert, snack, beverage) or null
- Key Ingredients: 3-5 PRIMARY ingredients from the provided list (max 50 chars), exclude common staples (salt, pepper, oil)
- Servings/Times: Extract if mentioned, otherwise return null

IMPORTANT: You are NOT responsible for cleaning or returning ingredients/steps. Those are preserved exactly as parsed from the source.`;

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
  // NOTE: ingredients and steps removed - AI only extracts metadata
  // Original parsed ingredients/steps are always preserved from input
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
  sourceUrl?: string,
): OpenAIRequestBody {
  const existingTagsText = existingTags.length > 0 ? existingTags.join(', ') : 'None';
  const sourceText = sourceUrl || 'User-provided data';

  return {
    model: OPENAI_MODEL,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Extract metadata from this recipe:

Source URL: ${sourceText}
Recipe Title: ${title}

Ingredients (for context):
${ingredientsList}

Steps (for context):
${stepsText}

Existing household tags: ${existingTagsText}

Extract ONLY metadata:
- tags: 3-5 relevant tags
- cuisine: cuisine type or null
- meal_type: meal type or null
- key_ingredients: 3-5 primary ingredients from the list above
- servings: number if mentioned, otherwise null
- prep_time_minutes: number if mentioned, otherwise null
- cook_time_minutes: number if mentioned, otherwise null

DO NOT modify or return the ingredients/steps - they are for context only.`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'recipe_metadata_extraction',
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
            // NOTE: ingredients and steps removed from schema
            // AI only extracts metadata - original parsed content is preserved
          },
          required: [
            'tags',
            'cuisine',
            'meal_type',
            'key_ingredients',
            'servings',
            'prep_time_minutes',
            'cook_time_minutes',
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
 * Extracts metadata only - original steps/ingredients are always preserved
 *
 * @param recipe - Parsed recipe preview data
 * @param householdId - Household ID for fetching existing tags
 * @param supabase - Supabase client for database queries
 * @param sourceUrl - Optional source URL for context (where recipe was parsed from)
 * @returns AIEnrichmentResult with metadata and original steps/ingredients
 */
export async function enrichRecipeData(
  recipe: RecipePreview,
  householdId: string,
  supabase: any,
  sourceUrl?: string,
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
    const requestBody = createOpenAIRequest(
      title,
      ingredientsList,
      stepsText,
      householdTags,
      sourceUrl,
    );

    // 5. Call OpenAI API
    const aiResponse = await callOpenAI(requestBody, apiKey);

    // 6. Extract tag names (drop confidence scores)
    const tags = aiResponse.tags.map((t) => t.name);

    // 7. Return metadata from AI + original steps/ingredients from input
    // IMPORTANT: AI never modifies steps/ingredients - only extracts metadata
    return {
      // Metadata from AI
      tags,
      cuisine: aiResponse.cuisine,
      meal_type: aiResponse.meal_type,
      key_ingredients: aiResponse.key_ingredients,
      servings: aiResponse.servings,
      prep_time_minutes: aiResponse.prep_time_minutes,
      cook_time_minutes: aiResponse.cook_time_minutes,

      // ALWAYS preserve original parsed content (never use AI output)
      ingredients: recipe.ingredients || [],
      steps: recipe.steps || [],

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
