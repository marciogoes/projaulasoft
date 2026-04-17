# Makefile — comandos comuns do projeto
# Uso: make <comando>
#
# Didático: um Makefile concentra os comandos usuais do projeto,
# facilitando o onboarding de novos desenvolvedores.

.PHONY: help install test run-local run-docker stop clean seed lint

# Comando padrão — lista comandos disponíveis
help:
	@echo "Pharmacy Microservices — Comandos disponíveis:"
	@echo ""
	@echo "  make install     Instala deps em todos os serviços (venv local)"
	@echo "  make test        Roda todos os testes (pytest)"
	@echo "  make run-docker  Sobe todos os serviços via docker-compose"
	@echo "  make run-local   Sobe todos os serviços localmente (sem Docker)"
	@echo "  make stop        Para os containers"
	@echo "  make clean       Remove containers, volumes e arquivos temporários"
	@echo "  make seed        Popula dados de exemplo"
	@echo "  make lint        Verifica formatação com ruff"
	@echo ""

install:
	@echo "📦 Instalando dependências em cada serviço..."
	@for svc in product-service inventory-service sales-service api-gateway; do \
		echo "  → $$svc"; \
		cd services/$$svc && pip install -q -r requirements.txt && cd ../..; \
	done
	@echo "✅ Pronto!"

test:
	@echo "🧪 Rodando testes..."
	@for svc in product-service inventory-service sales-service api-gateway; do \
		echo ""; \
		echo "═══ $$svc ═══"; \
		cd services/$$svc && python -m pytest -v; cd ../..; \
	done

run-docker:
	docker-compose up --build

run-local:
	@bash scripts/run_local.sh

stop:
	docker-compose down

clean:
	docker-compose down -v
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.db" -delete 2>/dev/null || true
	@echo "🧹 Limpeza concluída."

seed:
	@python scripts/seed_data.py

lint:
	@pip install -q ruff 2>/dev/null
	@ruff check services/
