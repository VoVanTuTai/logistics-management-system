param(
  [ValidateSet('lan', 'emulator')]
  [string]$MobileMode = 'lan',
  [switch]$SkipInfra,
  [switch]$SkipMobile
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$rootDir = Resolve-Path $PSScriptRoot

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

function Set-EnvValue(
  [string]$FilePath,
  [string]$Key,
  [string]$Value
) {
  $line = "$Key=$Value"
  $keyPattern = "^\s*$([Regex]::Escape($Key))\s*="

  $lines = @()
  if (Test-Path $FilePath) {
    $lines = @(Get-Content -Path $FilePath)
  }

  $updated = $false
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match $keyPattern) {
      $lines[$i] = $line
      $updated = $true
      break
    }
  }

  if (-not $updated) {
    $lines += $line
  }

  Set-Content -Path $FilePath -Value $lines -Encoding UTF8
}

function Update-CourierMobileGatewayEnv([string]$mode) {
  $mobileDir = Join-Path $rootDir 'apps/courier-mobile'
  if (-not (Test-Path $mobileDir)) {
    throw "Missing app path for courier-mobile: $mobileDir"
  }

  $gatewayBaseUrl = if ($mode -eq 'emulator') {
    'http://10.0.2.2:3000'
  } else {
    $lanIp = Resolve-LanIp
    "http://$lanIp`:3000"
  }

  $envPath = Join-Path $mobileDir '.env'
  Set-EnvValue -FilePath $envPath -Key 'EXPO_PUBLIC_GATEWAY_BASE_URL' -Value $gatewayBaseUrl

  Write-Host "[mobile-env] updated $envPath"
  Write-Host "[mobile-env] EXPO_PUBLIC_GATEWAY_BASE_URL=$gatewayBaseUrl"
}

function Update-GatewayBffEnv([string]$mode) {
  $gatewayDir = Join-Path $rootDir 'services/gateway-bff'
  if (-not (Test-Path $gatewayDir)) {
    throw "Missing service path for gateway-bff: $gatewayDir"
  }

  $s3Endpoint = if ($mode -eq 'emulator') {
    'http://10.0.2.2:9000'
  } else {
    $lanIp = Resolve-LanIp
    "http://$lanIp`:9000"
  }

  $envPath = Join-Path $gatewayDir '.env'
  
  if (-not (Test-Path $envPath)) {
    $examplePath = Join-Path $gatewayDir '.env.example'
    if (Test-Path $examplePath) {
      Copy-Item $examplePath $envPath
    }
  }

  Set-EnvValue -FilePath $envPath -Key 'S3_ENDPOINT' -Value $s3Endpoint

  Write-Host "[gateway-env] updated $envPath"
  Write-Host "[gateway-env] S3_ENDPOINT=$s3Endpoint"
}

Push-Location $rootDir
try {
  if (-not $SkipMobile) {
    Update-CourierMobileGatewayEnv -mode $MobileMode
  } else {
    Write-Host '[mobile-env] skipped by flag -SkipMobile'
  }

  Update-GatewayBffEnv -mode $MobileMode

  $startScript = Join-Path $rootDir 'scripts/start-all-retry.windows.ps1'
  if (-not (Test-Path $startScript)) {
    throw "Missing start script: $startScript"
  }

  & $startScript -MobileMode $MobileMode -SkipInfra:$SkipInfra -SkipMobile:$SkipMobile

  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
finally {
  Pop-Location
}
