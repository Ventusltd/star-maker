# tick.ps1 — the 10-minute watch in one command. Prints the state and turns the dial by the
# headroom law. Law: GPU < 40 % and CPU < 50 % and VRAM < 6 GB and temp < 75 → dial +2 (max 16);
# GPU > 70 % or CPU > 70 % or VRAM > 8 GB or temp > 80 → dial −2 (min 4); otherwise hold.
$b = 'C:\Users\vikra\Desktop\Claude-Sandbox-MSI\bench'; $sky = 'C:\Users\vikra\Documents\GitHub\star-maker'
$ctl = "$b\state\star-control.json"
$procs = Get-CimInstance Win32_Process -Filter "name='node.exe'" | % { (($_.CommandLine).Trim() -split '\s+')[-1] }
$alive = @('server.mjs','starmaker.mjs','controlpad.mjs') | % { "$_=" + [int]($procs -contains $_) }
$m = [regex]::Matches((nvidia-smi --query-gpu=utilization.gpu,memory.used,temperature.gpu --format=csv,noheader,nounits), '\d+')
$g = [int]$m[0].Value; $vram = [int]$m[1].Value; $temp = [int]$m[2].Value
$cpu = [int](Get-CimInstance Win32_Processor).LoadPercentage
$ram = [math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1MB, 1)
$stars = Get-ChildItem "$sky\stars" -Filter *.json
$recent = ($stars | ? { $_.LastWriteTime -gt (Get-Date).AddMinutes(-10) }).Count
$tail = Get-Content "$b\state\starmaker.log" | Select-Object -Last 1
$errs = (Get-Content "$b\state\starmaker.log" | Select-Object -Last 200 | Select-String 'ERROR|failed').Count
$dial = 12; if (Test-Path $ctl) { $dial = [int](Get-Content $ctl -Raw | ConvertFrom-Json).concurrency }
$new = $dial
if ($g -lt 40 -and $cpu -lt 50 -and $vram -lt 6144 -and $temp -lt 75) { $new = [math]::Min(16, $dial + 2) }
if ($g -gt 70 -or $cpu -gt 70 -or $vram -gt 8192 -or $temp -gt 80) { $new = [math]::Max(4, $dial - 2) }
if ($tail -match 'pass done') { $new = $dial }   # nothing to speed up
if ($new -ne $dial) { "{`"concurrency`": $new}" | Set-Content $ctl -Encoding ascii }
$storage = try { (Invoke-RestMethod http://127.0.0.1:8790/api/storage -TimeoutSec 5) } catch { $null }
$sb = if ($storage) { [math]::Round($storage.sandbox_bytes/1GB, 2) } else { '?' }
$lastPush = git -C $sky log -1 --format='%cr' 2>$null
"TICK $(Get-Date -Format 'HH:mm') | $($alive -join ' ') | stars $($stars.Count) (+$recent in 10 min) | GPU ${g}% ${vram} MiB ${temp} C | CPU ${cpu}% | RAM free ${ram} GB | errs(last 200 lines) ${errs} | dial ${dial} -> ${new} | sandbox ${sb} GB overflow=$($storage.overflowing) | last push ${lastPush}"
"LAST: $tail"
