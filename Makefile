ya-auth:
	@echo $(YA_OAUTH_TOKEN)|docker login --username oauth --password-stdin cr.yandex

ya-deploy:
	docker build --platform linux/amd64 -t frontend -f Dockerfile.yandex .
	docker tag frontend:latest $(YA_DOCKER_REGISTRY)/frontend:latest
	docker push $(YA_DOCKER_REGISTRY)/frontend:latest

ya-restart:
	kubectl rollout restart deployment frontend
