$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$rootDir = Resolve-Path (Join-Path $PSScriptRoot '..')

$services = @(
  @{ Name = 'gateway-bff'; Path = 'services/gateway-bff'; Port = 3000 },
  @{ Name = 'masterdata-service'; Path = 'services/masterdata-service'; Port = 3001 },
  @{ Name = 'shipment-service'; Path = 'services/shipment-service'; Port = 3002 },
  @{ Name = 'pickup-service'; Path = 'services/pickup-service'; Port = 3003 },
  @{ Name = 'dispatch-service'; Path = 'services/dispatch-service'; Port = 3004 },
  @{ Name = 'manifest-service'; Path = 'services/manifest-service'; Port = 3005 },
  @{ Name = 'scan-service'; Path = 'services/scan-service'; Port = 3006 },
  @{ Name = 'delivery-service'; Path = 'services/delivery-service'; Port = 3007 },
  @{ Name = 'tracking-service'; Path = 'services/tracking-service'; Port = 3008 },
  @{ Name = 'reporting-service'; Path = 'services/reporting-service'; Port = 3009 },
  @{ Name = 'auth-service'; Path = 'services/auth-service'; Port = 3010 }
)

function Test-PortListening([int]$port) {
  return $null -ne (Get-ListeningPid -port $port)
}

function Test-HttpOk(
  [string]$url,
  [int]$timeoutSeconds = 5
) {
  try {
    $response = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -TimeoutSec $timeoutSeconds
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300)
  } catch {
    return $false
  }
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

function Test-DockerContainerHealthy([string]$containerName) {
  try {
    $status = & docker inspect --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}" $containerName 2>$null
    if ($LASTEXITCODE -ne 0) { return $false }
    return ($status -and $status.Trim() -eq 'healthy')
  } catch {
    return $false
  }
}

function Test-DockerHealthAccess() {
  try {
    & docker ps --format "{{.ID}}" 1>$null 2>$null
    return ($LASTEXITCODE -eq 0)
  } catch {
    return $false
  }
}

