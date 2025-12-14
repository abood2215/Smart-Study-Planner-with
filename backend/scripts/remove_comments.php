<?php
/**
 * Remove Comments from PHP Files
 * Converts and replaces Python and Shell script functionality
 * Usage: php scripts/remove_comments.php
 */

class CommentRemover {
    private $base_dir;
    private $processed_count = 0;
    private $success_count = 0;

    public function __construct($base_dir) {
        $this->base_dir = $base_dir;
    }

    /**
     * Remove all types of comments from PHP code
     */
    private function removePhpComments($content) {
        // Remove multi-line comments /* */
        $content = preg_replace('/\/\*.*?\*\//s', '', $content);

        // Remove single-line comments starting with //
        // But preserve URLs (http://, https://)
        $content = preg_replace('/(?<!:)\/\/(?!\/)(?!.*$)[^\n]*/', '', $content);

        // Remove single-line comments starting with #
        // But preserve #! shebang lines
        $content = preg_replace('/(?<!<\?php )#(?!!)[^\n]*/', '', $content);

        // Remove empty lines left after comment removal
        $lines = explode("\n", $content);
        $cleaned_lines = [];

        foreach ($lines as $line) {
            $stripped = rtrim($line);
            if ($stripped || (!$stripped && !empty($cleaned_lines) && trim(end($cleaned_lines)))) {
                $cleaned_lines[] = rtrim($line);
            }
        }

        // Remove trailing empty lines
        while (!empty($cleaned_lines) && !trim(end($cleaned_lines))) {
            array_pop($cleaned_lines);
        }

        return implode("\n", $cleaned_lines) . "\n";
    }

    /**
     * Detect file encoding (UTF-8, ISO-8859-1, etc.)
     */
    private function detectEncoding($file_path) {
        $file_content = file_get_contents($file_path, false, null, 0, 4096);
        
        if (mb_detect_encoding($file_content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true)) {
            return mb_detect_encoding($file_content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
        }
        
        return 'UTF-8';
    }

    /**
     * Process a single PHP file
     */
    private function processPhpFile($file_path) {
        try {
            $encoding = $this->detectEncoding($file_path);
            echo "Processing: {$file_path} (encoding: {$encoding})\n";

            $content = file_get_contents($file_path);
            
            // Convert to UTF-8 if needed
            if ($encoding !== 'UTF-8') {
                $content = mb_convert_encoding($content, 'UTF-8', $encoding);
            }

            $cleaned_content = $this->removePhpComments($content);

            file_put_contents($file_path, $cleaned_content);

            echo "✓ Successfully processed: {$file_path}\n";
            $this->success_count++;
            return true;

        } catch (Exception $e) {
            echo "✗ Error processing {$file_path}: " . $e->getMessage() . "\n";
            return false;
        }
    }

    /**
     * Find all PHP files recursively
     */
    private function findPhpFiles($dir) {
        $files = [];
        
        if (!is_dir($dir)) {
            return $files;
        }

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $files[] = $file->getRealPath();
            }
        }

        return $files;
    }

    /**
     * Main execution
     */
    public function run() {
        echo "Smart Study Planner - Comment Remover\n";
        echo str_repeat("-", 60) . "\n";

        $php_files = $this->findPhpFiles($this->base_dir);
        $this->processed_count = count($php_files);

        if ($this->processed_count === 0) {
            echo "No PHP files found in: {$this->base_dir}\n";
            return;
        }

        echo "Found {$this->processed_count} PHP files\n";
        echo str_repeat("-", 60) . "\n";

        foreach ($php_files as $php_file) {
            $this->processPhpFile($php_file);
        }

        echo str_repeat("-", 60) . "\n";
        echo "Processed {$this->success_count}/{$this->processed_count} files successfully\n";
    }
}

// Run the script
if (php_sapi_name() === 'cli') {
    $base_dir = __DIR__ . '/../';
    $remover = new CommentRemover($base_dir);
    $remover->run();
} else {
    echo "This script must be run from the command line.\n";
    exit(1);
}
?>
