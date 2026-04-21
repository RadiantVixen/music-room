# Makefile for Docker management

# Variables
COMPOSE_FILE = docker-compose.yml

# Default command: build and run
.PHONY: up
up: build
	@echo "Starting Docker Compose..."
	docker compose -f $(COMPOSE_FILE) up -d

# Build Docker Compose images
.PHONY: build
build:
	@echo "Building Docker Compose images..."
	docker compose -f $(COMPOSE_FILE) build

# Stop and remove all containers, networks, volumes
.PHONY: clean
clean:
	@echo "Stopping and removing all containers..."
	-docker rm -f $$(docker ps -aq)
	@echo "Removing all networks (except default)..."
	-docker network rm $$(docker network ls -q | grep -v "bridge\|host\|none")
	@echo "Removing all volumes..."
	-docker volume rm $$(docker volume ls -q)
	@echo "Docker cleanup complete!"

# Stop and remove containers, networks, volumes, and images (optional)
.PHONY: prune
prune: clean
	@echo "Removing all images (except python:3.10-slim and postgres:15)..."
	-docker images -q | grep -v  -e "$$(docker images -q postgres:15)" -e "$$(docker images -q redis:7)" | xargs -r docker rmi -f
	@echo "Docker prune complete!"

# Restart everything: clean + build + up
.PHONY: restart
restart: clean up
	@echo "Docker environment restarted successfully!"


front:
	docker-compose up --build front_service

front-clean:
	docker-compose down -v --remove-orphans
	docker system prune -af
	docker-compose up --build front_service
