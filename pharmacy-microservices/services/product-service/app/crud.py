"""
crud.py — Camada de acesso a dados (Repository pattern).

Concentra a lógica de queries. As rotas (routes.py) não devem
manipular o DB diretamente — chamam funções deste módulo. Isso
facilita testes e troca do ORM no futuro.
"""
from sqlalchemy.orm import Session
from sqlalchemy import select
from . import models, schemas


def get_product(db: Session, product_id: int) -> models.Product | None:
    """Busca produto por ID."""
    return db.get(models.Product, product_id)


def get_product_by_barcode(db: Session, codigo_barras: str) -> models.Product | None:
    """Busca produto por código de barras."""
    stmt = select(models.Product).where(models.Product.codigo_barras == codigo_barras)
    return db.execute(stmt).scalar_one_or_none()


def list_products(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    apenas_ativos: bool = True,
) -> list[models.Product]:
    """Lista produtos com paginação."""
    stmt = select(models.Product)
    if apenas_ativos:
        stmt = stmt.where(models.Product.ativo == True)  # noqa: E712
    stmt = stmt.offset(skip).limit(limit)
    return list(db.execute(stmt).scalars().all())


def create_product(db: Session, product: schemas.ProductCreate) -> models.Product:
    """Cria um novo produto."""
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def update_product(
    db: Session, product_id: int, update: schemas.ProductUpdate
) -> models.Product | None:
    """Atualiza um produto existente (atualização parcial)."""
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    # model_dump(exclude_unset=True) pega apenas os campos enviados
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(db_product, field, value)
    db.commit()
    db.refresh(db_product)
    return db_product


def delete_product(db: Session, product_id: int) -> bool:
    """
    Remove um produto.

    Em sistemas reais, prefira soft-delete (marcar ativo=False) a
    deletar fisicamente. Aqui oferecemos ambos para fins didáticos.
    """
    db_product = get_product(db, product_id)
    if not db_product:
        return False
    db.delete(db_product)
    db.commit()
    return True
