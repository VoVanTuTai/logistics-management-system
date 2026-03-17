$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$rootDir = Resolve-Path (Join-Path $PSScriptRoot '..')

Push-Location $rootDir
try {
  Write-Host '[infra] starting local postgres + rabbitmq'
  docker compose -f infra/dev/docker-compose.yml up -d
  if ($LASTEXITCODE -ne 0) { throw 'docker compose up failed' }

  Write-Host '[db] applying schema'
  & (Join-Path $PSScriptRoot 'migrate-all.ps1')

  Write-Host '[db] seeding test data'
  & (Join-Path $PSScriptRoot 'seed-all.ps1')

  Write-Host 'dev-up completed'
  Write-Host 'Now start services with npm run start:dev in each service you need.'
}
finally {
  Pop-Location
}
