# ================================================================
#  Plastic Logbook System — Makefile
#  Usage: make <target>
#  Tip  : Run `make help` to list all available targets.
# ================================================================

# ── Configuration ────────────────────────────────────────────────
BACKEND_DIR  := backend
FRONTEND_DIR := frontend
DOCKER_COMP  := docker-compose
NODE         := node
NPM          := npm

# Colours (ANSI) – works on Git Bash / WSL / macOS / Linux
GREEN  := \033[0;32m
YELLOW := \033[0;33m
CYAN   := \033[0;36m
RED    := \033[0;31m
BOLD   := \033[1m
RESET  := \033[0m

# ── Default target ───────────────────────────────────────────────
.DEFAULT_GOAL := help

# Mark targets that do not represent files
.PHONY: help \
        install install-backend install-frontend \
        dev dev-backend dev-frontend \
        test test-backend test-frontend \
        test-unit test-unit-auth test-unit-product test-unit-middleware \
        test-integration test-integration-auth test-integration-products \
        test-integration-customers test-integration-general \
        test-watch test-coverage test-coverage-open \
        test-ci \
        docker-build docker-up docker-down docker-logs docker-clean \
        docker-test docker-prod \
        lint clean

# ================================================================
#  HELP
# ================================================================
help:
	@echo ""
	@echo "$(BOLD)$(CYAN)╔══════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(BOLD)$(CYAN)║     Plastic Logbook System — Available Commands      ║$(RESET)"
	@echo "$(BOLD)$(CYAN)╚══════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(BOLD)$(YELLOW)📦 INSTALL$(RESET)"
	@echo "  make install              Install all dependencies (backend + frontend)"
	@echo "  make install-backend      Install backend dependencies only"
	@echo "  make install-frontend     Install frontend dependencies only"
	@echo ""
	@echo "$(BOLD)$(YELLOW)🚀 DEV SERVERS$(RESET)"
	@echo "  make dev                  Start backend dev server (nodemon)"
	@echo "  make dev-backend          Same as above"
	@echo "  make dev-frontend         Start React dev server"
	@echo ""
	@echo "$(BOLD)$(YELLOW)🧪 TESTS — ALL$(RESET)"
	@echo "  make test                 Run ALL backend tests (unit + integration)"
	@echo "  make test-backend         Same as make test"
	@echo "  make test-frontend        Run React (jest) frontend tests"
	@echo "  make test-watch           Run backend tests in watch mode"
	@echo "  make test-coverage        Run backend tests and generate coverage report"
	@echo "  make test-coverage-open   Generate + open HTML coverage report"
	@echo "  make test-ci              Run all tests suitable for CI (no watch)"
	@echo ""
	@echo "$(BOLD)$(YELLOW)🧪 UNIT TESTS$(RESET)"
	@echo "  make test-unit            Run all unit tests"
	@echo "  make test-unit-auth       Unit tests → authController"
	@echo "  make test-unit-product    Unit tests → productController"
	@echo "  make test-unit-middleware Unit tests → authMiddleware"
	@echo ""
	@echo "$(BOLD)$(YELLOW)🔗 INTEGRATION TESTS$(RESET)"
	@echo "  make test-integration             Run all integration tests"
	@echo "  make test-integration-auth        Integration → Auth API"
	@echo "  make test-integration-products    Integration → Products API"
	@echo "  make test-integration-customers   Integration → Customers API"
	@echo "  make test-integration-general     Integration → Health & 404"
	@echo ""
	@echo "$(BOLD)$(YELLOW)🐳 DOCKER$(RESET)"
	@echo "  make docker-build         Build all Docker images"
	@echo "  make docker-up            Start services (backend + mongo)"
	@echo "  make docker-prod          Start ALL services including frontend (Nginx)"
	@echo "  make docker-test          Run backend tests inside Docker"
	@echo "  make docker-down          Stop and remove containers"
	@echo "  make docker-logs          Tail all container logs"
	@echo "  make docker-clean         Remove containers, volumes, and images"
	@echo ""
	@echo "$(BOLD)$(YELLOW)🛠  OTHER$(RESET)"
	@echo "  make clean                Remove node_modules and build artifacts"
	@echo ""

# ================================================================
#  INSTALL
# ================================================================
install: install-backend install-frontend
	@echo "$(GREEN)✅ All dependencies installed.$(RESET)"

install-backend:
	@echo "$(CYAN)📦 Installing backend dependencies...$(RESET)"
	cd $(BACKEND_DIR) && $(NPM) install

install-frontend:
	@echo "$(CYAN)📦 Installing frontend dependencies...$(RESET)"
	cd $(FRONTEND_DIR) && $(NPM) install

# ================================================================
#  DEV SERVERS
# ================================================================
dev: dev-backend

dev-backend:
	@echo "$(CYAN)🚀 Starting backend dev server (nodemon)...$(RESET)"
	cd $(BACKEND_DIR) && $(NPM) run dev

dev-frontend:
	@echo "$(CYAN)🚀 Starting React dev server...$(RESET)"
	cd $(FRONTEND_DIR) && $(NPM) start

# ================================================================
#  TESTS — ALL
# ================================================================

## Run every backend test suite
test: test-backend

test-backend:
	@echo ""
	@echo "$(BOLD)$(CYAN)════════════════════════════════════════$(RESET)"
	@echo "$(BOLD)$(CYAN)  🧪 Running ALL Backend Tests$(RESET)"
	@echo "$(BOLD)$(CYAN)════════════════════════════════════════$(RESET)"
	cd $(BACKEND_DIR) && $(NPM) test
	@echo "$(GREEN)✅ Backend tests complete.$(RESET)"

test-frontend:
	@echo ""
	@echo "$(BOLD)$(CYAN)════════════════════════════════════════$(RESET)"
	@echo "$(BOLD)$(CYAN)  🎨 Running Frontend Tests$(RESET)"
	@echo "$(BOLD)$(CYAN)════════════════════════════════════════$(RESET)"
	cd $(FRONTEND_DIR) && CI=true $(NPM) test -- --watchAll=false --passWithNoTests
	@echo "$(GREEN)✅ Frontend tests complete.$(RESET)"

## Watch mode — re-runs on file change
test-watch:
	@echo "$(CYAN)👁  Starting test watcher (Ctrl+C to stop)...$(RESET)"
	cd $(BACKEND_DIR) && $(NPM) run test:watch

## Full coverage report
test-coverage:
	@echo ""
	@echo "$(BOLD)$(CYAN)════════════════════════════════════════$(RESET)"
	@echo "$(BOLD)$(CYAN)  📊 Running Tests with Coverage$(RESET)"
	@echo "$(BOLD)$(CYAN)════════════════════════════════════════$(RESET)"
	cd $(BACKEND_DIR) && $(NPM) run test:coverage
	@echo "$(GREEN)✅ Coverage report saved to backend/coverage/$(RESET)"

## Coverage + open HTML report in browser
test-coverage-open: test-coverage
	@echo "$(CYAN)🌐 Opening coverage report...$(RESET)"
	start $(BACKEND_DIR)/coverage/lcov-report/index.html

## CI-friendly: all tests in both packages, no interactivity
test-ci:
	@echo ""
	@echo "$(BOLD)$(CYAN)════════════════════════════════════════$(RESET)"
	@echo "$(BOLD)$(CYAN)  🤖 CI Mode — Full Test Suite$(RESET)"
	@echo "$(BOLD)$(CYAN)════════════════════════════════════════$(RESET)"
	@$(MAKE) test-backend
	@$(MAKE) test-frontend
	@echo "$(GREEN)$(BOLD)✅ All CI tests passed!$(RESET)"

# ================================================================
#  UNIT TESTS
# ================================================================

## Run all files in tests/unit/
test-unit:
	@echo ""
	@echo "$(BOLD)$(YELLOW)  🔬 Unit Tests — All$(RESET)"
	@echo "$(YELLOW)────────────────────────────────────────$(RESET)"
	cd $(BACKEND_DIR) && npx jest tests/unit/ --runInBand --forceExit --detectOpenHandles --verbose
	@echo "$(GREEN)✅ Unit tests done.$(RESET)"

## Auth controller unit tests only
test-unit-auth:
	@echo "$(YELLOW)🔬 Unit → authController$(RESET)"
	cd $(BACKEND_DIR) && npx jest tests/unit/authController.test.js --runInBand --forceExit --detectOpenHandles --verbose

## Product controller unit tests only
test-unit-product:
	@echo "$(YELLOW)🔬 Unit → productController$(RESET)"
	cd $(BACKEND_DIR) && npx jest tests/unit/productController.test.js --runInBand --forceExit --detectOpenHandles --verbose

## Auth middleware unit tests only
test-unit-middleware:
	@echo "$(YELLOW)🔬 Unit → authMiddleware$(RESET)"
	cd $(BACKEND_DIR) && npx jest tests/unit/authMiddleware.test.js --runInBand --forceExit --detectOpenHandles --verbose

# ================================================================
#  INTEGRATION TESTS
# ================================================================

## Run all files in tests/integration/
test-integration:
	@echo ""
	@echo "$(BOLD)$(YELLOW)  🔗 Integration Tests — All$(RESET)"
	@echo "$(YELLOW)────────────────────────────────────────$(RESET)"
	cd $(BACKEND_DIR) && npx jest tests/integration/ --runInBand --forceExit --detectOpenHandles --verbose
	@echo "$(GREEN)✅ Integration tests done.$(RESET)"

## Auth API integration tests
test-integration-auth:
	@echo "$(YELLOW)🔗 Integration → Auth API$(RESET)"
	cd $(BACKEND_DIR) && npx jest tests/integration/auth.test.js --runInBand --forceExit --detectOpenHandles --verbose

## Products API integration tests
test-integration-products:
	@echo "$(YELLOW)🔗 Integration → Products API$(RESET)"
	cd $(BACKEND_DIR) && npx jest tests/integration/products.test.js --runInBand --forceExit --detectOpenHandles --verbose

## Customers API integration tests
test-integration-customers:
	@echo "$(YELLOW)🔗 Integration → Customers API$(RESET)"
	cd $(BACKEND_DIR) && npx jest tests/integration/customers.test.js --runInBand --forceExit --detectOpenHandles --verbose

## Health & general API tests
test-integration-general:
	@echo "$(YELLOW)🔗 Integration → Health & 404$(RESET)"
	cd $(BACKEND_DIR) && npx jest tests/integration/general.test.js --runInBand --forceExit --detectOpenHandles --verbose

# ================================================================
#  DOCKER
# ================================================================

## Build all images (backend + frontend)
docker-build:
	@echo "$(CYAN)🐳 Building Docker images...$(RESET)"
	$(DOCKER_COMP) build
	@echo "$(GREEN)✅ Docker images built.$(RESET)"

## Start backend + mongo (default services)
docker-up:
	@echo "$(CYAN)🐳 Starting backend + MongoDB containers...$(RESET)"
	$(DOCKER_COMP) up -d mongo backend
	@echo "$(GREEN)✅ Containers running. Backend → http://localhost:5000$(RESET)"

## Start ALL services including Nginx frontend
docker-prod:
	@echo "$(CYAN)🐳 Starting full production stack...$(RESET)"
	$(DOCKER_COMP) --profile production up -d
	@echo "$(GREEN)✅ Production stack running."
	@echo "   Frontend → http://localhost:80"
	@echo "   Backend  → http://localhost:5000$(RESET)"

## Run backend tests inside Docker using the test profile
docker-test:
	@echo "$(CYAN)🐳 Running tests inside Docker...$(RESET)"
	$(DOCKER_COMP) --profile test up --abort-on-container-exit --exit-code-from backend-test
	@echo "$(GREEN)✅ Docker test run complete.$(RESET)"

## Stop and remove containers
docker-down:
	@echo "$(CYAN)🛑 Stopping containers...$(RESET)"
	$(DOCKER_COMP) down
	@echo "$(GREEN)✅ Containers stopped.$(RESET)"

## Tail logs from all running containers
docker-logs:
	$(DOCKER_COMP) logs -f

## Full cleanup: containers, volumes, dangling images
docker-clean:
	@echo "$(RED)🗑  Removing containers, volumes, and images...$(RESET)"
	$(DOCKER_COMP) down -v --rmi local --remove-orphans
	@echo "$(GREEN)✅ Docker cleanup complete.$(RESET)"

# ================================================================
#  CLEAN
# ================================================================
clean:
	@echo "$(RED)🗑  Removing node_modules and build artifacts...$(RESET)"
	-rm -rf $(BACKEND_DIR)/node_modules
	-rm -rf $(FRONTEND_DIR)/node_modules
	-rm -rf $(FRONTEND_DIR)/build
	-rm -rf $(BACKEND_DIR)/coverage
	@echo "$(GREEN)✅ Clean complete.$(RESET)"
