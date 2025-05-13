#\!/bin/bash

# For each file that needs fixing
while read file; do
  echo "Processing $file..."
  
  # Use perl for the regex substitution (more reliable than sed for complex patterns)
  perl -i -pe 's/asChalkColor\(\(asChalkColor\(\(asChalkColor\(\(['"'"'"]([^'"'"'"]+)['"'"'"]\)\)\)\)\)\)/asChalkColor\('\1'\)/g' "$file"
  perl -i -pe 's/asChalkColor\(\(asChalkColor\(\(['"'"'"]([^'"'"'"]+)['"'"'"]\)\)\)\)/asChalkColor\('\1'\)/g' "$file"
  perl -i -pe 's/asChalkColor\(\(['"'"'"]([^'"'"'"]+)['"'"'"]\)\)/asChalkColor\('\1'\)/g' "$file"
  
  echo "Finished processing $file"
done < files_to_fix.txt

echo "All files processed\!"
