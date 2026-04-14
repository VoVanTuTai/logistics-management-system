$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$rootDir = Resolve-Path (Join-Path $PSScriptRoot '..')
$services = @(
  'auth-service',
  'masterdata-service',
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
  Write-Host "[migrate] $service"
  Push-Location (Join-Path $rootDir "services/$service")
  try {
    npx prisma db push --schema prisma/schema.prisma --skip-generate
    if ($LASTEXITCODE -ne 0) { throw "Failed to push schema for $service" }
  }
  finally {
    Pop-Location
  }
}

Write-Host 'migrate-all completed'
