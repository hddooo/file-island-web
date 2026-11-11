# Reviewed, manual host installation. Does not change credentials, permissions, ports or Nginx.
[CmdletBinding()]
param()
$ErrorActionPreference='Stop'
$controller='C:\Users\INNOGRID\Documents\Codex\2026-11-02\task-3\home-front-cd-controller'
$node='C:\Users\INNOGRID\Documents\Codex\2026-10-28\task-2\runner-package\unregistered\externals\node24\bin\node.exe'
$taskName='HanQ-Frontend-Health-Monitor'
$script=Join-Path $controller 'frontend-health.cjs'
$compose=Join-Path $controller 'runtime\compose.yaml.disabled'
$source=Join-Path $PSScriptRoot 'frontend-health.cjs'
if (!(Test-Path -LiteralPath $controller -PathType Container) -or !(Test-Path -LiteralPath $node -PathType Leaf)) {throw 'Expected installed controller/Node unavailable'}
$existing=Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing -and (($existing.Actions.Execute -ne $node) -or ($existing.Actions.Arguments -ne ('"'+$script+'"')))) {throw 'Task name belongs to an unexpected action; do not overwrite'}
$identity=docker inspect fileisland-web-candidate --format '{{index .Config.Labels "com.docker.compose.project"}}'
if ($LASTEXITCODE -ne 0 -or $identity.Trim() -ne 'fileisland-web-candidate') {throw 'Unexpected frontend target'}
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'
foreach($file in @($script,$compose)) {if(Test-Path -LiteralPath $file) {Copy-Item -LiteralPath $file -Destination ($file+'.before-resilience-'+$stamp)}}
if ($existing) {Export-ScheduledTask -TaskName $taskName | Set-Content -LiteralPath (Join-Path $controller ('frontend-task-before-'+$stamp+'.xml')) -Encoding utf8}
Copy-Item -LiteralPath $source -Destination $script
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'runtime\compose.yaml.disabled') -Destination $compose
if ((Get-FileHash -LiteralPath $source).Hash -ne (Get-FileHash -LiteralPath $script).Hash) {throw 'Installed monitor hash mismatch'}
& $node --check $script
if($LASTEXITCODE -ne 0) {throw 'Installed monitor syntax check failed'}
# This update does not recreate or restart the live frontend.
docker update --restart unless-stopped fileisland-web-candidate
if($LASTEXITCODE -ne 0) {throw 'Frontend restart policy update failed'}
$action=New-ScheduledTaskAction -Execute $node -Argument ('"'+$script+'"') -WorkingDirectory $controller
$user=[Security.Principal.WindowsIdentity]::GetCurrent().Name
$triggers=@((New-ScheduledTaskTrigger -AtLogOn -User $user),(New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 1)))
$principal=New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
$settings=New-ScheduledTaskSettingsSet -Hidden -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 2) -StartWhenAvailable
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $triggers -Principal $principal -Settings $settings -Description 'HanQ frontend HTTP checks; bounded frontend-only recovery. Maintenance file and deployment lock are respected.' -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
[pscustomobject]@{Task=$taskName;MonitorSHA256=(Get-FileHash -LiteralPath $script).Hash;ComposeSHA256=(Get-FileHash -LiteralPath $compose).Hash;User=$user;Privilege='Limited interactive user';DockerHealthcheck='Future recreation only; installed monitor probes current container without recreation'} | ConvertTo-Json
