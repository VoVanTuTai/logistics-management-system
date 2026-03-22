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

Push-Location $rootDir
try {
  $runTag = Get-Date -Format 'yyyyMMdd-HHmmss'

  $infraPorts = @(15432, 5672)
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
      if ($LASTEXITCODE -eq 0) {
        $infraDeadline = (Get-Date).AddMinutes(2)
        while ((Get-Date) -lt $infraDeadline) {
          $allInfraUp = $true
          foreach ($infraPort in $infraPorts) {
            if (-not (Test-PortListening $infraPort)) {
              $allInfraUp = $false
              break
            }
          }

          if ($allInfraUp) { break }
          Start-Sleep -Seconds 2
        }
      } else {
        Write-Host '[infra] docker compose failed, continue starting services anyway.' -ForegroundColor Yellow
      }
    } catch {
      Write-Host "[infra] cannot run docker compose ($($_.Exception.Message)), continue starting services anyway." -ForegroundColor Yellow
    }
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

    $stdoutLog = Join-Path $rootDir "$($service.Name).dev.$runTag.stdout.log"
    $stderrLog = Join-Path $rootDir "$($service.Name).dev.$runTag.stderr.log"

    $launcher = Start-Process `
      -FilePath 'cmd.exe' `
      -ArgumentList '/c', 'npx ts-node src/main.ts' `
      -WorkingDirectory $workingDir `
      -WindowStyle Hidden `
      -RedirectStandardOutput $stdoutLog `
      -RedirectStandardError $stderrLog `
      -PassThru

    $started += [pscustomobject]@{
      Service = $service.Name
      Port = $service.Port
      LauncherPid = $launcher.Id
      StderrLog = [System.IO.Path]::GetFileName($stderrLog)
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
    Write-Host "Some services are DOWN. Check *.dev.*.stderr.log in $rootDir (run=$runTag)." -ForegroundColor Yellow
    exit 1
  }

  Write-Host ''
  Write-Host 'All 11 services are running.' -ForegroundColor Green
}
finally {
  Pop-Location
}
