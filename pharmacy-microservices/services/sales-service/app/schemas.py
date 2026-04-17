"""schemas.py — DTOs do sales-service."""
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class SaleItemInput(BaseModel):
    produto_id: int = Field(..., gt=0)
    quantidade: int = Field(..., gt=0)


class SaleCreate(BaseModel):
    cliente: str | None = Field(default=None, max_length=200)
    itens: list[SaleItemInput] = Field(..., min_length=1)


class SaleItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    produto_id: int
    quantidade: int
    preco_unitario: float
    subtotal: float


class SaleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cliente: str | None
    total: float
    criado_em: datetime
    itens: list[SaleItemRead]
