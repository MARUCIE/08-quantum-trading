# Project Makefile Template
# Usage: Copy to project root and customize

PROJECT_NAME := $(shell basename $(CURDIR))
COMPOSE_FILE := docker-compose.yml

.PHONY: help up down restart logs status clean build shell sandbox-local sandbox-cloud-check sandbox-proof

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Start all services
	@echo "Starting $(PROJECT_NAME)..."
	@docker compose -f $(COMPOSE_FILE) up -d
	@echo "Done. Run 'make status' to check."

down: ## Stop all services
	@echo "Stopping $(PROJECT_NAME)..."
	@docker compose -f $(COMPOSE_FILE) down
	@echo "Done."

restart: down up ## Restart all services

logs: ## View logs (follow mode)
	@docker compose -f $(COMPOSE_FILE) logs -f --tail=100

logs-api: ## View API logs only
	@docker compose -f $(COMPOSE_FILE) logs -f --tail=100 backend

logs-web: ## View Web logs only
	@docker compose -f $(COMPOSE_FILE) logs -f --tail=100 frontend

status: ## Show service status
	@echo "=== $(PROJECT_NAME) Status ==="
	@docker compose -f $(COMPOSE_FILE) ps

health: ## Check service health
	@echo "=== $(PROJECT_NAME) Health Check ==="
	@docker compose -f $(COMPOSE_FILE) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

clean: ## Remove containers, volumes, and images
	@echo "Cleaning $(PROJECT_NAME)..."
	@docker compose -f $(COMPOSE_FILE) down -v --rmi local
	@echo "Done."

build: ## Rebuild images
	@echo "Building $(PROJECT_NAME)..."
	@docker compose -f $(COMPOSE_FILE) build --no-cache
	@echo "Done."

shell-api: ## Open shell in API container
	@docker compose -f $(COMPOSE_FILE) exec backend sh

shell-web: ## Open shell in Web container
	@docker compose -f $(COMPOSE_FILE) exec frontend sh

shell-db: ## Open psql in DB container
	@echo "No database service is defined in $(COMPOSE_FILE)"

# Development shortcuts
dev: up logs ## Start and follow logs
watch: ## Watch for changes (requires entr)
	@find . -name "*.ts" -o -name "*.tsx" | entr -r make restart

sandbox-local: ## Run command in local sandbox (PROFILE=strict_offline CMD='ls -la')
	@bash scripts/sandbox/run_local_sandbox.sh "$(PROFILE)" "$(CMD)"

sandbox-cloud-check: ## Probe cloud sandbox provider availability
	@bash scripts/sandbox/run_cloud_sandbox.sh cloud_probe "echo cloud-sandbox-probe"

sandbox-proof: ## Run sandbox policy proof commands and capture logs
	@bash scripts/sandbox/run_local_sandbox.sh strict_offline "ls -1 doc/00_project/initiative_quantum_x | head"
	@bash scripts/sandbox/run_local_sandbox.sh strict_offline "node -e \"const https=require('https');https.get('https://example.com',()=>{console.log('unexpected_network_access')}).on('error',()=>{console.log('network_blocked')})\""
	@bash scripts/sandbox/run_local_sandbox.sh strict_offline "sh -lc 'touch /workspace/blocked-write 2>/tmp/write.err || true; if [ -f /workspace/blocked-write ]; then echo write_unexpected; else echo write_blocked; fi; cat /tmp/write.err || true'"
	@SANDBOX_TIMEOUT_SECONDS=2 bash scripts/sandbox/run_local_sandbox.sh strict_offline "sh -lc 'sleep 5; echo timeout_unexpected'" || [ $$? -eq 124 ]
	@bash scripts/sandbox/run_local_sandbox.sh build_offline "node -v"
