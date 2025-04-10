# Variables
COMPOSE_DEV = docker-compose -f docker-compose.dev.yml
COMPOSE_PROD = docker-compose -f docker-compose.prod.yml

# Development
dev-up:
	$(COMPOSE_DEV) up --build

dev-down:
	$(COMPOSE_DEV) down

dev-logs:
	$(COMPOSE_DEV) logs -f

# Production
prod-up:
	$(COMPOSE_PROD) up --build

prod-down:
	$(COMPOSE_PROD) down

prod-logs:
	$(COMPOSE_PROD) logs -f

# Clean up all
clean:
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose -f docker-compose.prod.yml down -v
	docker system prune -f
