param(
  [ValidateSet('lan', 'emulator')]
  [string]$MobileMode = 'lan',
  [switch]$SkipInfra,
  [switch]$SkipMobile
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$rootDir = Resolve-Path (Join-Path $PSScriptRoot '..')

function Test-PortListening([int]$port) {
  return $null -ne (Get-ListeningPid -port $port)
}

function Get-ListeningPid([int]$port) {
  try {
    $listener = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($listener) {
      return [int]$listener.OwningProcess
    }
  } catch {
    # Fallback handled below.
  }

  $pattern = "^\s*TCP\s+\S+:$port\s+\S+\s+LISTENING\s+(\d+)\s*$"
  foreach ($line in (netstat -ano -p tcp 2>$null)) {
    if ($line -match $pattern) {
      return [int]$Matches[1]
    }
  }

  return $null
}

function Wait-PortListening(
  [int]$port,
  [int]$timeoutSeconds = 30,
  [int]$sleepSeconds = 2
) {
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-PortListening $port) {
      return $true
    }
    Start-Sleep -Seconds $sleepSeconds
  }

  return $false
}

function Resolve-LanIp() {
  $defaultRoute = Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue |
    Sort-Object -Property RouteMetric, InterfaceMetric |
    Select-Object -First 1

  if ($defaultRoute) {
    $routeIp = Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $defaultRoute.InterfaceIndex -ErrorAction SilentlyContinue |
      Where-Object {
        $_.IPAddress -notlike '127.*' -and
        $_.IPAddress -notlike '169.254*'
      } |
      Select-Object -ExpandProperty IPAddress -First 1

    if ($routeIp) {
      return $routeIp
    }
  }

  $fallbackIp = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -notlike '127.*' -and
      $_.IPAddress -notlike '169.254*' -and
      $_.IPAddress -notlike '172.26.*' -and
      $_.IPAddress -notlike '172.25.*' -and
      $_.IPAddress -notlike '192.168.56.*'
    } |
    Select-Object -ExpandProperty IPAddress -First 1

  if ($fallbackIp) {
    return $fallbackIp
  }

  throw 'Cannot resolve LAN IPv4 address. Please check network and run again.'
}

function Start-WebUiProcess(
  [string]$name,
  [string]$relativePath,
  [int]$port
) {
  if (Test-PortListening $port) {
    Write-Host "[skip] $name already listening on port $port"
    return
  }

  $workingDir = Join-Path $rootDir $relativePath
  if (-not (Test-Path $workingDir)) {
    throw "Missing app path for ${name}: $workingDir"
  }

  $launcher = Start-Process `
    -FilePath 'cmd.exe' `
    -ArgumentList '/c', "npm run dev -- --host 0.0.0.0 --port $port" `
    -WorkingDirectory $workingDir `
    -WindowStyle Hidden `
    -PassThru

  Write-Host "[start] $name pid=$($launcher.Id) port=$port"
}

function Start-CourierMobileProcess([string]$mode) {
  $workingDir = Join-Path $rootDir 'apps/courier-mobile'
  if (-not (Test-Path $workingDir)) {
    throw "Missing app path for courier-mobile: $workingDir"
  }

  if (Test-PortListening 8081) {
    Write-Host '[skip] courier-mobile already listening on port 8081'
    return
  }

  $expoBin = Join-Path $workingDir 'node_modules\.bin\expo.cmd'
  if (-not (Test-Path $expoBin)) {
    Write-Host '[mobile] expo not found in courier-mobile/node_modules, running npm install...' -ForegroundColor Yellow
    Push-Location $workingDir
    try {
      & cmd.exe /c 'npm install'
      if ($LASTEXITCODE -ne 0) {
        throw 'npm install failed for courier-mobile'
      }
    } finally {
      Pop-Location
    }
  }

  $gatewayBaseUrl = if ($mode -eq 'emulator') {
    'http://10.0.2.2:3000'
  } else {
    $lanIp = Resolve-LanIp
    "http://$lanIp`:3000"
  }

  $expoHost = if ($mode -eq 'emulator') { 'localhost' } else { 'lan' }

  # Use /k so QR + Metro logs stay visible in a separate terminal window.
  $command = "set EXPO_PUBLIC_GATEWAY_BASE_URL=$gatewayBaseUrl && npm run start -- --host $expoHost --port 8081"

  $launcher = Start-Process `
    -FilePath 'cmd.exe' `
    -ArgumentList '/k', $command `
    -WorkingDirectory $workingDir `
    -PassThru

  Write-Host "[start] courier-mobile pid=$($launcher.Id) port=8081 mode=$mode"
  Write-Host "        EXPO_PUBLIC_GATEWAY_BASE_URL=$gatewayBaseUrl"
}

