"""
main.py — API Gateway.

Padrão arquitetural: Gateway é um ponto único de entrada que
roteia requisições para os microserviços apropriados.

Benefícios:
 - Cliente não precisa conhecer endereço de cada serviço
 - Pode centralizar autenticação, rate limiting, logs
 - Facilita versionamento de API

Didático: este é um gateway MÍNIMO. Em produção considere:
 - Kong, Traefik, AWS API Gateway, NGINX
 - Circuit breaker, retry, cache
 - Autenticação (JWT/OAuth) e autorização
 - Observabilidade (tracing distribuído)
"""
import os
from typing import Any
import httpx
from fastapi import FastAPI, Request, Response, HTTPException

# --- Configuração dos serviços downstream -------------------------
PRODUCT_URL = os.getenv("PRODUCT_SERVICE_URL", "http://localhost:8001")
INVENTORY_URL = os.getenv("INVENTORY_SERVICE_URL", "http://localhost:8002")
SALES_URL = os.getenv("SALES_SERVICE_URL", "http://localhost:8003")

# Mapa de prefixos → URL base do serviço
ROUTES: dict[str, str] = {
    "/api/products": PRODUCT_URL + "/products",
    "/api/inventory": INVENTORY_URL + "/inventory",
    "/api/sales": SALES_URL + "/sales",
}

app = FastAPI(
    title="API Gateway",
    description=(
        "**Ponto único de entrada** do sistema Pharmacy Microservices.\n\n"
        "Roteia requisições `/api/*` para os microserviços:\n"
        "- `/api/products/*` → product-service (8001)\n"
        "- `/api/inventory/*` → inventory-service (8002)\n"
        "- `/api/sales/*` → sales-service (8003)\n\n"
        "Consulte a documentação Swagger de cada serviço em sua porta dedicada."
    ),
    version="1.0.0",
)


def _resolver_destino(path: str) -> str | None:
    """Encontra a URL do serviço downstream para um path."""
    for prefixo, base_url in ROUTES.items():
        if path.startswith(prefixo):
            return base_url + path[len(prefixo):]
    return None


async def _proxy(request: Request, destino: str) -> Response:
    """Repassa a requisição para o serviço downstream."""
    # Copia headers (remove os de infra do FastAPI)
    headers = {k: v for k, v in request.headers.items()
               if k.lower() not in ("host", "content-length")}
    body = await request.body()

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.request(
                method=request.method,
                url=destino,
                content=body,
                headers=headers,
                params=request.query_params,
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Serviço indisponível: {e}",
            )

    # Remove headers que o FastAPI recalcula
    response_headers = {k: v for k, v in resp.headers.items()
                        if k.lower() not in ("content-encoding", "content-length",
                                             "transfer-encoding", "connection")}
    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=response_headers,
        media_type=resp.headers.get("content-type"),
    )


@app.get("/", tags=["meta"])
def root():
    return {
        "service": "api-gateway",
        "version": "1.0.0",
        "routes": list(ROUTES.keys()),
    }


@app.get("/health", tags=["meta"])
async def health() -> dict[str, Any]:
    """Health check agregado — verifica todos os serviços downstream."""
    saude: dict[str, Any] = {"gateway": "ok", "services": {}}
    async with httpx.AsyncClient(timeout=2.0) as client:
        for nome, url in [("product", PRODUCT_URL),
                          ("inventory", INVENTORY_URL),
                          ("sales", SALES_URL)]:
            try:
                r = await client.get(f"{url}/health")
                saude["services"][nome] = (
                    "ok" if r.status_code == 200 else f"erro:{r.status_code}"
                )
            except httpx.RequestError:
                saude["services"][nome] = "indisponivel"
    return saude


@app.api_route(
    "/api/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    tags=["proxy"],
    summary="Proxy para microserviços",
)
async def gateway_proxy(path: str, request: Request):
    """
    Roteia qualquer requisição `/api/...` para o microserviço correto.

    Ex:
    - `GET  /api/products/1`       → `GET  product-service/products/1`
    - `POST /api/inventory/movements` → `POST inventory-service/inventory/movements`
    - `POST /api/sales`            → `POST sales-service/sales`
    """
    full_path = f"/api/{path}"
    destino = _resolver_destino(full_path)
    if destino is None:
        raise HTTPException(status_code=404, detail=f"Rota '{full_path}' não mapeada")
    return await _proxy(request, destino)
