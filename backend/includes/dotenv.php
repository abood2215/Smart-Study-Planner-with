<?php
// Minimal .env loader (no external dependency)
// Supports typical KEY=VALUE lines and PowerShell style: $env:VAR = 'value'
// Loads variables from project root .env into getenv() and $_ENV if not already set

$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;

        $name = null;
        $value = null;

        // PowerShell style: $env:VAR = 'value' or $env:VAR = "value"
        if (preg_match('/^\$env:([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/', $line, $m)) {
            $name = $m[1];
            $value = trim($m[2]);
        }

        // KEY=VALUE style
        elseif (preg_match('/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/', $line, $m)) {
            $name = $m[1];
            $value = trim($m[2]);
        }

        if ($name === null) continue;

        // remove surrounding quotes if present
        if ((substr($value, 0, 1) === '"' && substr($value, -1) === '"') || (substr($value, 0, 1) === "'" && substr($value, -1) === "'")) {
            $value = substr($value, 1, -1);
        }

        if (getenv($name) === false) {
            putenv("$name=$value");
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}
