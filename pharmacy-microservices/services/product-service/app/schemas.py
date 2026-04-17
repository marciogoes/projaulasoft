"""
schemas.py — Schemas Pydantic (DTOs de entrada/saída da API).

Separar "modelo ORM" (models.py) de "schema da API" (schemas.py) é
uma boa prática: o que vai para o banco pode ser diferente do que
é exposto na API. Exemplo: senha não vai para a resposta.
"""
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ProductBase(BaseModel):
    """Campos comuns entre criação e atualização."""
    nome: str = Field(..., min_length=2, max_length=200, examples=["Dipirona 500mg"])
    codigo_barras: str = Field(..., min_length=8, max_length=50, examples=["7891234567890"])
    fabricante: str = Field(..., min_length=2, max_length=150, examples=["EMS"])
    preco: float = Field(..., gt=0, examples=[12.50])
    requer_receita: bool = Field(default=False)


class ProductCreate(ProductBase):
    """Schema para criação de um novo produto."""
    pass


class ProductUpdate(BaseModel):
    """
    Schema para atualização — todos os campos opcionais,
    permitindo atualização parcial (PATCH).
    """
    nome: str | None = None
    fabricante: str | None = None
    preco: float | None = Field(default=None, gt=0)
    requer_receita: bool | None = None
    ativo: bool | None = None


class ProductRead(ProductBase):
    """Schema de resposta — inclui campos gerados pelo banco."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime
