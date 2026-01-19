/**
 * Raw parsed data from JSON-LD (before normalization)
 */
export interface RawRecipeData {
  title?: string;
  description?: string;
  servings?: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  ingredients: string[];
  steps: string[];
  image_url?: string;
  tags: string[];
}

/**
 * Parse schema.org Recipe JSON-LD from HTML
 *
 * @param html - HTML content to parse
 * @returns Parsed recipe data or null if no Recipe found
 */
export function parseJsonLd(html: string): RawRecipeData | null {
  try {
    // Extract all JSON-LD script tags
    const jsonLdMatches = html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis,
    );

    for (const match of jsonLdMatches) {
      const jsonContent = match[1];

      try {
        const data = JSON.parse(jsonContent);

        // Find Recipe object (could be nested in @graph)
        const recipe = findRecipeObject(data);

        if (recipe) {
          return extractRecipeData(recipe);
        }
      } catch (error) {
        // Malformed JSON in this script tag, try next one
        console.warn('Failed to parse JSON-LD:', error);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing JSON-LD:', error);
    return null;
  }
}

/**
 * Find Recipe object in JSON-LD data (handles @graph arrays)
 */
function findRecipeObject(data: any): any {
  if (!data) return null;

  // Direct Recipe object
  if (data['@type'] === 'Recipe') {
    return data;
  }

  // Recipe in @graph array
  if (data['@graph'] && Array.isArray(data['@graph'])) {
    return data['@graph'].find((item: any) => item['@type'] === 'Recipe');
  }

  // Array of objects
  if (Array.isArray(data)) {
    return data.find((item: any) => item['@type'] === 'Recipe');
  }

  return null;
}

/**
 * Extract recipe data from schema.org Recipe object
 */
function extractRecipeData(recipe: any): RawRecipeData {
  return {
    title: recipe.name,
    description: recipe.description,
    servings: parseServings(recipe.recipeYield),
    prep_time_minutes: parseDuration(recipe.prepTime),
    cook_time_minutes: parseDuration(recipe.cookTime || recipe.totalTime),
    ingredients: parseIngredients(recipe.recipeIngredient),
    steps: parseSteps(recipe.recipeInstructions),
    image_url: parseImage(recipe.image),
    tags: parseTags(recipe.keywords, recipe.recipeCategory, recipe.recipeCuisine),
  };
}

/**
 * Parse servings from various formats
 * Examples: "4", "4 servings", "Serves 6", "4-6 servings", 4
 */
function parseServings(recipeYield: any): number | undefined {
  if (!recipeYield) return undefined;

  if (typeof recipeYield === 'number') {
    return recipeYield;
  }

  if (typeof recipeYield === 'string') {
    // Extract first number from string
    const match = recipeYield.match(/\d+/);
    if (match) {
      return parseInt(match[0], 10);
    }
  }

  return undefined;
}

/**
 * Parse ISO 8601 duration to minutes
 * Examples: PT30M, PT1H, PT1H15M, P0DT0H30M0S
 */
function parseDuration(duration: any): number | undefined {
  if (!duration || typeof duration !== 'string') return undefined;

  try {
    let totalMinutes = 0;

    // Extract hours (PT1H or PT1H15M)
    const hoursMatch = duration.match(/(\d+)H/);
    if (hoursMatch) {
      totalMinutes += parseInt(hoursMatch[1], 10) * 60;
    }

    // Extract minutes (PT30M or PT1H15M)
    const minutesMatch = duration.match(/(\d+)M/);
    if (minutesMatch) {
      totalMinutes += parseInt(minutesMatch[1], 10);
    }

    return totalMinutes > 0 ? totalMinutes : undefined;
  } catch (error) {
    console.warn('Failed to parse duration:', duration, error);
    return undefined;
  }
}

/**
 * Parse ingredients array
 */
function parseIngredients(recipeIngredient: any): string[] {
  if (!recipeIngredient) return [];

  if (Array.isArray(recipeIngredient)) {
    return recipeIngredient.filter((ing) => typeof ing === 'string' && ing.trim());
  }

  if (typeof recipeIngredient === 'string') {
    return [recipeIngredient];
  }

  return [];
}

/**
 * Parse recipe instructions
 * Can be: string, array of strings, array of HowToStep objects
 */
function parseSteps(recipeInstructions: any): string[] {
  if (!recipeInstructions) return [];

  // Single string
  if (typeof recipeInstructions === 'string') {
    return [recipeInstructions];
  }

  // Array
  if (Array.isArray(recipeInstructions)) {
    return recipeInstructions
      .map((step) => {
        // HowToStep object
        if (typeof step === 'object' && step.text) {
          return step.text;
        }
        // Plain string
        if (typeof step === 'string') {
          return step;
        }
        return null;
      })
      .filter((step): step is string => step !== null && step.trim() !== '');
  }

  return [];
}

/**
 * Parse image URL from various formats
 * Can be: string, ImageObject, array
 */
function parseImage(image: any): string | undefined {
  if (!image) return undefined;

  // String URL
  if (typeof image === 'string') {
    return image;
  }

  // ImageObject
  if (typeof image === 'object' && image.url) {
    return image.url;
  }

  // Array - take first image
  if (Array.isArray(image) && image.length > 0) {
    const firstImage = image[0];
    if (typeof firstImage === 'string') {
      return firstImage;
    }
    if (typeof firstImage === 'object' && firstImage.url) {
      return firstImage.url;
    }
  }

  return undefined;
}

/**
 * Parse tags from keywords, recipeCategory, recipeCuisine
 */
function parseTags(keywords: any, recipeCategory: any, recipeCuisine: any): string[] {
  const tags: string[] = [];

  // Keywords (string or array)
  if (keywords) {
    if (typeof keywords === 'string') {
      // Split by comma
      tags.push(...keywords.split(',').map((k) => k.trim()));
    } else if (Array.isArray(keywords)) {
      tags.push(...keywords.filter((k) => typeof k === 'string'));
    }
  }

  // Recipe category
  if (recipeCategory && typeof recipeCategory === 'string') {
    tags.push(recipeCategory);
  }

  // Recipe cuisine
  if (recipeCuisine && typeof recipeCuisine === 'string') {
    tags.push(recipeCuisine);
  }

  // Remove duplicates and empty strings
  return [...new Set(tags.filter((tag) => tag.trim() !== ''))];
}