Push-Location $rootDir
try {
  if (-not $SkipInfra) {
    Write-Host '[infra] running dev-up (docker + migrate + seed)'
    $LASTEXITCODE = 0
    & (Join-Path $PSScriptRoot 'dev-up.ps1')
    if (-not $?) {
      throw 'dev-up failed'
    }
    if ($LASTEXITCODE -ne 0) {
      throw 'dev-up failed'
    }
  } else {
    Write-Host '[infra] skipped dev-up by flag'
  }

  Write-Host '[services] running start-services'
  $LASTEXITCODE = 0
  & (Join-Path $PSScriptRoot 'start-services.ps1')
  if (-not $?) {
    throw 'start-services failed'
  }
  if ($LASTEXITCODE -ne 0) {
    throw 'start-services failed'
  }

  Write-Host '[ui] starting web apps'
  Start-WebUiProcess -name 'ops-web' -relativePath 'apps/ops-web' -port 5173
  Start-WebUiProcess -name 'merchant-web' -relativePath 'apps/merchant-web' -port 5174
  Start-WebUiProcess -name 'admin-web' -relativePath 'apps/admin-web' -port 5175
  Start-WebUiProcess -name 'public-tracking' -relativePath 'apps/public-tracking' -port 5176

  if (-not $SkipMobile) {
    Write-Host '[ui] starting courier-mobile'
    Start-CourierMobileProcess -mode $MobileMode
    Write-Host '[ui] waiting for courier-mobile Metro (port 8081)...'
    $mobileReady = Wait-PortListening -port 8081 -timeoutSeconds 90 -sleepSeconds 2
    if (-not $mobileReady) {
      Write-Host '[ui] courier-mobile is not listening yet (Metro may still be starting).' -ForegroundColor Yellow
    }
  } else {
    Write-Host '[ui] skipped courier-mobile by flag'
  }

  Start-Sleep -Seconds 3

  Write-Host ''
  Write-Host '=== UI PORT STATUS ==='
  $uiPorts = @(
    @{ Name = 'ops-web'; Port = 5173 },
    @{ Name = 'merchant-web'; Port = 5174 },
    @{ Name = 'admin-web'; Port = 5175 },
    @{ Name = 'public-tracking'; Port = 5176 },
    @{ Name = 'courier-mobile'; Port = 8081 }
  )

  $uiRows = foreach ($uiPort in $uiPorts) {
    $listenerPid = Get-ListeningPid -port $uiPort.Port
    [pscustomobject]@{
      App = $uiPort.Name
      Port = $uiPort.Port
      Status = if ($null -ne $listenerPid) { 'UP' } else { 'DOWN' }
      Pid = $listenerPid
    }
  }

  $uiRows | Format-Table -AutoSize

  Write-Host ''
  Write-Host '=== OPEN URLS ==='
  Write-Host 'ops-web:         http://localhost:5173'
  Write-Host 'merchant-web:    http://localhost:5174'
  Write-Host 'admin-web:       http://localhost:5175'
  Write-Host 'public-tracking: http://localhost:5176'
  Write-Host 'courier-mobile:  http://localhost:8081'

  Write-Host ''
  Write-Host '=== SAMPLE ACCOUNTS ==='
  Write-Host 'admin-web:       10000001 / password'
  Write-Host 'ops-web:         20000001 / password'
  Write-Host 'merchant-web:    41100001 / merchant123456'
  Write-Host 'courier-mobile:  30000001 / password'
}
finally {
  Pop-Location
}
