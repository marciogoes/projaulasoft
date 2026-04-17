"""
main.py — Entrypoint da aplicação FastAPI do product-service.

Configura a aplicação, inclui as rotas e expõe endpoints de infra
(health check, root). Cada microserviço tem seu próprio `main.py`.
"""
import os
from fastapi import FastAPI
from .database import Base, engine
from . import routes, models  # noqa: F401 (models importado para registrar no metadata)

# Cria as tabelas no primeiro start (didático — em produção, usar Alembic).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Product Service",
    description=(
        "Microserviço responsável pelo **catálogo de medicamentos** "
        "da farmácia. Cadastra, atualiza e consulta produtos. "
        "Parte do sistema didático **Pharmacy Microservices** (TEADS0354)."
    ),
    version="1.0.0",
)

# Inclui o router com as rotas de negócio
app.include_router(routes.router)


@app.get("/", tags=["meta"], summary="Informações do serviço")
def root():
    """Informações básicas do serviço."""
    return {
        "service": os.getenv("SERVICE_NAME", "product-service"),
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["meta"], summary="Health check")
def health():
    """
    Endpoint de health check — usado por orquestradores (Docker,
    Kubernetes) para saber se o serviço está pronto.
    """
    return {"status": "ok", "service": "product-service"}
