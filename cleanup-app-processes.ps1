$ErrorActionPreference = 'SilentlyContinue'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspace = (Resolve-Path $root).Path

$patterns = @(
  'server.cjs',
  'vite.js',
  'concurrently.js',
  'launch-electron.cjs',
  'node_modules\\electron\\dist\\electron.exe'
)

Get-CimInstance Win32_Process | ForEach-Object {
  $cmd = $_.CommandLine
  if (-not $cmd) {
    return
  }

  foreach ($pattern in $patterns) {
    if ($cmd -match [regex]::Escape($pattern)) {
      Stop-Process -Id $_.ProcessId -Force
      break
    }
  }
}
