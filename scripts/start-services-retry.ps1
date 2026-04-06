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
  return [bool](Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
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

function Start-ServiceIfDown(
  [hashtable]$service,
  [string]$rootDir,
  [ref]$started
) {
  if (Test-PortListening $service.Port) {
    return
  }

  $workingDir = Join-Path $rootDir $service.Path
  if (-not (Test-Path $workingDir)) {
    Write-Host "[missing] $($service.Name) path not found: $workingDir" -ForegroundColor Yellow
    return
  }

  $launcher = Start-Process `
    -FilePath 'cmd.exe' `
    -ArgumentList '/c', 'npx ts-node src/main.ts' `
    -WorkingDirectory $workingDir `
    -WindowStyle Hidden `
    -PassThru

  $started.Value += [pscustomobject]@{
    Service = $service.Name
    Port = $service.Port
    LauncherPid = $launcher.Id
  }

  Write-Host "[start] $($service.Name) launcher pid=$($launcher.Id)"
  Start-Sleep -Milliseconds 250
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
    if ($dockerAvailable) {
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
  $maxAttempts = 3
  $attempt = 1
  do {
    if ($attempt -gt 1) {
      Write-Host "[retry] attempt $attempt/$maxAttempts for services still DOWN..." -ForegroundColor Yellow
    }

    foreach ($service in $services) {
    Start-ServiceIfDown -service $service -rootDir $rootDir -started ([ref]$started)
    }

    $waitDeadline = (Get-Date).AddSeconds(75)
    while ((Get-Date) -lt $waitDeadline) {
      $downNow = $services | Where-Object { -not (Test-PortListening $_.Port) }
      if ($downNow.Count -eq 0) { break }
      Start-Sleep -Seconds 3
    }

    $remainingDown = $services | Where-Object { -not (Test-PortListening $_.Port) }
    if ($remainingDown.Count -eq 0) {
      break
    }

    if ($attempt -lt $maxAttempts) {
      Write-Host ("[retry] still down: " + (($remainingDown | ForEach-Object { $_.Name }) -join ', ')) -ForegroundColor Yellow
      Start-Sleep -Seconds 5
    }

    $attempt += 1
  } while ($attempt -le $maxAttempts)

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
    $listener = Get-NetTCPConnection -State Listen -LocalPort $service.Port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($listener) {
      [pscustomobject]@{
        Service = $service.Name
        Port = $service.Port
        Status = 'UP'
        Pid = $listener.OwningProcess
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

  Write-Host ''
  Write-Host 'All 11 services are running.' -ForegroundColor Green
}
finally {
  Pop-Location
}
