Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-NetTCPConnection -LocalPort 8767 -State Listen -ErrorAction SilentlyContinue)) {
    Start-Process -FilePath 'C:\Users\Lenovo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' -ArgumentList 'listing/server.cjs' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
}
Start-Process 'http://127.0.0.1:8766'
node .\server.cjs
