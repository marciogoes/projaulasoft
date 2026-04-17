"""schemas.py — DTOs da API do inventory-service."""
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from .models import TipoMovimento


class StockItemRead(BaseModel):
    """Estado atual do estoque de um produto."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    produto_id: int
    quantidade: int
    estoque_minimo: int
    atualizado_em: datetime


class MovementCreate(BaseModel):
    """
    Entrada/saída manual de estoque.

    Para SAÍDA, a quantidade deve ser positiva — o serviço calcula
    o sinal corretamente ao aplicar.
    """
    produto_id: int = Field(..., gt=0)
    tipo: TipoMovimento
    quantidade: int = Field(..., gt=0)
    observacao: str | None = Field(default=None, max_length=500)
    referencia_externa: str | None = Field(default=None, max_length=100)


class MovementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    stock_item_id: int
    tipo: TipoMovimento
    quantidade: int
    observacao: str | None
    referencia_externa: str | None
    criado_em: datetime


class EstoqueMinimoUpdate(BaseModel):
    """Atualização do nível mínimo de estoque (gera alerta)."""
    estoque_minimo: int = Field(..., ge=0)


# --- Eventos -------------------------------------------------------
class VendaCriadaEvento(BaseModel):
    """
    Payload do evento `sale.created`, consumido por este serviço.

    Emitido pelo sales-service após confirmar uma venda. Nós
    reagimos dando baixa automática no estoque.
    """
    evento: str = Field(default="sale.created")
    venda_id: int
    itens: list[dict]  # [{"produto_id": 1, "quantidade": 2}, ...]
