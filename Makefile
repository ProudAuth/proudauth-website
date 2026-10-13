VERSION ?= 0.2.0-snapshot
IMAGE ?= proudauth-website:$(VERSION)
.PHONY: build test check preview image serve stop
build:
	npm run build
test:
	npm test
check:
	npm run check
preview:
	npm run preview
image: check
	docker build --pull=false --network=none -f deploy/Dockerfile --build-arg VERSION=$(VERSION) -t $(IMAGE) .
serve:
	WEBSITE_IMAGE=$(IMAGE) docker compose -f deploy/compose.yaml up -d --wait --wait-timeout 90
stop:
	docker compose -f deploy/compose.yaml down
