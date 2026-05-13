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
  @{ Name = 'auth-service'; Path = 'services/auth-service'; Port = 3010 },
  @{ Name = 'payment-service'; Path = 'services/payment-service'; Port = 3011 }
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

  if (Get-Command netstat -ErrorAction SilentlyContinue) {
    $pattern = "^\s*TCP\s+\S+:$port\s+\S+\s+LISTENING\s+(\d+)\s*$"
    foreach ($line in (netstat -ano -p tcp 2>$null)) {
      if ($line -match $pattern) {
        return [int]$Matches[1]
      }
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

function Resolve-NpmCommand() {
  $npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if ($npmCmd) {
    return $npmCmd.Source
  }

  $npm = Get-Command npm -ErrorAction SilentlyContinue
  if ($npm) {
    return $npm.Source
  }

  return 'npm'
}

function Resolve-NodeCommand() {
  $nodeExe = Get-Command node.exe -ErrorAction SilentlyContinue
  if ($nodeExe) {
    return $nodeExe.Source
  }

  $node = Get-Command node -ErrorAction SilentlyContinue
  if ($node) {
    return $node.Source
  }

  return 'node'
}

function Resolve-TsNodeCommand([string]$workingDir) {
  $localTsNodeCmd = Join-Path $workingDir 'node_modules\.bin\ts-node.cmd'
  if (Test-Path $localTsNodeCmd) {
    return $localTsNodeCmd
  }

  $localTsNode = Join-Path $workingDir 'node_modules\.bin\ts-node'
  if (Test-Path $localTsNode) {
    return $localTsNode
  }

  return 'ts-node'
}

function Resolve-TsNodeEntrypoint([string]$workingDir) {
  $localTsNodeEntrypoint = Join-Path $workingDir 'node_modules\ts-node\dist\bin.js'
  if (Test-Path $localTsNodeEntrypoint) {
    return $localTsNodeEntrypoint
  }

  return $null
}

function Resolve-PrismaCommand([string]$workingDir) {
  $localPrismaCmd = Join-Path $workingDir 'node_modules\.bin\prisma.cmd'
  if (Test-Path $localPrismaCmd) {
    return $localPrismaCmd
  }

  $localPrisma = Join-Path $workingDir 'node_modules\.bin\prisma'
  if (Test-Path $localPrisma) {
    return $localPrisma
  }

  return 'prisma'
}

function Resolve-PrismaEntrypoint([string]$workingDir) {
  $localPrismaEntrypoint = Join-Path $workingDir 'node_modules\prisma\build\index.js'
  if (Test-Path $localPrismaEntrypoint) {
    return $localPrismaEntrypoint
  }

  return $null
}

function Start-ServiceIfDown(
  [hashtable]$service,
  [string]$rootDir,
  [ref]$started
) {
  if (Test-PortListening $service.Port) {
    return
  }

  $activeLauncher = @($started.Value | Where-Object {
    $_.Service -eq $service.Name -and
    $null -ne (Get-Process -Id $_.LauncherPid -ErrorAction SilentlyContinue)
  } | Select-Object -Last 1)

  if ($activeLauncher.Count -gt 0) {
    Write-Host "[wait] $($service.Name) launcher still running pid=$($activeLauncher[0].LauncherPid)"
    return
  }

  $workingDir = Join-Path $rootDir $service.Path
  if (-not (Test-Path $workingDir)) {
    Write-Host "[missing] $($service.Name) path not found: $workingDir" -ForegroundColor Yellow
    return
  }

  $logsDir = Join-Path $rootDir '.tmp/service-logs'
  if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
  }

  $logId = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
  $stdoutPath = Join-Path $logsDir "$($service.Name)-$logId.out.log"
  $stderrPath = Join-Path $logsDir "$($service.Name)-$logId.err.log"
  $runnerPath = Join-Path $logsDir "$($service.Name)-$logId.run.cmd"
  $npmCommand = Resolve-NpmCommand
  $npmDir = Split-Path -Parent $npmCommand
  if ($npmDir -and (($env:PATH -split ';') -notcontains $npmDir)) {
    $env:PATH = "$npmDir;$env:PATH"
    $env:Path = "$npmDir;$env:Path"
  }
  $nodeCommand = Resolve-NodeCommand
  $tsNodeCommand = Resolve-TsNodeCommand -workingDir $workingDir
  $tsNodeEntrypoint = Resolve-TsNodeEntrypoint -workingDir $workingDir
  $prismaCommand = Resolve-PrismaCommand -workingDir $workingDir
  $prismaEntrypoint = Resolve-PrismaEntrypoint -workingDir $workingDir
  $prismaSchema = Join-Path $workingDir 'prisma\schema.prisma'

  $runnerLines = @(
    '@echo off'
  )
  if ($npmDir) {
    $runnerLines += "set `"PATH=$npmDir;%PATH%`""
  }
  $runnerLines += "cd /d `"$workingDir`""
  if (Test-Path $prismaSchema) {
    if ($prismaEntrypoint) {
      $runnerLines += "`"$nodeCommand`" `"$prismaEntrypoint`" generate --schema prisma/schema.prisma"
    } else {
      $runnerLines += "`"$prismaCommand`" generate --schema prisma/schema.prisma"
    }
    $runnerLines += 'if errorlevel 1 exit /b %errorlevel%'
    if ($prismaEntrypoint) {
      $runnerLines += "`"$nodeCommand`" `"$prismaEntrypoint`" db push --schema prisma/schema.prisma"
    } else {
      $runnerLines += "`"$prismaCommand`" db push --schema prisma/schema.prisma"
    }
    $runnerLines += 'if errorlevel 1 exit /b %errorlevel%'
  }
  if ($tsNodeEntrypoint) {
    $runnerLines += "`"$nodeCommand`" `"$tsNodeEntrypoint`" src/main.ts"
  } else {
    $runnerLines += "`"$tsNodeCommand`" src/main.ts"
  }
  Set-Content -Path $runnerPath -Value $runnerLines -Encoding ASCII

  $launcher = Start-Process `
    -FilePath $runnerPath `
    -WorkingDirectory $workingDir `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath `
    -WindowStyle Hidden `
    -PassThru

  $started.Value += [pscustomobject]@{
    Service = $service.Name
    Port = $service.Port
    LauncherPid = $launcher.Id
    Logs = ".tmp/service-logs/$($service.Name)-$logId.*.log"
  }

  Write-Host "[start] $($service.Name) launcher pid=$($launcher.Id) logs=.tmp/service-logs/$($service.Name)-$logId.*.log"
  Start-Sleep -Milliseconds 250
}

Push-Location $rootDir
try {
  $infraPorts = @(5672, 15432)
  $infraContainers = @(
    'jms-dev-rabbitmq',
    'jms-dev-postgres'
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
      docker compose -f infra/dev/docker-compose.yml up -d --remove-orphans
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
    Write-Host 'Some services are DOWN. Recent logs:' -ForegroundColor Yellow

    $logsDir = Join-Path $rootDir '.tmp/service-logs'
    foreach ($downService in @($statusRows | Where-Object { $_.Status -eq 'DOWN' })) {
      Write-Host ''
      Write-Host "[$($downService.Service)]" -ForegroundColor Yellow

      if (-not (Test-Path $logsDir)) {
        Write-Host 'No service log directory found.'
        continue
      }

      $latestErrorLog = Get-ChildItem -Path $logsDir -Filter "$($downService.Service)-*.err.log" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
      $latestOutputLog = Get-ChildItem -Path $logsDir -Filter "$($downService.Service)-*.out.log" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

      if ($latestErrorLog) {
        Write-Host "stderr: $($latestErrorLog.FullName)"
        Get-Content -Path $latestErrorLog.FullName -Tail 40 -ErrorAction SilentlyContinue
      }

      if ($latestOutputLog) {
        Write-Host "stdout: $($latestOutputLog.FullName)"
        Get-Content -Path $latestOutputLog.FullName -Tail 40 -ErrorAction SilentlyContinue
      }
    }

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
  Write-Host 'All 12 services are running.' -ForegroundColor Green
}
finally {
  Pop-Location
}
