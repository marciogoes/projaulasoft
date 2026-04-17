"""
models.py — Modelos ORM do inventory-service.

Note um ponto CRÍTICO de microserviços: aqui guardamos `produto_id`
como um INTEGER comum, SEM foreign key para a tabela de produtos.
Por quê? Porque a tabela de produtos está em OUTRO banco, de outro
serviço. Cada serviço é o dono do seu esquema.

A integridade referencial é mantida pela camada de aplicação
(validando no product-service antes de criar o estoque).
"""
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


class TipoMovimento(str, PyEnum):
    """Tipos de movimentação de estoque."""
    ENTRADA = "ENTRADA"   # Compra, devolução, ajuste positivo
    SAIDA = "SAIDA"       # Venda, avaria, ajuste negativo


class StockItem(Base):
    """
    Item de estoque — representa a quantidade atual de um produto.

    Cada produto tem EXATAMENTE UM StockItem neste serviço.
    A quantidade é calculada somando/subtraindo os Movements.
    """
    __tablename__ = "stock_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    produto_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, index=True)
    quantidade: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    estoque_minimo: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    movements: Mapped[list["Movement"]] = relationship(
        back_populates="stock_item", cascade="all, delete-orphan"
    )


class Movement(Base):
    """
    Movimento de estoque — histórico de cada entrada/saída.

    Manter o histórico é fundamental: a quantidade atual pode ser
    reconstruída a partir dos movimentos (event sourcing simplificado).
    """
    __tablename__ = "movements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    stock_item_id: Mapped[int] = mapped_column(
        ForeignKey("stock_items.id"), nullable=False, index=True
    )
    tipo: Mapped[TipoMovimento] = mapped_column(Enum(TipoMovimento), nullable=False)
    quantidade: Mapped[int] = mapped_column(Integer, nullable=False)
    observacao: Mapped[str | None] = mapped_column(String(500), nullable=True)
    referencia_externa: Mapped[str | None] = mapped_column(
        String(100), nullable=True, index=True,
        doc="ID de venda, compra ou outro evento que originou o movimento"
    )
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    stock_item: Mapped["StockItem"] = relationship(back_populates="movements")
