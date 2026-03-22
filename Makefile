.PHONY: dev-up start-services

dev-up:
	powershell -ExecutionPolicy Bypass -File scripts/dev-up.ps1

start-services:
	powershell -ExecutionPolicy Bypass -File scripts/start-services.ps1
