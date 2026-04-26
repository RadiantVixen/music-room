# ==========================================
# ⚙️ CONFIG
# ==========================================
COMPOSE := docker compose
FILE    := docker-compose.yml
FRONT   := ./frontend
NVM_DIR := /goinfre/aatki/.nvm
NODE_INIT := export NVM_DIR="$(NVM_DIR)" && [ -s "$(NVM_DIR)/nvm.sh" ] && . "$(NVM_DIR)/nvm.sh" && nvm use 20 --silent

# ==========================================
# 🐳 BACKEND
# ==========================================

.PHONY: up down logs restart

up:
	@echo "🚀 Starting backend..."
	$(COMPOSE) -f $(FILE) up -d --build

down:
	@echo "🛑 Stopping backend..."
	$(COMPOSE) -f $(FILE) down

logs:
	$(COMPOSE) -f $(FILE) logs -f

restart: down up

# ==========================================
# 🧹 CLEANUP (SAFE vs HARD)
# ==========================================

.PHONY: clean clean-hard prune

# Safe cleanup (only project-related)
clean:
	@echo "🧹 Cleaning project containers/volumes..."
	$(COMPOSE) -f $(FILE) down -v --remove-orphans

# Hard cleanup (⚠️ destructive)
clean-hard:
	@echo "🔥 HARD CLEAN: removing ALL unused Docker data..."
	docker system prune -af --volumes

# Optional image pruning (controlled)
prune:
	@echo "🧼 Removing dangling images..."
	docker image prune -f

# ==========================================
# 📱 FRONTEND
# ==========================================

.PHONY: front-install front-web front-mobile

front-install:
	@echo "📦 Installing frontend deps..."
	$(NODE_INIT) && cd $(FRONT) && npm install && npm audit fix --force 2>/dev/null || true

front-web: front-install
	@echo "🌐 Starting web frontend..."
	$(NODE_INIT) && cd $(FRONT) && npx expo start --web

front-mobile: front-install
	@echo "📱 Starting mobile frontend..."
	$(NODE_INIT) && cd $(FRONT) && npx expo start --lan --clear

# ==========================================
# 🚀 FULL STACK
# ==========================================

.PHONY: all mobile

all: up front-web

mobile: up front-mobile
