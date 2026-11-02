# Read-only local checks: MCP initialize/tools-list and Tencent EdgeOne DescribePagesProjects.
# No deployment, no project creation, and no credential persistence.
param(
  [switch]$SkipCloudApi
)
$ErrorActionPreference = "Stop"
$nodeScript = Join-Path $PSScriptRoot "verify-edgeone-mcp.mjs"
if (-not (Test-Path $nodeScript)) {
  Write-Error "Missing verify-edgeone-mcp.mjs beside this script."
  exit 1
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is not available on PATH."
  exit 1
}

$oldToken = [Environment]::GetEnvironmentVariable("EDGEONE_PAGES_API_TOKEN", "Process")
$hadToken = -not [string]::IsNullOrWhiteSpace($oldToken)
$tokenChanged = $false
try {
  if ($SkipCloudApi) {
    [Environment]::SetEnvironmentVariable("EDGEONE_PAGES_API_TOKEN", $null, "Process")
    $tokenChanged = $true
  } elseif (-not $hadToken) {
    $userToken = [Environment]::GetEnvironmentVariable("EDGEONE_PAGES_API_TOKEN", "User")
    if (-not [string]::IsNullOrWhiteSpace($userToken)) {
      [Environment]::SetEnvironmentVariable("EDGEONE_PAGES_API_TOKEN", $userToken, "Process")
      $tokenChanged = $true
    } else {
      Write-Host "Enter your Tencent EdgeOne API token locally; it will NOT be displayed or saved."
      Write-Host "To skip cloud API validation, press Enter without typing a token."
      $secret = Read-Host "EDGEONE_PAGES_API_TOKEN" -AsSecureString
      $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
      try {
        $value = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
        if (-not [string]::IsNullOrWhiteSpace($value)) {
          [Environment]::SetEnvironmentVariable("EDGEONE_PAGES_API_TOKEN", $value, "Process")
          $tokenChanged = $true
        }
        $value = $null
      } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
      }
    }
  }

  & node $nodeScript
  $result = $LASTEXITCODE
} finally {
  if ($tokenChanged) {
    [Environment]::SetEnvironmentVariable("EDGEONE_PAGES_API_TOKEN", $oldToken, "Process")
  }
}
exit $result
