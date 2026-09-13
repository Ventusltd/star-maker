# ventus.ps1 — the terminal surface of the Spider. Same elements, same stars, same Bench;
# written on a keyboard instead of touched on the web. Usage:
#   ventus element <symbol|name>        show one element from the periodic table
#   ventus elements [family]            list the table (physics, vocabulary, engine, cartridge, data-layer, contract)
#   ventus stars [RED|AMBER|GREEN] [n]  newest stars, optionally by verdict
#   ventus star <id>                    one star in full
#   ventus drive '<json choice>' [query] drive a composition on the Bench now, e.g. ventus drive '{"enabled":{"sld-sandbox":false}}'
#   ventus map <repd_ref> <technology>  fire the MAP button for a project and report the arrival
#   ventus tick                         the 10-minute watch, once
param([Parameter(Position=0)][string]$cmd = 'help', [Parameter(Position=1)][string]$a, [Parameter(Position=2)][string]$b2, [Parameter(Position=3)][string]$c)
$sky = if ($env:SKY_DIR) { $env:SKY_DIR } else { 'C:\Users\vikra\Documents\GitHub\star-maker' }
$bench = 'http://127.0.0.1:8790'
function T { (Get-Content "$sky\elements\table.json" -Raw | ConvertFrom-Json).elements }
switch ($cmd) {
  'element'  { T | ? { $_.symbol -eq $a -or $_.name -like "*$a*" -or $_.key -like "*$a*" } | % { $_ | ConvertTo-Json -Depth 5 } }
  'elements' { T | ? { -not $a -or $_.family -eq $a } | Select-Object number, symbol, family, name, state | Format-Table -AutoSize }
  'stars'    { $n = if ($b2) { [int]$b2 } else { 20 }; Get-ChildItem "$sky\stars" -Filter *.json | Sort-Object LastWriteTime -Descending | % { Get-Content $_.FullName -Raw | ConvertFrom-Json } | ? { -not $a -or $_.verdict -eq $a } | Select-Object -First $n | % { "{0} {1,-5} {2}" -f $_.id, $_.verdict, $_.seed.label } }
  'star'     { Get-Content "$sky\stars\$a.json" -Raw }
  'drive'    { $choice = $a | ConvertFrom-Json; $body = @{ choice = @{ enabled = if ($choice.enabled) { $choice.enabled } else { @{} }; selected = if ($choice.selected) { $choice.selected } else { @{} } }; query = $b2 } | ConvertTo-Json -Depth 5; $r = Invoke-RestMethod -Method Post -Uri "$bench/api/testdrive" -ContentType application/json -Body $body -TimeoutSec 240; "$($r.verdict) · universe $($r.universe) · $($r.loadMs) ms · loaded $($r.composition.order -join ',')"; $r.findings | % { "  [$($_.level)] $($_.part): $($_.text)" } }
  'map'      { $body = @{ choice = @{ enabled = @{}; selected = @{} }; query = "repd_ref=$a&technology=$b2&zoom=12"; expect = if ($c) { $c } else { $null } } | ConvertTo-Json -Depth 5; $r = Invoke-RestMethod -Method Post -Uri "$bench/api/testdrive" -ContentType application/json -Body $body -TimeoutSec 240; "$($r.verdict) · arrived=$($r.arrival.arrived) · km: $($r.arrival.km -join ', ') · $($r.arrival.failed -join ' | ')" }
  'tick'     { & "$PSScriptRoot\tick.ps1" }
  default    { Get-Content $PSCommandPath | Select-Object -First 10 | % { $_.TrimStart('# ') } }
}
