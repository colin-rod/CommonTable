#!/bin/bash

# Script to add missing Recipe metadata fields to test files
# Adds: cooking_method, dietary_categories, dish_category

echo "Fixing Recipe mock objects in test files..."

# Find all test files and add the missing fields
find apps/web -name "*.test.ts*" -type f | while read file; do
  # Check if file contains Recipe objects missing the new fields
  if grep -q "status: 'suggested'" "$file" 2>/dev/null; then
    # Add fields after status line if not already present
    if ! grep -q "cooking_method:" "$file" 2>/dev/null; then
      # Use perl for in-place editing with backup
      perl -i.bak -pe 's/(status: .*?[,;])/$1\n    cooking_method: null,\n    dietary_categories: null,\n    dish_category: null,/g' "$file"
      echo "Updated: $file"
    fi
  fi
done

echo "Done!"
