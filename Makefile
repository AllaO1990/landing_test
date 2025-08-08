ya-auth:
	@echo $(YA_OAUTH_TOKEN)|docker login --username oauth --password-stdin cr.yandex

ya-deploy:
	docker build -t gateway-api -f Dockerfile.yandex .
	docker tag gateway-api:latest $(YA_DOCKER_REGISTRY)/gateway-api:latest
	docker push $(YA_DOCKER_REGISTRY)/gateway-api:latest
