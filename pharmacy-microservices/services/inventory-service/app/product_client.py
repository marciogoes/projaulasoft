"""
product_client.py — Cliente HTTP para o Product Service.

Demonstra COMUNICAÇÃO SÍNCRONA entre microserviços via REST.

Didático: o inventory-service precisa validar que um produto existe
antes de abrir estoque para ele. Essa validação é feita via chamada
HTTP ao product-service.

⚠️ Em sistemas reais, considere:
 - Circuit breaker (falhas em cascata)
 - Timeout curto
 - Cache de respostas para dados que mudam pouco
 - Retry com backoff
"""
import os
import httpx

PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL", "http://localhost:8001")


class ProductNotFoundError(Exception):
    """Produto não encontrado no product-service."""
    pass


class ProductServiceUnavailableError(Exception):
    """Product-service não respondeu (timeout, rede, etc.)."""
    pass


def validar_produto(produto_id: int) -> dict:
    """
    Consulta o product-service e retorna os dados do produto.

    Raises:
        ProductNotFoundError: produto não existe.
        ProductServiceUnavailableError: serviço indisponível.
    """
    try:
        r = httpx.get(f"{PRODUCT_SERVICE_URL}/products/{produto_id}", timeout=3.0)
    except httpx.RequestError as e:
        raise ProductServiceUnavailableError(
            f"Falha ao contactar product-service: {e}"
        ) from e

    if r.status_code == 404:
        raise ProductNotFoundError(f"Produto {produto_id} não existe no catálogo")
    r.raise_for_status()
    return r.json()
