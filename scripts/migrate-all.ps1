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
  'reporting-service',
  'payment-service'
)

# Map service names to database names
$dbNameMap = @{
  'auth-service'        = 'auth_db'
  'masterdata-service'  = 'masterdata_db'
  'shipment-service'    = 'shipment_db'
  'pickup-service'      = 'pickup_db'
  'dispatch-service'    = 'dispatch_db'
  'manifest-service'    = 'manifest_db'
  'scan-service'        = 'scan_db'
  'delivery-service'    = 'delivery_db'
  'tracking-service'    = 'tracking_db'
  'reporting-service'   = 'reporting_db'
  'payment-service'     = 'payment_db'
}

foreach ($service in $services) {
  Write-Host "[migrate] $service"
  Push-Location (Join-Path $rootDir "services/$service")
  try {
    $dbName = $dbNameMap[$service]
    $env:DATABASE_URL = "postgresql://postgres:postgres@localhost:15432/$dbName"
    
    # Install dependencies if needed (skip build scripts)
    if (-not (Test-Path "node_modules")) {
      Write-Host "[install] installing dependencies for $service"
      pnpm install --ignore-scripts
    }
    
    # Run Prisma migration directly
    $prismaPath = Join-Path (Get-Location) "node_modules/.bin/prisma"
    & $prismaPath db push --schema prisma/schema.prisma --accept-data-loss
    if ($LASTEXITCODE -ne 0) { throw "Failed to push schema for $service" }
  }
  finally {
    Pop-Location
  }
}

Write-Host 'migrate-all completed'
