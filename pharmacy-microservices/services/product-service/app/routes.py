"""
routes.py — Rotas HTTP (endpoints REST) do product-service.

Camada fina: valida entrada, chama crud, retorna resposta.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from . import crud, schemas
from .database import get_db

router = APIRouter(prefix="/products", tags=["products"])


@router.post(
    "",
    response_model=schemas.ProductRead,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar novo medicamento",
)
def criar_produto(
    payload: schemas.ProductCreate,
    db: Session = Depends(get_db),
):
    """Cadastra um novo medicamento no catálogo."""
    existente = crud.get_product_by_barcode(db, payload.codigo_barras)
    if existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Já existe produto com código de barras {payload.codigo_barras}",
        )
    return crud.create_product(db, payload)


@router.get(
    "",
    response_model=list[schemas.ProductRead],
    summary="Listar medicamentos",
)
def listar_produtos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    apenas_ativos: bool = Query(True),
    db: Session = Depends(get_db),
):
    """Lista produtos com paginação."""
    return crud.list_products(db, skip=skip, limit=limit, apenas_ativos=apenas_ativos)


@router.get(
    "/{product_id}",
    response_model=schemas.ProductRead,
    summary="Buscar medicamento por ID",
)
def buscar_produto(product_id: int, db: Session = Depends(get_db)):
    """Retorna um produto pelo seu ID."""
    produto = crud.get_product(db, product_id)
    if not produto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto {product_id} não encontrado",
        )
    return produto


@router.patch(
    "/{product_id}",
    response_model=schemas.ProductRead,
    summary="Atualizar medicamento (parcial)",
)
def atualizar_produto(
    product_id: int,
    payload: schemas.ProductUpdate,
    db: Session = Depends(get_db),
):
    """Atualiza campos de um produto existente."""
    produto = crud.update_product(db, product_id, payload)
    if not produto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto {product_id} não encontrado",
        )
    return produto


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover medicamento",
)
def remover_produto(product_id: int, db: Session = Depends(get_db)):
    """
    Remove um produto do catálogo.

    ⚠️ Em produção, considere soft-delete (ativo=False) em vez de remover.
    """
    ok = crud.delete_product(db, product_id)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto {product_id} não encontrado",
        )
    return None
