# Sync channel-manager plugin to extensions directory
# Usage: .\sync.ps1
# Run after any code change to update the discovered copy

$src = "C:\Users\User\.openclaw\plugins\channel-manager"
$dst = "C:\Users\User\.openclaw\extensions\channel-manager"

# Sync code files (exclude node_modules — deps installed separately)
robocopy $src $dst /MIR /XD node_modules .git dist .turbo .cache /XF sync.ps1 /NFL /NDL /NJH /NJS /NP

# Ensure deps are installed in extensions copy
if (-not (Test-Path "$dst\node_modules\better-sqlite3")) {
    Push-Location $dst
    npm install --production 2>&1 | Out-Null
    Pop-Location
    Write-Host "  Installed dependencies" -ForegroundColor Yellow
}

Write-Host "Synced channel-manager -> extensions" -ForegroundColor Green
