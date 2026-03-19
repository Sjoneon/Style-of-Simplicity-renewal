param(
    [string]$ExpectedBranch = "main",
    [string]$BackendProfile = "dev",
    [int]$FrontendPort = 3000,
    [switch]$SkipRemoteGuard
)

$ErrorActionPreference = "Stop"

function Fail([string]$Message) {
    Write-Host "[SAFE-GUARD] $Message" -ForegroundColor Red
    exit 1
}

function Info([string]$Message) {
    Write-Host "[SAFE-GUARD] $Message" -ForegroundColor Cyan
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path
Set-Location $repoRoot

# 1) Ensure this script runs inside the renewal repo root.
$requiredPaths = @(".git", "frontend", "sosos")
foreach ($path in $requiredPaths) {
    if (-not (Test-Path (Join-Path $repoRoot $path))) {
        Fail "Missing required path '$path'. Run this script from Style-of-Simplicity repo."
    }
}

$gitRoot = (git rev-parse --show-toplevel 2>$null)
if (-not $gitRoot) {
    Fail "Not a git repository."
}
$gitRoot = (Resolve-Path $gitRoot.Trim()).Path
if ($gitRoot -ne $repoRoot) {
    Fail "Git root mismatch. Expected '$repoRoot' but got '$gitRoot'."
}

# 2) Branch guard.
$currentBranch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($currentBranch -ne $ExpectedBranch) {
    Fail "Current branch is '$currentBranch'. Switch to '$ExpectedBranch' and retry."
}

# 3) Remote guard: prevent accidental push target confusion.
if (-not $SkipRemoteGuard) {
    $renewalPush = (git remote get-url --push renewal 2>$null)
    if (-not $renewalPush) {
        Fail "Push remote 'renewal' is missing. Configure renewal remote first."
    }

    $originPush = (git remote get-url --push origin 2>$null)
    if ($originPush -and $originPush.Trim() -ne "DISABLED") {
        Fail "origin push is enabled ('$originPush'). Disable it or run with -SkipRemoteGuard."
    }
}

# 4) DB env guard.
if ([string]::IsNullOrWhiteSpace($env:DB_USERNAME) -or [string]::IsNullOrWhiteSpace($env:DB_PASSWORD)) {
    Fail "DB_USERNAME and DB_PASSWORD env vars are required."
}

# 5) Cleanup previous listeners on dev ports.
$ports = @(8085, 5173, $FrontendPort)
$active = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $ports -contains $_.LocalPort } |
    Select-Object -ExpandProperty OwningProcess -Unique

if ($active) {
    Info ("Stopping existing processes on ports {0}" -f ($ports -join ", "))
    foreach ($processId in $active) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
}

# 6) Start backend.
$backendCommand = @"
cd '$repoRoot\sosos'
`$env:DB_USERNAME='$env:DB_USERNAME'
`$env:DB_PASSWORD='$env:DB_PASSWORD'
.\mvnw.cmd spring-boot:run '-Dspring-boot.run.profiles=$BackendProfile'
"@
$backendProcess = Start-Process -FilePath "powershell" -ArgumentList @(
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        $backendCommand
    ) -PassThru

# 7) Start frontend.
$frontendCommand = "cd '$repoRoot\frontend'; npm run dev -- --host --port $FrontendPort"
$frontendProcess = Start-Process -FilePath "powershell" -ArgumentList @(
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        $frontendCommand
    ) -PassThru

# 8) Wait for listen ports.
$deadline = (Get-Date).AddSeconds(60)
do {
    Start-Sleep -Milliseconds 800
    $listening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalPort -in @(8085, $FrontendPort) } |
        Select-Object -ExpandProperty LocalPort
} while ((Get-Date) -lt $deadline -and (($listening -notcontains 8085) -or ($listening -notcontains $FrontendPort)))

if (($listening -notcontains 8085) -or ($listening -notcontains $FrontendPort)) {
    Fail "Server did not start on expected ports. Check process logs."
}

Info "Backend PID: $($backendProcess.Id)  -> http://localhost:8085"
Info "Frontend PID: $($frontendProcess.Id) -> http://localhost:$FrontendPort"
Info "Safe start complete."
