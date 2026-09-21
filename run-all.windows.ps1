param(
  [ValidateSet('lan', 'emulator')]
  [string]$MobileMode = 'lan',
  [ValidateSet('container', 'local')]
  [string]$BackendMode = 'container',
  [switch]$SkipInfra,
  [switch]$SkipBackend,
  [switch]$SkipWeb,
  [switch]$SkipMobile
)

$ErrorActionPreference = 'Stop'
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

  return '127.0.0.1'
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

function Wait-HttpHealth([string]$Name, [string]$Url, [int]$TimeoutSeconds = 60) {
  Write-Host "[wait] checking health for $Name ($Url)..." -NoNewline
  $elapsed = 0
  while ($elapsed -lt $TimeoutSeconds) {
    try {
      $res = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
      if ($res.StatusCode -ge 200 -and $res.StatusCode -lt 400) {
        Write-Host " [READY]" -ForegroundColor Green
        return $true
      }
    } catch {
      # retry
    }
    Start-Sleep -Seconds 2
    $elapsed += 2
    Write-Host "." -NoNewline
  }
  Write-Host " [TIMEOUT]" -ForegroundColor Yellow
  return $false
}

$lanIp = Resolve-LanIp
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " NEXUS LOGISTICS PLATFORM (WINDOWS RUNNER)" -ForegroundColor Cyan
Write-Host " LAN IP: $lanIp | MobileMode: $MobileMode" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Update .env files
$mobileGatewayUrl = if ($MobileMode -eq 'emulator') { 'http://10.0.2.2:3000' } else { "http://$lanIp`:3000" }
$s3Endpoint = if ($MobileMode -eq 'emulator') { 'http://10.0.2.2:9000' } else { "http://$lanIp`:9000" }

Write-Host "`n>>> [1/4] Updating environment (.env) configs..." -ForegroundColor Yellow

# Courier Mobile
$courierEnv = Join-Path $rootDir 'apps/courier-mobile/.env'
Set-EnvValue -FilePath $courierEnv -Key 'EXPO_PUBLIC_GATEWAY_BASE_URL' -Value $mobileGatewayUrl
Set-EnvValue -FilePath $courierEnv -Key 'EXPO_PUBLIC_GATEWAY_FALLBACK_BASE_URLS' -Value "$mobileGatewayUrl,http://$lanIp`:3000,http://10.0.2.2:3000,http://localhost:3000"
Write-Host "  [OK] courier-mobile .env -> $mobileGatewayUrl"

# Customer Mobile
$customerEnv = Join-Path $rootDir 'apps/customer-mobile/.env'
Set-EnvValue -FilePath $customerEnv -Key 'EXPO_PUBLIC_GATEWAY_BASE_URL' -Value $mobileGatewayUrl
Write-Host "  [OK] customer-mobile .env -> $mobileGatewayUrl"

# Gateway BFF
$gatewayDir = Join-Path $rootDir 'services/gateway-bff'
$gatewayEnv = Join-Path $gatewayDir '.env'
if (-not (Test-Path $gatewayEnv) -and (Test-Path (Join-Path $gatewayDir '.env.example'))) {
  Copy-Item (Join-Path $gatewayDir '.env.example') $gatewayEnv
}
Set-EnvValue -FilePath $gatewayEnv -Key 'S3_ENDPOINT' -Value $s3Endpoint
Set-EnvValue -FilePath $gatewayEnv -Key 'AUTH_SERVICE_URL' -Value 'http://localhost:3010'
Set-EnvValue -FilePath $gatewayEnv -Key 'DELIVERY_SERVICE_URL' -Value 'http://localhost:3007'
Set-EnvValue -FilePath $gatewayEnv -Key 'DISPATCH_SERVICE_URL' -Value 'http://localhost:3004'
Set-EnvValue -FilePath $gatewayEnv -Key 'MANIFEST_SERVICE_URL' -Value 'http://localhost:3005'
Set-EnvValue -FilePath $gatewayEnv -Key 'MASTERDATA_SERVICE_URL' -Value 'http://localhost:3001'
Set-EnvValue -FilePath $gatewayEnv -Key 'PICKUP_SERVICE_URL' -Value 'http://localhost:3003'
Set-EnvValue -FilePath $gatewayEnv -Key 'REPORTING_SERVICE_URL' -Value 'http://localhost:3009'
Set-EnvValue -FilePath $gatewayEnv -Key 'SCAN_SERVICE_URL' -Value 'http://localhost:3006'
Set-EnvValue -FilePath $gatewayEnv -Key 'SHIPMENT_SERVICE_URL' -Value 'http://localhost:3002'
Set-EnvValue -FilePath $gatewayEnv -Key 'TRACKING_SERVICE_URL' -Value 'http://localhost:3008'
Set-EnvValue -FilePath $gatewayEnv -Key 'PAYMENT_SERVICE_URL' -Value 'http://localhost:3011'
Set-EnvValue -FilePath $gatewayEnv -Key 'PRICING_SERVICE_URL' -Value 'http://localhost:3012'
Write-Host "  [OK] gateway-bff .env -> S3_ENDPOINT=$s3Endpoint"

