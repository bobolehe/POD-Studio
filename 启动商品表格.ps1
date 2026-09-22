$root=$PSScriptRoot
if (-not (Get-NetTCPConnection -LocalPort 8767 -State Listen -ErrorAction SilentlyContinue)) {
  $node='C:\Users\Lenovo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
  Start-Process -FilePath $node -ArgumentList 'listing/server.cjs' -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput "$root\listing\server.log" -RedirectStandardError "$root\listing\server-error.log"
}
Start-Process 'http://127.0.0.1:8767/listing.html'
