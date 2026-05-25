.PHONY: dev-up start-services docker-build-services docker-push-services docker-up-services docker-down-services prod-deploy

dev-up:
	powershell -ExecutionPolicy Bypass -File scripts/dev-up.ps1

start-services:
	powershell -ExecutionPolicy Bypass -File scripts/start-services-retry.ps1

docker-build-services:
	./scripts/build-service-images.sh

docker-push-services:
	PUSH=true ./scripts/build-service-images.sh

docker-up-services:
	docker compose -f infra/dev/docker-compose.yml -f infra/dev/docker-compose.services.yml up -d --remove-orphans

docker-down-services:
	docker compose -f infra/dev/docker-compose.yml -f infra/dev/docker-compose.services.yml down

prod-deploy:
	./scripts/deploy-vps.sh
