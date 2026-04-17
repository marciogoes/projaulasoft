"""main.py — Entrypoint do Sales Service."""
import os
from fastapi import FastAPI
from .database import Base, engine
from . import routes, models  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sales Service",
    description=(
        "Microserviço responsável pelo **registro de vendas** da farmácia. "
        "Coordena product-service (preços) e inventory-service (estoque), "
        "e publica o evento `sale.created` para baixa automática."
    ),
    version="1.0.0",
)

app.include_router(routes.router)


@app.get("/", tags=["meta"])
def root():
    return {
        "service": os.getenv("SERVICE_NAME", "sales-service"),
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "service": "sales-service"}
