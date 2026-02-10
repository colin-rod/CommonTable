#!/usr/bin/env tsx
/* eslint-disable no-console */

/**
 * Recipe Images Migration Script
 *
 * Purpose: Migrate existing images from Supabase Storage to recipe_images table
 *
 * This script:
 * 1. Lists all files in the recipe-images storage bucket
 * 2. Parses file paths to extract household_id, recipe_id, and image_id
 * 3. Verifies recipes exist in the database
 * 4. Creates recipe_images records with proper metadata
 * 5. Sets the first image for each recipe as primary
 *
 * Storage Path Format: {household_id}/{recipe_id}/{image_id}.{ext}
 * Example: abc-123/recipe-456/img-789.jpg
 *
 * Usage:
 *   pnpm migrate:images
 *
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL in apps/web/.env.local
 *   - SUPABASE_SECRET_KEY in apps/web/.env.local
 */

import path from 'path';

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from apps/web/.env.local
dotenv.config({ path: path.join(__dirname, '../apps/web/.env.local') });

const BUCKET_NAME = 'recipe-images';

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
}

async function migrateRecipeImages(): Promise<void> {
  console.log('🚀 Starting recipe images migration...\n');

  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
  };

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    console.error('❌ Missing required environment variables:');
    if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseSecretKey) console.error('  - SUPABASE_SECRET_KEY');
    console.error('\nMake sure apps/web/.env.local is configured correctly.');
    process.exit(1);
  }

  // Initialize Supabase client with admin privileges (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseSecretKey);

  console.log(`📂 Scanning storage bucket: ${BUCKET_NAME}\n`);

  // List all files recursively
  const allFiles: Array<{ name: string; metadata?: Record<string, unknown> }> = [];

  // Recursive function to list all files in folders
  async function listAllFiles(prefix = ''): Promise<void> {
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(prefix, { limit: 1000 });

    if (listError) {
      console.error(`❌ Failed to list storage files at ${prefix}:`, listError);
      throw listError;
    }

    if (!files || files.length === 0) {
      return;
    }

    for (const file of files) {
      const fullPath = prefix ? `${prefix}/${file.name}` : file.name;

      // If it's a folder, recurse into it
      if (file.id === null) {
        await listAllFiles(fullPath);
      } else {
        // It's a file
        allFiles.push({ name: fullPath, metadata: file.metadata });
      }
    }
  }

  try {
    await listAllFiles();
  } catch (error) {
    console.error('❌ Failed to scan storage:', error);
    process.exit(1);
  }

  console.log(`📊 Found ${allFiles.length} file(s) in storage\n`);
  stats.total = allFiles.length;

  if (allFiles.length === 0) {
    console.log('ℹ️  No images found in storage. Migration complete.');
    return;
  }

  // Process each file
  for (const file of allFiles) {
    const pathParts = file.name.split('/');

    // Skip temporary import images (format: imports/{user_id}/{timestamp}_{uuid}/{image_id}.{ext})
    if (pathParts[0] === 'imports') {
      console.log(`ℹ️  Skipping temporary import: ${file.name}`);
      stats.skipped++;
      continue;
    }

    // Expected format for recipe images: {household_id}/{recipe_id}/{image_id}.{ext}
    if (pathParts.length !== 3) {
      console.warn(
        `⚠️  Skipping invalid path: ${file.name} (expected 3 parts, got ${pathParts.length})`,
      );
      stats.skipped++;
      continue;
    }

    const [_householdId, recipeId, imageFilename] = pathParts;
    const lastDotIndex = imageFilename.lastIndexOf('.');

    if (lastDotIndex === -1) {
      console.warn(`⚠️  Skipping invalid filename: ${imageFilename} (no extension)`);
      stats.skipped++;
      continue;
    }

    const imageId = imageFilename.substring(0, lastDotIndex);

    // Verify recipe exists
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id, created_by')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      console.warn(`⚠️  Recipe ${recipeId} not found, skipping image ${imageId}`);
      stats.skipped++;
      continue;
    }

    // Check if record already exists
    const { data: existing, error: checkError } = await supabase
      .from('recipe_images')
      .select('id')
      .eq('id', imageId)
      .maybeSingle();

    if (checkError) {
      console.error(`❌ Error checking existing image ${imageId}:`, checkError);
      stats.errors++;
      continue;
    }

    if (existing) {
      console.log(`ℹ️  Image ${imageId} already migrated, skipping`);
      stats.skipped++;
      continue;
    }

    // Check if this is the first image for this recipe (set as primary)
    const { count, error: countError } = await supabase
      .from('recipe_images')
      .select('*', { count: 'exact', head: true })
      .eq('recipe_id', recipeId);

    if (countError) {
      console.error(`❌ Error counting images for recipe ${recipeId}:`, countError);
      stats.errors++;
      continue;
    }

    const isPrimary = (count || 0) === 0;
    const displayOrder = count || 0;

    // Insert record
    const { error: insertError } = await supabase.from('recipe_images').insert({
      id: imageId,
      recipe_id: recipeId,
      storage_path: file.name,
      display_order: displayOrder,
      is_primary: isPrimary,
      is_public: false,
      alt_text: null,
      width: null,
      height: null,
      file_size_bytes: null,
      created_by: recipe.created_by,
    });

    if (insertError) {
      console.error(`❌ Failed to insert image ${imageId}:`, insertError);
      stats.errors++;
    } else {
      console.log(
        `✅ Migrated: ${imageId} → recipe ${recipeId} (primary: ${isPrimary}, order: ${displayOrder})`,
      );
      stats.migrated++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));
  console.log(`Total files scanned:    ${stats.total}`);
  console.log(`Successfully migrated:  ${stats.migrated}`);
  console.log(`Skipped:                ${stats.skipped}`);
  console.log(`Errors:                 ${stats.errors}`);
  console.log('='.repeat(60));

  if (stats.migrated > 0) {
    console.log('\n✅ Migration complete! Images should now be visible in the UI.');
    console.log('   Navigate to http://localhost:3000/recipes to verify.');
  } else if (stats.total === 0) {
    console.log('\nℹ️  No images found in storage.');
  } else {
    console.log('\n⚠️  No new images were migrated. Check warnings above.');
  }
}

// Run migration
migrateRecipeImages().catch((error) => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
