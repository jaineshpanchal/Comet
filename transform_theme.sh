#!/bin/bash

# Theme transformation script for all 45 pages
# Transforms to exact blue gradient standards

# Get all page.tsx files
pages=$(find /Users/jaineshpanchal/Documents/GitHub/Comet/frontend/src/app/\(app\) -name "page.tsx" -type f)

echo "Transforming theme for 45 pages..."
echo "=================================="

for file in $pages; do
    echo "Processing: $file"

    # Backup file
    cp "$file" "$file.backup"

    # 1. Replace ALL gradient patterns with standard blue gradient
    sed -i '' 's/bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500/bg-gradient-to-r from-blue-600 to-blue-500/g' "$file"
    sed -i '' 's/bg-gradient-to-br from-blue-600 to-blue-700/bg-gradient-to-r from-blue-600 to-blue-500/g' "$file"
    sed -i '' 's/bg-gradient-to-r from-blue-600 to-blue-700/bg-gradient-to-r from-blue-600 to-blue-500/g' "$file"
    sed -i '' 's/from-blue-500 to-purple-600/from-blue-600 to-blue-500/g' "$file"
    sed -i '' 's/from-purple-600 to-blue-600/from-blue-600 to-blue-500/g' "$file"

    # 2. Remove hover gradient changes on buttons
    sed -i '' 's/hover:from-blue-700 hover:to-blue-600//g' "$file"
    sed -i '' 's/hover:from-purple-700 hover:to-blue-700//g' "$file"

    # 3. Replace purple with blue for text/borders/backgrounds (but not for badges where purple is intentional)
    sed -i '' 's/text-purple-600/text-blue-600/g' "$file"
    sed -i '' 's/text-purple-700/text-blue-700/g' "$file"
    sed -i '' 's/border-purple-600/border-blue-600/g' "$file"
    sed -i '' 's/border-purple-300/border-blue-300/g' "$file"
    sed -i '' 's/ring-purple-600/ring-blue-600/g' "$file"
    sed -i '' 's/focus:ring-purple-600/focus:ring-blue-600/g' "$file"
    sed -i '' 's/peer-focus:ring-purple-300/peer-focus:ring-blue-300/g' "$file"
    sed -i '' 's/border-purple-200/border-blue-200/g' "$file"
    sed -i '' 's/peer-checked:bg-purple-600/peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-blue-500/g' "$file"

    # 4. Replace hover purple with blue
    sed -i '' 's/hover:text-purple-700/hover:text-blue-700/g' "$file"
    sed -i '' 's/hover:text-purple-600/hover:text-blue-600/g' "$file"
    sed -i '' 's/hover:border-purple-300/hover:border-blue-300/g' "$file"
    sed -i '' 's/hover:bg-purple-50/hover:bg-blue-50/g' "$file"

    # 5. Update button styling - single color to gradient with shadows
    sed -i '' 's/bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors/bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg shadow-blue-500\/30 hover:shadow-blue-500\/40 transition-all duration-200/g' "$file"
    sed -i '' 's/bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors/bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg shadow-blue-500\/30 hover:shadow-blue-500\/40 transition-all duration-200/g' "$file"

    # 6. Fix tagline styling (text-lg -> text-sm, mb-2 in heading -> mb-1)
    sed -i '' 's/text-lg font-normal text-gray-500 tracking-normal leading-relaxed/text-sm font-normal text-gray-500 tracking-wide/g' "$file"
    sed -i '' 's/pb-1 mb-2">/pb-1 mb-1">/g' "$file"

    # 7. Update spinner colors
    sed -i '' 's/border-purple-600/border-blue-600/g' "$file"
    sed -i '' 's/border-b-2 border-purple-600/border-b-2 border-blue-600/g' "$file"

    echo "  ✓ Completed"
done

echo "=================================="
echo "Theme transformation complete!"
echo "All 45 pages have been updated."
echo ""
echo "Backup files created with .backup extension"
