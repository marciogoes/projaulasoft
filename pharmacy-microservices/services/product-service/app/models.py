"""
models.py — Modelos ORM (SQLAlchemy).

Representam as tabelas do banco de dados deste serviço.
Didaticamente: modelos são objetos Python que mapeiam linhas de tabelas.
"""
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


def _now_utc() -> datetime:
    """
    Retorna o datetime atual em UTC (timezone-aware).

    Substitui `datetime.utcnow()` (deprecated no Python 3.12+ e removido em
    versões futuras). A função nova retorna um objeto "aware" — com fuso
    horário explícito — o que evita bugs sutis ao comparar datas.
    """
    return datetime.now(timezone.utc)


class Product(Base):
    """
    Medicamento do catálogo da farmácia.

    Note que ESTE serviço é responsável APENAS pelo cadastro do
    produto (dados "estáticos"). Quantidade em estoque fica no
    inventory-service. Isso é o princípio de "single responsibility"
    aplicado a microserviços.
    """
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    codigo_barras: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    fabricante: Mapped[str] = mapped_column(String(150), nullable=False)
    preco: Mapped[float] = mapped_column(Float, nullable=False)
    requer_receita: Mapped[bool] = mapped_column(Boolean, default=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=_now_utc)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, default=_now_utc, onupdate=_now_utc
    )
