"""
Testes do API Gateway.

Didático: não testamos a integração real (isso seria E2E).
Aqui verificamos apenas roteamento e health do próprio gateway.
"""
from fastapi.testclient import TestClient
from app.main import app, _resolver_destino

client = TestClient(app)


def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert "api-gateway" in r.json()["service"]


def test_resolver_destino_products():
    assert _resolver_destino("/api/products/1").endswith("/products/1")


def test_resolver_destino_inventory():
    assert "/inventory/" in _resolver_destino("/api/inventory/stock/1")


def test_resolver_destino_sales():
    assert _resolver_destino("/api/sales").endswith("/sales")


def test_rota_nao_mapeada_retorna_404():
    r = client.get("/api/desconhecido/foo")
    assert r.status_code == 404
