import type { RawRecipeData } from './jsonld.ts';

/**
 * Parse recipe data from HTML using common patterns
 * This is a fallback when JSON-LD is not available
 *
 * @param html - HTML content to parse
 * @returns Partial recipe data (may have missing fields)
 */
export function parseHtmlFallback(html: string): RawRecipeData {
  return {
    title: extractTitle(html),
    description: extractDescription(html),
    servings: extractServings(html),
    prep_time_minutes: extractPrepTime(html),
    cook_time_minutes: extractCookTime(html),
    ingredients: extractIngredients(html),
    steps: extractSteps(html),
    image_url: extractImage(html),
    tags: [],
  };
}

/**
 * Extract title from <h1> or <title> tag
 */
function extractTitle(html: string): string | undefined {
  // Try h1 first
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
  if (h1Match) {
    return stripHtml(h1Match[1]).trim();
  }

  // Fall back to <title> tag
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
  if (titleMatch) {
    return stripHtml(titleMatch[1]).trim();
  }

  return undefined;
}

/**
 * Extract description from meta tags
 */
function extractDescription(html: string): string | undefined {
  // Try meta description
  const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/is);
  if (metaMatch) {
    return metaMatch[1].trim();
  }

  // Try og:description
  const ogMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/is);
  if (ogMatch) {
    return ogMatch[1].trim();
  }

  return undefined;
}

/**
 * Extract servings from text patterns
 * Patterns: "serves X", "X servings", "makes X servings"
 */
function extractServings(html: string): number | undefined {
  const patterns = [/serves?\s+(\d+)/i, /(\d+)\s+servings?/i, /makes?\s+(\d+)\s+servings?/i];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return undefined;
}

/**
 * Extract prep time from text patterns
 * Patterns: "prep time: X min", "X min prep", "prep: X minutes"
 */
