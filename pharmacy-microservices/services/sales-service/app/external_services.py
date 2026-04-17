"""
external_services.py — Clientes HTTP para os demais serviços
e publicador de eventos.

Este módulo concentra TODAS as interações do sales-service com
o mundo externo:

 1. product_client    → valida produto e obtém preço
 2. inventory_client  → verifica disponibilidade de estoque
 3. event_publisher   → publica eventos (sale.created) via HTTP

Isso segue o padrão de "Adapters" (Arquitetura Hexagonal): toda
comunicação com serviços externos fica isolada em um módulo,
facilitando mocks nos testes.
"""
import os
import httpx

PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL", "http://localhost:8001")
INVENTORY_SERVICE_URL = os.getenv("INVENTORY_SERVICE_URL", "http://localhost:8002")


# ============================================================
# Exceções
# ============================================================
class ProductNotFoundError(Exception):
    pass


class EstoqueInsuficienteError(Exception):
    pass


class ServicoIndisponivelError(Exception):
    pass


# ============================================================
# Product Service client
# ============================================================
def obter_produto(produto_id: int) -> dict:
    """Obtém dados do produto (inclui preço) do product-service."""
    try:
        r = httpx.get(f"{PRODUCT_SERVICE_URL}/products/{produto_id}", timeout=3.0)
    except httpx.RequestError as e:
        raise ServicoIndisponivelError(f"product-service: {e}") from e

    if r.status_code == 404:
        raise ProductNotFoundError(f"Produto {produto_id} não existe")
    r.raise_for_status()
    return r.json()


# ============================================================
# Inventory Service client
# ============================================================
def verificar_estoque(produto_id: int, quantidade: int) -> None:
    """
    Confirma que há saldo suficiente ANTES de criar a venda.

    Raises:
        EstoqueInsuficienteError: saldo insuficiente.
        ServicoIndisponivelError: inventory-service offline.
    """
    try:
        r = httpx.get(
            f"{INVENTORY_SERVICE_URL}/inventory/stock/{produto_id}",
            timeout=3.0,
        )
    except httpx.RequestError as e:
        raise ServicoIndisponivelError(f"inventory-service: {e}") from e

    if r.status_code == 404:
        raise EstoqueInsuficienteError(
            f"Produto {produto_id} não possui estoque registrado"
        )
    r.raise_for_status()
    disponivel = r.json()["quantidade"]
    if disponivel < quantidade:
        raise EstoqueInsuficienteError(
            f"Produto {produto_id}: solicitado={quantidade}, disponível={disponivel}"
        )


# ============================================================
# Event Publisher
# ============================================================
def publicar_venda_criada(venda_id: int, itens: list[dict]) -> None:
    """
    Publica o evento `sale.created` — o inventory-service consome
    e dá baixa no estoque.

    DIDÁTICO: em produção usa-se um broker (RabbitMQ, Kafka). Aqui
    simulamos com HTTP POST direto. Se o handler falhar, a venda
    continua gravada (at-most-once); em produção real você quer
    at-least-once com retry + idempotência.
    """
    payload = {
        "evento": "sale.created",
        "venda_id": venda_id,
        "itens": itens,
    }
    try:
        httpx.post(
            f"{INVENTORY_SERVICE_URL}/events/sale-created",
            json=payload,
            timeout=3.0,
        )
    except httpx.RequestError as e:
        # Não derruba a venda — apenas registra.
        # Em produção: enviar para uma outbox / DLQ para retry.
        print(f"[WARN] Falha ao publicar evento sale.created: {e}")
