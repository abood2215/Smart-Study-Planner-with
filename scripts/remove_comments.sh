#!/bin/bash

# Function to remove comments from a PHP file
remove_php_comments() {
    local file="$1"
    local temp_file="${file}.tmp"
    local encoding=$(file -b --mime-encoding "$file")

    echo "Processing: $file (encoding: $encoding)"

    # Convert to UTF-8 if needed
    if [[ "$encoding" == "utf-16le" ]]; then
        iconv -f UTF-16LE -t UTF-8 "$file" > "${file}.utf8"
        mv "${file}.utf8" "$file"
    fi

    # Remove comments using sed
    # 1. Remove /* */ multi-line comments
    # 2. Remove // single-line comments
    # 3. Remove # single-line comments (but not in <?php #)
    sed -e ':a;N;$!ba;s|/\*[^*]*\*\+\([^/*][^*]*\*\+\)*/||g' \
        -e 's|//.*$||g' \
        -e 's|[[:space:]]*#[^!].*$||g' \
        "$file" > "$temp_file"

    # Remove trailing whitespace and excessive blank lines
    sed -e 's/[[:space:]]*$//' \
        -e '/^[[:space:]]*$/d' \
        "$temp_file" > "${file}.clean"

    mv "${file}.clean" "$file"
    rm -f "$temp_file"

    echo "✓ Completed: $file"
}

# Find all PHP files and process them
cd "C:\xampp\htdocs\smart-study-planner"

echo "Finding all PHP files..."
find . -name "*.php" -type f | while read -r php_file; do
    remove_php_comments "$php_file"
done

echo ""
echo "All files processed!"