function extractPrepTime(html: string): number | undefined {
  const patterns = [
    /prep\s*time[:\s]+(\d+)\s*(?:min|minutes?)/i,
    /(\d+)\s*(?:min|minutes?)\s+prep/i,
    /prep[:\s]+(\d+)\s*(?:min|minutes?)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return undefined;
}

/**
 * Extract cook time from text patterns
 * Patterns: "cook time: X min", "X min cook", "X hours"
 */
function extractCookTime(html: string): number | undefined {
  // Try hours first
  const hoursMatch = html.match(/cook\s*time[:\s]+(\d+)\s*hours?/i);
  if (hoursMatch) {
    return parseInt(hoursMatch[1], 10) * 60;
  }

  const patterns = [
    /cook\s*time[:\s]+(\d+)\s*(?:min|minutes?)/i,
    /(\d+)\s*(?:min|minutes?)\s+cook/i,
    /cook[:\s]+(\d+)\s*(?:min|minutes?)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return undefined;
}

/**
 * Extract ingredients from <ul> or <ol> near "ingredients" heading
 */
function extractIngredients(html: string): string[] {
  // Find section with "ingredients" heading
  const sectionPatterns = [
    /<h[1-6][^>]*>.*?ingredients.*?<\/h[1-6]>(.*?)(?=<h[1-6]|$)/is,
    /<(?:div|section)[^>]*>.*?<h[1-6][^>]*>.*?ingredients.*?<\/h[1-6]>(.*?)<\/(?:div|section)>/is,
  ];

  for (const pattern of sectionPatterns) {
    const match = html.match(pattern);
    if (match) {
      return extractListItems(match[1]);
    }
  }

  // If no section found, look for first ul/ol after "ingredients" text
  const ingredientsIndex = html.search(/ingredients/i);
  if (ingredientsIndex !== -1) {
    const afterIngredients = html.substring(ingredientsIndex);
    const listMatch = afterIngredients.match(/<(?:ul|ol)[^>]*>(.*?)<\/(?:ul|ol)>/is);
    if (listMatch) {
      return extractListItems(listMatch[1]);
    }
  }

  return [];
}

/**
 * Extract steps from <ol> or <ul> near "instructions/directions/steps" heading
 */
function extractSteps(html: string): string[] {
  const headingPatterns = ['instructions', 'directions', 'steps', 'method'];

  for (const heading of headingPatterns) {
    const sectionPatterns = [
      new RegExp(`<h[1-6][^>]*>.*?${heading}.*?<\\/h[1-6]>(.*?)(?=<h[1-6]|$)`, 'is'),
      new RegExp(
        `<(?:div|section)[^>]*>.*?<h[1-6][^>]*>.*?${heading}.*?<\\/h[1-6]>(.*?)<\\/(?:div|section)>`,
        'is',
      ),
    ];

    for (const pattern of sectionPatterns) {
      const match = html.match(pattern);
      if (match) {
        return extractListItems(match[1]);
      }
    }

    // Try finding list after heading text
    const headingIndex = html.search(new RegExp(heading, 'i'));
    if (headingIndex !== -1) {
      const afterHeading = html.substring(headingIndex);
      const listMatch = afterHeading.match(/<(?:ul|ol)[^>]*>(.*?)<\/(?:ul|ol)>/is);
      if (listMatch) {
        return extractListItems(listMatch[1]);
      }
    }
  }

  return [];
}

/**
 * Extract image URL from <img> tags
 * Prioritize images with "recipe" in src or within article/main tags
 */
function extractImage(html: string): string | undefined {
  // Try to find image with "recipe" in src
  const recipeImageMatch = html.match(/<img[^>]+src=["'](.*?recipe.*?)["']/i);
  if (recipeImageMatch) {
    return recipeImageMatch[1];
  }

  // Try first image in article or main tag
  const articleMatch = html.match(/<(?:article|main)[^>]*>(.*?)<\/(?:article|main)>/is);
  if (articleMatch) {
    const imgMatch = articleMatch[1].match(/<img[^>]+src=["'](.*?)["']/i);
    if (imgMatch) {
      return imgMatch[1];
    }
  }

  // Fall back to first image
  const imgMatch = html.match(/<img[^>]+src=["'](.*?)["']/i);
  if (imgMatch) {
    return imgMatch[1];
  }

  return undefined;
}

/**
 * Decode HTML entities to plain text
 * Handles hex entities (&#x25a2;), decimal entities (&#8594;),
 * and named entities (&amp;, &lt;, &nbsp;, etc.)
 *
 * Examples:
 *   &#x25a2; → ☢ (checkbox)
 *   &#8594; → → (arrow)
 *   &frac12; → ½
 *   &amp; → &
 *   &lt; → <
 *   &quot; → "
 */
function decodeHtmlEntities(text: string): string {
  return (
    text
      // Hex entities (&#xHEX;)
      .replace(/&#x([0-9A-Fa-f]+);/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)))
      // Decimal entities (&#DEC;)
      .replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(parseInt(dec, 10)))
      // Named entities
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&apos;/g, "'")
      .replace(/&frac12;/g, '½')
      .replace(/&frac14;/g, '¼')
      .replace(/&frac34;/g, '¾')
      .replace(/&ldquo;/g, '\u201c') // Left double quote
      .replace(/&rdquo;/g, '\u201d') // Right double quote
      .replace(/&lsquo;/g, '\u2018') // Left single quote
      .replace(/&rsquo;/g, '\u2019') // Right single quote
      .replace(/&mdash;/g, '\u2014') // Em dash
      .replace(/&ndash;/g, '\u2013') // En dash
  );
}

/**
 * Extract list items (<li>) from HTML fragment
 */
function extractListItems(htmlFragment: string): string[] {
  const items: string[] = [];
  const liMatches = htmlFragment.matchAll(/<li[^>]*>(.*?)<\/li>/gis);

  for (const match of liMatches) {
    const text = stripHtml(match[1]).trim();
    const decoded = decodeHtmlEntities(text);
    if (decoded.trim()) {
      items.push(decoded.trim());
    }
  }

  return items;
}

/**
 * Strip HTML tags from string
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}
