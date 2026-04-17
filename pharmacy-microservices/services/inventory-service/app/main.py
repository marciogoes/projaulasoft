"""main.py — Entrypoint do Inventory Service."""
import os
from fastapi import FastAPI
from .database import Base, engine
from . import routes, models  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory Service",
    description=(
        "Microserviço responsável pelo **controle de estoque** da farmácia. "
        "Gerencia quantidades, movimentações (entradas/saídas) e alertas "
        "de estoque baixo. Consome o evento `sale.created` do sales-service."
    ),
    version="1.0.0",
)

app.include_router(routes.router)
app.include_router(routes.eventos_router)


@app.get("/", tags=["meta"])
def root():
    return {
        "service": os.getenv("SERVICE_NAME", "inventory-service"),
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "service": "inventory-service"}
