Set-Location -LiteralPath $PSScriptRoot
$logDir = Join-Path $PSScriptRoot "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logPath = Join-Path $logDir "dashboard-server.log"

while ($true) {
  "[$(Get-Date)] starting dashboard" | Out-File -FilePath $logPath -Append -Encoding utf8
  & "C:\Program Files\nodejs\node.exe" "$PSScriptRoot\server.js" *>> $logPath
  "[$(Get-Date)] dashboard exited with $LASTEXITCODE, restarting in 2 seconds" | Out-File -FilePath $logPath -Append -Encoding utf8
  Start-Sleep -Seconds 2
}
