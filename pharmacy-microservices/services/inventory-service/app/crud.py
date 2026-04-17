"""
crud.py — Lógica de acesso a dados do inventory-service.

Aqui vive a regra central do estoque: aplicar um movimento
SEMPRE atualiza o agregado `StockItem` na mesma transação, para
garantir consistência.
"""
from sqlalchemy.orm import Session
from sqlalchemy import select
from . import models, schemas


# --- StockItem ------------------------------------------------------
def get_or_create_stock(db: Session, produto_id: int) -> models.StockItem:
    """
    Retorna o StockItem do produto — criando com qtd 0 se ainda não existe.

    Isso permite dar a primeira entrada sem pré-cadastro.
    """
    stmt = select(models.StockItem).where(models.StockItem.produto_id == produto_id)
    item = db.execute(stmt).scalar_one_or_none()
    if item is None:
        import os
        item = models.StockItem(
            produto_id=produto_id,
            quantidade=0,
            estoque_minimo=int(os.getenv("ESTOQUE_MINIMO_PADRAO", "10")),
        )
        db.add(item)
        db.flush()
    return item


def get_stock_by_produto(db: Session, produto_id: int) -> models.StockItem | None:
    stmt = select(models.StockItem).where(models.StockItem.produto_id == produto_id)
    return db.execute(stmt).scalar_one_or_none()


def list_stock(db: Session, apenas_baixo: bool = False) -> list[models.StockItem]:
    stmt = select(models.StockItem)
    items = list(db.execute(stmt).scalars().all())
    if apenas_baixo:
        items = [i for i in items if i.quantidade <= i.estoque_minimo]
    return items


def update_estoque_minimo(
    db: Session, produto_id: int, novo_minimo: int
) -> models.StockItem | None:
    item = get_stock_by_produto(db, produto_id)
    if not item:
        return None
    item.estoque_minimo = novo_minimo
    db.commit()
    db.refresh(item)
    return item


# --- Movement -------------------------------------------------------
class EstoqueInsuficienteError(Exception):
    """Erro lógico: tentativa de saída maior que o saldo atual."""
    def __init__(self, produto_id: int, disponivel: int, solicitado: int):
        self.produto_id = produto_id
        self.disponivel = disponivel
        self.solicitado = solicitado
        super().__init__(
            f"Estoque insuficiente p/ produto {produto_id}: "
            f"disponível={disponivel}, solicitado={solicitado}"
        )


def aplicar_movimento(db: Session, mov: schemas.MovementCreate) -> models.Movement:
    """
    Aplica um movimento ao estoque (entrada ou saída).

    CONSISTÊNCIA: movimento e atualização do saldo são gravados na
    MESMA transação. Se qualquer parte falhar, nada é persistido.

    Levanta `EstoqueInsuficienteError` se for SAIDA sem saldo.
    """
    item = get_or_create_stock(db, mov.produto_id)

    if mov.tipo == models.TipoMovimento.SAIDA:
        if item.quantidade < mov.quantidade:
            raise EstoqueInsuficienteError(
                produto_id=mov.produto_id,
                disponivel=item.quantidade,
                solicitado=mov.quantidade,
            )
        item.quantidade -= mov.quantidade
    else:  # ENTRADA
        item.quantidade += mov.quantidade

    movimento = models.Movement(
        stock_item_id=item.id,
        tipo=mov.tipo,
        quantidade=mov.quantidade,
        observacao=mov.observacao,
        referencia_externa=mov.referencia_externa,
    )
    db.add(movimento)
    db.commit()
    db.refresh(movimento)
    return movimento


def listar_movimentos(
    db: Session, produto_id: int | None = None, limit: int = 100
) -> list[models.Movement]:
    stmt = select(models.Movement).order_by(models.Movement.criado_em.desc()).limit(limit)
    if produto_id:
        item = get_stock_by_produto(db, produto_id)
        if not item:
            return []
        stmt = stmt.where(models.Movement.stock_item_id == item.id)
    return list(db.execute(stmt).scalars().all())
