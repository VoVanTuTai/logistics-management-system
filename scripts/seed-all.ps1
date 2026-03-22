$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$rootDir = Resolve-Path (Join-Path $PSScriptRoot '..')
$services = @(
  'auth-service',
  'shipment-service',
  'pickup-service',
  'dispatch-service',
  'manifest-service',
  'scan-service',
  'delivery-service',
  'tracking-service',
  'reporting-service'
)

foreach ($service in $services) {
  Write-Host "[seed] $service"
  Push-Location (Join-Path $rootDir "services/$service")
  try {
    npm run seed
    if ($LASTEXITCODE -ne 0) { throw "Seed failed for $service" }
  }
  finally {
    Pop-Location
  }
}

Write-Host 'seed-all completed'
