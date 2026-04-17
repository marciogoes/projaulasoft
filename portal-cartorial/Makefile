# Makefile — Comandos de conveniencia para o Portal Cartorial
# Uso: make <comando>

.PHONY: help up down logs install dev test lint build clean

# ── Ajuda ─────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "Portal Cartorial — Comandos disponíveis:"
	@echo ""
	@echo "  make up        Sobe toda a infraestrutura (Docker)"
	@echo "  make down      Para e remove os containers"
	@echo "  make logs      Exibe logs de todos os servicos"
	@echo "  make install   Instala dependencias (backend + frontend)"
	@echo "  make dev       Roda backend e frontend em modo dev"
	@echo "  make test      Roda todos os testes com cobertura"
	@echo "  make lint      ESLint em backend e frontend"
	@echo "  make build     Build de producao (backend + frontend)"
	@echo "  make clean     Remove node_modules e artefatos de build"
	@echo ""

# ── Docker ────────────────────────────────────────────────────────
up:
	docker compose up -d
	@echo "Infraestrutura rodando!"
	@echo "  API:      http://localhost:3000/api/docs"
	@echo "  Frontend: http://localhost:3001"
	@echo "  Keycloak: http://localhost:8080"
	@echo "  MinIO:    http://localhost:9001"

down:
	docker compose down

logs:
	docker compose logs -f

# ── Desenvolvimento ───────────────────────────────────────────────
install:
	cd backend && npm ci
	cd frontend && npm ci

dev:
	$(MAKE) up
	@echo "Iniciando backend e frontend em modo dev..."
	cd backend && npm run start:dev &
	cd frontend && npm run dev

# ── Qualidade ─────────────────────────────────────────────────────
test:
	@echo "Rodando testes unitarios — backend..."
	cd backend && npm run test:cov
	@echo "Rodando testes — frontend..."
	cd frontend && npm test

lint:
	@echo "ESLint — backend..."
	cd backend && npm run lint
	@echo "ESLint — frontend..."
	cd frontend && npm run lint

# ── Build ─────────────────────────────────────────────────────────
build:
	@echo "Build backend (NestJS)..."
	cd backend && npm run build
	@echo "Build frontend (Next.js)..."
	cd frontend && npm run build
	@echo "Build concluido!"

# ── Limpeza ───────────────────────────────────────────────────────
clean:
	rm -rf backend/node_modules backend/dist backend/coverage
	rm -rf frontend/node_modules frontend/.next frontend/coverage
	@echo "Limpeza concluida!"
