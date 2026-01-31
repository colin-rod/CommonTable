#!/usr/bin/env node

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lrelbxzvndbmfpxhgosd.supabase.co';
const supabaseKey = 'sb_secret_H6XZYWg07ULj49FUMri1Xw_AhG11SF2';

const supabase = createClient(supabaseUrl, supabaseKey);

const migrationPath = process.argv[2];
if (!migrationPath) {
  console.error('Usage: node apply-migration.mjs <migration-file-path>');
  process.exit(1);
}

const sql = readFileSync(migrationPath, 'utf8');

console.log('Applying migration:', migrationPath);
console.log('SQL:', sql.substring(0, 200) + '...');

// Execute the SQL
const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

if (error) {
  console.error('Error applying migration:', error);
  process.exit(1);
}

console.log('Migration applied successfully!');
console.log('Result:', data);
