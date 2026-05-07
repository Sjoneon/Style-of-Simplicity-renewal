param(
    [string]$RootPath = "."
)

$ErrorActionPreference = "Stop"

$resolvedRoot = (Resolve-Path -LiteralPath $RootPath).Path
Set-Location -LiteralPath $resolvedRoot

$extensions = @(
    ".md", ".java", ".js", ".jsx", ".ts", ".tsx", ".json", ".properties",
    ".xml", ".html", ".css", ".scss", ".yml", ".yaml", ".env", ".txt",
    ".sql", ".ps1", ".sh", ".cmd", ".bat"
)

$excludeDirRegex = [regex]"(\\|/)(node_modules|target|dist|build|\.git|\.idea|\.next|coverage)(\\|/)"

$patterns = @(
    @{ Name = "replacement-char"; Regex = [regex]([string][char]0xFFFD) },
    @{ Name = "question-before-korean"; Regex = [regex]"\?[\uAC00-\uD7A3]" },
    @{ Name = "compatibility-ideograph"; Regex = [regex]"[\uF900-\uFAFF]" }
)

$hits = New-Object System.Collections.Generic.List[object]

$files = Get-ChildItem -Path $resolvedRoot -Recurse -File | Where-Object {
    ($extensions -contains $_.Extension.ToLowerInvariant()) -and
    -not $excludeDirRegex.IsMatch($_.FullName)
}

foreach ($file in $files) {
    $lines = Get-Content -LiteralPath $file.FullName -Encoding UTF8
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        foreach ($pattern in $patterns) {
            if ($pattern.Regex.IsMatch($line)) {
                $hits.Add([pscustomobject]@{
                        Path    = $file.FullName.Replace($resolvedRoot + "\", "")
                        Line    = $i + 1
                        Pattern = $pattern.Name
                        Text    = $line.Trim()
                    })
            }
        }
    }
}

if ($hits.Count -eq 0) {
    Write-Host "OK: garbled-Korean patterns not found"
    exit 0
}

Write-Host "FAIL: garbled-Korean patterns found ($($hits.Count) hits)"
$hits | Sort-Object Path, Line, Pattern | Format-Table -AutoSize
exit 1
