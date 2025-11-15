import os
import re
import chardet

def detect_encoding(file_path):
    """Detect the encoding of a file"""
    with open(file_path, 'rb') as f:
        raw_data = f.read()
        result = chardet.detect(raw_data)
        return result['encoding']

def remove_php_comments(content):
    """Remove all types of comments from PHP code"""

    # Remove multi-line comments /* */
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)

    # Remove single-line comments starting with //
    # But preserve URLs (http://, https://)
    content = re.sub(r'(?<!:)//(?!/)[^\n]*', '', content)

    # Remove single-line comments starting with #
    # But preserve #! shebang lines
    content = re.sub(r'(?<!<\?php )#(?!!)[^\n]*', '', content)

    # Remove empty lines that were left after comment removal
    lines = content.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.rstrip()
        if stripped or (not stripped and cleaned_lines and cleaned_lines[-1].strip()):
            cleaned_lines.append(line.rstrip())

    # Remove trailing empty lines
    while cleaned_lines and not cleaned_lines[-1].strip():
        cleaned_lines.pop()

    return '\n'.join(cleaned_lines) + '\n'

def process_php_file(file_path):
    """Process a single PHP file to remove comments"""
    try:
        # Detect encoding
        encoding = detect_encoding(file_path)
        print(f"Processing {file_path} (encoding: {encoding})")

        # Read file with detected encoding
        with open(file_path, 'r', encoding=encoding) as f:
            content = f.read()

        # Remove comments
        cleaned_content = remove_php_comments(content)

        # Write back with same encoding
        with open(file_path, 'w', encoding=encoding) as f:
            f.write(cleaned_content)

        print(f"✓ Successfully processed {file_path}")
        return True
    except Exception as e:
        print(f"✗ Error processing {file_path}: {str(e)}")
        return False

def main():
    """Main function to process all PHP files"""
    base_dir = r"C:\xampp\htdocs\smart-study-planner"

    # Find all PHP files
    php_files = []
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.php'):
                php_files.append(os.path.join(root, file))

    print(f"Found {len(php_files)} PHP files")
    print("-" * 60)

    # Process each file
    success_count = 0
    for php_file in php_files:
        if process_php_file(php_file):
            success_count += 1

    print("-" * 60)
    print(f"Processed {success_count}/{len(php_files)} files successfully")

if __name__ == "__main__":
    main()
