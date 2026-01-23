/**
 * OpenAI integration for AI-powered tag suggestions
 * Uses GPT-4-turbo with structured outputs for consistent tag generation
 */

import { OpenAITagResponseSchema, type TagSuggestion } from './schema.ts';

// =====================================================================
// TYPES
// =====================================================================

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
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
      schema: {
        type: string;
        properties: Record<string, unknown>;
        required?: string[];
        additionalProperties: boolean;
      };
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

const OPENAI_MODEL = 'gpt-4-turbo';
const OPENAI_TEMPERATURE = 0.3; // Lower temperature for more consistent outputs
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a recipe tagging assistant. Your job is to suggest 3 relevant tags for recipes based on their title, ingredients, and cooking steps.

Guidelines:
- Tags should be lowercase, max 20 characters
- Prefer existing household tags when applicable, but create new tags if needed
- Consider: cuisine type, cooking method, main ingredient, dietary restriction, meal type, difficulty, or occasion
- Order tags by relevance (most relevant first)
- Provide a confidence score (0.0-1.0) for each tag
- Be specific but not overly narrow (e.g., "italian" not "northern-italian")

Examples:
- "Pasta Carbonara" → ["pasta", "italian", "dinner"]
- "Gluten-Free Banana Bread" → ["gluten-free", "dessert", "breakfast"]
- "Quick Stir-Fry Chicken" → ["quick", "asian", "chicken"]
- "Slow-Cooked Beef Stew" → ["slow-cooker", "comfort-food", "beef"]
- "Vegan Buddha Bowl" → ["vegan", "healthy", "lunch"]`;

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================

/**
 * Format ingredients as a readable comma-separated list
 */
function formatIngredients(
  ingredients: Array<{ name: string; quantity?: number; unit?: string }>,
): string {
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
 * Format steps as a readable paragraph
 */
function formatSteps(steps: Array<{ position: number; text: string }>): string {
  if (steps.length === 0) return 'None';

  return steps
    .sort((a, b) => a.position - b.position)
    .map((step) => step.text)
    .join(' ');
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
        content: `Suggest 3 tags for this recipe:

Title: ${title}

Ingredients: ${ingredientsList}

Steps: ${stepsText}

Existing household tags: ${existingTagsText}

Provide exactly 3 tags with confidence scores.`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'tag_suggestions',
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
                  reason: { type: 'string' },
                },
                required: ['name', 'confidence'],
                additionalProperties: false,
              },
              minItems: 3,
              maxItems: 3,
            },
          },
          required: ['tags'],
          additionalProperties: false,
        },
      },
    },
    temperature: OPENAI_TEMPERATURE,
  };
}

// =====================================================================
// MAIN FUNCTION
// =====================================================================

/**
 * Generate tag suggestions for a recipe using OpenAI GPT-4-turbo
 *
 * @param title - Recipe title
 * @param ingredients - Array of ingredients with optional quantity/unit
 * @param steps - Array of cooking steps
 * @param existingTags - Existing household tags to prefer
 * @returns Array of 3 tag suggestions with confidence scores
 * @throws Error if OpenAI API call fails or response is invalid
 */
export async function generateTagSuggestions(
  title: string,
  ingredients: Array<{ name: string; quantity?: number; unit?: string }>,
  steps: Array<{ position: number; text: string }>,
  existingTags: string[],
): Promise<TagSuggestion[]> {
  // 1. Validate API key
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable not set');
  }

  // 2. Format recipe data
  const ingredientsList = formatIngredients(ingredients);
  const stepsText = formatSteps(steps);

  // 3. Create request body
  const requestBody = createOpenAIRequest(title, ingredientsList, stepsText, existingTags);

  // 4. Call OpenAI API
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  // 5. Handle HTTP errors
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  // 6. Parse response
  const data: OpenAIResponse = await response.json();

  // 7. Extract content
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content in OpenAI response');
  }

  // 8. Parse JSON content
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse OpenAI JSON response: ${error}`);
  }

  // 9. Validate against schema
  const validated = OpenAITagResponseSchema.parse(parsed);

  // 10. Log token usage (optional)
  if (data.usage) {
    console.log(
      `OpenAI tokens used: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`,
    );
  }

  return validated.tags;
}