Push-Location $rootDir
try {

  $infraPorts = @(5672, 15432, 15433, 15434, 15435, 15436, 15437, 15438, 15439, 15440, 15441)
  $infraContainers = @(
    'jms-dev-rabbitmq',
    'jms-dev-postgres-auth',
    'jms-dev-postgres-masterdata',
    'jms-dev-postgres-shipment',
    'jms-dev-postgres-pickup',
    'jms-dev-postgres-dispatch',
    'jms-dev-postgres-manifest',
    'jms-dev-postgres-scan',
    'jms-dev-postgres-delivery',
    'jms-dev-postgres-tracking',
    'jms-dev-postgres-reporting'
  )
  $dockerAvailable = $null -ne (Get-Command docker -ErrorAction SilentlyContinue)
  $dockerHealthAccess = $dockerAvailable -and (Test-DockerHealthAccess)
  if ($dockerAvailable -and -not $dockerHealthAccess) {
    Write-Host '[infra] docker CLI detected but no inspect permission. Falling back to port-only readiness checks.' -ForegroundColor Yellow
  }

  $infraReady = $true
  foreach ($infraPort in $infraPorts) {
    if (-not (Test-PortListening $infraPort)) {
      $infraReady = $false
      break
    }
  }

  if (-not $infraReady) {
    Write-Host '[infra] docker ports missing, starting infra/dev docker-compose'
    try {
      docker compose -f infra/dev/docker-compose.yml up -d
      if ($LASTEXITCODE -ne 0) {
        Write-Host '[infra] docker compose failed, continue starting services anyway.' -ForegroundColor Yellow
      }
    } catch {
      Write-Host "[infra] cannot run docker compose ($($_.Exception.Message)), continue starting services anyway." -ForegroundColor Yellow
    }
  }

  $infraDeadline = (Get-Date).AddMinutes(3)
  $infraReady = $false
  while ((Get-Date) -lt $infraDeadline) {
    $allInfraPortsUp = $true
    foreach ($infraPort in $infraPorts) {
      if (-not (Test-PortListening $infraPort)) {
        $allInfraPortsUp = $false
        break
      }
    }

    $allInfraHealthy = $true
    if ($dockerHealthAccess) {
      foreach ($containerName in $infraContainers) {
        if (-not (Test-DockerContainerHealthy $containerName)) {
          $allInfraHealthy = $false
          break
        }
      }
    }

    if ($allInfraPortsUp -and $allInfraHealthy) {
      $infraReady = $true
      break
    }

    Start-Sleep -Seconds 2
  }

  if ($infraReady) {
    Write-Host '[infra] dependencies are ready (ports + health).'
  } else {
    Write-Host '[infra] dependencies not fully ready after timeout, continue starting services anyway.' -ForegroundColor Yellow
  }

  Write-Host "[services] starting $($services.Count) backend services"

  $started = @()
  foreach ($service in $services) {
    if (Test-PortListening $service.Port) {
      Write-Host "[skip] $($service.Name) already listening on port $($service.Port)"
      continue
    }

    $workingDir = Join-Path $rootDir $service.Path
    if (-not (Test-Path $workingDir)) {
      Write-Host "[missing] $($service.Name) path not found: $workingDir"
      continue
    }

    $launcher = Start-Process `
      -FilePath 'cmd.exe' `
      -ArgumentList '/c', 'npx ts-node src/main.ts' `
      -WorkingDirectory $workingDir `
      -WindowStyle Hidden `
      -PassThru

    $started += [pscustomobject]@{
      Service = $service.Name
      Port = $service.Port
      LauncherPid = $launcher.Id
    }

    Write-Host "[start] $($service.Name) launcher pid=$($launcher.Id)"
    Start-Sleep -Milliseconds 250
  }

  $deadline = (Get-Date).AddMinutes(4)
  while ((Get-Date) -lt $deadline) {
    $downServices = $services | Where-Object { -not (Test-PortListening $_.Port) }
    if ($downServices.Count -eq 0) { break }
    Start-Sleep -Seconds 3
  }

  Write-Host ''
  Write-Host '=== STARTED ==='
  if ($started.Count -eq 0) {
    Write-Host '(none, all were already up)'
  } else {
    $started | Format-Table -AutoSize
  }

  Write-Host ''
  Write-Host '=== PORT STATUS ==='
  $statusRows = foreach ($service in $services) {
    $listenerPid = Get-ListeningPid -port $service.Port
    if ($null -ne $listenerPid) {
      [pscustomobject]@{
        Service = $service.Name
        Port = $service.Port
        Status = 'UP'
        Pid = $listenerPid
      }
    } else {
      [pscustomobject]@{
        Service = $service.Name
        Port = $service.Port
        Status = 'DOWN'
        Pid = $null
      }
    }
  }

  $statusRows | Format-Table -AutoSize

  $downCount = @($statusRows | Where-Object { $_.Status -eq 'DOWN' }).Count
  if ($downCount -gt 0) {
    Write-Host ''
    Write-Host 'Some services are DOWN. Check console output above.' -ForegroundColor Yellow
    exit 1
  }

  $gatewayHealthy = Test-HttpOk -url 'http://localhost:3000/health' -timeoutSeconds 5
  $authHealthy = Test-HttpOk -url 'http://localhost:3010/health' -timeoutSeconds 5

  Write-Host ''
  Write-Host '=== HEALTH CHECK ==='
  Write-Host ("gateway-bff /health: " + ($(if ($gatewayHealthy) { 'OK' } else { 'FAILED' })))
  Write-Host ("auth-service /health: " + ($(if ($authHealthy) { 'OK' } else { 'FAILED' })))

  if (-not $authHealthy) {
    Write-Host '[warn] auth-service khong health-check duoc. Gateway login co the tra ve "fetch failed".' -ForegroundColor Yellow
  }

  Write-Host ''
  Write-Host 'All 11 services are running.' -ForegroundColor Green
}
finally {
  Pop-Location
}
