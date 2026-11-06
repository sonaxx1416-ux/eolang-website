# Rebuilds assets/eo.wasm (the playground's interpreter) from ..\..\source
# Run from the website folder:   powershell -ExecutionPolicy Bypass -File tools\build-wasm.ps1
$ErrorActionPreference = "Stop"
$site = Split-Path -Parent $PSScriptRoot
$src  = Join-Path (Split-Path -Parent $site) "source"
$tmp  = Join-Path $env:TEMP "eo-wasm-build"
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory $tmp | Out-Null
Copy-Item "$src\eo.go", "$src\eoBuild.go", "$src\go.mod" $tmp
Copy-Item "$PSScriptRoot\wasm_main.go" $tmp
# the browser build has its own main(), so the command-line one is renamed
(Get-Content "$tmp\eo.go" -Raw -Encoding UTF8) -replace '(?m)^func main\(\) \{', 'func cliMain() {' | Set-Content "$tmp\eo.go" -Encoding UTF8 -NoNewline
$env:GOOS = "js"; $env:GOARCH = "wasm"
go build -C $tmp -trimpath -ldflags="-s -w" -o "$site\assets\eo.wasm" .
Remove-Item Env:GOOS, Env:GOARCH
Copy-Item "$(go env GOROOT)\lib\wasm\wasm_exec.js" "$site\assets\wasm_exec.js"
Write-Host "Built assets\eo.wasm"