# Web apps
@('apps/ops-web/.env', 'apps/guest-web/.env', 'apps/merchant-web/.env', 'apps/admin-web/.env') | ForEach-Object {
  $p = Join-Path $rootDir $_
  Set-EnvValue -FilePath $p -Key 'VITE_GATEWAY_BFF_URL' -Value 'http://localhost:3000'
}
Write-Host "  [OK] Web apps .env -> VITE_GATEWAY_BFF_URL=http://localhost:3000"

# 2. Infra & Backend
if (-not $SkipBackend) {
  Write-Host "`n>>> [2/4] Starting Docker infrastructure and microservices..." -ForegroundColor Yellow
  $infraFile = Join-Path $rootDir 'infra/dev/docker-compose.yml'
  $servicesFile = Join-Path $rootDir 'infra/dev/docker-compose.services.yml'

  if (-not $SkipInfra) {
    docker compose -f $infraFile up -d --remove-orphans
  }
  docker compose -f $infraFile -f $servicesFile up -d --remove-orphans

  # Wait for Gateway BFF
  Wait-HttpHealth -Name 'Gateway BFF' -Url 'http://localhost:3000/health' -TimeoutSeconds 45
}

# 3. Web Frontends
if (-not $SkipWeb) {
  Write-Host "`n>>> [3/4] Launching Web Frontends in background..." -ForegroundColor Yellow

  # Clean up any lingering processes on frontend ports to avoid port collision/swapping
  @(5173, 5174, 5175, 5176, 5177, 3013) | ForEach-Object {
    Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique |
      ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
  }

  $webApps = @(
    @{ Name = 'Ops Web'; Dir = 'apps/ops-web'; Port = 5173 },
    @{ Name = 'Merchant Web'; Dir = 'apps/merchant-web'; Port = 5174 },
    @{ Name = 'Admin Web'; Dir = 'apps/admin-web'; Port = 5175 },
    @{ Name = 'Guest Web'; Dir = 'apps/guest-web'; Port = 5177 }
  )

  foreach ($app in $webApps) {
    $dirPath = Join-Path $rootDir $app.Dir
    Write-Host "  Starting $($app.Name) on port $($app.Port)..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$dirPath'; npm run dev -- --host 0.0.0.0 --port $($app.Port) --strictPort" -WindowStyle Minimized
  }

  $chatbotDir = Join-Path $rootDir 'services/chatbot-service'
  if (Test-Path $chatbotDir) {
    Write-Host "  Starting AI Chatbot Service on port 3013..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$chatbotDir'; npm run start:dev" -WindowStyle Minimized
  }
}

# 4. Mobile Apps
if (-not $SkipMobile) {
  Write-Host "`n>>> [4/4] Launching Mobile Apps Expo Dev Server..." -ForegroundColor Yellow

  $courierDir = Join-Path $rootDir 'apps/courier-mobile'
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$courierDir'; npm run start"
  Write-Host "  [OK] Courier Mobile started in a new PowerShell window (Port 8081)"

  $customerDir = Join-Path $rootDir 'apps/customer-mobile'
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$customerDir'; npm run start"
  Write-Host "  [OK] Customer Mobile started in a new PowerShell window (Port 8082)"
}

Write-Host "`n=================================================" -ForegroundColor Green
Write-Host " NEXUS LOGISTICS SYSTEM IS READY!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host " Gateway BFF:     http://localhost:3000/health (LAN: http://$lanIp`:3000)"
Write-Host " AI Chatbot:      http://localhost:3013/health"
Write-Host " Ops Web:         http://localhost:5173"
Write-Host " Merchant Web:    http://localhost:5174"
Write-Host " Admin Web:       http://localhost:5175"
Write-Host " Guest Web:       http://localhost:5177"
Write-Host " Courier Mobile:  Expo Port 8081"
Write-Host " Customer Mobile: Expo Port 8082"
Write-Host "-------------------------------------------------"
Write-Host " Demo Logins (Password for all: password):"
Write-Host "   Merchant:  41100001"
Write-Host "   Courier:   30001001 / 30002015"
Write-Host "   Admin:     admin@nexus.dev"
Write-Host "=================================================" -ForegroundColor Green
